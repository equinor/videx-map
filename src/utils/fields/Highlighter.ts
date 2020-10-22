import { FieldMesh } from '../../FieldModule';

type vec3 = [number, number, number];

interface Cache {
  fillCol1: vec3;
  fillCol2: vec3;
  outlineCol: vec3;
  baseZIndex: number;
  field: FieldMesh;
}

/**
 * Highlighter class for field layer.
 */
export default class Hightlighter {
  fields: FieldMesh[][] = [];

  // Cached data from highlight
  cached: Cache[] = [];

  // Highlight colors
  fillColor1: vec3;
  fillColor2: vec3;
  outlineColor: vec3;

  constructor(fillColor1: vec3, fillColor2: vec3, outlineColor: vec3) {
    this.fillColor1 = fillColor1;
    this.fillColor2 = fillColor2;
    this.outlineColor = outlineColor;
  }

  /**
   * Add a new group to highlighter.
   * @param group Group of field meshes
   */
  add(group: FieldMesh[]): void {
    this.fields.push(group);
  }

  /**
   * Highlight a group by given index.
   * @param index Index of group to highlight
   */
  highlight(index: number): void {
    const target = this.fields[index];

    if (this.cached) this.revert();

    this.cached = new Array(target.length);
    for (let i = 0; i < target.length; i++) {
      const field = target[i];

      // Cache colors before highlight
      this.cached[i] = {
        fillCol1: field.fill.uniform.col1,
        fillCol2: field.fill.uniform.col2,
        outlineCol: field.outline.uniform.color,
        baseZIndex: field.fill.mesh.zIndex,
        field,
      }

      // Highlight
      field.fill.uniform.col1 = this.fillColor1;
      field.fill.uniform.col2 = this.fillColor2;
      field.fill.mesh.zIndex += 10000;
      field.outline.uniform.color = this.outlineColor;
      field.outline.mesh.zIndex += 10000;
    }
  }

  /** Revert any highlighting. */
  revert(): boolean {
    if (!this.cached) return false;
    // Revert selection
    this.cached.forEach(d => {
      d.field.fill.uniform.col1 = d.fillCol1;
      d.field.fill.uniform.col2 = d.fillCol2;
      d.field.fill.mesh.zIndex = d.baseZIndex;
      d.field.outline.uniform.color = d.outlineCol;
      d.field.outline.mesh.zIndex = d.baseZIndex + 1;
    });
    this.cached = undefined;
    return true;
  }
}
