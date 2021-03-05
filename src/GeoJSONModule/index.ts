export { default as GeoJSONMultiPolygon } from './multipolygon';
export { default as GeoJSONPolygon } from './polygon';
export { default as GeoJSONLineString } from './linestring';
export { default as GeoJSONPoint } from './point';
export { default as GeoJSONModule } from './GeoJSONModule';

export interface FeatureStyle {
  lineColor: string;
  lineWidth: number;
  fillColor?: string;
  fillColor2?: string;
  fillOpacity?: number;
  hashed?: boolean;
  labelScale?: number;
}

export interface FeatureProps {
  id: number;
  label: string;
  style: FeatureStyle;
  additionalData?: any;
}
