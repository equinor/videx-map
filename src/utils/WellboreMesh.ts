import { SegmentPoint, LineInterpolator } from './LineInterpolator';
import Mesh from './Mesh';

interface meshData {
  vertices: number[];
  triangles: number[];
  vertexData: number[];
  extraData: number[];
}

export class WellboreMesh {

  /** Line interpolator used to construct mesh. */
  interp: LineInterpolator;

  /** Thickness of line. */
  thickness: number;

  /** Index of latest vertex, i.e. base for triangulation of new geometry. */
  baseTris: number;

  /**
   * Constructor for creating a new line interpolator.
   * @param interp Interpolator used to generate line
   */
  constructor(interp: LineInterpolator, thickness: number) {
    this.interp = interp;
    this.thickness = thickness;
    this.baseTris = 0;
  }

  /**
   * Generate mesh. Interval positioning should be relative.
   * @param intervals Collection of intervals on the format: [ [Start0, End0], ..., [StartN, EndN] ]
   */
  generate(intervals: [number, number][] = []): meshData {
    // Vertices and triangulation
    const vertices: number[] = [];
    const triangles: number[] = [];
    const vertexData: number[] = [];
    const extraData: number[] = []; // 0: Normal, 1: Interval, 2: Tick

    let j: number = 0;
    if(intervals.length <= 0) {
      const path: SegmentPoint[] = this.interp.GetSection(0, 1);
      this.appendSegment(path, 0, vertices, triangles, vertexData, extraData);
    } else if (intervals.length > 0) { // If there are intervals
      let p: number = 0;
      intervals.forEach(i => {
        const path1: SegmentPoint[] = this.interp.GetSection(p, i[0]);
        this.appendSegment(path1, 0, vertices, triangles, vertexData, extraData);
        const path2: SegmentPoint[] = this.interp.GetSection(i[0], i[1]);
        this.appendSegment(path2, 1, vertices, triangles, vertexData, extraData);
        p = i[1];
      })
      // Add last path
      const end = intervals[intervals.length - 1][1];
      if (end < 1) {
        const lastPath: SegmentPoint[] = this.interp.GetSection(end, 1);
        this.appendSegment(lastPath, 0, vertices, triangles, vertexData, extraData);
      }
    }

    // Iterate over intervals to create cross-lines
    intervals.forEach(i => {
      const p1: SegmentPoint = this.interp.GetPoint(i[0]);
      this.generateCrossline(this.thickness, p1, vertices, triangles, vertexData, extraData);
      if(Math.abs(i[0] - i[1]) < 0.001) return; // Don't draw second if close
      const p2: SegmentPoint = this.interp.GetPoint(i[1]);
      this.generateCrossline(this.thickness, p2, vertices, triangles, vertexData, extraData);
    });

    return { vertices, triangles, vertexData, extraData };
  }

  /**
   * Append line segment from a section of points.
   * @param section Collection of segment points
   * @param type Type of segment, applied as vertex color
   * @param vertices 1-dimensional array with vertices
   * @param triangles 1-dimensional array with triangulation
   * @param vertexData 1-dimensional array with vertex data
   * @param extraData 1-dimensional array with type-data
   * @private
   */
  appendSegment(section: SegmentPoint[], type: number, vertices: number[], triangles: number[], vertexData: number[], extraData: number[]) : void {
     // Make line mesh and use callback to add extra attributes
     const mesh = Mesh.WellboreSegment(section, this.thickness, type);

    vertices.push(...mesh.vertices);
    mesh.triangles.forEach(d => triangles.push(d + this.baseTris));
    vertexData.push(...mesh.vertexData);
    extraData.push(...mesh.extraData);
    this.baseTris += mesh.vertices.length / 2;
  }

  /**
   * Creates a tick at the given position.
   * @param p Position of tick
   * @param baseTris Base triangle index
   * @param vertices 1-dimensional array with vertices
   * @param triangles 1-dimensional array with triangulation
   * @param vertexData 1-dimensional array with vertex data
   * @param extraData 1-dimensional array with type-data
   * @private
   */
  generateCrossline(thickness: number, p: SegmentPoint, vertices: number[], triangles: number[], vertexData: number[], extraData: number[]): void {
    const px = p.position[0];
    const py = p.position[1];

    // 2    3
    //
    // 0    1

    const crosslinesWidth = thickness * 0.075;
    const dirX = p.direction[0] * crosslinesWidth;
    const dirY = p.direction[1] * crosslinesWidth;

    const crosslinesHeight = thickness;
    const normX = -p.direction[1] * crosslinesHeight;
    const normY = p.direction[0] * crosslinesHeight;

    vertices.push(
      px - dirX - normX, // Lower left:  X
      py - dirY - normY, // Lower left:  Y
      px + dirX - normX, // Lower right: X
      py + dirY - normY, // Lower right: Y
      px - dirX + normX, // Upper left:  X
      py - dirY + normY, // Upper left:  Y
      px + dirX + normX, // Upper right: X
      py + dirY + normY, // Upper right: Y
    );

    triangles.push(this.baseTris, this.baseTris + 2, this.baseTris + 3, this.baseTris, this.baseTris + 3, this.baseTris + 1);

    extraData.push(2, 2, 2, 2); // Push tick type

    // Real distance [0, N], Upper/Lower [0, 1], Normal.x [-1, 1], Normal.y [-1, 1]
    vertexData.push(
      p.distance, 0.0, 0, 0,
      p.distance, 0.0, 0, 0,
      p.distance, 1.0, 0, 0,
      p.distance, 1.0, 0, 0,
    ); // Add vertex data

    this.baseTris += 4;
  }
}
