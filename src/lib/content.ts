import { getCollection, type CollectionEntry } from 'astro:content';

export type PostCollection = 'articles' | 'news';
export type Post = CollectionEntry<PostCollection>;

export const getPublishedPosts = async (collection: PostCollection) => {
	const posts = await getCollection(collection);

	return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
};

/** Posts explicitly linked through the CMS "Related" field, in the order chosen. */
export const getRelatedPosts = async (post: Post): Promise<Post[]> => {
	const ids = post.data.related;
	if (!ids || ids.length === 0) return [];

	const collection = post.collection as PostCollection;
	const posts = await getCollection(collection);

	return ids
		.map((id) => posts.find((candidate) => candidate.id === id))
		.filter((candidate): candidate is Post => Boolean(candidate));
};

export const getSectionForCollection = (collection: PostCollection) =>
	collection === 'news' ? 'news' : 'articles';

export const getPostHref = (post: Pick<Post, 'collection' | 'id'>) =>
	`/${getSectionForCollection(post.collection as PostCollection)}/${post.id}/`;

export const formatPostDate = (date: Date, style: 'short' | 'long' = 'short') =>
	new Intl.DateTimeFormat('en-PH', {
		year: 'numeric',
		month: style === 'long' ? 'long' : 'short',
		day: 'numeric',
	}).format(date);

/** DTI Region 10 offices/provinces. A post tagged with one of these shows it as a location badge. */
export const PROVINCES = [
	'Regional Office',
	'Bukidnon',
	'Camiguin',
	'Lanao del Norte',
	'Misamis Occidental',
	'Misamis Oriental',
] as const;

/** Provinces for a post: the Province field, plus any tag that names a province. */
export const getProvinces = (data: { province?: string[]; tags?: string[] }) => {
	const names = [...(data.province ?? []), ...(data.tags ?? [])].map((n) => n.trim().toLowerCase());
	return PROVINCES.filter((p) => names.includes(p.toLowerCase()));
};
