'use server';
/**
 * @fileOverview An AI agent that generates rich nested task/project templates.
 *
 * - generateAiTaskTemplate - A function that handles the template generation.
 * - AiTemplateGeneratorInput - Input schema.
 * - AiTemplateGeneratorOutput - Output schema.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiTemplateGeneratorInputSchema = z.object({
  prompt: z.string().describe('Describe the project type, task group, or checklist template you want to generate. (e.g. Standard WordPress Setup, SEO Audit checklist)'),
  type: z.enum(['project', 'group', 'task']).describe('The scope/level of the template to generate.'),
});
export type AiTemplateGeneratorInput = z.infer<typeof AiTemplateGeneratorInputSchema>;

// A subtask can have a simple checklist format
const TemplateSubTaskSchema = z.object({
  text: z.string().describe('The subtask action item text.'),
  completed: z.boolean().default(false),
});

const TemplateTaskSchema = z.object({
  title: z.string().describe('The title of the task.'),
  details: z.string().optional().describe('Brief description or details of the task.'),
  subTasks: z.array(TemplateSubTaskSchema).optional().describe('Checklist items inside the task.'),
});

const TemplateGroupSchema = z.object({
  title: z.string().describe('The name/title of the task group (e.g. Backlog, Planning, Assets).'),
  tasks: z.array(TemplateTaskSchema).optional().describe('Tasks belonging to this group.'),
});

const AiTemplateGeneratorOutputSchema = z.object({
  name: z.string().describe('A suitable title for the generated template.'),
  description: z.string().describe('A summary of what this template covers.'),
  type: z.enum(['project', 'group', 'task']),
  data: z.object({
    groups: z.array(TemplateGroupSchema).optional().describe('For project-level templates, a list of groups. For group-level, this should contain exactly 1 group. Leave undefined for task-level.'),
    subTasks: z.array(TemplateSubTaskSchema).optional().describe('For task-level templates, a list of checklist subtasks. Leave undefined for project/group-level.'),
  }),
});
export type AiTemplateGeneratorOutput = z.infer<typeof AiTemplateGeneratorOutputSchema>;

export async function generateAiTaskTemplate(input: AiTemplateGeneratorInput): Promise<AiTemplateGeneratorOutput> {
  return aiTemplateGeneratorFlow(input);
}

const aiTemplateGeneratorPrompt = ai.definePrompt({
  name: 'aiTemplateGeneratorPrompt',
  input: { schema: AiTemplateGeneratorInputSchema },
  output: { schema: AiTemplateGeneratorOutputSchema },
  prompt: `You are an expert project manager and system architect.
Your task is to generate a comprehensive, highly actionable task template based on the user's prompt and requested template type.

Template Types:
1. "project": A full project structure. It must contain one or more Groups. Each Group should contain relevant Tasks, and each Task should contain detailed Subtasks.
2. "group": A single task group. It must contain exactly 1 group inside "groups", with its Tasks and Subtasks.
3. "task": A list of checklist subtasks. The "subTasks" property at the root of "data" should contain the checklist items.

Prompt: {{{prompt}}}
Template Type: {{{type}}}

Generate a detailed and logical structure. Keep titles professional and clear. You may use English or Thai based on the user's input.
Ensure the output JSON strictly matches the schema.
`,
});

const aiTemplateGeneratorFlow = ai.defineFlow(
  {
    name: 'aiTemplateGeneratorFlow',
    inputSchema: AiTemplateGeneratorInputSchema,
    outputSchema: AiTemplateGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await aiTemplateGeneratorPrompt(input);
    if (!output) {
      throw new Error('Failed to generate template structure.');
    }
    return output;
  }
);
