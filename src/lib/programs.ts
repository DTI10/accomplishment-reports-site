import { getCollection } from "astro:content";

// The Program pages at /programs/<slug>/ come from the "Programs" collection (content/programs/<slug>.md),
// so a program added, renamed or deleted in the CMS gets its page and menu link automatically.
export const programHref = (slug: string) => `/programs/${slug}/`;

export const getPrograms = async () => {
  const entries = await getCollection("programs");
  return entries
    .map((entry) => ({
      slug: entry.id,
      // short name for the menu, the breadcrumb and the tag that links accomplishments to the program
      label: entry.data.label ?? entry.data.name,
      order: entry.data.order ?? 100,
    }))
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
};
