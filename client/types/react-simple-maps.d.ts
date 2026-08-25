declare module "react-simple-maps" {
  import { ComponentType, CSSProperties, ReactNode } from "react";

  interface ComposableMapProps {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
  }

  interface GeographiesChildProps {
    geographies: Array<{
      id: string;
      rsmKey: string;
      type: string;
      properties: Record<string, unknown>;
    }>;
  }

  interface GeographiesProps {
    geography: string | Record<string, unknown>;
    children: (props: GeographiesChildProps) => ReactNode;
  }

  interface GeographyProps {
    geography: Record<string, unknown>;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: CSSProperties;
      hover?: CSSProperties;
      pressed?: CSSProperties;
    };
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
    onClick?: (event: React.MouseEvent) => void;
    className?: string;
    key?: string;
  }

  interface AnnotationProps {
    subject: [number, number];
    dx?: number;
    dy?: number;
    connectorProps?: Record<string, unknown>;
    children?: ReactNode;
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
  export const Annotation: ComponentType<AnnotationProps>;
  export const Marker: ComponentType<{ coordinates: [number, number]; children?: ReactNode }>;
  export const Line: ComponentType<Record<string, unknown>>;
  export const Sphere: ComponentType<Record<string, unknown>>;
  export const Graticule: ComponentType<Record<string, unknown>>;
  export const ZoomableGroup: ComponentType<Record<string, unknown>>;
}
