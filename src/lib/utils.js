import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names and applies Tailwind's merge utility
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
