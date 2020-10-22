import Vector2 from '@equinor/videx-vector2';

type projectFunction = (coord: [number, number], zoom?: number) => { x: number, y: number };

export default class Projector {
  project: projectFunction;

  constructor(project: projectFunction) {
    this.project = project;
  }

  get(coord: [number, number], zoom?: number): { x: number, y: number } {
    return this.project(coord, zoom);
  }

  getVector2(coord: [number, number], zoom?: number): Vector2 {
    return new Vector2(this.project(coord, zoom));
  }

  batch(coords: [number, number][], zoom?: number): { x: number, y: number }[] {
    const output: { x: number, y: number }[] = new Array(coords.length);
    for (let i = 0; i < coords.length; i++) {
      output[i] = this.project(coords[i], zoom);
    }
    return output;
  }

  batchVector2(coords: [number, number][], zoom?: number): Vector2[] {
    const output: Vector2[] = new Array(coords.length);
    for (let i = 0; i < coords.length; i++) {
      output[i] = new Vector2(this.project(coords[i], zoom));
    }
    return output;
  }
}
