// Based on Leaflet.PixiOverlay
// version: 1.9.4
// author: Manuel Baclet <mbaclet@gmail.com>
// license: MIT

import { autoDetectRenderer, isWebGLSupported } from 'pixi.js';
import L from 'leaflet';

(function (factory) {
  factory(L, { autoDetectRenderer, isWebGLSupported });
})(function (L, { autoDetectRenderer, isWebGLSupported }) {
  const round = L.Point.prototype._round;
  const no_round = function () {
    return this;
  };

  function setEventSystem(
    renderer,
    destroyInteractionManager,
    autoPreventDefault,
  ) {
    const eventSystem = renderer.events;

    if (destroyInteractionManager) {
      eventSystem.destroy();
    } else if (!autoPreventDefault) {
      eventSystem.autoPreventDefault = false;
    }
  }

  function projectionZoom(map) {
    const maxZoom = map.getMaxZoom();
    const minZoom = map.getMinZoom();
    if (maxZoom === Infinity) return minZoom + 8;

    return (maxZoom + minZoom) / 2;
  }

  const pixiOverlayClass = {
    options: {
      // @option padding: Number = 0.1
      // How much to extend the clip area around the map view (relative to its size)
      // e.g. 0.1 would be 10% of map view in each direction
      padding: 0.1,
      // @option forceCanvas: Boolean = false
      // Force use of a 2d-canvas
      forceCanvas: false,
      // @option doubleBuffering: Boolean = false
      // Help to prevent flicker when refreshing display on some devices (e.g. iOS devices)
      // It is ignored if rendering is done with 2d-canvas
      doubleBuffering: false,
      // @option resolution: Number = 1
      // Resolution of the renderer canvas
      resolution: L.Browser.retina ? 2 : 1,
      // @option projectionZoom(map: map): Number
      // return the layer projection zoom level
      projectionZoom: projectionZoom,
      // @option destroyInteractionManager:  Boolean = false
      // Destroy PIXI EventSystem
      destroyInteractionManager: false,
      // @option
      // Customize PIXI EventSystem autoPreventDefault property
      // This option is ignored if destroyInteractionManager is set
      autoPreventDefault: true,
      // @option resolution: Boolean = false
      // Enables drawing buffer preservation
      preserveDrawingBuffer: false,
      // @option resolution: Boolean = true
      // Clear the canvas before the new render pass
      clearBeforeRender: true,
      // @option shouldRedrawOnMove(e: moveEvent): Boolean
      // filter move events that should trigger a layer redraw
      shouldRedrawOnMove: function () {
        return false;
      },
    },

    initialize: function (drawCallback, pixiContainer, options) {
      L.setOptions(this, options);
      L.stamp(this);
      this._drawCallback = drawCallback;
      this._pixiContainer = pixiContainer;
      this._rendererOptions = {
        resolution: this.options.resolution,
        antialias: true,
        forceCanvas: this.options.forceCanvas,
        preserveDrawingBuffer: this.options.preserveDrawingBuffer,
        clearBeforeRender: this.options.clearBeforeRender,
      };

      this._rendererOptions.backgroundAlpha = 0;

      this._doubleBuffering =
        isWebGLSupported() &&
        !this.options.forceCanvas &&
        this.options.doubleBuffering;
    },

    _setMap: function () {},

    _setContainerStyle: function () {},

    _addContainer: function () {
      this.getPane().appendChild(this._container);
    },

    _setEvents: function () {},

    setRenderer: async function() {
      this._renderer = await autoDetectRenderer(this._rendererOptions);
      if (this._doubleBuffering) {
          this._auxRenderer = await autoDetectRenderer(this._rendererOptions);
      }
    },

    onAdd: function (targetMap) {
      this._setMap(targetMap);
      if (!this._container) {
        const container = (this._container = L.DomUtil.create(
          'div',
          'leaflet-pixi-overlay',
        ));
        container.style.position = 'absolute';
        setEventSystem(
          this._renderer,
          this.options.destroyInteractionManager,
          this.options.autoPreventDefault,
        );
        container.appendChild(this._renderer.canvas);
        if (this._zoomAnimated) {
          L.DomUtil.addClass(container, 'leaflet-zoom-animated');
          this._setContainerStyle();
        }
        if (this._doubleBuffering) {
          setEventSystem(
            this._auxRenderer,
            this.options.destroyInteractionManager,
            this.options.autoPreventDefault,
          );
          container.appendChild(this._auxRenderer.canvas);
          this._renderer.canvas.style.position = 'absolute';
          this._auxRenderer.canvas.style.position = 'absolute';
        }
      }
      this._addContainer();
      this._setEvents();

      const map = this._map;
      this._initialZoom = this.options.projectionZoom(map);
      this._wgsOrigin = L.latLng([0, 0]);
      this._wgsInitialShift = map.project(this._wgsOrigin, this._initialZoom);
      this._mapInitialZoom = map.getZoom();
      const _layer = this;
      this.utils = {
        latLngToLayerPoint: function (latLng, zoom) {
          const newZoom = zoom ?? _layer._initialZoom;
          const projectedPoint = map.project(L.latLng(latLng), newZoom);
          return projectedPoint;
        },
        layerPointToLatLng: function (point, zoom) {
          const newZoom = zoom ?? _layer._initialZoom;
          const projectedPoint = L.point(point);
          return map.unproject(projectedPoint, newZoom);
        },
        getScale: function (zoom) {
          if (zoom === undefined)
            return map.getZoomScale(map.getZoom(), _layer._initialZoom);
          else return map.getZoomScale(zoom, _layer._initialZoom);
        },
        getRenderer: function () {
          return _layer._renderer;
        },
        getContainer: function () {
          return _layer._pixiContainer;
        },
        getMap: function () {
          return _layer._map;
        },
      };

      this._update({ type: 'add' });
    },

    onRemove: function () {
      L.DomUtil.remove(this._container);
    },

    getEvents: function () {
      const events = {
        zoom: this._onZoom,
        move: this._onMove,
        moveend: this._update,
      };
      if (this._zoomAnimated) {
        events.zoomanim = this._onAnimZoom;
      }
      return events;
    },

    _onZoom: function () {
      this._updateTransform(this._map.getCenter(), this._map.getZoom());
    },

    _onAnimZoom: function (e) {
      this._updateTransform(e.center, e.zoom);
    },

    _onMove: function (e) {
      if (this.options.shouldRedrawOnMove(e)) {
        this._update(e);
      }
    },

    _updateTransform: function (center, zoom) {
      const scale = this._map.getZoomScale(zoom, this._zoom);
      const viewHalf = this._map
        .getSize()
        .multiplyBy(0.5 + this.options.padding);
      const currentCenterPoint = this._map.project(this._map.getCenter(), zoom);
      const topLeftOffset = viewHalf
        .multiplyBy(-scale)
        .add(currentCenterPoint)
        .subtract(this._map._getNewPixelOrigin(center, zoom));

      if (L.Browser.any3d) {
        L.DomUtil.setTransform(this._container, topLeftOffset, scale);
      } else {
        L.DomUtil.setPosition(this._container, topLeftOffset);
      }
    },

    _redraw: function (offset, e) {
      this._disableLeafletRounding();
      const scale = this._map.getZoomScale(this._zoom, this._initialZoom),
        shift = this._map
          .latLngToLayerPoint(this._wgsOrigin)
          ._subtract(this._wgsInitialShift.multiplyBy(scale))
          ._subtract(offset);
      this._pixiContainer.scale.set(scale);
      this._pixiContainer.position.set(shift.x, shift.y);
      this._drawCallback(this.utils, e);
      this._enableLeafletRounding();
    },

    _update: function (e) {
      // is this really useful?
      if (this._map._animatingZoom && this._bounds) {
        return;
      }

      // Update pixel bounds of renderer container
      const p = this.options.padding,
        mapSize = this._map.getSize(),
        min = this._map
          .containerPointToLayerPoint(mapSize.multiplyBy(-p))
          .round();

      this._bounds = new L.Bounds(
        min,
        min.add(mapSize.multiplyBy(1 + p * 2)).round(),
      );
      this._center = this._map.getCenter();
      this._zoom = this._map.getZoom();

      if (this._doubleBuffering) {
        const currentRenderer = this._renderer;
        this._renderer = this._auxRenderer;
        this._auxRenderer = currentRenderer;
      }

      if (!this._renderer) return;
      const { canvas } = this._renderer;
      const b = this._bounds;
      const container = this._container;
      const size = b.getSize();

      if (
        !this._renderer.size ||
        this._renderer.size.x !== size.x ||
        this._renderer.size.y !== size.y
      ) {
        if (this._renderer.gl) {
          this._renderer.resolution = this.options.resolution;
          if (this._renderer.rootRenderTarget) {
            this._renderer.rootRenderTarget.resolution =
              this.options.resolution;
          }
        }
        this._renderer.resize(size.x, size.y);
        canvas.style.width = size.x + 'px';
        canvas.style.height = size.y + 'px';
        if (this._renderer.gl) {
          let { gl } = this._renderer;
          if (gl.drawingBufferWidth !== this._renderer.width) {
            const resolution =
              (this.options.resolution * gl.drawingBufferWidth) /
              this._renderer.width;
            this._renderer.resolution = resolution;
            if (this._renderer.rootRenderTarget) {
              this._renderer.rootRenderTarget.resolution = resolution;
            }
            this._renderer.resize(size.x, size.y);
          }
        }
        this._renderer.size = size;
      }

      if (this._doubleBuffering) {
        const self = this;
        requestAnimationFrame(function () {
          self._redraw(b.min, e);
          self._renderer.gl.finish();
          canvas.style.visibility = 'visible';
          self._auxRenderer.canvas.style.visibility = 'hidden';
          L.DomUtil.setPosition(container, b.min);
        });
      } else {
        this._redraw(b.min, e);
        L.DomUtil.setPosition(container, b.min);
      }
    },

    _disableLeafletRounding: function () {
      L.Point.prototype._round = no_round;
    },

    _enableLeafletRounding: function () {
      L.Point.prototype._round = round;
    },

    redraw: function (data) {
      if (this._map) {
        this._disableLeafletRounding();
        this._drawCallback(this.utils, data);
        this._enableLeafletRounding();
      }
      return this;
    },

    _destroy: function () {
      this._renderer.destroy(true);
      if (this._doubleBuffering) {
        this._auxRenderer.destroy(true);
      }
    },

    destroy: function () {
      this.remove();
      this._destroy();
    },
  };

  L.PixiOverlay = L.Layer.extend(pixiOverlayClass);

  // @factory L.pixiOverlay(drawCallback: function, pixiContainer: PIXI.Container, options?: L.PixiOverlay options)
  // Creates a PixiOverlay with the given arguments.
  L.pixiOverlay = function (drawCallback, pixiContainer, options) {
    return L.Browser.canvas
      ? new L.PixiOverlay(drawCallback, pixiContainer, options)
      : null;
  };
});
