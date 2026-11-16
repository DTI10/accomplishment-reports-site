// The Province / Office pages at /accomplishments/<slug>/.
//
// `province` must be spelled exactly like an entry of PROVINCES in lib/content.ts:
// a post appears on an office page when its Province / Office field matches it.
// The banner name and tagline for each office live in content/offices/<slug>.md.
export const OFFICES = [
	{ slug: 'regional-office', province: 'Regional Office' },
	{ slug: 'bukidnon', province: 'Bukidnon' },
	{ slug: 'camiguin', province: 'Camiguin' },
	{ slug: 'lanao-del-norte', province: 'Lanao del Norte' },
	{ slug: 'misamis-occidental', province: 'Misamis Occidental' },
	{ slug: 'misamis-oriental', province: 'Misamis Oriental' },
] as const;

export type Office = (typeof OFFICES)[number];

export const officeHref = (slug: string) => `/accomplishments/${slug}/`;
