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
import {getFrame} from "../../../utils/DataUtils.js";
import {InputDragPointer} from "../pointer/InputDragPointer.js";


class DomPower {
    constructor() {
        let inputDragPointer = new InputDragPointer()
        let htmlElement;
        let _this = this;
        let statusMap;

        let inputElement;
        let stickElement;

        let controlLineX;

        let dynamicRollL;
        let dynamicRollR;

        function update() {
            inputDragPointer.call.updateKeyState();
            translateElement3DPercent(stickElement, 0,100 - statusMap['INPUT_POWER']*100,  0);

            let outRoll = 100 - statusMap['output_INPUT_POWER']*100

            translateElement3DPercent(controlLineX, 0, outRoll,   0);

            let dynR = 100 - statusMap['DYNAMIC_ENGINE_L']*100
            let dynL = 100 - statusMap['DYNAMIC_ENGINE_R']*100

            translateElement3DPercent(dynamicRollL, -70, dynL,0  );
            translateElement3DPercent(dynamicRollR, 70, dynR,  0);

        }


        function setupListeners() {
            let surface = htmlElement.call.getChildElement('sampler_surface')
            controlLineX = htmlElement.call.getChildElement('actuator')
            inputElement = htmlElement.call.getChildElement('input')
            stickElement = htmlElement.call.getChildElement('input_state')
            dynamicRollL = htmlElement.call.getChildElement('dynamic_l')
            dynamicRollR = htmlElement.call.getChildElement('dynamic_r')

            let opts = [
                {axis:"Y", min:0, max:1, origin: 0, margin:0.25, invert:true, autoZero:false, additive:true, keys:{add:'f', sub:'r'}}
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

        this.call = {
            update:update,
            initElement:initElement
        }

    }
}

export { DomPower }