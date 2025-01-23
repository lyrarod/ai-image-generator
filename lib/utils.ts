import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const prompts = [
  "A beautiful sunset over the mountains",
  "A cat holding a sign that says hello world",
  "An astronaut riding a winged horse in space",
];
