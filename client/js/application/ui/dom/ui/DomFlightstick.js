import {poolFetch} from "../../../utils/PoolUtils.js";
import {
    transformElement3DPercent,
    translateElement3DPercent
} from "../DomUtils.js";
import {InputDragPointer} from "../pointer/InputDragPointer.js";
import {MATH} from "../../../MATH.js";
import {getFrame} from "../../../utils/DataUtils.js";


class DomFlightstick {
    constructor() {

        let inputDragPointer = new InputDragPointer()
        let htmlElement;
        let _this = this;
        let statusMap;

        let surface;

        let inputElement;
        let stickElement;

        let controlLineX;
        let controlLineY;

        let dynamicRollL;
        let dynamicRollR;
        let dynamicPitchL;
        let dynamicPitchR;

        let pitchStateDiv;
        let pitchLineDiv;
        let aoaXStateDiv;
            let rollStateDiv;
            let yawStateDiv;
            let aoaYStateDiv;

            let nState;
        let eState;
        let sState;
        let wState;

        let moveRange = 40;

        function update() {
            translateElement3DPercent(stickElement, statusMap['INPUT_ROLL']*moveRange, statusMap['INPUT_PITCH']*moveRange, 0);

            let outRoll = statusMap['output_INPUT_ROLL']*moveRange+50
            let outPitch = statusMap['output_INPUT_PITCH']*moveRange+50

            translateElement3DPercent(controlLineX, outRoll, 0,  0);
            translateElement3DPercent(controlLineY, 0,outPitch,  0);

            let dynRollL = statusMap['DYNAMIC_ROLL_L']*moveRange+50
            let dynRollR = -statusMap['DYNAMIC_ROLL_R']*moveRange+50
            let dynPitchR = statusMap['DYNAMIC_PITCH_L']*moveRange+50
            let dynPitchL = statusMap['DYNAMIC_PITCH_R']*moveRange+50

            translateElement3DPercent(dynamicRollL, dynRollL,15,  0);
            translateElement3DPercent(dynamicRollR, dynRollR,60,  0);
            translateElement3DPercent(dynamicPitchL, 12, dynPitchL,  0);
            translateElement3DPercent(dynamicPitchR, -12, dynPitchR,  0);

            let pitch = statusMap['STATUS_PITCH']*50 / 3.15 + 50
            let roll = statusMap['STATUS_ROLL'] // *50 / 3.15 + 50
            let yaw = statusMap['STATUS_YAW']*50 / 3.15 + 50
            translateElement3DPercent(pitchStateDiv, 0, pitch,  0);
            translateElement3DPercent(pitchLineDiv, 0, pitch,  0);
            transformElement3DPercent(rollStateDiv,  0,0,  0, roll);
            translateElement3DPercent(yawStateDiv, yaw, 0,  0);

            let n = statusMap['STATUS_ANGLE_NORTH']*50 / 3.15 + 50
            let e = statusMap['STATUS_ANGLE_EAST']*50 / 3.15 + 50
            let s = statusMap['STATUS_ANGLE_SOUTH']*50 / 3.15 + 50
            let w = statusMap['STATUS_ANGLE_WEST']*50 / 3.15 + 50

            translateElement3DPercent(nState, n, 0,  0);
            translateElement3DPercent(eState, e, 0,  0);
            translateElement3DPercent(sState, s, 0,  0);
            translateElement3DPercent(wState, w, 0,  0);

            let txt = 'FPS: '+MATH.numberToDigits(1 / getFrame().avgTpf, 0, 0);
            statusMap['fps_avg'] = txt;
            statusMap['elevation'] = 'ALT: '+MATH.numberToDigits(statusMap['STATUS_ELEVATION'], 0, 0);
        //    surface.innerHTML = txt
        }


        function setupListeners() {
            surface = htmlElement.call.getChildElement('stick_sampler')
            controlLineX = htmlElement.call.getChildElement('actuator_x')
            controlLineY = htmlElement.call.getChildElement('actuator_y')
            inputElement = htmlElement.call.getChildElement('stick_input')
            stickElement = htmlElement.call.getChildElement('stick_state')

            dynamicRollL = htmlElement.call.getChildElement('dynamic_roll_l');
            dynamicRollR = htmlElement.call.getChildElement('dynamic_roll_r');
            dynamicPitchL = htmlElement.call.getChildElement('dynamic_pitch_l');
            dynamicPitchR = htmlElement.call.getChildElement('dynamic_pitch_r');

            pitchStateDiv = htmlElement.call.getChildElement('pitch_state');
            pitchLineDiv = htmlElement.call.getChildElement('pitch_state_line');
            aoaXStateDiv = htmlElement.call.getChildElement('aoa_x_state');
            rollStateDiv = htmlElement.call.getChildElement('roll_state');
            yawStateDiv = htmlElement.call.getChildElement('yaw_state');


            nState = htmlElement.call.getChildElement('n_state');;
            eState = htmlElement.call.getChildElement('w_state');;
            sState = htmlElement.call.getChildElement('s_state');;
            wState = htmlElement.call.getChildElement('e_state');;

            let opts = [
                    {axis:"X", min:-1, max:1, origin: 0, margin:1.5},
                    {axis:"Y", min:-1, max:1, origin: 0, margin:1.5}
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