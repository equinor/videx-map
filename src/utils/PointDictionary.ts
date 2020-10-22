import Vector2 from "@equinor/videx-vector2";

/** Interface of a single point. */
interface Point<T> {
  /** Value stored in point. */
  val: T;
  /** Position of points. */
  pos: Vector2;
  /** ID of point. */
  id: number;
}

/** Dictionary for points. Also manages overlapping. */
export default class PointDictionary<T> {
  /** Threshold to define overlapping. */
  distThreshold: number;

  /** gridSize of data segmentation. */
  gridSize: number;

  /** Radius of points. */
  radius: number;

  /** Mapping tile coordinates, on format 'x.y', to submap of points. */
  tiles = new Map<string, Map<number, Point<T>>>();

  /** Mapping point IDs to values. */
  pointValues = new Map<number, Point<T>>();

  /** User provided function to test if a line is active or not */
  testActiveFunction: (value:T) => boolean;

  /** Used to assign PointID */
  private pointSeq: number = 0;

  /**
   * Constructs a new point dictionary.
   * @param distThreshold Threshold for what is considered overlapping
   * @param gridSize grid cell size used for segmentation
   */
  constructor(distThreshold: number, gridSize: number = 2, radius: number, testActive?: (value: T) => boolean) {
    if (gridSize < radius) throw 'Gridsize of point dictionary must be greater than scaled radius of root.';
    this.distThreshold = distThreshold;
    this.gridSize = gridSize;
    this.radius = radius;
    this.testActiveFunction = testActive;
  }

  /**
   * Add a single point to the dictionary.
   * @param pos Position of point
   * @param val Value stored within points
   * @returns ID of newly added point
   */
  add(pos: Vector2, val: T): number {
    // If not overlapping
    const id = ++this.pointSeq;

    const point: Point<T> = { val: val, pos: pos, id };

    // Add point
    this.pointValues.set(id, point);

    // Calculate keys
    const keys = this.getKeys(pos);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      // Add pointID to tile with given key
      if (this.tiles.has(key)) {
        this.tiles.get(key).set(id, point);
      } else {
        const map = new Map<number, Point<T>>();
        map.set(id, point);
        this.tiles.set(key, map);
      }
    }

    return id;
  }

  private getKeys(pos: Vector2): string[] {
    const { radius, gridSize } = this;

    // Tile-key (base)
    const keyX: number = Math.floor(pos[0] / gridSize);
    const keyY: number = Math.floor(pos[1] / gridSize);

    // Collection of keys + initial key
    const keys: string[] = [ `${keyX}.${keyY}` ];

    // Local position on tile
    const localX = pos[0] - keyX * gridSize;
    const localY = pos[1] - keyY * gridSize;
    const local = [ localX, localY ];

    const addKey = (deltaX: number, deltaY: number) => {
      keys.push(`${keyX + deltaX}.${keyY + deltaY}`);
    }

    const tryAddDiagKey = (cornerLocal: [number, number], deltaX: number, deltaY: number) => {
      if (Vector2.distance(local, cornerLocal) < radius) keys.push(`${keyX + deltaX}.${keyY + deltaY}`);
    }

    let l = false, r = false, d = false, u = false;

    // Add adjacent
    if (localX < radius) { addKey(-1, 0); l = true; }           // LEFT
    if (localX > gridSize - radius) { addKey(1, 0); r = true; } // RIGHT
    if (localY < radius) { addKey(0, -1); d = true; }           // DOWN
    if (localY > gridSize - radius) { addKey(0, 1); u = true; } // UP

    // Try to add diagonals
    if (l) {
      if (u) tryAddDiagKey([0, gridSize], -1, 1);
      else if (d) tryAddDiagKey([0, 0], -1, -1);
    }
    else if (r) {
      if (u) tryAddDiagKey([gridSize, gridSize], 1, 1);
      else if (d) tryAddDiagKey([gridSize, 0], 1, -1);
    }

    return keys;
  }

  isActive(point: Point<T>) : boolean {
    if (!this.testActiveFunction) return true;
    return point && this.testActiveFunction(point.val);
  }

  getKey(position: Vector2): string {
    const keyX: number = Math.floor(position[0] / this.gridSize);
    const keyY: number = Math.floor(position[1] / this.gridSize);
    return `${keyX}.${keyY}`;
  }

  /**
   * Get overlapping points, if any.
   * @param pos Target position
   * @returns Overlapping point
   */
  getOverlapping(pos: Vector2): Point<T> {
    const key: string = this.getKey(pos);
    if (!this.tiles.has(key)) return null;
    // Iterate over points on tilemap
    const points = Array.from(this.tiles.get(key).values());
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const distance: number = Vector2.distance(pos, point.pos);
      if (distance < this.distThreshold) return point;
    }
    return null;
  }

  /**
   * Get closest point under coordinates defined by radius.
   * @param pos Target position
   * @returns Closest point
   */
  getClosestUnder(pos: Vector2, radius: number = this.radius): Point<T> {
    const key: string = this.getKey(pos);

    let minDist: number = Infinity;
    let closest: Point<T> = null;
    if (!this.tiles.has(key)) return null;
    // Iterate over points on tilemap
    this.tiles.get(key).forEach(point => {
      const distance: number = Vector2.distance(pos, point.pos);
      if (this.isActive(point) && distance < radius && distance < minDist) {
        minDist = distance;
        closest = point;
      }
    });

    return closest;
  }

  /** Clear point dictionary to prepare for new data. */
  clear(filter?: (value:T, id:number) => boolean): void {
    if (filter) {
      this.pointValues.forEach(point => {
        if(!filter(point.val, point.id)) return; // Skip if filter does not pass
        const keys = this.getKeys(point.pos); // ! Alternatively possible to store keys in point. (But getKeys is fast)
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const tile = this.tiles.get(key);
          tile.delete(point.id); // Delete point id from tilemap
          if (tile.size == 0) this.tiles.delete(key); // Remove tile if empty
        }
        this.pointValues.delete(point.id); // Remove from point values
      });
    } else {
      this.tiles = new Map<string, Map<number, Point<T>>>();
      this.pointValues = new Map<number, Point<T>>();
    }
  }
}
