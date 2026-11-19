import { useMemo, useState } from 'react';

import type { DashboardData } from '@/lib/dashboard';

import { OFFICES, officeHref } from '@/lib/offices';

import { MonthlyChart, OfficeChart, ProgramChart } from './charts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ALL = 'all';

const panel = 'rounded-xl border border-navy/10 bg-white p-5 sm:p-6';
const heading = 'text-[0.95rem] font-semibold text-navy';
const sub = 'mt-1 text-[0.8rem] text-ink/55';

const shortDate = (iso: string) =>
	new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
		new Date(iso),
	);

const longDate = (iso: string) =>
	new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(
		new Date(iso),
	);

// A quiet stat card: label, one large figure, one line of context
function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
	return (
		<div className="rounded-xl border border-navy/10 bg-white p-5 sm:p-6">
			<p className="text-sm text-ink/65">{label}</p>
			<p className="mt-2 text-3xl font-semibold tracking-tight text-navy tabular-nums">{value}</p>
			<p className="mt-3 line-clamp-1 text-sm text-ink/55">{note}</p>
		</div>
	);
}

function FilterSelect({
	id,
	label,
	value,
	onChange,
	children,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	children: React.ReactNode;
}) {
	return (
		<div>
			<label htmlFor={id} className="block text-[0.7rem] font-semibold tracking-[0.18em] text-ink/55 uppercase">
				{label}
			</label>
			<div className="relative mt-2 w-40 sm:w-44">
				<select
					id={id}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="h-10 w-full cursor-pointer appearance-none rounded-md border border-navy/15 bg-white pr-9 pl-3 text-sm font-medium text-navy shadow-xs transition-colors hover:border-navy/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
				>
					{children}
				</select>
				<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-navy/60">
					<path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</div>
		</div>
	);
}

export default function Dashboard({ data }: { data: DashboardData }) {
	const [year, setYear] = useState<string>(String(data.defaultYear));
	const [month, setMonth] = useState<string>(ALL);
	const allYears = year === ALL;
	const allMonths = month === ALL;
	const monthName = allMonths ? '' : MONTH_NAMES[Number(month)];
	// e.g. "November 2026", "November, all years", "2026", "all years"
	const scope = allMonths ? (allYears ? 'all years' : year) : allYears ? `${monthName}, all years` : `${monthName} ${year}`;

	const view = useMemo(() => {
		const posts = data.posts.filter(
			(p) => (allYears || p.date.startsWith(year)) && (allMonths || Number(p.date.slice(5, 7)) - 1 === Number(month)),
		);

		// all offices are listed, even with 0; the most active first, ties in menu order
		const byOffice = data.offices
			.map((office) => ({
				office,
				href: officeHref(OFFICES.find((o) => o.province === office)?.slug ?? ''),
				total: posts.filter((p) => p.office === office).length,
			}))
			.sort((a, b) => b.total - a.total || data.offices.indexOf(a.office) - data.offices.indexOf(b.office));

		// the programs only: stories without a program are left out of this chart
		const byProgram = data.programs
			.map((pr) => ({ name: pr.name, total: posts.filter((p) => p.programs.includes(pr.key)).length }))
			.filter((d) => d.total > 0);
		const inAnyProgram = posts.filter((p) => data.programs.some((pr) => p.programs.includes(pr.key))).length;
		// a year shows its twelve months, a month shows its days, "All years" shows one bar per year
		const buildTrend = (list: typeof posts) => {
			if (allYears) {
				const ys = data.posts.map((p) => Number(p.date.slice(0, 4)));
				const from = Math.min(...ys);
				const to = Math.max(...ys);
				return Array.from({ length: to - from + 1 }, (_, i) => ({
					label: String(from + i),
					total: list.filter((p) => p.date.startsWith(String(from + i))).length,
				}));
			}
			if (allMonths) {
				return MONTHS.map((label, i) => ({
					label,
					total: list.filter((p) => Number(p.date.slice(5, 7)) - 1 === i).length,
				}));
			}
			const days = new Date(Number(year), Number(month) + 1, 0).getDate();
			return Array.from({ length: days }, (_, i) => ({
				label: String(i + 1),
				total: list.filter((p) => Number(p.date.slice(8, 10)) === i + 1).length,
			}));
		};
		const trend = buildTrend(posts);

		// the period right before this one, as plain text under the first figure
		let compare: string | null = null;
		if (!allYears) {
			let py = Number(year);
			let pm: number | null = null;
			if (allMonths) {
				py -= 1;
			} else {
				pm = Number(month) - 1;
				if (pm < 0) {
					pm = 11;
					py -= 1;
				}
			}
			const key = pm === null ? String(py) : `${py}-${String(pm + 1).padStart(2, '0')}`;
			const before = data.posts.filter((p) => p.date.startsWith(key)).length;
			const label = pm === null ? String(py) : `${MONTH_NAMES[pm]} ${py}`;
			const diff = posts.length - before;
			if (posts.length > 0 || before > 0) {
				compare = diff === 0 ? `same as ${label}` : `${diff > 0 ? 'up' : 'down'} ${Math.abs(diff)} from ${label}`;
			}
		}

		const programsCovered = data.programs.filter((pr) => posts.some((p) => p.programs.includes(pr.key))).length;
		return {
			posts,
			byOffice,
			byProgram,
			inAnyProgram,
			trend,
			officesReporting: byOffice.filter((o) => o.total > 0).length,
			programsCovered,
			latest: posts[0]?.date ?? null,
			latestPost: posts[0] ?? null,
			compare,
		};
	}, [data, year, month, allYears, allMonths]);

	const notPosted = data.offices.length - view.officesReporting;

	return (
		<div>
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div className="flex flex-wrap items-end gap-3 sm:gap-4">
					<FilterSelect id="dash-month" label="Month" value={month} onChange={setMonth}>
						<option value={ALL}>All months</option>
						{MONTH_NAMES.map((m, i) => (
							<option key={m} value={i}>
								{m}
							</option>
						))}
					</FilterSelect>
					<FilterSelect id="dash-year" label="Reporting year" value={year} onChange={setYear}>
						{data.years.map((y) => (
							<option key={y} value={y}>
								{y}
							</option>
						))}
						<option value={ALL}>All years</option>
					</FilterSelect>
				</div>
				{data.updated && <p className="text-sm text-ink/55">Updated {data.updated}</p>}
			</div>

			<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard label="Accomplishments posted" value={String(view.posts.length)} note={view.compare ? `In ${scope}, ${view.compare}` : `In ${scope}`} />
				<StatCard
					label="Offices reporting"
					value={`${view.officesReporting} of ${data.offices.length}`}
					note={notPosted === 0 ? 'Every office has posted' : `${notPosted} ${notPosted === 1 ? 'office has' : 'offices have'} not posted`}
				/>
				<StatCard
					label="Programs covered"
					value={data.programs.length > 0 ? `${view.programsCovered} of ${data.programs.length}` : '0'}
					note={
						view.programsCovered > 0
							? data.programs.filter((pr) => view.posts.some((p) => p.programs.includes(pr.key))).map((pr) => pr.name).join(', ')
							: 'No program stories'
					}
				/>
				<StatCard
					label="Latest accomplishment"
					value={view.latest ? shortDate(view.latest) : 'None yet'}
					note={view.latestPost ? (view.latestPost.office ?? 'DTI Region 10') : `Nothing posted in ${scope}`}
				/>
			</div>

			{view.posts.length === 0 ? (
				<p className={`${panel} mt-6 text-ink/65`}>No accomplishments were posted in {scope}.</p>
			) : (
				<div className="mt-6 grid gap-4 sm:gap-6 lg:grid-cols-2">
					<section className={`${panel} lg:col-span-2`} aria-label="Accomplishments over time">
						<h2 className={heading}>
							{allYears ? 'Accomplishments per year' : allMonths ? `Accomplishments by month, ${year}` : `Accomplishments by day, ${monthName} ${year}`}
						</h2>
						<p className={sub}>
							{allYears ? (allMonths ? 'Posted each year' : `Posted each year, ${monthName} only`) : allMonths ? 'Posted each month' : 'Posted each day'}
						</p>
						<div className="mt-4">
							<MonthlyChart key={`${year}-${month}`} data={view.trend} />
						</div>
					</section>

					<section className={panel} aria-label="By office">
						<h2 className={heading}>By office</h2>
						<p className={sub}>Accomplishments posted by each office in {scope}. Select an office name to open its page.</p>
						<div className="mt-4">
							<OfficeChart key={`${year}-${month}`} data={view.byOffice} />
						</div>
					</section>

					<section className={panel} aria-label="By program">
						<h2 className={heading}>By program</h2>
						<p className={sub}>A story in two programs counts in each</p>
						<div className="mt-4">
							{view.byProgram.length > 0 ? (
								<ProgramChart key={`${year}-${month}`} data={view.byProgram} total={view.inAnyProgram} />
							) : (
								<p className="grid h-64 place-items-center text-sm text-ink/55">No program stories in {scope}.</p>
							)}
						</div>
					</section>

					<section className={`${panel} lg:col-span-2`} aria-label="Latest accomplishments">
						<h2 className={heading}>Latest accomplishments</h2>
						<ul className="mt-3 divide-y divide-navy/10">
							{view.posts.slice(0, 5).map((p) => (
								<li key={p.href}>
									<a href={p.href} className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3.5">
										<span className="font-medium text-navy underline-offset-4 group-hover:underline">{p.title}</span>
										<span className="text-sm text-ink/55">
											{p.office ?? 'DTI Region 10'} · {longDate(p.date)}
										</span>
									</a>
								</li>
							))}
						</ul>
					</section>
				</div>
			)}
		</div>
	);
}
