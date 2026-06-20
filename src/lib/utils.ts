import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function debounce<U extends unknown[]>(fn: (...args: U) => void, timeout: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: U) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), timeout);
  };
}

export function fmtWordHex(word: bigint | number) {
  return "0x" + word.toString(16).toUpperCase().padStart(8, "0");
}
