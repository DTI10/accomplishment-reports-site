/*
 * Admin preview + save cleanup for Accomplishments (Sveltia CMS).
 *
 * - The preview is laid out like the real page: same fonts, sizes, spacing, tags and photo
 *   placement (preview.css), so editors see what will be published.
 * - Before saving, text pasted from Word / Google Docs is cleaned (non-breaking spaces,
 *   invisible characters, blank-looking lines) so the published page matches the preview.
 *
 * The text rules mirror src/lib/storyBody.ts on the website - keep the two in step.
 * Adapted from the RAPID Growth R10 admin (rcu10.rapid).
 */
(function () {
	if (!window.CMS || !window.marked) return;
	var CMS = window.CMS;
	var marked = window.marked;
	var h = window.h;
	var createClass = window.createClass;

	// --- the same rules as src/lib/storyBody.ts ------------------------------------------
	function cleanBasic(md) {
		var s = String(md || '')
			.replace(/\r\n?/g, '\n')
			.replace(/[​-‍﻿]/g, '')
			.replace(/ /g, ' ')
			.replace(/&nbsp;/g, ' ');
		s = s
			.split('\n')
			.map(function (line) {
				return line.trim() === '' ? '' : line.replace(/[ \t]+$/, '');
			})
			.join('\n');
		return s.replace(/\n{3,}/g, '\n\n').trim();
	}
	function cleanStoryText(md) {
		var s = cleanBasic(md).replace(/^[ \t]*\*\*([^*\n]+?)\*\*[ \t]*$/gm, '\n### $1\n');
		return s.replace(/\n{3,}/g, '\n\n').trim();
	}
	function renderStoryBlocks(md) {
		return marked
			.lexer(cleanStoryText(md), { gfm: true, breaks: false })
			.filter(function (t) {
				return t.type !== 'space';
			})
			.map(function (t) {
				return { html: marked.parser([t]), isParagraph: t.type === 'paragraph' };
			});
	}
	function photoSlots(blocks, count) {
		var paras = [];
		blocks.forEach(function (b, i) {
			if (b.isParagraph) paras.push(i);
		});
		if (!count || !paras.length) return [];
		var slots = [];
		for (var k = 0; k < count; k++) {
			var p = Math.round(((k + 1) * paras.length) / (count + 1));
			var prev = slots.length ? paras.indexOf(slots[slots.length - 1]) + 1 : 0;
			p = Math.min(Math.max(p, 2, prev + 1), paras.length);
			slots.push(paras[p - 1]);
		}
		return slots;
	}
	function placePhotos(blocks, photos) {
		var autoCount = photos.filter(function (p) {
			return p.after == null || p.after === '';
		}).length;
		var autoSlots = photoSlots(blocks, autoCount);
		var a = 0;
		return photos.map(function (p) {
			if (p.after == null || p.after === '') {
				var s = autoSlots[a++];
				return s == null ? blocks.length - 1 : s;
			}
			return Math.min(Number(p.after), blocks.length) - 1;
		});
	}
	function photoSide(side, index) {
		if (side === 'left' || side === 'right') return side;
		return index % 2 === 0 ? 'left' : 'right';
	}
	// ---------------------------------------------------------------------------------------

	function esc(v) {
		return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}
	function toJS(v) {
		return v && typeof v.toJS === 'function' ? v.toJS() : v;
	}
	function list(v) {
		return Array.isArray(v) ? v.filter(Boolean) : v ? [v] : [];
	}
	function assetUrl(getAsset, path) {
		if (!path) return '';
		var a = getAsset(path);
		return a ? String(a.url || a) : String(path);
	}
	function fmtDate(v) {
		var d = new Date(v);
		if (isNaN(d)) return esc(v);
		return d.toLocaleDateString('en-PH', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
	}
	function programLabel(fieldsMetaData, slug) {
		var meta = fieldsMetaData && fieldsMetaData.getIn
			? fieldsMetaData.getIn(['programs', 'programs', slug])
			: null;
		var data = meta && typeof meta.toJS === 'function' ? meta.toJS() : meta;
		return (data && (data.label || data.name)) || slug;
	}
	function buildHtml(d, getAsset, typeLabel, fieldsMetaData) {
		var photos = list(d.photos)
			.filter(function (p) {
				return p && p.image;
			})
			.slice(0, 4);

		var blocks = renderStoryBlocks(d.body);
		var slots = placePhotos(blocks, photos);
		var figuresAt = function (i) {
			var out = '';
			photos.forEach(function (ph, k) {
				if (slots[k] !== i) return;
				out +=
					'<figure class="post-photo size-' + esc(ph.size || 'medium') + ' side-' + photoSide(ph.side, k) + '">' +
					'<img src="' + esc(assetUrl(getAsset, ph.image)) + '" alt="">' +
					(ph.caption && String(ph.caption).trim() ? '<figcaption class="photo-caption">' + esc(String(ph.caption).trim()) + '</figcaption>' : '') +
					'</figure>';
			});
			return out;
		};
		var text = figuresAt(-1); // photos placed at the top (paragraph 0)
		blocks.forEach(function (b, i) {
			text += b.html + figuresAt(i);
		});

		var provinces = list(d.province);
		var programs = list(d.programs);
		var badges =
			'<span class="badge">' + esc(typeLabel) + '</span>' +
			provinces.map(function (p) { return '<span class="badge badge--outline">' + esc(p) + '</span>'; }).join('');

		var html =
			'<header class="post-head"><div class="wrap head-grid"><div>' +
			'<div class="badges">' + badges + '</div>' +
			'<h1 class="post-title">' + esc(d.title) + '</h1>' +
			(programs.length ? '<ul class="tag-list">' + programs.map(function (slug) { return '<li>' + esc(programLabel(fieldsMetaData, slug)) + '</li>'; }).join('') + '</ul>' : '') +
			'</div>' +
			'<div><div class="photo-notch">' +
			(d.image ? '<img class="photo" src="' + esc(assetUrl(getAsset, d.image)) + '" alt="">' : '<div class="photo placeholder">Cover image</div>') +
			'<div class="notch"><span>' + fmtDate(d.date) + '</span><span>' + esc(provinces.length ? provinces.join(', ') : 'DTI Region 10') + '</span></div></div>' +
			'</div></div></header>';

		html += '<article class="wrap post-article">';
		html += '<div class="post-body">' + text + '</div>';
		if (d.author) html += '<p class="byline">By <b>' + esc(d.author) + '</b></p>';
		return html + '</article>';
	}

	function template(typeLabel) {
		return createClass({
			render: function () {
				var d = toJS(this.props.entry.get('data')) || {};
				var html = buildHtml(d, this.props.getAsset, typeLabel, this.props.fieldsMetaData);
				return h('div', { className: 'post-preview', dangerouslySetInnerHTML: { __html: html } });
			},
		});
	}

	CMS.registerPreviewStyle('/admin/preview.css');
	CMS.registerPreviewTemplate('articles', template('Accomplishment'));

	// Clean pasted text before saving, so the published page matches the preview
	CMS.registerEventListener({
		name: 'preSave',
		handler: function (args) {
			var data = args.entry.get('data');
			var body = data.get('body');
			if (typeof body === 'string') data = data.set('body', cleanBasic(body));
			return data;
		},
	});
})();
