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
      console.log('creating new map');
      ctrl.map = ctrl.map || new GeoLoop(ctrl, mapContainer[0]);  // only update map if there is still nothing
    }

    ctrl.map.resize();

    if (ctrl.mapCenterMoved) ctrl.map.panToMapCenter();

    if (!ctrl.map.legend && ctrl.panel.showLegend) ctrl.map.createLegend();

    ctrl.updateRamp();
    ctrl.map.drawLayerFrames();
  }
}
