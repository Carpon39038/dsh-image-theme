import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client';
import type { ImagePalette, ThemeConfig } from './types.ts';
export interface ThemeRoles {
    surface: string;
    accent: string;
    foreground: string;
    secondary: string;
}
export interface ThemeRoleModes {
    light: ThemeRoles;
    dark: ThemeRoles;
}
export declare function createThemeRoleModes(palette: ImagePalette, accentIndex: number): ThemeRoleModes;
/** Backwards-compatible dark role set for consumers that use the original helper. */
export declare function createThemeRoles(palette: ImagePalette, accentIndex: number): ThemeRoles;
export declare function buildThemeTokens(palette: ImagePalette, config: ThemeConfig): ThemeTokenOverrides;
