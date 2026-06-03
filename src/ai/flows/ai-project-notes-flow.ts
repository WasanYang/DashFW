'use server';
/**
 * @fileOverview An AI agent that analyzes raw project notes and organizes them into structured HTML tabs.
 *
 * - generateAiProjectNotes - A function that handles the notes organization process.
 * - AiProjectNotesInput - The input type for the generateAiProjectNotes function.
 * - AiProjectNotesOutput - The return type for the generateAiProjectNotes function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiProjectNotesInputSchema = z.object({
  rawText: z.string().describe('The raw unstructured project notes, requirements, credentials, or client brief.'),
});
export type AiProjectNotesInput = z.infer<typeof AiProjectNotesInputSchema>;

const AiProjectNotesSectionSchema = z.object({
  title: z.string().describe('The title of the note section / tab.'),
  content: z.string().describe('The content of the note section formatted in clean HTML (e.g., using h3, p, ul, li, strong, table).'),
});

const AiProjectNotesOutputSchema = z.object({
  sections: z.array(AiProjectNotesSectionSchema).describe('The structured tabs generated from the raw text.'),
});
export type AiProjectNotesOutput = z.infer<typeof AiProjectNotesOutputSchema>;

export async function generateAiProjectNotes(input: AiProjectNotesInput): Promise<AiProjectNotesOutput> {
  return aiProjectNotesFlow(input);
}

const aiProjectNotesPrompt = ai.definePrompt({
  name: 'aiProjectNotesPrompt',
  input: { schema: AiProjectNotesInputSchema },
  output: { schema: AiProjectNotesOutputSchema },
  prompt: `You are an expert AI assistant specializing in project management, system analysis, and digital marketing.
Your goal is to take raw, unstructured project notes, requirements, login credentials, communications, or briefs, and organize them into clean, structured, and logical tabs/sections.

Please analyze the following raw text and divide it into logical tabs. For example, if the text contains credentials and checklists, separate them into an "Access Credentials" tab and a "Checklist" tab. If it contains SEO strategy, create an "SEO Strategy" tab.

Raw Text:
{{{rawText}}}

For each section:
1. Provide a short, clear, and professional title (e.g. "General Info", "Credentials", "SEO Keywords", "Competitor Analysis"). You may use Thai or English for titles based on the language of the raw text.
2. Formulate the content as valid and clean HTML. Use standard HTML tags such as:
   - <h3> for subheaders
   - <p> for paragraphs
   - <ul> and <li> for lists
   - <strong> or <em> for emphasis
   - <table>, <thead>, <tbody>, <tr>, <th>, and <td> for tabular data (e.g. key-value pairs, credentials, status). Add inline border styling for tables to render clearly: border: 1px solid #d1d5db; border-collapse: collapse; padding: 8px;
3. Do not include outer html, head, or body tags. Do not wrap the output in markdown code blocks inside the HTML strings.
`,
});

const aiProjectNotesFlow = ai.defineFlow(
  {
    name: 'aiProjectNotesFlow',
    inputSchema: AiProjectNotesInputSchema,
    outputSchema: AiProjectNotesOutputSchema,
  },
  async (input) => {
    const { output } = await aiProjectNotesPrompt(input);
    if (!output) {
      throw new Error('Failed to generate structured project notes.');
    }
    return output;
  }
);
