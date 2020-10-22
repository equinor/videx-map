export const latLngToLayerPoint = ([lat, lng]: number[]) => ({ x: lat * 200, y: lng * 1000});
export const layerPointToLatLng = (point:{ x:number, y:number}) => [point.x / 200, point.y / 1000];

export const pixiOverlayMock = {
  initialize: () => ({}),
  onAdd: () => ({}),
  onRemove: () => ({}),
  getEvents: () => ({}),
  redraw: () => ({}),
  utils: {
    latLngToLayerPoint,
    layerPointToLatLng,
    getContainer: () => ({}),
    getMap: () => ({}),
    getScale: () => ({}),
    getRenderer: () => ({}),
  },
};
