import PointDictionary from '../src/utils/PointDictionary';
import Vector2 from '@equinor/videx-vector2';

const distanceTreshold = 0.25;
const gridSize = 10;
const rootRadius = 2;

test('Can instantitate dictionary', () => {
  const dict = new PointDictionary<number>(distanceTreshold, gridSize, rootRadius);
  expect(dict.distThreshold).toBe(distanceTreshold);
  expect(dict.gridSize).toBe(gridSize);
  expect(dict.radius).toBe(rootRadius);
  expect(dict.tiles).toBeDefined();
  expect(dict.tiles.size).toBe(0);
  expect(dict.pointValues).toBeDefined();
  expect(dict.pointValues.size).toBe(0);
});

test('Cannot instantitate with grid smaller than radius', () => {
  expect(
    () => new PointDictionary<number>(distanceTreshold, gridSize, gridSize + 0.0001),
  ).toThrowError();
});

test('Can add to tile (center)', () => {
  const dict = new PointDictionary<number>(distanceTreshold, gridSize, rootRadius);

  const pos = new Vector2(5, 5);
  dict.add(pos, 42);

  expect(dict.tiles.size).toBe(1);
  expect(dict.tiles.get('0.0').size).toBe(1);
  expect(dict.pointValues.size).toBe(1);

  // Check point on tile
  const point = dict.tiles.get('0.0').get(1);
  expect(point.val).toBe(42);
  expect(point.pos).toBe(pos);
  expect(point.id).toBe(1);

  // Compare with point in pointValues
  expect(dict.pointValues.get(1)).toBe(point);
});

test('Can add to tile (edge)', () => {
  const dict = new PointDictionary<number>(distanceTreshold, gridSize, rootRadius);

  const pos = new Vector2(9, 5);
  dict.add(pos, 42);

  expect(dict.tiles.size).toBe(2);
  expect(dict.tiles.get('0.0').size).toBe(1);
  expect(dict.tiles.get('1.0').size).toBe(1);
  expect(dict.pointValues.size).toBe(1);

  // Same point on tiles
  expect(dict.tiles.get('0.0').get(1)).toBe(dict.tiles.get('1.0').get(1));
});

test('Can add to tile (diagonal)', () => {
  const dict = new PointDictionary<number>(distanceTreshold, gridSize, rootRadius);

  const pos = new Vector2(9, 9);
  dict.add(pos, 42);

  expect(dict.tiles.size).toBe(4);
  expect(dict.tiles.get('0.0').size).toBe(1);
  expect(dict.tiles.get('1.0').size).toBe(1);
  expect(dict.tiles.get('0.1').size).toBe(1);
  expect(dict.tiles.get('1.1').size).toBe(1);
  expect(dict.pointValues.size).toBe(1);
});

test('Can add to tile (multiple)', () => {
  const dict = new PointDictionary<number>(distanceTreshold, gridSize, rootRadius);

  dict.add(new Vector2(5, 5), 1);      // Should be: [0, 0]
  dict.add(new Vector2(5, 1), 2);      // Should be: [0, 0], [0, -1]
  dict.add(new Vector2(9, 5), 3);      // Should be: [0, 0], [1, 0]
  dict.add(new Vector2(205, 405), 4);  // Should be: [20, 40]

  expect(dict.tiles.size).toBe(4); // [0, 0], [0, -1], [1, 0], [20, 40]
  expect(dict.tiles.get('0.0').size).toBe(3);
  expect(dict.tiles.get('0.-1').size).toBe(1);
  expect(dict.tiles.get('1.0').size).toBe(1);
  expect(dict.tiles.get('20.40').size).toBe(1);
  expect(dict.pointValues.size).toBe(4);
});

test('Can clear with filter', () => {
  const dict = new PointDictionary<string>(distanceTreshold, gridSize, rootRadius);

  dict.add(new Vector2(5, 5), 'Drilled');   // Should be: [0, 0]
  dict.add(new Vector2(9, 5), 'Planned');   // Should be: [0, 0], [1, 0]
  dict.add(new Vector2(11, 5), 'Drilled');  // Should be: [0, 0], [1, 0]
  dict.add(new Vector2(15, 5), 'Planned');  // Should be: [1, 0]
  dict.add(new Vector2(25, 5), 'Planned');  // Should be: [2, 0]

  // Check initial
  expect(dict.tiles.size).toBe(3);
  expect(dict.tiles.get('0.0').size).toBe(3);
  expect(dict.tiles.get('1.0').size).toBe(3);
  expect(dict.tiles.get('2.0').size).toBe(1);
  expect(dict.pointValues.size).toBe(5);

  // Remove 'Planned' points
  dict.clear(p => p === 'Planned');

  // Check after
  expect(dict.tiles.size).toBe(2);
  expect(dict.tiles.get('0.0').size).toBe(2);
  expect(dict.tiles.get('1.0').size).toBe(1);
  expect(dict.tiles.has('2.0')).toBeFalsy();
  expect(dict.pointValues.size).toBe(2);
});

test('Can clear all', () => {
  const dict = new PointDictionary<number>(distanceTreshold, gridSize, rootRadius);

  dict.add(new Vector2(5, 5), 1);
  dict.add(new Vector2(15, 5), 2);
  dict.add(new Vector2(25, 5), 3);
  dict.add(new Vector2(35, 5), 4);

  expect(dict.tiles.size).toBe(4);
  expect(dict.pointValues.size).toBe(4);

  dict.clear();

  expect(dict.tiles.size).toBe(0);
  expect(dict.pointValues.size).toBe(0);
});
