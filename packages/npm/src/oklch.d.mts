export function hexToOklch(hex: string): { l: number; c: number; h: number };
export function oklchToHex(col: { l: number; c: number; h: number }): string;
export function relativeLuminance(hex: string): number;
export function contrast(a: string, b: string): number;
