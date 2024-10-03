import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        positive:
          "border-transparent bg-green-100 text-green-500 hover:bg-green/80",
        warning:
          "border-transparent bg-orange-100 text-orange-500 hover:bg-orange/80",
        purple:
          "border-transparent bg-purple-100 text-purple-500 hover:bg-purple/80",
        gray: "border-transparent bg-gray-100 text-gray-500 hover:bg-gray/80",
        yellow:
          "border-transparent bg-yellow-100 text-yellow-500 hover:bg-yellow/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        info: "border-transparent bg-blue-100 text-blue-500 hover:bg-blue/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
