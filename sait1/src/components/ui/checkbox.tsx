"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "./utils";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function Checkbox({
  className,
  checked = false,
  onCheckedChange,
  onChange,
  ...props
}: CheckboxProps) {
  const isChecked = Boolean(checked);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    onCheckedChange?.(newChecked);
    onChange?.(e);
  };

  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className="sr-only peer"
        {...props}
      />
      <div
        className={cn(
          "peer w-4 h-4 shrink-0 rounded-[4px] border shadow-sm transition-all cursor-pointer",
          "flex items-center justify-center",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          // Стили для невыбранного состояния
          !isChecked && [
            "border-primary bg-input-background dark:bg-input/30",
            "hover:border-primary/70"
          ],
          // Стили для выбранного состояния
          isChecked && [
            "bg-primary border-primary",
            "hover:bg-primary/90"
          ],
          className
        )}
        onClick={(e) => {
          // Обеспечиваем, что клик на div также триггерит изменение
          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
          if (input && input.type === 'checkbox') {
            input.click();
          }
        }}
      >
        <CheckIcon 
          className={cn(
            "w-3 h-3 transition-all duration-200",
            isChecked ? "opacity-100 scale-100 text-primary-foreground" : "opacity-0 scale-75",
            !isChecked && "text-transparent"
          )} 
        />
      </div>
    </div>
  );
}

export { Checkbox };