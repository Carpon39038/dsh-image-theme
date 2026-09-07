import type { Context } from '@deepseek-ai/cordis';
import { type ImageThemeKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        'settings.imageTheme': ImageThemeKey;
    }
}
export declare const inject: string[];
export declare function apply(ctx: Context): void;
export { extractPaletteFromBlob, extractPaletteFromPixels } from './palette.ts';
export { buildThemeTokens, createThemeRoles } from './theme.ts';
export type { ImagePalette, ImageThemeState, ThemeConfig } from './types.ts';
