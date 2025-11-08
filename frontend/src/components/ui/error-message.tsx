import * as React from "react";
import { cn } from "@/lib/utils";

type ErrorMessageProps = React.HTMLAttributes<HTMLElement> & {
  as?: "p" | "div" | "span";
  id?: string;
};

function ErrorMessage({ as = "p", className, children, id, ...props }: ErrorMessageProps) {
  const Component = as;
  return React.createElement(
    Component,
    {
      id,
      "data-slot": "error",
      "aria-live": "polite",
      className: cn("text-sm text-destructive mt-1", className),
      ...props,
    },
    children
  );
}

export { ErrorMessage };
