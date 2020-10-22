import LineDictionary from '../src/utils/LineDictionary';
import { wellbores } from './test-data';
import Vector2 from '@equinor/videx-vector2';
import { latLngToLayerPoint } from './mocks';


test('can add and remove lines to the dictionary', () => {
  const dict = new LineDictionary<string>(1);

  const getTiles = (lineId: number) => Array.from(dict.tiles.keys()).filter(key => dict.tiles.get(key).some(s => s.lineID === lineId));

  expect(dict).toBeInstanceOf(LineDictionary);

  const lines = wellbores.map((d, i) => dict.add(d.path.map(pt => new Vector2(latLngToLayerPoint(pt))), 'Line ' + i));

  expect(dict.lineValues.size).toBe(10);
  expect(dict.tiles.size).toBe(25);

  dict.lineValues.forEach(l => {
    expect(dict.isActive(l)).toBeTruthy();
  });

  const testGeometry = lines[2].segments[2].geometry;
  const testVector = new Vector2((testGeometry.x2 + testGeometry.x1) / 2, (testGeometry.y2 + testGeometry.y1) / 2);
  expect(dict.getSegmentsOn3Grid(testVector).size).toBe(15);

  // set a function to determine if line should be considered active or not
  dict.testActiveFunction = v => v !== 'Line 2';

  expect(dict.isActive(lines[0])).toBeTruthy();
  expect(dict.isActive(lines[1])).toBeTruthy();
  expect(dict.isActive(lines[2])).toBeFalsy();
  expect(dict.isActive(lines[3])).toBeTruthy();
  expect(dict.isActive(lines[4])).toBeTruthy();

  expect(dict.getSegmentsOn3Grid(testVector).size).toBe(0);

  // testing Line 5
  let testLine = lines[5];

  expect(testLine.value).toBe('Line 5');

  let intersectedTiles = getTiles(testLine.id);
  expect(intersectedTiles.length).toBe(1);
  expect(intersectedTiles).toEqual(['11768.2517']);

  dict.clear(d => d === 'Line 5');

  expect(dict.lineValues.size).toBe(9);

  intersectedTiles = getTiles(testLine.id);

  expect(dict.tiles.size).toBe(25);
  expect(intersectedTiles.length).toBe(0);

  // testing Line 7
  testLine = lines[7];

  expect(testLine.value).toBe('Line 7');

  intersectedTiles = getTiles(testLine.id);
  expect(intersectedTiles.length).toBe(1);
  expect(intersectedTiles).toEqual(['11768.2517']);

  dict.clear(d => d === 'Line 7');

  expect(dict.lineValues.size).toBe(8);

  intersectedTiles = getTiles(testLine.id);

  expect(intersectedTiles.length).toBe(0);

  expect(dict.tiles.size).toBe(24);

  // testing Line 9
  testLine = lines[9];

  expect(testLine.value).toBe('Line 9');

  intersectedTiles = getTiles(testLine.id);
  expect(intersectedTiles.length).toBe(8);
  expect(intersectedTiles).toEqual([
    '11766.2652',
    '11767.2652',
    '11767.2651',
    '11767.2650',
    '11768.2650',
    '11768.2649',
    '11768.2648',
    '11769.2648',
  ]);

  dict.clear(d => d === 'Line 9');

  expect(dict.lineValues.size).toBe(7);

  intersectedTiles = getTiles(testLine.id);

  expect(intersectedTiles.length).toBe(0);

  expect(dict.tiles.size).toBe(17);

  // clear all
  dict.clear();

  expect(dict.lineValues.size).toBe(0);
  expect(dict.tiles.size).toBe(0);

});
