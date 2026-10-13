import { labelsVisibleAtZoom } from '../src/GeoJSONModule/labels';

const resize = {
  min: { zoom: 0, scale: 1 },
  max: { zoom: 20, scale: 0 },
};

describe('labelsVisibleAtZoom', () => {
  test('Should be visible at all zooms without thresholds', () => {
    expect(labelsVisibleAtZoom(0, resize)).toBeTruthy();
    expect(labelsVisibleAtZoom(20, resize)).toBeTruthy();
  });

  test('Should hide labels at or below threshold', () => {
    const config = { ...resize, threshold: 8 };
    expect(labelsVisibleAtZoom(7, config)).toBeFalsy();
    expect(labelsVisibleAtZoom(8, config)).toBeFalsy();
    expect(labelsVisibleAtZoom(9, config)).toBeTruthy();
  });

  test('Should hide labels at or above upperThreshold', () => {
    const config = { ...resize, upperThreshold: 8 };
    expect(labelsVisibleAtZoom(7, config)).toBeTruthy();
    expect(labelsVisibleAtZoom(8, config)).toBeFalsy();
    expect(labelsVisibleAtZoom(9, config)).toBeFalsy();
  });

  test('Should only show labels between threshold and upperThreshold', () => {
    const config = { ...resize, threshold: 5, upperThreshold: 8 };
    expect(labelsVisibleAtZoom(5, config)).toBeFalsy();
    expect(labelsVisibleAtZoom(6, config)).toBeTruthy();
    expect(labelsVisibleAtZoom(7, config)).toBeTruthy();
    expect(labelsVisibleAtZoom(8, config)).toBeFalsy();
  });
});
