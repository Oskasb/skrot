import {poolFetch} from "../../utils/PoolUtils.js";
import {ENUMS} from "../../ENUMS.js";
import {addClickFunction} from "./DomUtils.js";
import {getPlayerActor} from "../../utils/ActorUtils.js";
import {DomSettings} from "./DomSettings.js";

class DomWorldHud {
    constructor() {

        let rightBarElement = null;
        let statusMap = {};

        function update() {

            rightBarElement.call.applyTransformSettings(
                ENUMS.Settings.OFFSET_RBAR_X,
                ENUMS.Settings.OFFSET_RBAR_Y,
                ENUMS.Settings.SCALE_RBAR
            )

        }


        function close() {
        //    ThreeAPI.unregisterPrerenderCallback(update);
        }


        let openSettings = function() {
            let settings = new DomSettings()

            function settingsClosed() {

            }

            settings.initDomSettings(settingsClosed)
        }

        function rightBarReady() {
            let settingsDiv = rightBarElement.call.getChildElement('button_settings');
            addClickFunction(settingsDiv, openSettings)
            ThreeAPI.registerPrerenderCallback(update);
        }


        function activate() {
            rightBarElement = poolFetch('HtmlElement');
            rightBarElement.initHtmlElement('bar_right', null, statusMap, 'bar_right', rightBarReady);
        }

        function hide() {
            rightBarElement.hideHtmlElement(0.3)
        }

        function show() {
            rightBarElement.showHtmlElement(0.3)
        }

        this.call = {
            close:close,
            activate:activate
        }

        activate();
    }

}

export { DomWorldHud }