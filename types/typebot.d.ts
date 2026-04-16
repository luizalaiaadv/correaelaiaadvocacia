declare module '@typebot.io/react' {
  import { ComponentProps } from 'react';

  interface BubbleProps {
    typebot: string;
    apiHost?: string;
    previewMessage?: { message: string };
    theme?: {
      button?: {
        backgroundColor?: string;
        size?: 'small' | 'medium' | 'large';
      };
    };
    [key: string]: unknown;
  }

  export function Bubble(props: BubbleProps): JSX.Element;
  export function Popup(props: Record<string, unknown>): JSX.Element;
  export function Standard(props: Record<string, unknown>): JSX.Element;
}
