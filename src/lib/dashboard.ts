import { OFFICES } from './offices';
import { getPrograms } from './programs';
import { formatPostDate, getPostHref, getProvinces, getPublishedPosts } from './content';

export interface DashboardPost {
	title: string;
	href: string;
	/** YYYY-MM-DD */
	date: string;
	office: string | null;
	programs: string[];
}

export interface DashboardData {
	posts: DashboardPost[];
	offices: string[];
	programs: { key: string; name: string }[];
	/** the year the page opens on */
	defaultYear: number;
	years: number[];
	updated: string | null;
}

// One small record per accomplishment. The page's React island filters and counts these in the browser,
// so the Year selector can change every chart without loading anything.
export const getDashboardData = async (): Promise<DashboardData> => {
	const posts = await getPublishedPosts('articles'); // newest first
	const programs = await getPrograms();

	const records: DashboardPost[] = posts.map((p) => ({
		title: p.data.title,
		href: getPostHref(p),
		date: p.data.date.toISOString().slice(0, 10),
		office: getProvinces(p.data)[0] ?? null,
		programs: p.data.programs,
	}));

	const years = [...new Set(records.map((r) => Number(r.date.slice(0, 4))))].sort((a, b) => b - a);
	const thisYear = new Date().getFullYear();

	return {
		posts: records,
		offices: OFFICES.map((o) => o.province),
		programs: programs.map((p) => ({ key: p.slug, name: p.label })),
		defaultYear: years.includes(thisYear) ? thisYear : (years[0] ?? thisYear),
		years: years.length > 0 ? years : [thisYear],
		updated: posts[0] ? formatPostDate(posts[0].data.date, 'long') : null,
	};
};
