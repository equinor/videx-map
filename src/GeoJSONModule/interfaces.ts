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
