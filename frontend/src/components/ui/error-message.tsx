import * as React from "react";
import { cn } from "@/lib/utils";

type ErrorMessageProps = React.HTMLAttributes<HTMLElement> & {
  as?: "p" | "div" | "span";
  id?: string;
};

function ErrorMessage({ as = "p", className, children, id, ...props }: ErrorMessageProps) {
  const Comp: any = as;
  return (
    <Comp
      id={id}
      data-slot="error"
      aria-live="polite"
      className={cn("text-sm text-destructive mt-1", className)}
      {...props}
    >
      {children}
    </Comp>
  );
}

export { ErrorMessage };
