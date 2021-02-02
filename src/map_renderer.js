import GeoLoop from './geoloop';

export default function link(scope, elem, attrs, ctrl) {
  const mapContainer = elem.find('.mapcontainer');
  console.log('initialized map renderer');

  ctrl.events.on('render', () => {
    render();
    if (ctrl.map) {
      setTimeout(() => {
        ctrl.map.resize();
      }, 500);
    }
    ctrl.renderingCompleted();
  });

  function render() {
    console.log('called into RENDER');
    if (!ctrl.map) {
      console.log('creating new map (new GeoLoop(...))');
      const newmap = new GeoLoop(ctrl, mapContainer[0]);
      ctrl.map = ctrl.map || newmap;  // only update map if there is still nothing (this is as atomic as it gets - small race condition)
      if (ctrl.map !== newmap) newmap.remove();  // unload new map, if there was one create before
    }

    ctrl.map.resize();

    if (ctrl.mapCenterMoved) ctrl.map.panToMapCenter();

    if (!ctrl.map.legend && ctrl.panel.showLegend) ctrl.map.createLegend();

    // initialize color ramp/interpolation
    ctrl.updateRamp();
    // create frames on map and start the animation
    ctrl.map.drawLayerFrames();
  }
}
