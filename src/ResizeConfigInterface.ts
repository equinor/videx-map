export interface ResizeConfig {
  min: { zoom: number; scale: number };
  max: { zoom: number; scale: number };
}

export interface LabelResizeConfig extends ResizeConfig {
  // Sets the lower limit of when to hide labels
  threshold?: number;
  // Labels are hidden at or above this zoom (no upper limit when undefined)
  upperThreshold?: number;
  baseScale?: number;
}
