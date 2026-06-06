import Anthropic from '@anthropic-ai/sdk';
import { AiResponse, TaskPriority } from '@/types';

const client = new Anthropic({ apiKey: process.env.ANHTROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-5';

export async function breakdownTask(
   title: string,
   description?: string,
): Promise<AiResponse> {
   const prompt = `You are a productivity assistant. Break down this task into actionable subtasks.

Task: "${title}"
${description ? `Description: "${description}"` : ''}

Respond with ONLY a JSON object in this exact format, no other text:
{
  "subtasks": [
    { "id": "1", "title": "subtask title", "completed": false },
    { "id": "2", "title": "subtask title", "completed": false }
  ],
  "estimated_minutes": 60,
  "message": "brief helpful note"
}

Generate 3-6 specific, actionable subtasks. Be concise.`;

   const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
   });

   const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

   try {
      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
   } catch {
      return { message: 'Could not parse AI response', subtasks: [] };
   }
}

export async function suggestPriority(
   title: string,
   description?: string,
): Promise<AiResponse> {
   const prompt = `You are a productivity assistant. Suggest a priority level for this task.

Task: "${title}"
${description ? `Description: "${description}"` : ''}

Respond with ONLY a JSON object in this exact format, no other text:
{
  "priority": "high",
  "estimated_minutes": 30,
  "message": "brief reason for priority"
}

Priority must be exactly one of: "low", "medium", "high"`;

   const response = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
   });

   const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

   try {
      const clean = text.replace(/```json|```g/, '').trim();
      return JSON.parse(clean);
   } catch {
      return {
         priority: 'medium' as TaskPriority,
         message: 'Default priority assigned',
      };
   }
}

export async function createTaskFromNaturalLanguage(
   input: string,
): Promise<AiResponse> {
   const prompt = `You are a productivity assistant. Convert this natural language input into structured tasks.

Input: "${input}"

Respond with ONLY a JSON object in this exact format, no other text:
{
  "tasks": [
    {
      "title": "task title",
      "description": "brief description",
      "priority": "medium",
      "estimated_minutes": 30,
      "category": "general",
      "subtasks": [
        { "id": "1", "title": "subtask", "completed": false }
      ]
    }
  ],
  "message": "brief note"
}

Priority must be: "low", "medium", or "high"
Category suggestions: "work", "personal", "health", "learning", "general"
Generate 1-4 tasks maximum. Be specific and actionable.`;

   const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
   });

   const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

   try {
      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
   } catch {
      return { message: 'Could not parse AI response', tasks: [] };
   }
}
