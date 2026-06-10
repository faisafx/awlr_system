// lib/utils.ts — Utility helpers
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely, resolving conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number to fixed decimal places with optional unit */
export function fmt(value: number, decimals = 2, unit = ''): string {
  return `${value.toFixed(decimals)}${unit ? ' ' + unit : ''}`;
}

/** Format ISO timestamp to HH:mm:ss WIB display */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Makassar', // WITA = UTC+8 (covers Sulawesi)
  });
}

/** Format ISO to short date + time */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Makassar',
  });
}