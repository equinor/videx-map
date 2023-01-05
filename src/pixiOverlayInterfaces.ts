/* eslint-disable @typescript-eslint/no-explicit-any */
export interface pixiOverlayBase {
  initialize(drawCallback: any, pixiContainer: any, options: any): void;
  onAdd(targetMap: any): void;
  onRemove(): void;
  getEvents(): any;
  redraw(data?: any): any;
  utils: pixiOverlayUtils;
}

export interface pixiOverlayUtils {
  latLngToLayerPoint(latLng: any, zoom?: number): any;
  layerPointToLatLng(point: any, zoom?: number): any;
  getScale(zoom: number): any;
  getRenderer(): any;
  getContainer(): any;
  getMap(): any;
}
