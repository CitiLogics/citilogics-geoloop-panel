'use strict';

System.register(['app/plugins/sdk', './geoloop_ctrl'], function (_export, _context) {
  "use strict";

  var loadPluginCss, GeoLoopCtrl;
  return {
    setters: [function (_appPluginsSdk) {
      loadPluginCss = _appPluginsSdk.loadPluginCss;
    }, function (_geoloop_ctrl) {
      GeoLoopCtrl = _geoloop_ctrl.default;
    }],
    execute: function () {
      /* eslint import/no-extraneous-dependencies: 0 */
      loadPluginCss({
        dark: 'plugins/citilogics-geoloop-panel/css/geoloop.dark.css',
        light: 'plugins/citilogics-geoloop-panel/css/geoloop.light.css'
      });

      /* eslint import/prefer-default-export: 0 */

      _export('PanelCtrl', GeoLoopCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map
