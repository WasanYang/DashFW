'use server';
/**
 * @fileOverview A flow for generating detailed and customizable checklists based on a description.
 *
 * - createAiChecklist - A function that generates a checklist using AI.
 * - AiChecklistCreatorInput - The input type for the createAiChecklist function.
 * - AiChecklistCreatorOutput - The return type for the createAiChecklist function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiChecklistCreatorInputSchema = z.object({
  description: z.string().describe('A detailed description of the service or project type for which to generate a checklist.'),
});
export type AiChecklistCreatorInput = z.infer<typeof AiChecklistCreatorInputSchema>;

const AiChecklistCreatorOutputSchema = z.object({
  checklistItems: z.array(z.string()).describe('An array of checklist items generated based on the description.'),
});
export type AiChecklistCreatorOutput = z.infer<typeof AiChecklistCreatorOutputSchema>;

export async function createAiChecklist(input: AiChecklistCreatorInput): Promise<AiChecklistCreatorOutput> {
  return aiChecklistCreatorFlow(input);
}

const aiChecklistCreatorPrompt = ai.definePrompt({
  name: 'aiChecklistCreatorPrompt',
  input: { schema: AiChecklistCreatorInputSchema },
  output: { schema: AiChecklistCreatorOutputSchema },
  prompt: `You are an expert in creating comprehensive and actionable checklists for professional services and project types.
Given the following description, generate a detailed and customizable checklist. Each item in the checklist should be a clear, distinct step.
The output should be a JSON object with a single key 'checklistItems' which is an array of strings.

Description: {{{description}}}`,
});

const aiChecklistCreatorFlow = ai.defineFlow(
  {
    name: 'aiChecklistCreatorFlow',
    inputSchema: AiChecklistCreatorInputSchema,
    outputSchema: AiChecklistCreatorOutputSchema,
  },
  async (input) => {
    const { output } = await aiChecklistCreatorPrompt(input);
    if (!output) {
      throw new Error('Failed to generate checklist.');
    }
    return output;
  }
);
