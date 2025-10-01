"use client";

import * as React from "react";
import { cn } from "./utils";

interface TooltipProps {
  children: React.ReactNode;
}

interface TooltipContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextType | undefined>(undefined);

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Tooltip({ children }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </TooltipContext.Provider>
  );
}

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

function TooltipTrigger({ 
  asChild = false, 
  children, 
  ...props 
}: TooltipTriggerProps) {
  const context = React.useContext(TooltipContext);
  
  const handleMouseEnter = () => context?.setOpen(true);
  const handleMouseLeave = () => context?.setOpen(false);
  const handleFocus = () => context?.setOpen(true);
  const handleBlur = () => context?.setOpen(false);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
      ...props,
    });
  }

  // Исключаем asChild из props, передаваемых в DOM
  const { asChild: _, ...domProps } = props;
  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...domProps}
    >
      {children}
    </div>
  );
}

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  hidden?: boolean;
}

function TooltipContent({
  className,
  side = "top",
  align = "center",
  sideOffset = 4,
  hidden = false,
  children,
  ...props
}: TooltipContentProps) {
  const context = React.useContext(TooltipContext);
  
  if (!context?.open || hidden) {
    return null;
  }

  const sideClasses = {
    top: "bottom-full mb-1",
    bottom: "top-full mt-1", 
    left: "right-full mr-1",
    right: "left-full ml-1",
  };

  const alignClasses = {
    start: side === "top" || side === "bottom" ? "left-0" : "top-0",
    center: side === "top" || side === "bottom" ? "left-1/2 -translate-x-1/2" : "top-1/2 -translate-y-1/2",
    end: side === "top" || side === "bottom" ? "right-0" : "bottom-0",
  };

  return (
    <div
      className={cn(
        "absolute z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95",
        sideClasses[side],
        alignClasses[align],
        className
      )}
      style={{ marginTop: side === "bottom" ? sideOffset : undefined }}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };