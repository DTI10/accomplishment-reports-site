// The Program pages at /programs/<slug>/. The page text lives in content/programs/<slug>.md.
export const PROGRAMS = [
  { slug: "ssf", label: "SSF" },
  { slug: "rapid", label: "RAPID" },
] as const;

export const programHref = (slug: string) => `/programs/${slug}/`;
