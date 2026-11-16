import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const postSchema = z.object({
	title: z.string(),
	date: z.coerce.date(),
	image: z.string().optional(),
	author: z.string().optional(),
	photos: z
		.array(
			z.object({
				image: z.string(),
							size: z.enum(['small', 'medium', 'large', 'full']).default('medium'),
				side: z.enum(['auto', 'left', 'right']).default('auto'),
				after: z.number().int().min(0).nullish(),
			}),
		)
		.max(4)
		.optional()
		.default([]),
	// One province/office. Older posts may still hold a list: take the first one.
	province: z
		.union([z.string(), z.array(z.string())])
		.optional()
		.transform((value) => (Array.isArray(value) ? value[0] : value)),
	tags: z.array(z.string()).optional().default([]),
});

const articles = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './content/articles' }),
	schema: postSchema,
});

const news = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './content/news' }),
	schema: postSchema,
});

const settings = defineCollection({
	loader: glob({ pattern: '*.yml', base: './content/settings' }),
	schema: z.object({
		auto_publish: z.boolean().default(false),
	}),
});

export const collections = { articles, news, settings };
