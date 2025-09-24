import { z } from 'zod';

export const StyleDNASchema = z.object({
  voice: z.array(z.string()).default([]),
  themes: z.array(z.string()).default([]),
  characters: z.array(z.string()).default([]),
  narrative: z.array(z.string()).default([]),
  dialog: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  examples: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(100).default(0),
});

export type StyleDNAOutput = z.infer<typeof StyleDNASchema>;

export const KnowledgeGraphSchema = z.object({
  entities: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        description: z.string(),
      })
    )
    .default([]),
  relationships: z
    .array(
      z.object({
        from: z.string(),
        to: z.string(),
        type: z.string(),
      })
    )
    .default([]),
  timeline: z
    .array(
      z.object({
        event: z.string(),
        order: z.number(),
      })
    )
    .default([]),
  themes: z.array(z.string()).default([]),
});

export type KnowledgeGraphOutput = z.infer<typeof KnowledgeGraphSchema>;

export const EpisodeSuggestionSchema = z.object({
  title: z.string(),
  synopsis: z.string(),
  setting: z.string(),
  minPages: z.number().min(3).max(15),
});

export type EpisodeSuggestionOutput = z.infer<typeof EpisodeSuggestionSchema>;

export const ProjectSuggestionSchema = z.object({
  title: z.string(),
  genre: z.string(),
  tone: z.string(),
  totalEpisodes: z.number().min(1).max(100),
  synopsis: z.string(),
});

export type ProjectSuggestionOutput = z.infer<typeof ProjectSuggestionSchema>;

export function extractFirstJsonObject(text: string): any {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Invalid JSON response from AI');
  return JSON.parse(match[0]);
}


