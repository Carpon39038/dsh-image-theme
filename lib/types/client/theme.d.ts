import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client';
import type { ImagePalette, ThemeConfig } from './types.ts';
export interface ThemeRoles {
    surface: string;
    accent: string;
    foreground: string;
    secondary: string;
}
export declare function createThemeRoles(palette: ImagePalette, accentIndex: number): ThemeRoles;
export declare function buildThemeTokens(palette: ImagePalette, config: ThemeConfig): ThemeTokenOverrides;
