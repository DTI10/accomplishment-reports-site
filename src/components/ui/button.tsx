import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// shadcn/ui Button, with variants in the RAPID R10 palette (6px corners, formal style)
const buttonVariants = cva(
	"inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[6px] text-sm font-semibold transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dti-gold disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default: 'bg-dti-gold text-navy-deep hover:bg-mist',
				secondary: 'bg-dti-blue text-mist hover:bg-navy',
				outline: 'border border-mist/35 bg-navy-deep/30 text-mist backdrop-blur-sm hover:border-mist hover:bg-mist/10',
				ghost: 'text-mist hover:bg-mist/10',
			},
			size: {
				default: 'h-11 px-5',
				sm: 'h-9 px-3.5',
				lg: 'h-12 px-6 text-[0.975rem]',
				icon: 'size-11',
			},
		},
		defaultVariants: { variant: 'default', size: 'default' },
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : 'button';
	return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
