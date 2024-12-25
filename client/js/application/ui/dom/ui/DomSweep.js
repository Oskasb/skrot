import {poolFetch} from "../../../utils/PoolUtils.js";
import {
    addMouseMoveFunction,
    addPressEndFunction,
    addPressStartFunction,
    pointerEventToPercentX,
    pointerEventToPercentY,
    translateElement3DPercent
} from "../DomUtils.js";
import {MATH} from "../../../MATH.js";


class DomSweep {
    constructor() {

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

        let pressActive = false;

        function pressStart(e) {
            pressActive = true;
            pointerMove(e)
        }

        function pressEnd(e) {
            pressActive = false;
            translateElement3DPercent(inputElement, statusMap['AXIS_Y'], 0, 0);
        }

        function pointerMove(e) {
            if (pressActive) {
                statusMap['AXIS_Y'] = MATH.clamp( (-0.25 + pointerEventToPercentY(e)/50), 0, 1);
                translateElement3DPercent(inputElement,0, statusMap['AXIS_Y']*100,  0);
            }

        }

        function setupListeners() {
            let surface = htmlElement.call.getChildElement('sampler_surface')
            controlLineX = htmlElement.call.getChildElement('actuator')
            inputElement = htmlElement.call.getChildElement('input')
            stickElement = htmlElement.call.getChildElement('input_state')
            dynamicRollL = htmlElement.call.getChildElement('dynamic_l')
            dynamicRollR = htmlElement.call.getChildElement('dynamic_r')

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

export { DomSweep }