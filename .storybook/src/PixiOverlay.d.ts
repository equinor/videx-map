declare namespace L {
  class PixiOverlay {
    constructor(drawCallback: any, container: any, options: any);

    onAdd(map: L.Map): void;

    onRemove(map: L.Map): void;
  }

  namespace LeafletEvent {
    function latlng(): any;
  }
}
