import {poolFetch} from "../../../utils/PoolUtils.js";
import {
    translateElement3DPercent
} from "../DomUtils.js";
import {InputDragPointer} from "../pointer/InputDragPointer.js";

class DomFlightstick {
    constructor() {

        let inputDragPointer = new InputDragPointer()
        let htmlElement;
        let _this = this;
        let statusMap;
        let surface;
        let inputElement;
        let stickElement;

        let moveRange = 40;

        function update() {
            inputDragPointer.call.updateKeyState();
            translateElement3DPercent(stickElement, statusMap['INPUT_ROLL']*moveRange, statusMap['INPUT_PITCH']*moveRange, 0);
        }


        function setupListeners() {
            surface = htmlElement.call.getChildElement('stick_sampler')
            inputElement = htmlElement.call.getChildElement('stick_input')
            stickElement = htmlElement.call.getChildElement('stick_state')

            let opts = [
                {axis:"X", min:-1, max:1, origin: 0, margin:1.5, autoZero:true, additive:true, keys:{add:'d', sub:'a'}},
                {axis:"Y", min:-1, max:1, origin: 0, margin:1.5, autoZero:true, additive:true, keys:{add:'s', sub:'w'}}
            ]

            inputDragPointer.call.activateDragSurface(surface, inputElement, statusMap, opts)

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

export { DomFlightstick }