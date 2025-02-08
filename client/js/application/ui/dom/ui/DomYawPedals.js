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


class DomYawPedals {
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
            inputDragPointer.call.updateKeyState();
            translateElement3DPercent(stickElement, statusMap['INPUT_YAW']*50, 0, 0);

            let outRoll = statusMap['output_INPUT_YAW']*50+50
            let outPitch = statusMap['INPUT_YAW']*50+50

            translateElement3DPercent(controlLineX, outRoll, 0,  0);
        //    translateElement3DPercent(controlLineY, 0,outPitch,  0);

            let dynRollR = statusMap['DYNAMIC_RUDDER_R']*50+50
            let dynRollL = statusMap['DYNAMIC_RUDDER_L']*50+50

            translateElement3DPercent(dynamicRollL, dynRollL,0,  0);
            translateElement3DPercent(dynamicRollR, dynRollR,50,  0);
        }


        function setupListeners() {
            let surface = htmlElement.call.getChildElement('sampler_surface')
            controlLineX = htmlElement.call.getChildElement('actuator_x')
            inputElement = htmlElement.call.getChildElement('yaw_input')
            stickElement = htmlElement.call.getChildElement('yaw_state')

            dynamicRollL = htmlElement.call.getChildElement('dynamic_yaw_l');
            dynamicRollR = htmlElement.call.getChildElement('dynamic_yaw_r');

            let opts = [
                {axis:"X", min:-1, max:1, origin: 0, margin:0.25, autoZero:false, additive:true, keys:{add:'e', sub:'q'}}
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

export { DomYawPedals }