import {poolFetch} from "../../../utils/PoolUtils.js";
import {
    addMouseMoveFunction,
    addPressEndFunction,
    addPressStartFunction,
    pointerEvenToPercentX,
    pointerEvenToPercentY
} from "../DomUtils.js";


class DomFlightstick {
    constructor() {

        let htmlElement;
        let _this = this;
        let statusMap;

        function update() {

        }

        let pressActive = false;

        function pressStart(e) {
            pressActive = true;
        }

        function pressEnd(e) {
            pressActive = false;
            statusMap['INPUT_X'] = 0;
            statusMap['INPUT_Y'] = 0;
        }

        function pointerMove(e) {
            if (pressActive) {
                console.log(e);
                statusMap['INPUT_X'] = pointerEvenToPercentX(e);
                statusMap['INPUT_Y'] = pointerEvenToPercentY(e);
            }
        }

        function setupListeners() {
            let surface = htmlElement.call.getChildElement('stick_container')

            addPressStartFunction(surface, pressStart)
            addMouseMoveFunction(surface, pointerMove)
            addPressEndFunction(surface, pressEnd)
        }


        function initElement(sMap, url, styleClass, onReady) {
            statusMap = sMap;
            function elemReady(htmlEl) {
                htmlElement = htmlEl;
                onReady(_this)
                setupListeners()
            }

            let element = poolFetch('HtmlElement');
            element.initHtmlElement(url, null, statusMap, styleClass, elemReady);
        }

        this.call = {
            update:update,
            initElement:initElement
        }

    }
}

export { DomFlightstick }