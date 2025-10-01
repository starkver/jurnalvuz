// Simplified utility functions without external dependencies
export type ClassValue = string | number | boolean | undefined | null | ClassArray | ClassDictionary;
export interface ClassDictionary {
  [id: string]: any;
}
export interface ClassArray extends Array<ClassValue> {}

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  
  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object') {
      if (Array.isArray(input)) {
        const nested = cn(...input);
        if (nested) classes.push(nested);
      } else {
        for (const key in input) {
          if (input[key]) classes.push(key);
        }
      }
    }
  }
  
  return classes.join(' ');
}
