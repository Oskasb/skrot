import {poolFetch} from "../../../utils/PoolUtils.js";
import {
    addMouseMoveFunction,
    addPressEndFunction,
    addPressStartFunction,
    pointerEventToPercentX,
    pointerEventToPercentY, translateElement3DPercent
} from "../DomUtils.js";
import {MATH} from "../../../MATH.js";


class DomFlightstick {
    constructor() {

        let htmlElement;
        let _this = this;
        let statusMap;

        let inputElement;
        let stickElement;

        let controlLineX;
        let controlLineY;


        function update() {
            translateElement3DPercent(stickElement, statusMap['INPUT_ROLL']*50, statusMap['INPUT_PITCH']*50, 0);
            translateElement3DPercent(controlLineX, statusMap['output_INPUT_ROLL']*50+50,0,  0);
            translateElement3DPercent(controlLineY, 0,statusMap['output_INPUT_PITCH']*50 +50,  0);

        }

        let pressActive = false;

        function pressStart(e) {
            pressActive = true;
            pointerMove(e)
        }

        function pressEnd(e) {
            pressActive = false;
            statusMap['AXIS_X'] = 0;
            statusMap['AXIS_Y'] = 0;
            translateElement3DPercent(inputElement, statusMap['AXIS_X'], statusMap['AXIS_Y'], 0);
        }

        function pointerMove(e) {
            if (pressActive) {
            //    console.log(e);
                statusMap['AXIS_X'] = MATH.clamp((-50 + pointerEventToPercentX(e))/25, -1, 1);
                statusMap['AXIS_Y'] = MATH.clamp((-50 + pointerEventToPercentY(e))/25, -1, 1);
                translateElement3DPercent(inputElement, statusMap['AXIS_X']*50, statusMap['AXIS_Y']*50, 0);
            }

        }

        function setupListeners() {
            let surface = htmlElement.call.getChildElement('stick_sampler')
            controlLineX = htmlElement.call.getChildElement('actuator_x')
            controlLineY = htmlElement.call.getChildElement('actuator_y')
            inputElement = htmlElement.call.getChildElement('stick_input')
            stickElement = htmlElement.call.getChildElement('stick_state')
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

export { DomFlightstick }