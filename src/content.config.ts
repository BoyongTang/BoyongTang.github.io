import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const link = z.object({ label: z.string(), href: z.string().url() });

/** A research dossier: one question pursued with a method, with its evidence and limits. */
const research = defineCollection({
  loader: glob({ base: './src/content/research', pattern: '**/*.md' }),
  schema: z.object({
    /** Stable catalogue number, e.g. R-001. Never reuse one. */
    code: z.string().regex(/^R-\d{3}$/),
    title: z.string(),
    summary: z.string(),
    /** The question in one sentence. */
    question: z.string(),
    status: z.enum(['exploring', 'ongoing', 'completed', 'paused', 'archived']),
    topic: z.string(),
    methods: z.array(z.string()).default([]),
    updatedAt: z.coerce.date(),
    links: z.array(link).default([]),
    /** True while the entry is placeholder copy: it is marked SAMPLE everywhere it appears. */
    sample: z.boolean().default(false),
  }),
});

/** Field notes: reading, proofs, experiment logs. */
const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.md' }),
  schema: z.object({
    code: z.string().regex(/^N-\d{3}$/),
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    topic: z.string(),
    lang: z.enum(['en', 'zh']).default('en'),
    sample: z.boolean().default(false),
  }),
});

export const collections = { research, notes };
