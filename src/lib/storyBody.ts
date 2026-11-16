import { marked, type Token } from 'marked';

/*
 * Story text rendering for the story pages.
 *
 * Editors often paste articles from Word or Google Docs. That brings invisible characters
 * (non-breaking spaces, zero-width spaces, Windows line endings) that make Markdown merge
 * paragraphs or glue a heading onto the paragraph before it. cleanStoryText() fixes those
 * before rendering, so the page matches what the editor saw in the admin preview.
 *
 * The admin preview (public/admin/preview.js) uses the same rules — keep the two in step.
 */

/** Normalise pasted text so paragraphs and headings come out exactly as written. */
export function cleanStoryText(md: string): string {
	let s = md
		.replace(/\r\n?/g, '\n') // Windows / old Mac line endings
		.replace(/[​-‍﻿]/g, '') // zero-width characters
		.replace(/ /g, ' ') // non-breaking spaces from Word/Docs
		.replace(/&nbsp;/g, ' ');
	// lines that only contain spaces/tabs count as blank lines (separate paragraphs)
	s = s
		.split('\n')
		.map((line) => (line.trim() === '' ? '' : line.replace(/[ \t]+$/, '')))
		.join('\n');
	// a line that is only bold text is a subheading: give it its own block
	s = s.replace(/^[ \t]*\*\*([^*\n]+?)\*\*[ \t]*$/gm, '\n### $1\n');
	// at most one empty line between blocks
	return s.replace(/\n{3,}/g, '\n\n').trim();
}

export interface StoryBlock {
	html: string;
	isParagraph: boolean;
}

/** Render the story into top-level blocks (paragraphs, subheadings, lists, quotes). */
export function renderStoryBlocks(md: string): StoryBlock[] {
	const tokens = marked.lexer(cleanStoryText(md), { gfm: true, breaks: false });
	return tokens
		.filter((t: Token) => t.type !== 'space')
		.map((t: Token) => ({
			html: marked.parser([t] as never) as string,
			isParagraph: t.type === 'paragraph',
		}));
}

/**
 * Where to put each extra photo: returns, for each photo, the index of the block it goes after.
 * Photos are spread evenly through the paragraphs, the first one after the 2nd paragraph.
 */
export function photoSlots(blocks: StoryBlock[], count: number): number[] {
	const paras = blocks.map((b, i) => (b.isParagraph ? i : -1)).filter((i) => i >= 0);
	if (!count || paras.length === 0) return [];
	const slots: number[] = [];
	for (let k = 0; k < count; k++) {
		// spread across the paragraphs, never before the 2nd one, never two photos in one slot
		let p = Math.round(((k + 1) * paras.length) / (count + 1));
		p = Math.max(p, 2, (slots.length ? paras.indexOf(slots[slots.length - 1]) + 1 : 0) + 1);
		p = Math.min(p, paras.length);
		slots.push(paras[p - 1]);
	}
	return slots;
}

/**
 * Placement for each extra photo, honouring the editor's "place after paragraph" numbers.
 * Returns the block index each photo goes after (-1 = top of the story).
 *  - after = 0      → top of the story
 *  - after = N      → after the Nth text block (paragraphs, subheadings and lists each count)
 *  - after > blocks → after the last block
 *  - no after       → automatic, spread evenly like photoSlots()
 */
export function placePhotos(blocks: StoryBlock[], photos: { after?: number | null }[]): number[] {
	const autoCount = photos.filter((p) => p.after == null).length;
	const autoSlots = photoSlots(blocks, autoCount);
	let a = 0;
	return photos.map((p) => {
		if (p.after == null) return autoSlots[a++] ?? blocks.length - 1;
		return Math.min(p.after, blocks.length) - 1;
	});
}

/** Left/right for each photo: the editor's choice, or alternating (1st left, 2nd right…) on "auto". */
export function photoSide(side: string | undefined, index: number): 'left' | 'right' {
	if (side === 'left' || side === 'right') return side;
	return index % 2 === 0 ? 'left' : 'right';
}

/** Plain text of the story's first paragraph, used as its summary (hero, link previews). */
export function firstParagraph(md: string, maxLength = 220): string {
	const first = renderStoryBlocks(md).find((b) => b.isParagraph);
	if (!first) return '';
	const text = first.html
		.replace(/<[^>]+>/g, '')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/\s+/g, ' ')
		.trim();
	if (text.length <= maxLength) return text;
	// cut at a word boundary
	return text.slice(0, text.lastIndexOf(' ', maxLength)).replace(/[,;:.]$/, '') + '…';
}

