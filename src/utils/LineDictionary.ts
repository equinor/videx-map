import Vector2 from "@equinor/videx-vector2";
import { distanceToLine } from "./linePoint";

/** Collection of coordinates defining geometry of a line segment. */
interface Geometry {
  /** X-component of start position. */
  x1: number;
  /** Y-component of start position. */
  y1: number;
  /** X-component of end position. */
  x2: number;
  /** Y-component of end position. */
  y2: number;
}

/** Definition of a single line segment. */
interface LineSegment {
  /** ID of parent line. */
  lineID: number;
  /** Geometry of line segment. */
  geometry: Geometry;
}

interface Line<T> {
  id: number,
  value: T;
  segments: LineSegment[],
}

/**
 * Find the tile indices on a grid intersected by a line segment
 * @param x1 point 1 x-coordinate
 * @param x2 point 2 x-coordinate
 * @param y1 point 1 y-coordinate
 * @param y2 point 2 y-coordinate
 * @param gridsize size of grid cells
 */
function findGridIntersections(x1: number, x2: number, y1: number, y2: number, gridsize: number) : Set<string> {
  const intersections = new Set<string>();

  // Is line going down
  let downwards: boolean;

  // Coordinates for possible cross sections
  let xMin: number, xMax: number, yMin: number, yMax: number;

  // Line variables
  let m: number, y0: number;

  // Ensure data line is calculated left to right
  if(x1 < x2) {
    xMin = Math.floor(x1 / gridsize);
    xMax = Math.floor(x2 / gridsize);
    const deltaX: number = x2 - x1;
    const deltaY: number = y2 - y1;
    m = deltaY / deltaX;
    y0 = (y1 - x1 * m) / gridsize;

    downwards = y2 < y1;

    // Add first
    const key: string = `${Math.floor(x1 / gridsize)}.${Math.floor(y1 / gridsize)}`;
    intersections.add(key);
  } else {
    xMin = Math.floor(x2 / gridsize);
    xMax = Math.floor(x1 / gridsize);
    const deltaX: number = x1 - x2;
    const deltaY: number = y1 - y2;
    m = deltaY / deltaX;
    y0 = (y2 - x2 * m) / gridsize;

    downwards = y1 < y2;

    // Add first
    const key: string = `${Math.floor(x2 / gridsize)}.${Math.floor(y2 / gridsize)}`;
    intersections.add(key);
  }

  // Calculate y range
  if (y1 < y2) {
    yMin = Math.floor(y1 / gridsize);
    yMax = Math.floor(y2 / gridsize);
  } else {
    yMin = Math.floor(y2 / gridsize);
    yMax = Math.floor(y1 / gridsize);
  }

  // Iterate over x-crossing
  for (let x: number = xMin + 1; x <= xMax; x++) {
    const y: number = y0 + x * m;
    intersections.add(`${x}.${Math.floor(y)}`);
  }

  // Iterate over y-crossing
  for (let y: number = yMin + 1; y <= yMax; y++) {
    const x: number = (y - y0) / m;
    intersections.add(`${Math.floor(x)}.${Math.floor(downwards ? y - 1 : y)}`);
  }

  return intersections;
}

/** Dictionary for segmenting lines and finding closest entries. */
export default class LineDictionary<T> {
  /*/ gridsize of data segmentation. */
  gridsize: number;

  /** Map with collection of segment IDs. */
  tiles = new Map<string, LineSegment[]>();

  /** IDs of lines mapped to values. */
  lineValues = new Map<number, Line<T>>();

  /** User provided function to test if a line is active or not */
  testActiveFunction: (value:T) => boolean;

  /** Used to assign lineID */
  private lineSeq: number;

  /**
   * Constructs a new line dictionary with segmentation based on given decimal.
   * @param decimals Defines size of tiles. For example, decimals = 2, would assign
   * both [12, 23] and [19, 21] to a single tile [10, 20]. Decimals also defines
   * maximum search distance. For decimals equals 2, only lines within 10 units will
   * be returned. (Default: 0)
   */
  constructor(gridsize: number = 10, testActive?: (value: T) => boolean) {
    this.gridsize = gridsize;
    this.lineSeq = 0;
    this.testActiveFunction = testActive;
  }

  /**
   * Maps a line up to a given value
   * @param points Collection of points on line
   * @param value Value to return for line
   * @param id Optionally associate an id with this entry
   */
  add(points: Vector2[], value: T, id?: number): Line<T> {
    const lineID = Number.isFinite(id) ? id : ++this.lineSeq;
    const line: Line<T> = {
      id: lineID,
      value,
      segments: [],
    };
    this.lineValues.set(lineID, line);

    // Iterate over line segments
    for (let i: number = 1; i < points.length; i++) {
      const p1: Vector2 = points[i - 1];
      const p2: Vector2 = points[i];

      // Append new line segments
      this.addSegment(p1[0], p1[1], p2[0], p2[1], line);
    }

    return line;
  }

  /**
   * Add a line segment to the dictionary by start and end position.
   * @param x1 X-component of start position
   * @param y1 Y-component of start position
   * @param x2 X-component of end position
   * @param y2 Y-component of end position
   * @param lineID ID of the line which the segment should belong to
   * @private
   */
  addSegment(x1: number, y1: number, x2: number, y2: number, line: Line<T>): void {
    const segment = {
      lineID: line.id,
      geometry: {x1, y1, x2, y2},
    };
    line.segments.push(segment);
    const intersections = findGridIntersections(x1, x2, y1, y2, this.gridsize);

    intersections.forEach(key => {
      if (this.tiles.has(key)) {
        this.tiles.get(key).push(segment);
      } else {
        this.tiles.set(key, [segment]);
      }
    });
  }

  /**
   * Find the closest line to the given coordinates and return its value.
   * @param target Reference position to evaluate
   * @param maxDist Maximum distance relative to decimals. Given a decimal value of 2, a maxDist of 1 will return lines within a distance of 0.01 units.
   * @returns Value assigned the line
   */
  getClosest(target: Vector2, maxDist: number = 1): T {
    // Get all involved segments
    const segments: Set<LineSegment> = this.getSegmentsOn3Grid(target);

    // Do not return anything if no segments
    if (segments.size === 0) return undefined;

    // Find closest line
    let minDist: number = Infinity;
    let minLineID: number = -1;
    segments.forEach(seg => {
      const dist: number = distanceToLine(
        target,
        new Vector2(seg.geometry.x1, seg.geometry.y1),
        new Vector2(seg.geometry.x2, seg.geometry.y2),
      );
      if (dist < minDist) {
        minDist = dist;
        minLineID = seg.lineID;
      }
    });

    if(minDist > maxDist * this.gridsize) return undefined;

    // Return value of line with smallest distance
    return this.lineValues.get(minLineID).value;
  }

  /**
   * Find the closest lines to the given coordinates and return their value.
   * @param target Reference position to evaluate
   * @param epsilon Allowed distance between overlapping segments
   * @param maxDist Maximum distance in grid cells.
   * @param filter Function for filtering points based on minimum
   * @returns Values assigned the lines
   */
  getAllClosest(target: Vector2, epsilon: number = 0, maxDist: number = 1, filter?: (min: T, d: T) => boolean): T[] {
    // Get all involved segments
    const segments: Set<LineSegment> = this.getSegmentsOn3Grid(target);

    // Do not return anything if no segments
    if (segments.size === 0) return [];

    // Find closest line
    let minDist: number = Infinity;
    let minID: number = -1;
    let extraLines: {ID: number, distance: number}[] = [];
    segments.forEach(seg => {
      const distance: number = distanceToLine(
        target,
        new Vector2(seg.geometry.x1, seg.geometry.y1),
        new Vector2(seg.geometry.x2, seg.geometry.y2),
      );

      // If in collection
      if (distance < minDist + epsilon) {
        // If new min distance
        if (distance < minDist) {
          const upperLimit = distance + epsilon;

          // Recalculate lines within range
          const newLines: {ID: number, distance: number}[] = [];

          // Attempt to append previous min
          if (minDist <= upperLimit) newLines.push({
            ID: minID,
            distance: minDist,
          });

          extraLines.forEach(d => {
            if(d.distance <= upperLimit) newLines.push(d);
          });
          extraLines = newLines;

          minDist = distance;
          minID = seg.lineID;
        } else {
          extraLines.push({
            ID: seg.lineID,
            distance,
          });
        }
      }
    });

    if(minDist > maxDist * this.gridsize) return [];

    // Ensure extra lines are unique
    const unique: {[key: number]: boolean} = { [minID]: true };
    const uniqueLines: {ID: number, distance: number}[] = [];
    extraLines.forEach(d => {
      if (unique.hasOwnProperty(d.ID)) return;
      unique[d.ID] = true;
      uniqueLines.push(d);
    });

    // Translate IDs to T-values
    const minT: T = this.lineValues.get(minID).value;
    let extraT: T[] = uniqueLines.map(d => this.lineValues.get(d.ID).value);

    if (filter) {
      const filtered: T[] = [];
      extraT.forEach(curT => {
        if (filter(minT, curT)) filtered.push(curT);
      })
      extraT = filtered;
    }

    // Return smallest lines
    return [ minT, ...extraT ];
  }

  isActive(line: Line<T>) : boolean {
    if (!this.testActiveFunction) return true;
    return line && this.testActiveFunction(line.value);
  }

  /**
   * Get unique line segments within a 3 by 3 grid.
   * @private
   * @param x X position of point
   * @param y Y position of point
   * @returns Collection of segments within boundaries
   */
  getSegmentsOn3Grid(target: Vector2): Set<LineSegment> {
    const gridSegments = new Set<LineSegment>();
    const keyX: number = Math.floor(target[0] / this.gridsize);
    const keyY: number = Math.floor(target[1] / this.gridsize);

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        const key: string = `${keyX + x}.${keyY + y}`;
        if (!this.tiles.has(key)) continue;
        this.tiles.get(key).forEach(tileSegment => { // Iterate over values
          if(!gridSegments.has(tileSegment)) {
            // Only push segment if line is active
            if(this.isActive(this.lineValues.get(tileSegment.lineID))) {
              gridSegments.add(tileSegment);
            }
          }
        });
      }
    }

    return gridSegments;
  }

  /** Clear line dictionary to prepare for new data. */
  clear(filter?: (value:T, id:number) => boolean): void {
    if (filter) {
      const segmentsToDelete = new Set<LineSegment>();
      this.lineValues.forEach((line, key) => {
        if (filter(line.value, key)) {
          line.segments.forEach(segmentsToDelete.add, segmentsToDelete);
          this.lineValues.delete(key);
        }
      });
      if (segmentsToDelete.size > 0) {
        this.tiles.forEach((list, key) => {
          const filtered = list.filter(s => !segmentsToDelete.has(s));
          if (filtered.length > 0) {
            this.tiles.set(key, filtered);
          } else {
            this.tiles.delete(key);
          }
        });
      }
    } else {
      this.tiles = new Map<string, LineSegment[]>();
      this.lineValues = new Map<number, Line<T>>();
    }
  }
}
