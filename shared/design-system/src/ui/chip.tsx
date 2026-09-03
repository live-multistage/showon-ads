import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";
import styles from "./chip.module.scss";

const chipVariants = cva(styles.chip, {
  variants: {
    variant: {
      // Genre filter pill — Space Mono 11px uppercase (DESIGN.md §5)
      default: styles.default,
      active: styles.active,
      // Footer static tag — Space Mono 10px uppercase
      tag: styles.tag,
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Chip({
  className,
  variant,
  asChild = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof chipVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="chip"
      className={cn(chipVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Chip, chipVariants };
