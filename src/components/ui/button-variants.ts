import { cva } from "class-variance-authority";

import type { VariantProps } from "class-variance-authority";

/**
 * Button styles, kept apart from the Button component so links and client
 * components can use them without pulling `cn` or Radix Slot into the browser
 * bundle: `<Link className={buttonVariants({ size: "lg" })}>`.
 *
 * Without `cn` nothing merges conflicting classes, so each property is set in
 * exactly one place: border and focus colors per variant; radius, text and icon
 * size per size. button-variants.test.ts enforces this for every combination.
 */
export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 focus-visible:border-ring focus-visible:ring-ring/50",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] focus-visible:border-ring focus-visible:ring-ring/50 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "border-transparent hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "border-transparent text-primary underline-offset-4 hover:underline focus-visible:border-ring focus-visible:ring-ring/50",
      },
      size: {
        default:
          "h-9 gap-1.5 rounded-lg px-3 text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-4",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        // 44px: the minimum touch target on mobile (docs/design-system.md §2.4)
        lg: "h-11 gap-2 rounded-[min(var(--radius-xl),12px)] px-5 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 [&_svg:not([class*='size-'])]:size-4",
        icon: "size-9 rounded-lg text-sm [&_svg:not([class*='size-'])]:size-4",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] text-xs in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] text-[0.8rem] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-4",
        "icon-lg":
          "size-11 rounded-lg text-base [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
