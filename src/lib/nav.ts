import { OFFICES, officeHref } from './offices';
import { getPrograms, programHref } from './programs';

export interface NavItem {
	label: string;
	href: string;
	external?: boolean;
	children?: NavItem[];
}

// Structure mirrors the DTI Region 10 staging site. Pages that do not exist
// yet point to '#'; swap in the real route when each page is built.
// The Programs menu is built from the Programs collection (see programs.ts), so it follows the CMS.
export const getNavItems = async (): Promise<NavItem[]> => {
	const programs = await getPrograms();
	return [
		{ label: 'Home', href: '/' },
		{
			label: 'Accomplishments',
			href: '/accomplishments/',
			children: OFFICES.map((office) => ({
				label: office.province,
				href: officeHref(office.slug),
			})),
		},
		// no Programs menu while there are no programs
		...(programs.length > 0
			? [
					{
						label: 'Programs',
						href: '#',
						children: programs.map((p) => ({ label: p.label, href: programHref(p.slug) })),
					},
				]
			: []),
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
	];
};
