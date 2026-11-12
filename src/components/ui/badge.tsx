import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// shadcn/ui Badge, with the site's story labels as variants
const badgeVariants = cva(
	'inline-flex w-fit shrink-0 items-center justify-center whitespace-nowrap rounded-[3px] border px-2.5 py-1 text-[0.68rem] font-semibold tracking-[0.14em] uppercase',
	{
		variants: {
			variant: {
				default: 'border-dti-gold/70 text-dti-gold',
				news: 'border-dti-gold/70 text-dti-gold',
				story: 'border-dti-gold/70 text-dti-gold',
				youth: 'border-dti-gold/70 text-dti-gold',
				outline: 'border-mist/30 text-mist/85',
			},
		},
		defaultVariants: { variant: 'default' },
	},
);

function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
	return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
