import type { DetailedHTMLProps, HTMLAttributes } from "react";

export interface ModelViewerElement extends HTMLElement {
  modelIsVisible?: boolean;
  cameraOrbit?: string;
  cameraTarget?: string;
}

export interface ModelViewerAttributes extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
  class?: string;
  className?: string;
  src?: string;
  poster?: string;
  alt?: string;
  loading?: string;
  reveal?: string;
  "camera-controls"?: string | boolean;
  "touch-action"?: string;
  "shadow-intensity"?: string | number;
  exposure?: string | number;
  "camera-orbit"?: string;
  "camera-target"?: string;
  "auto-rotate"?: string | boolean;
  "auto-rotate-delay"?: string | number;
  "rotation-per-second"?: string;
  "interpolation-decay"?: string | number;
  "interaction-prompt"?: string;
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "model-viewer": ModelViewerElement;
  }
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}
