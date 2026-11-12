import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const postSchema = z.object({
	title: z.string(),
	date: z.coerce.date(),
	description: z.string().optional(),
	author: z.string().optional(),
	image: z.string().optional(),
	gallery: z
		.array(
			z.object({
				image: z.string(),
				caption: z.string().optional(),
			}),
		)
		.optional()
		.default([]),
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
