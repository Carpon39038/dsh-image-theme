import type { ImagePalette, Rgb } from './types.ts';
interface Lab {
    l: number;
    a: number;
    b: number;
}
export declare function rgbToLab(rgb: Rgb): Lab;
export declare function extractPaletteFromPixels(data: ArrayLike<number>, colorCount?: number): ImagePalette;
export declare function extractPaletteFromBlob(blob: Blob, colorCount?: number): Promise<ImagePalette>;
export declare function darkestPaletteColor(palette: ImagePalette): string;
export {};
