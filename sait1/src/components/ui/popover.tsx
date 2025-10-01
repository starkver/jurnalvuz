"use client";

import * as React from "react";
import { cn } from "./utils";

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  onClick?: () => void;
}

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
  contentRef: React.RefObject<HTMLDivElement>;
}>({
  open: false,
  setOpen: () => {},
  triggerRef: React.createRef(),
  contentRef: React.createRef(),
});

function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = React.useCallback((newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  }, [onOpenChange]);

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, setOpen]);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        open &&
        contentRef.current &&
        triggerRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, setOpen]);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      {children}
    </PopoverContext.Provider>
  );
}

function PopoverTrigger({ children, asChild, ...props }: PopoverTriggerProps) {
  const { setOpen, triggerRef } = React.useContext(PopoverContext);

  const handleClick = () => {
    setOpen(true);
    if (props.onClick) {
      props.onClick();
    }
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      ref: triggerRef,
      onClick: handleClick,
      ...props,
    });
  }

  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

function PopoverContent({ 
  children, 
  className, 
  align = "center", 
  side = "bottom", 
  sideOffset = 4 
}: PopoverContentProps) {
  const { open, triggerRef, contentRef } = React.useContext(PopoverContext);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const scrollX = window.pageXOffset;
      const scrollY = window.pageYOffset;

      let top = 0;
      let left = 0;

      // Calculate position based on side
      switch (side) {
        case "bottom":
          top = triggerRect.bottom + scrollY + sideOffset;
          break;
        case "top":
          top = triggerRect.top + scrollY - sideOffset;
          break;
        case "right":
          left = triggerRect.right + scrollX + sideOffset;
          top = triggerRect.top + scrollY;
          break;
        case "left":
          left = triggerRect.left + scrollX - sideOffset;
          top = triggerRect.top + scrollY;
          break;
      }

      // Calculate position based on align
      if (side === "top" || side === "bottom") {
        switch (align) {
          case "start":
            left = triggerRect.left + scrollX;
            break;
          case "center":
            left = triggerRect.left + scrollX + triggerRect.width / 2;
            break;
          case "end":
            left = triggerRect.right + scrollX;
            break;
        }
      }

      setPosition({ top, left });
    }
  }, [open, align, side, sideOffset]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        "fixed z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
        "animate-in fade-in-0 zoom-in-95",
        side === "bottom" && "slide-in-from-top-2",
        side === "top" && "slide-in-from-bottom-2",
        side === "left" && "slide-in-from-right-2", 
        side === "right" && "slide-in-from-left-2",
        className
      )}
      style={{
        top: position.top,
        left: align === "center" ? position.left - 144 : position.left, // 144 = w-72 / 2
        transform: side === "top" ? "translateY(-100%)" : undefined,
      }}
    >
      {children}
    </div>
  );
}

function PopoverAnchor({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
