/* eslint-disable no-magic-numbers, curly, @typescript-eslint/no-explicit-any */
import { WellboreData } from './data/WellboreData';
import { pixiOverlayBase } from '../../pixiOverlayInterfaces';

type vec2 = [number, number];

/** Class for handling realtime position of wellbore. */
export default class RealtimeWellbore {
  private map: any;
  private root: vec2;
  private prevCoords: vec2 = [Number.MIN_VALUE, Number.MIN_VALUE];

  constructor(pixiOverlay: pixiOverlayBase, wellbore: WellboreData);
  constructor(map: L.Map, wellbore: WellboreData);
  constructor(mapInput: L.Map | pixiOverlayBase, wellbore: WellboreData) {

    /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    if (mapInput.utils && 'getMap' in mapInput.utils) { // pixiOverlay
      const pixiOverlay: pixiOverlayBase = mapInput as pixiOverlayBase;
      this.map = pixiOverlay.utils.getMap();
    } else { // map
      this.map = mapInput;
    }

    // Get root from wellbore data
    this.root = wellbore.data.path[0];
  }

  /** Get pixel coordinates of wellbore within map. */
  get pixelCoordinates(): vec2{
    const { map } = this;

    const containerPoint = map.latLngToContainerPoint(this.root);
    const rect = map.getContainer().getBoundingClientRect();
    const coords: vec2 = [rect.x + containerPoint.x, rect.y + containerPoint.y];
    this.prevCoords = coords; // Always set when retrieving
    return coords;
  }

  /** Get pixel coordinates and check if value have changed since last call */
  public getPixelCoordinates(): { coords: vec2, changed: boolean } {
    const { prevCoords } = this; // Get before updating
    const coords = this.pixelCoordinates; // Get current coords

    return {
      coords,
      changed: !this.coordinatesEqual(coords, prevCoords, 0.00001),
    }
  }

  /** Returns true, if coordinates are equal with delta precision */
  private coordinatesEqual(c1: vec2, c2: vec2, delta: number): boolean {
    if (Math.abs(c1[0] - c2[0]) > delta) return false;
    if (Math.abs(c1[1] - c2[1]) > delta) return false;
    return true;
  }
}
