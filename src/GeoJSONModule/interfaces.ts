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
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any  */
  additionalData?: any;
}
