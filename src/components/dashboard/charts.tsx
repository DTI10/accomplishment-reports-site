import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Label,
	LabelList,
	Legend,
	Pie,
	PieChart,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';

const PALETTE = ['#0a1f44', '#0038a8', '#7d93c4', '#c3cde0'];
const cursor = { fill: 'rgba(10,31,68,0.05)' };
// legend labels in the page's ink colour, not the series colour (gold is hard to read)
const legendText = (value: string) => <span className="text-ink/70">{value}</span>;

export function MonthlyChart({ data }: { data: { label: string; total: number }[] }) {
	const config: ChartConfig = { total: { label: 'Accomplishments', color: PALETTE[0] } };
	return (
		<ChartContainer config={config}>
			<BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
				<CartesianGrid vertical={false} />
				<XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
				<YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} />
				<Tooltip cursor={cursor} content={<ChartTooltip config={config} />} />
				<Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} maxBarSize={44} animationDuration={500}>
					<LabelList dataKey="total" position="top" className="fill-navy" />
				</Bar>
			</BarChart>
		</ChartContainer>
	);
}

// Office name as a link to that office's page (the axis labels are the navigation)
function OfficeTick({ x, y, payload, hrefs }: { x?: number; y?: number; payload?: { value: string }; hrefs: Record<string, string> }) {
	const name = payload?.value ?? '';
	return (
		<a href={hrefs[name]}>
			<text x={(x ?? 0) - 4} y={y} dy={4} textAnchor="end" className="fill-navy text-[0.8rem] font-medium hover:underline">
				{name}
			</text>
		</a>
	);
}

export function OfficeChart({ data }: { data: { office: string; href: string; total: number }[] }) {
	const config: ChartConfig = { total: { label: 'Accomplishments', color: PALETTE[1] } };
	const hrefs = Object.fromEntries(data.map((d) => [d.office, d.href]));
	// every row gets a pale full-width track, so offices with 0 still read as a row
	const top = Math.max(4, ...data.map((d) => d.total));
	const rows = data.map((d) => ({ ...d, track: top }));
	return (
		<ChartContainer config={config} className="h-80">
			<BarChart data={rows} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }} barCategoryGap="22%" barGap={-22}>
				<CartesianGrid horizontal={false} />
				<XAxis
					type="number"
					domain={[0, top]}
					allowDecimals={false}
					tickLine={false}
					axisLine={false}
					tickMargin={8}
				/>
				<YAxis
					type="category"
					dataKey="office"
					width={132}
					tickLine={false}
					axisLine={false}
					tick={<OfficeTick hrefs={hrefs} />}
				/>
				<Tooltip
					cursor={false}
					content={(props: any) => (
						<ChartTooltip {...props} payload={props.payload?.filter((i: any) => i.dataKey === 'total')} config={config} />
					)}
				/>
				<Bar dataKey="track" fill="#eef1f8" radius={6} barSize={22} isAnimationActive={false} legendType="none">
					{/* an office with no posts has no blue bar to carry its number, so the 0 sits on the track */}
					<LabelList
						dataKey="total"
						content={(p: any) =>
							Number(p.value) === 0 ? (
								<text x={Number(p.x) + 10} y={Number(p.y) + Number(p.height) / 2} dy={4} className="fill-ink/50 text-xs font-semibold">
									0
								</text>
							) : null
						}
					/>
				</Bar>
				<Bar dataKey="total" fill="var(--color-total)" radius={6} barSize={22} animationDuration={500}>
					<LabelList
						dataKey="total"
						content={(p: any) => (
							<text x={Number(p.x) + Number(p.width) + 8} y={Number(p.y) + Number(p.height) / 2} dy={4} className="fill-navy text-xs font-semibold">
								{p.value}
							</text>
						)}
					/>
				</Bar>
			</BarChart>
		</ChartContainer>
	);
}

export function ProgramChart({
	data,
	total,
}: {
	data: { name: string; total: number }[];
	total: number;
}) {
	const config: ChartConfig = {};
	return (
		<ChartContainer config={config}>
			<PieChart>
				<Tooltip content={<ChartTooltip config={config} />} />
				<Pie
					animationDuration={500}
					data={data}
					dataKey="total"
					nameKey="name"
					innerRadius={62}
					outerRadius={92}
					strokeWidth={3}
					stroke="#fff"
				>
					{data.map((d, i) => (
						<Cell key={d.name} fill={PALETTE[i % PALETTE.length]} />
					))}
					<Label
						content={({ viewBox }) => {
							const { cx, cy } = viewBox as { cx: number; cy: number };
							return (
								<text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
									<tspan x={cx} y={cy - 4} className="fill-navy text-3xl font-semibold">
										{total}
									</tspan>
									<tspan x={cx} y={cy + 18} className="fill-ink/60 text-xs">
										in programs
									</tspan>
								</text>
							);
						}}
					/>
				</Pie>
				<Legend iconType="square" iconSize={10} formatter={legendText} />
			</PieChart>
		</ChartContainer>
	);
}
