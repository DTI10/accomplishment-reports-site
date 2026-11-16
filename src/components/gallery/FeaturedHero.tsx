import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import Fade from 'embla-carousel-fade';

import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface HeroItem {
	id: string;
	tag: string;
	provinces?: string[];
	date: string;
	title: string;
	summary: string;
	href: string;
	alt: string;
	src?: string; // large photo (optional: falls back to a branded panel)
}

const AUTOPLAY_MS = 7000;

/**
 * Featured stories as the page's hero: a full-width photo per story with its title, summary and
 * one button over it, a crossfade between stories, a counter, an autoplay progress bar and arrows.
 * Autoplay pauses while the pointer is over the story text or the controls, while dragging,
 * and while anything inside has keyboard focus.
 * Built on the shadcn/ui Carousel (Embla) with the fade plugin.
 */
export default function FeaturedHero({ items }: { items: HeroItem[] }) {
	const [api, setApi] = React.useState<CarouselApi>();
	const [selected, setSelected] = React.useState(0);
	const [paused, setPaused] = React.useState(false);
	const [still, setStill] = React.useState(false);
	const n = items.length;
	const many = n > 1;

	React.useEffect(() => {
		setStill(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
	}, []);

	React.useEffect(() => {
		if (!api) return;
		const onSelect = () => setSelected(api.selectedScrollSnap());
		onSelect();
		api.on('select', onSelect);
		api.on('pointerDown', () => setPaused(true));
		api.on('pointerUp', () => setPaused(false));
		return () => {
			api.off('select', onSelect);
		};
	}, [api]);

	const autoplay = many && !still;

	return (
		<Carousel
			setApi={setApi}
			opts={{ loop: many, duration: 32, watchDrag: many }}
			plugins={[Fade()]}
			className="fh"
			aria-label="Featured stories"
			onFocusCapture={() => setPaused(true)}
			onBlurCapture={() => setPaused(false)}
		>
			<CarouselContent className="ml-0">
				{items.map((item, i) => {
					const active = i === selected;
					return (
						<CarouselItem key={item.id} className="fh-slide pl-0" aria-label={`${i + 1} of ${n}`} inert={!active}>
							{item.src ? (
								<img
								src={item.src}
								alt={item.alt}
								className={cn('fh-photo', active && 'is-active')}
								// the home page script adds data-loaded before React takes over (it drives the fade-in)
								suppressHydrationWarning
								// Deliberately NOT given a view-transition-name: a named photo is drawn in its own layer during page
								// transitions, above the gradient overlay, so the photo would show un-darkened until the transition ends.
								// all stacked photos load up front so each zoom plays on a ready image
								loading="eager"
								fetchPriority={i === 0 ? 'high' : 'auto'}
								draggable={false}
							/>
							) : (
								<div className="fh-photo fh-fallback" aria-hidden="true" />
							)}
							<div className="fh-shade" aria-hidden="true" />

							<div className="fh-content shell">
								<div
									className={cn('fh-text', active && 'is-active')}
									onMouseEnter={() => setPaused(true)}
									onMouseLeave={() => setPaused(false)}
								>
									<div className="flex flex-wrap items-center gap-2">
										<Badge variant={item.tag === 'Accomplishment' ? 'story' : 'news'}>{item.tag}</Badge>
										{item.provinces?.map((p) => (
											<Badge key={p} variant="outline">
												{p}
											</Badge>
										))}
									</div>
									<h3 className="fh-title display mt-5">
										<a href={item.href} className="focus-visible:outline-dti-gold">
											{item.title}
										</a>
									</h3>
									<p className="mt-5 text-sm text-mist/70">
										{item.date}
									</p>
									{item.summary && <p className="fh-summary mt-4 text-mist/80">{item.summary}</p>}
									<Button asChild size="lg" className="group/cta mt-7 h-12 gap-2.5 bg-[#f2c230] px-6 text-base hover:bg-[#f7d45c] shadow-[0_14px_30px_-16px_rgb(0_0_0/0.7)] sm:mt-8 sm:h-[3.25rem] sm:gap-3 sm:px-7 sm:text-[1.05rem]">
										<a href={item.href}>
											Read more
											<ArrowRight className="size-5 transition-transform duration-300 group-hover/cta:translate-x-1" aria-hidden="true" />
										</a>
									</Button>
								</div>
							</div>
						</CarouselItem>
					);
				})}
			</CarouselContent>

			{many && (
				<div className="fh-controls shell" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
					<div className="flex min-w-0 flex-1 items-center gap-4">
						<span className="text-sm font-semibold tabular-nums text-mist" aria-hidden="true">
							{String(selected + 1).padStart(2, '0')}
							<span className="text-mist/50"> / {String(n).padStart(2, '0')}</span>
						</span>
						{/* autoplay progress: when the bar fills, the next story shows */}
						<div className="fh-progress" aria-hidden="true">
							{autoplay && (
								<span
									key={selected}
									style={{ animationDuration: `${AUTOPLAY_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }}
									onAnimationEnd={() => api?.scrollNext()}
								/>
							)}
						</div>
					</div>


					<div className="flex items-center gap-2">
						<CarouselPrevious className="static translate-y-0" />
						<CarouselNext className="static translate-y-0" />
					</div>
				</div>
			)}

			<p className="sr-only" aria-live="polite">
				{items[selected]?.title}
			</p>
		</Carousel>
	);
}
