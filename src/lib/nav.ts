export interface NavItem {
	label: string;
	href: string;
	external?: boolean;
	children?: NavItem[];
}

// Structure mirrors the DTI Region 10 staging site. Pages that do not exist
// yet point to '#'; swap in the real route when each page is built.
export const navItems: NavItem[] = [
	{ label: 'Home', href: '/' },
	{
		label: 'Stories & Press Release',
		href: '#',
		children: [
			{ label: 'Regional Office', href: '#' },
			{ label: 'Bukidnon', href: '#' },
			{ label: 'Camiguin', href: '#' },
			{ label: 'Lanao del Norte', href: '#' },
			{ label: 'Misamis Oriental', href: '#' },
		],
	},
	{
		label: 'Programs',
		href: '#',
		children: [
			{ label: 'SSF', href: '#' },
			{ label: 'RAPID', href: '#' },
		],
	},
	{
		label: 'Resources',
		href: '#',
		children: [
			{
				label: 'DTI-X Micro Site',
				href: 'https://sites.google.com/r10.dti.gov.ph/dti-region-10/home/',
				external: true,
			},
		],
	},
	{ label: 'Accomplishments', href: '#' },
	{ label: 'About', href: '#' },
];
