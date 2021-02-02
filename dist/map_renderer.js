'use strict';

System.register(['./geoloop'], function (_export, _context) {
  "use strict";

  var GeoLoop;
  function link(scope, elem, attrs, ctrl) {
    var mapContainer = elem.find('.mapcontainer');
    console.log('initialized map renderer');

    ctrl.events.on('render', function () {
      render();
      if (ctrl.map) {
        setTimeout(function () {
          ctrl.map.resize();
        }, 500);
      }
      ctrl.renderingCompleted();
    });

    function render() {
      console.log('called into RENDER');
      if (!ctrl.map) {
        createMap();
      }

      ctrl.map.resize();

      if (ctrl.mapCenterMoved) ctrl.map.panToMapCenter();

      if (!ctrl.map.legend && ctrl.panel.showLegend) ctrl.map.createLegend();

      // initialize color ramp/interpolation
      ctrl.updateRamp();
      // create frames on map and start the animation
      ctrl.map.drawLayerFrames();
    }

    function createMap() {
      // create map if none exists
      console.log('creating new map (new GeoLoop(...))');
      var newmap = new GeoLoop(ctrl, mapContainer[0]);
      ctrl.map = ctrl.map || newmap; // only update map if there is still nothing (this is as atomic as it gets - small race condition)
      if (ctrl.map !== newmap) newmap.remove(); // unload new map, if there was one create before
    }
  }

  _export('default', link);

  return {
    setters: [function (_geoloop) {
      GeoLoop = _geoloop.default;
    }],
    execute: function () {}
  };
});
//# sourceMappingURL=map_renderer.js.map
