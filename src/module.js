/* eslint import/no-extraneous-dependencies: 0 */
import {loadPluginCss} from 'app/plugins/sdk';
import GeoLoopCtrl from './geoloop_ctrl';

loadPluginCss({
  dark: 'plugins/citilogics-geoloop-panel/css/geoloop.dark.css',
  light: 'plugins/citilogics-geoloop-panel/css/geoloop.light.css'
});

/* eslint import/prefer-default-export: 0 */
export {
  GeoLoopCtrl as PanelCtrl
};
