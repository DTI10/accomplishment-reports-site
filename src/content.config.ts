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
	province: z.array(z.string()).optional().default([]),
	tags: z.array(z.string()).optional().default([]),
	program: z.string().optional(),
	image_alt: z.string().optional(),
	featured: z.boolean().optional().default(false),
	event: z
		.object({
			start: z.coerce.date(),
			end: z.coerce.date().optional(),
			venue: z.string().optional(),
			registration_url: z.string().optional(),
		})
		.optional(),
	stats: z
		.array(
			z.object({
				label: z.string(),
				value: z.string(),
			}),
		)
		.optional()
		.default([]),
	partners: z.array(z.string()).optional().default([]),
	attachments: z
		.array(
			z.object({
				title: z.string(),
				file: z.string(),
			}),
		)
		.optional()
		.default([]),
	contact: z
		.object({
			name: z.string().optional(),
			role: z.string().optional(),
			email: z.string().optional(),
			phone: z.string().optional(),
		})
		.optional(),
	related: z.array(z.string()).optional().default([]),
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
