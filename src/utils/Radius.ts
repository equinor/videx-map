import { clamp, lerp } from '@equinor/videx-math';
import { ResizeConfig } from '../ResizeConfigInterface';

export function getRadius(zoom: number, { min, max }: ResizeConfig) {
  const zoomClamped = clamp(zoom, min.zoom, max.zoom) - min.zoom;
  /* eslint-disable-next-line no-magic-numbers */
  const t = Math.pow(2, -zoomClamped);
  return lerp(max.scale, min.scale, t);
}
