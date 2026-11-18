import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const postSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  image: z.string().optional(),
  author: z.string().optional(),
  photos: z
    .array(
      z.object({
        image: z.string(),
        size: z.enum(["small", "medium", "large", "full"]).default("medium"),
        side: z.enum(["auto", "left", "right"]).default("auto"),
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
  // Programs this accomplishment belongs to, stored as program slugs by the CMS relation field.
  programs: z.array(z.string()).optional().default([]),
});

const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/articles" }),
  schema: postSchema,
});

const settings = defineCollection({
  loader: glob({ pattern: "*.yml", base: "./content/settings" }),
  schema: z.object({
    auto_publish: z.boolean().default(false),
  }),
});

// Banner title for the Province / Office pages (content/offices/<slug>.md). Optional.
const offices = defineCollection({
  loader: glob({ pattern: "*.md", base: "./content/offices" }),
  schema: z.object({
    name: z.string().optional(),
  }),
});

// Text for the Program pages (content/programs/<slug>.md).
const programs = defineCollection({
  loader: glob({ pattern: "*.md", base: "./content/programs" }),
  schema: z.object({
    name: z.string(),
    // Short name for the menu, the breadcrumb and the accomplishment tag (e.g. "SSF"). Defaults to the name.
    label: z.string().optional(),
    // Position in the Programs menu: lower numbers come first
    order: z.number().nullish(),
    tagline: z.string().optional(),
    // Optional photo behind the page's top banner (a path such as /media/ssf-banner.webp)
    banner: z.string().optional(),
    // Optional Looker Studio (Google Data Studio) report shown under the stat cards: paste its embed address
    // (the CMS writes an empty box as '', so that is allowed and treated as "no dashboard")
    dashboard: z
      .union([z.literal(""), z.url()])
      .optional()
      .transform((value) => value || undefined),
    // Up to four figures shown as cards under the "About" text
    stats: z
      .array(
        z.object({
          value: z.string(),
          label: z.string(),
          note: z.string().optional(),
        })
      )
      .max(4)
      .optional()
      .default([]),
  }),
});

export const collections = { articles, settings, offices, programs };
