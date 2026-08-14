import type { ReactNode } from 'react';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ImageThemeController } from './controller.ts';
export interface ImageThemeSectionInjected {
    controller: ImageThemeController;
}
export type ImageThemeSectionProps = PropsRuntime<'settings.section'> & PropsLocale<'settings.imageTheme'> & InjectFace<ImageThemeSectionInjected>;
export declare function ImageThemeSection({ controller, t }: ImageThemeSectionProps): ReactNode;
