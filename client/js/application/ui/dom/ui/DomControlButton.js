import {poolFetch} from "../../../utils/PoolUtils.js";
import {
    addElementClass, removeElementClass
} from "../DomUtils.js";
import {InputDragPointer} from "../pointer/InputDragPointer.js";

class DomControlButton {
    constructor() {
        let inputDragPointer = new InputDragPointer()
        let htmlElement;
        let _this = this;
        let statusMap;
        let inputElement;
        let stickElement;

        let pressActive = false;

        function update() {

            inputDragPointer.call.updateKeyState();

            let press = statusMap['PRESS'];

            if (pressActive !== press) {
                console.log("DomControlButton", statusMap);

                if (press) {
                    addElementClass(inputElement, 'button_input_pressed');
                } else {
                    removeElementClass(inputElement, 'button_input_pressed');
                }

                pressActive = press;
            }

        }

        function setupListeners() {
            let surface = htmlElement.call.getChildElement('sampler_surface')
            inputElement = htmlElement.call.getChildElement('input')
            let opts = [
                {axis:"PRESS", min:0, max:1, origin: 0, margin:0.5},
            ]

            inputDragPointer.call.activatePressSurface(surface, inputElement, statusMap, opts)
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

        function closeElement() {
            htmlElement.closeHtmlElement()
            ThreeAPI.unregisterPrerenderCallback(update);
        }

        this.call = {
            update:update,
            initElement:initElement,
            closeElement:closeElement
        }

    }
}

export { DomControlButton }