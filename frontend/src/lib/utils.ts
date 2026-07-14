import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalizeWords(str: string) {
  if (!str) return "";
  // Capitalize the first letter of each word (split by spaces or punctuation)
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
