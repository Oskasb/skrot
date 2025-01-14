import {
    addMouseMoveFunction,
    addPressEndFunction,
    addPressStartFunction, pointerEventToPercentX, pointerEventToPercentY,
    translateElement3DPercent
} from "../DomUtils.js";
import {getFrame} from "../../../utils/DataUtils.js";
import {MATH} from "../../../MATH.js";
import {keyToValue} from "../../input/KeyboardState.js";
import {Vector3} from "../../../../../../libs/three/Three.Core.js";


let axisPosFunctions = {}
axisPosFunctions['X'] = pointerEventToPercentX;
axisPosFunctions['Y'] = pointerEventToPercentY;

class InputDragPointer {
    constructor() {

        let surfaceElement = null;
        let inputElement = null;
        let statusMap = null;
        let options = null;
        let pressActive = false;
        let pressStartTime = 0;
        let isDoubbleTap = false;

        function pressStart(e) {
            pressActive = true;

            let now = getFrame().systemTime;

            if (now - pressStartTime < 0.25) {
                isDoubbleTap = true;
            } else {
                isDoubbleTap = false;
                pointerMove(e)
            }

            pressStartTime = now;

        }

        function pressEnd() {
            pressActive = false;

            let now = getFrame().systemTime;
            let posX = 0;
            let posY = 0;

            for (let i = 0;i<options.length;i++) {

                if (now - pressStartTime < 0.25 || options[i].autoZero === true) {

                    statusMap['AXIS_'+options[i].axis] = options[i].origin;
                    let min =  options[i].min;
                    let max =  options[i].max;
                    let origin = options[i].origin;
                    let axis = options[i].axis
                    let offsetFrac = MATH.calcFraction(min, max, origin);

                    let inputPos = statusMap['AXIS_'+axis];

                    let inputFrac = (MATH.calcFraction(min, max, inputPos) - offsetFrac) * 100;

                    let invert = options[i].invert;
                    if (invert === true) {
                        inputFrac = 100-inputFrac;
                    }

                    if (axis === 'X') {
                        posX = inputFrac
                    }

                    if (axis === 'Y') {
                        posY = inputFrac
                    }

                }

                translateElement3DPercent(inputElement, posX, posY, 0);

            }

        }

        function pointerMove(e) {
            if (pressActive) {

                let posX = 0;
                let posY = 0;

                for (let i = 0;i<options.length;i++) {
                    let axis = options[i].axis
                    let pointerPcnt =    axisPosFunctions[axis](e);
                    let min =  options[i].min;
                    let max =  options[i].max;
                    let origin = options[i].origin;

                    let axisLength = max - min;
                    let margin = options[i].margin * axisLength;

                    let offsetFrac = MATH.calcFraction(min, max, origin);

                    let centerPcnt = offsetFrac*100;

                    let upscale = 100/(axisLength+margin);
                    let inputPos = MATH.clamp((-centerPcnt + pointerPcnt)/upscale, min, max);

                    let inputFrac = (MATH.calcFraction(min, max, inputPos) - offsetFrac) * 100;

                    let invert = options[i].invert;
                    if (invert === true) {
                     //   inputFrac = 100-inputFrac;
                        statusMap['AXIS_'+axis] = 1-inputPos;
                    } else {
                        statusMap['AXIS_'+axis] = inputPos;
                    }

                    if (axis === 'X') {
                        posX = inputFrac
                    }

                    if (axis === 'Y') {
                        posY = inputFrac
                    }

                }

                translateElement3DPercent(inputElement, posX, posY, 0);
            }

        }

        let hasKeyState = false;
        let hadKeyState = false;

        function updateKeyState() {
            let posX = 0;
            let posY = 0;

            hadKeyState = hasKeyState;
            hasKeyState = false;

            for (let i = 0;i<options.length;i++) {
                let axis = options[i].axis
                //  axisPosFunctions[axis](e);
                let keys = options[i].keys;
                let min =  options[i].min;
                let max =  options[i].max;
                let origin = options[i].origin;

                let offsetFrac = MATH.calcFraction(min, max, origin);


                let keySum = (keyToValue(keys.add) - keyToValue(keys.sub))

                    if (keySum !== 0) {
                        hasKeyState = true;
                    }

                let inputPos = MATH.clamp(keyToValue(keys.add) - keyToValue(keys.sub), min, max);

                let inputFrac = (MATH.calcFraction(min, max, inputPos) - offsetFrac) * 100;

                let invert = options[i].invert;
                if (invert === true) {
                    //   inputFrac = 100-inputFrac;
                    statusMap['AXIS_'+axis] += (1-inputPos) * getFrame().tpf*3;
                } else {
                    statusMap['AXIS_'+axis] += inputPos * getFrame().tpf*3;
                }

                if (axis === 'X') {
                    posX = inputFrac
                }

                if (axis === 'Y') {
                    posY = inputFrac
                }

            }

            if (hasKeyState) {
                translateElement3DPercent(inputElement, posX, posY, 0);
            } else if (hadKeyState) {
                pressEnd();
            }
        }

        function activateDragSurface(surfaceElem, inputElem, sMap, opts) {
            surfaceElement = surfaceElem;
            inputElement = inputElem;
            statusMap = sMap;
            options = opts

            addPressStartFunction(surfaceElement, pressStart)
            addMouseMoveFunction(surfaceElement, pointerMove)
            addPressEndFunction(surfaceElement, pressEnd)
        }

        this.call = {
            activateDragSurface:activateDragSurface,
            updateKeyState:updateKeyState
        }
    }
}

export { InputDragPointer }