import type { ElectronAPI } from "@shared/types";
import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare global {
  interface Window {
    prepOS: ElectronAPI;
    prepOSEvents: {
      onFocusForceEnd: (cb: () => void) => () => boolean;
    };
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          src?: string;
          partition?: string;
          allowpopups?: string | boolean;
          useragent?: string;
          preload?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
