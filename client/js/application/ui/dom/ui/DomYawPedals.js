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


class DomYawPedals {
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
            translateElement3DPercent(stickElement, statusMap['INPUT_YAW']*50, 0, 0);

            let outRoll = statusMap['output_INPUT_YAW']*50+50
            let outPitch = statusMap['INPUT_YAW']*50+50

            translateElement3DPercent(controlLineX, outRoll, 0,  0);
        //    translateElement3DPercent(controlLineY, 0,outPitch,  0);

            let dynRollR = statusMap['DYNAMIC_RUDDER_R']*20
            let dynRollL = statusMap['DYNAMIC_RUDDER_L']*20

            translateElement3DPercent(dynamicRollL, outRoll + dynRollL,0,  0);
            translateElement3DPercent(dynamicRollR, outRoll + dynRollR,50,  0);

        }

        let pressActive = false;

        function pressStart(e) {
            pressActive = true;
            pointerMove(e)
        }

        function pressEnd(e) {
            pressActive = false;
            statusMap['AXIS_X'] = 0;
            translateElement3DPercent(inputElement, statusMap['AXIS_X'], 0, 0);
        }

        function pointerMove(e) {
            if (pressActive) {
            //    console.log(e);
                statusMap['AXIS_X'] = MATH.clamp((-50 + pointerEventToPercentX(e))/25, -1, 1);
                translateElement3DPercent(inputElement, statusMap['AXIS_X']*50, 0, 0);
            }

        }

        function setupListeners() {
            let surface = htmlElement.call.getChildElement('sampler_surface')
            controlLineX = htmlElement.call.getChildElement('actuator_x')
            inputElement = htmlElement.call.getChildElement('yaw_input')
            stickElement = htmlElement.call.getChildElement('yaw_state')

            dynamicRollL = htmlElement.call.getChildElement('dynamic_yaw_l');
            dynamicRollR = htmlElement.call.getChildElement('dynamic_yaw_r');

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

export { DomYawPedals }