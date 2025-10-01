import * as React from "react";
import { cn } from "./utils";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function ScrollArea({ className, children, ...props }: ScrollAreaProps) {
  return (
    <div
      className={cn("relative overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function ScrollBar({ className, orientation = "vertical", ...props }: any) {
  return null; // Простая заглушка, поскольку мы используем нативный скролл
}

export { ScrollArea, ScrollBar };