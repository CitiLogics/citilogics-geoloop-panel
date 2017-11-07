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
      console.log("called into RENDER");
      if (!ctrl.map) {
        // console.log('creating new map');
        ctrl.map = new GeoLoop(ctrl, mapContainer[0]);
      }

      ctrl.map.resize();

      if (ctrl.mapCenterMoved) ctrl.map.panToMapCenter();

      if (!ctrl.map.legend && ctrl.panel.showLegend) ctrl.map.createLegend();

      ctrl.updateRamp();
      ctrl.map.drawLayerFrames();
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
