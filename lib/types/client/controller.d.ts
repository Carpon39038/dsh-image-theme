import type { ThemeRuntime } from '@deepseek-ai/dsh-client-ui-theme/client';
import { type ImageThemeState, type ThemeConfig } from './types.ts';
export declare class ImageThemeController {
    private state;
    private readonly listeners;
    private readonly theme;
    private themeDispose;
    private styleElement;
    private backdrop;
    private operation;
    constructor(theme: ThemeRuntime);
    readonly getSnapshot: () => ImageThemeState;
    readonly subscribe: (listener: () => void) => (() => void);
    start(): () => void;
    private publish;
    private ensureDom;
    private hydrate;
    readonly upload: (file: File) => Promise<void>;
    readonly updateConfig: (patch: Partial<ThemeConfig>) => void;
    readonly reset: () => Promise<void>;
    private present;
    private dispose;
}
