// src/ai/flows/ai-answer-faq.ts
'use server';

/**
 * @fileOverview An AI agent to answer questions based on FAQs.
 *
 * - answerFaq - A function that answers user questions based on provided FAQs.
 * - AnswerFaqInput - The input type for the answerFaq function.
 * - AnswerFaqOutput - The return type for the answerFaq function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerFaqInputSchema = z.object({
  question: z.string().describe('The user question to be answered.'),
  faqEntries: z
    .string()
    .describe('A collection of frequently asked questions and their answers.'),
});
export type AnswerFaqInput = z.infer<typeof AnswerFaqInputSchema>;

const AnswerFaqOutputSchema = z.object({
  answer: z.string().describe('The answer to the user question.'),
});
export type AnswerFaqOutput = z.infer<typeof AnswerFaqOutputSchema>;

export async function answerFaq(input: AnswerFaqInput): Promise<AnswerFaqOutput> {
  return answerFaqFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerFaqPrompt',
  input: {schema: AnswerFaqInputSchema},
  output: {schema: AnswerFaqOutputSchema},
  prompt: `You are an AI assistant designed to answer questions based on the provided FAQ entries.

FAQ Entries:
{{{faqEntries}}}

Question: {{{question}}}

Answer:`,
});

const answerFaqFlow = ai.defineFlow(
  {
    name: 'answerFaqFlow',
    inputSchema: AnswerFaqInputSchema,
    outputSchema: AnswerFaqOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
