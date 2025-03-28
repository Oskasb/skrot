import {poolFetch} from "../../../utils/PoolUtils.js";
import {
    translateElement3DPercent
} from "../DomUtils.js";
import {InputDragPointer} from "../pointer/InputDragPointer.js";

class DomSweep {
    constructor() {
        let inputDragPointer = new InputDragPointer()
        let htmlElement;
        let _this = this;
        let statusMap;

        let inputElement;
        let stickElement;

        let controlLineX;
        let controlLineY;

        let dynamicRollL;
        let dynamicRollR;
        let dynamicPitchL;
        let dynamicPitchR;

        function update() {
            translateElement3DPercent(stickElement, 0,statusMap['INPUT_SWEEP']*100,  0);

            let outRoll = statusMap['output_INPUT_SWEEP']*100

            translateElement3DPercent(controlLineX, 0, outRoll,   0);

            let dynRollR = statusMap['DYNAMIC_SWEEP_R']*100
            let dynRollL = statusMap['DYNAMIC_SWEEP_L']*100

            translateElement3DPercent(dynamicRollL, -70, dynRollL,0  );
            translateElement3DPercent(dynamicRollR, 70, dynRollR,  0);

        }


        function setupListeners() {
            let surface = htmlElement.call.getChildElement('sampler_surface')
            controlLineX = htmlElement.call.getChildElement('actuator')
            inputElement = htmlElement.call.getChildElement('input')
            stickElement = htmlElement.call.getChildElement('input_state')
            dynamicRollL = htmlElement.call.getChildElement('dynamic_l')
            dynamicRollR = htmlElement.call.getChildElement('dynamic_r')

            let opts = [
                {axis:"Y", min:0, max:1, origin: 0, margin:0.25},
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

export { DomSweep }