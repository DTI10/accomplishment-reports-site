import * as React from 'react';
import { ResponsiveContainer } from 'recharts';

import { cn } from '@/lib/utils';

export type ChartConfig = Record<string, { label: string; color: string }>;

// shadcn/ui Chart, trimmed: sets --color-<key> for each series and wraps Recharts
export function ChartContainer({
	config,
	className,
	children,
}: {
	config: ChartConfig;
	className?: string;
	children: React.ReactElement;
}) {
	const vars = Object.fromEntries(
		Object.entries(config).map(([k, v]) => [`--color-${k}`, v.color]),
	) as React.CSSProperties;
	return (
		<div
			data-slot="chart"
			style={vars}
			className={cn(
				'h-64 w-full text-xs [&_.recharts-cartesian-axis-tick_text]:fill-ink/60 [&_.recharts-cartesian-grid_line]:stroke-navy/10 [&_.recharts-surface]:outline-none',
				className,
			)}
		>
			<ResponsiveContainer width="100%" height="100%">
				{children}
			</ResponsiveContainer>
		</div>
	);
}

export function ChartTooltip({
	active,
	payload,
	label,
	config,
}: {
	active?: boolean;
	payload?: any[];
	label?: string;
	config: ChartConfig;
}) {
	if (!active || !payload?.length) return null;
	return (
		<div className="grid min-w-36 gap-1.5 rounded-lg border border-navy/10 bg-white px-3 py-2 text-xs shadow-lg">
			{label && <p className="font-semibold text-navy">{label}</p>}
			{payload.map((item) => {
				const key = String(item.dataKey ?? item.name);
				return (
					<div key={key} className="flex items-center gap-2">
						<span
							className="size-2.5 rounded-[2px]"
							style={{ background: item.color ?? item.payload?.fill }}
						/>
						<span className="text-ink/70">{config[key]?.label ?? item.name}</span>
						<span className="ml-auto font-semibold text-navy tabular-nums">{item.value}</span>
					</div>
				);
			})}
		</div>
	);
}
