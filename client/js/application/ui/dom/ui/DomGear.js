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


class DomGear {
    constructor() {
        let inputDragPointer = new InputDragPointer()
        let htmlElement;
        let _this = this;
        let statusMap;

        let inputElement;
        let stickElement;

        let controlLineX;

        let dynamicL;
        let dynamicR;
        let dynamicMid;


        function update() {
            translateElement3DPercent(stickElement, 0,statusMap['INPUT_GEAR']*100,  0);

            let outRoll = statusMap['output_INPUT_GEAR']*100

            translateElement3DPercent(controlLineX, 0, outRoll,   0);

            let dynGearR = statusMap['DYNAMIC_GEAR_R']*100
            let dynGearL = statusMap['DYNAMIC_GEAR_L']*100
            let dynGearN = statusMap['DYNAMIC_GEAR_NOSE']*100

            translateElement3DPercent(dynamicL, -80, dynGearL,0  );
            translateElement3DPercent(dynamicR, 80, dynGearR,  0);
            translateElement3DPercent(dynamicMid, 0, dynGearN,  0);
        }


        function setupListeners() {
            let surface = htmlElement.call.getChildElement('sampler_surface')
            controlLineX = htmlElement.call.getChildElement('actuator')
            inputElement = htmlElement.call.getChildElement('input')
            stickElement = htmlElement.call.getChildElement('input_state')
            dynamicL = htmlElement.call.getChildElement('dynamic_l')
            dynamicR = htmlElement.call.getChildElement('dynamic_r')
            dynamicMid = htmlElement.call.getChildElement('dynamic_mid')
            let opts = [
                {axis:"Y", min:0, max:1, origin: 0, margin:0.5},
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

export { DomGear }