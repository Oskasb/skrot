import {poolFetch} from "../../../utils/PoolUtils.js";
import {
    addMouseMoveFunction,
    addPressEndFunction,
    addPressStartFunction,
    pointerEventToPercentX,
    pointerEventToPercentY, translateElement3DPercent
} from "../DomUtils.js";
import {MATH} from "../../../MATH.js";
import {getFrame} from "../../../utils/DataUtils.js";
import {InputDragPointer} from "../pointer/InputDragPointer.js";


class DomFlightstick {
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
            translateElement3DPercent(stickElement, statusMap['INPUT_ROLL']*50, statusMap['INPUT_PITCH']*50, 0);

            let outRoll = statusMap['output_INPUT_ROLL']*50+50
            let outPitch = statusMap['output_INPUT_PITCH']*50+50

            translateElement3DPercent(controlLineX, outRoll, 0,  0);
            translateElement3DPercent(controlLineY, 0,outPitch,  0);

            let dynRollL = -statusMap['DYNAMIC_ROLL_L']*50+50
            let dynRollR = statusMap['DYNAMIC_ROLL_R']*50+50
            let dynPitchR = statusMap['DYNAMIC_PITCH_L']*50+50
            let dynPitchL = statusMap['DYNAMIC_PITCH_R']*50+50

            translateElement3DPercent(dynamicRollL, dynRollL,0,  0);
            translateElement3DPercent(dynamicRollR, dynRollR,50,  0);
            translateElement3DPercent(dynamicPitchL, 0, dynPitchL,  0);
            translateElement3DPercent(dynamicPitchR, 0, dynPitchR,  0);

        }


        function setupListeners() {
            let surface = htmlElement.call.getChildElement('stick_sampler')
            controlLineX = htmlElement.call.getChildElement('actuator_x')
            controlLineY = htmlElement.call.getChildElement('actuator_y')
            inputElement = htmlElement.call.getChildElement('stick_input')
            stickElement = htmlElement.call.getChildElement('stick_state')

            dynamicRollL = htmlElement.call.getChildElement('dynamic_roll_l');
            dynamicRollR = htmlElement.call.getChildElement('dynamic_roll_r');
            dynamicPitchL = htmlElement.call.getChildElement('dynamic_pitch_l');
            dynamicPitchR = htmlElement.call.getChildElement('dynamic_pitch_r');


            let opts = [
                    {axis:"X", min:-1, max:1, origin: 0, margin:0.25},
                    {axis:"Y", min:-1, max:1, origin: 0, margin:0.25}
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

export { DomFlightstick }