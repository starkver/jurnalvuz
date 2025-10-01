import * as React from "react"

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className = "", checked = false, onCheckedChange, disabled = false, id, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        data-disabled={disabled ? "" : undefined}
        disabled={disabled}
        className={`
          peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
          focus-visible:ring-offset-2 focus-visible:ring-offset-background 
          disabled:cursor-not-allowed disabled:opacity-50 
          ${checked ? 'bg-primary' : 'bg-muted'} 
          ${className}
        `}
        id={id}
        ref={ref}
        onClick={handleClick}
        {...props}
      >
        <span 
          className={`
            pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 
            transition-transform duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `} 
          style={{ boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}
        />
      </button>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };