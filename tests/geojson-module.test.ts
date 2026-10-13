import { GeoJSONModule } from '../src/GeoJSONModule';

describe('GeoJSONModule minZoom', () => {
  test('Should be visible at all zooms without minZoom', () => {
    const module = new GeoJSONModule({});
    module.resize(0);
    expect(module.root.visible).toBeTruthy();
  });

  test('Should hide features below minZoom', () => {
    const module = new GeoJSONModule({ minZoom: 8 });
    module.resize(7);
    expect(module.root.visible).toBeFalsy();
    module.resize(8);
    expect(module.root.visible).toBeTruthy();
  });

  test('Should stay hidden within zoom range when visibility is off', () => {
    const module = new GeoJSONModule({ minZoom: 8 });
    module.resize(10);
    module.setVisibility(false);
    expect(module.root.visible).toBeFalsy();
    module.setVisibility(true);
    expect(module.root.visible).toBeTruthy();
  });

  test('Should apply a new minZoom at the current zoom', () => {
    const module = new GeoJSONModule({});
    module.resize(5);
    module.setMinZoom(8);
    expect(module.root.visible).toBeFalsy();
    module.setMinZoom(undefined);
    expect(module.root.visible).toBeTruthy();
  });
});
