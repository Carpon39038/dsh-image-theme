export interface Rgb {
    r: number;
    g: number;
    b: number;
}
export interface ImagePalette {
    colors: string[];
}
export interface ThemeConfig {
    enabled: boolean;
    overlay: number;
    blur: number;
    saturation: number;
    positionX: number;
    positionY: number;
    accentIndex: number;
}
export interface StoredTheme {
    version: 1;
    fileName: string;
    palette: ImagePalette;
    config: ThemeConfig;
}
export type ThemeStatus = 'loading' | 'empty' | 'saving' | 'ready' | 'error';
export interface ImageThemeState {
    status: ThemeStatus;
    imageUrl: string | null;
    fileName: string | null;
    palette: ImagePalette | null;
    config: ThemeConfig;
    error: string | null;
}
export declare const DEFAULT_CONFIG: ThemeConfig;
