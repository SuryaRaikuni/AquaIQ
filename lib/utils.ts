import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Maps a stress index (0–1) to a hex color on the green→red gradient */
export function stressColor(index: number): string {
  if (index < 0.35) return '#22c55e'; // low
  if (index < 0.55) return '#84cc16'; // low-moderate
  if (index < 0.70) return '#eab308'; // moderate
  if (index < 0.85) return '#f97316'; // high
  return '#ef4444';                   // critical
}

/** Returns a human-readable stress label */
export function stressLabel(index: number): string {
  if (index < 0.35) return 'Low';
  if (index < 0.55) return 'Low-Moderate';
  if (index < 0.70) return 'Moderate';
  if (index < 0.85) return 'High';
  return 'Critical';
}

/** Format liters into a readable string (L / KL / ML) */
export function formatLiters(liters: number): string {
  if (liters >= 1_000_000) return `${(liters / 1_000_000).toFixed(2)} ML`;
  if (liters >= 1_000)     return `${(liters / 1_000).toFixed(1)} KL`;
  return `${liters.toFixed(0)} L`;
}

/** Format INR */
export function formatINR(amount: number): string {
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`;
  if (amount >= 1_000)   return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

/** Clamp a number between min and max */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}
