import {poolFetch} from "../../utils/PoolUtils.js";
import {ENUMS} from "../../ENUMS.js";
import {addClickFunction, addElementClass, removeElementClass} from "./DomUtils.js";
import {getPlayerActor} from "../../utils/ActorUtils.js";
import {DomSettings} from "./DomSettings.js";
import {remove} from "../../../../../libs/jsm/libs/tween.module.js";

class DomWorldHud {
    constructor() {

        let rightBarElement = null;
        let statusMap = {};
        let buttonDivs = {};

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


        let toggleSettings = function() {

            if (statusMap.settings) {
                statusMap.settings.closeDomSettings();
                statusMap.settings = null;
            } else {

                function settingsClosed() {
                    removeElementClass(buttonDivs.settingsDiv, 'bar_button_active')
                }

                statusMap.settings = new DomSettings()
                statusMap.settings.initDomSettings(settingsClosed)
                addElementClass(buttonDivs.settingsDiv, 'bar_button_active')
            }

        }

        function rightBarReady() {
            buttonDivs.settingsDiv = rightBarElement.call.getChildElement('button_settings');
            addClickFunction(buttonDivs.settingsDiv, toggleSettings)
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