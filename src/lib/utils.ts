import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats integer TZS amounts, e.g. 85000 -> "TSh 85,000". */
export function formatTZS(amount: number): string {
  return `TSh ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;
}
