import { getCollection, type CollectionEntry } from 'astro:content';

export type PostCollection = 'articles' | 'news';
export type Post = CollectionEntry<PostCollection>;

export const getPublishedPosts = async (collection: PostCollection) => {
	const posts = await getCollection(collection);

	return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
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
