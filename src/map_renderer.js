import GeoLoop from './geoloop';

export default function link(scope, elem, attrs, ctrl) {
  const mapContainer = elem.find('.mapcontainer');
  // console.log('found: ', mapContainer);

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
