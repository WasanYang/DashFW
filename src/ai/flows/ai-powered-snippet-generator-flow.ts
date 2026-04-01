'use server';
/**
 * @fileOverview An AI agent that generates professional and context-aware text snippets for client communications.
 *
 * - aiPoweredSnippetGenerator - A function that handles the snippet generation process.
 * - AiPoweredSnippetGeneratorInput - The input type for the aiPoweredSnippetGenerator function.
 * - AiPoweredSnippetGeneratorOutput - The return type for the aiPoweredSnippetGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiPoweredSnippetGeneratorInputSchema = z.object({
  prompt: z.string().describe('A brief description or context for the client communication snippet.'),
  context: z.string().optional().describe('Optional additional context, such as project status, client name, or specific details for the snippet.'),
});
export type AiPoweredSnippetGeneratorInput = z.infer<typeof AiPoweredSnippetGeneratorInputSchema>;

const AiPoweredSnippetGeneratorOutputSchema = z.object({
  snippet: z.string().describe('The generated professional text snippet for client communication.'),
});
export type AiPoweredSnippetGeneratorOutput = z.infer<typeof AiPoweredSnippetGeneratorOutputSchema>;

export async function aiPoweredSnippetGenerator(input: AiPoweredSnippetGeneratorInput): Promise<AiPoweredSnippetGeneratorOutput> {
  return aiPoweredSnippetGeneratorFlow(input);
}

const aiPoweredSnippetGeneratorPrompt = ai.definePrompt({
  name: 'aiPoweredSnippetGeneratorPrompt',
  input: {schema: AiPoweredSnippetGeneratorInputSchema},
  output: {schema: AiPoweredSnippetGeneratorOutputSchema},
  prompt: `You are an AI assistant specialized in generating professional and context-aware text snippets for client communications.
Your goal is to help a full-stack developer and digital marketer quickly craft messages for various scenarios, such as project updates, requirement requests, or opening pitches.

Generate a professional and concise text snippet based on the following prompt and context.

Prompt: {{{prompt}}}

{{#if context}}
Additional Context: {{{context}}}
{{/if}}

Ensure the tone is appropriate for client communication and the snippet directly addresses the prompt, incorporating any provided context naturally.
`,
});

const aiPoweredSnippetGeneratorFlow = ai.defineFlow(
  {
    name: 'aiPoweredSnippetGeneratorFlow',
    inputSchema: AiPoweredSnippetGeneratorInputSchema,
    outputSchema: AiPoweredSnippetGeneratorOutputSchema,
  },
  async input => {
    const {output} = await aiPoweredSnippetGeneratorPrompt(input);
    return output!;
  }
);
