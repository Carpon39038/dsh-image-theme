import { type StoredTheme } from './types.ts';
export declare function readThemeSettings(): StoredTheme | null;
export declare function writeThemeSettings(value: StoredTheme): void;
export declare function clearThemeSettings(): void;
export declare function readBackgroundImage(): Promise<Blob | null>;
export declare function writeBackgroundImage(blob: Blob): Promise<void>;
export declare function clearBackgroundImage(): Promise<void>;
