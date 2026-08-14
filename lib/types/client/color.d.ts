import type { Rgb } from './types.ts';
export declare function clamp(value: number, minimum?: number, maximum?: number): number;
export declare function rgbToHex(color: Rgb): string;
export declare function hexToRgb(value: string): Rgb;
export declare function mixRgb(first: Rgb, second: Rgb, weight: number): Rgb;
export declare function relativeLuminance(color: Rgb): number;
export declare function contrastRatio(first: Rgb, second: Rgb): number;
export declare function ensureContrast(foreground: Rgb, background: Rgb, target?: number): Rgb;
export declare function rgba(color: Rgb, alpha: number): string;
