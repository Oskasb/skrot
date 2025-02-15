import {
    addMouseMoveFunction,
    addPressEndFunction,
    addPressStartFunction,
    pointerEventToMoveX,
    pointerEventToMoveY,
    pointerEventToPercentX,
    pointerEventToPercentY,
    registerPressStart,
    translateElement3DPercent
} from "../DomUtils.js";
import {getFrame} from "../../../utils/DataUtils.js";
import {MATH} from "../../../MATH.js";
import {keyToValue} from "../../input/KeyboardState.js";
import {Vector3} from "../../../../../../libs/three/Three.Core.js";


let axisPosFunctions = {}
axisPosFunctions['X'] = pointerEventToMoveX;
axisPosFunctions['Y'] = pointerEventToMoveY;

class InputDragPointer {
    constructor() {

        let surfaceElement = null;
        let inputElement = null;
        let statusMap = null;
        let options = null;
        let pressActive = false;
        let pressStartTime = 0;
        let isDoubbleTap = false;

        let pressOrigin = {};
        const pressMoveSum= {X:null, Y:null};
        const keyMove = {X:0, Y:0};

        function pressStart(e) {
            registerPressStart(e);
            pressActive = true;

            let now = getFrame().systemTime;

            if (now - pressStartTime < 0.25) {
                isDoubbleTap = true;
            } else {
                isDoubbleTap = false;
                pointerMove(e, true)
            }

            pressStartTime = now;

        }

        function pressEnd() {
            pressActive = false;

            let now = getFrame().systemTime;
            let posX = 0;
            let posY = 0;

            for (let i = 0;i<options.length;i++) {

                let axis = options[i].axis;

                if (axis === 'PRESS') {
                    statusMap[axis] = 0;
                    continue;
                }

                if (now - pressStartTime < 0.25 || options[i].autoZero === true) {

                    /*
                    if (options[i].additive === true) {

                        if (isDoubbleTap === true) {
                            pressEndMove[axis] = options[i].origin;
                        } else {
                            pressEndMove[axis] = pressMoveSum[axis];
                            console.log("End Press store state", pressEndMove[axis])
                            continue;
                        }

                    } else {

                    }

                     */

                    statusMap['AXIS_'+axis] = options[i].origin;
                    pressMoveSum[axis] = null;


                    let min =  options[i].min;
                    let max =  options[i].max;
                    let origin = options[i].origin;
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

                    translateElement3DPercent(inputElement, posX, posY, 0);

                }

            }

        }

        function pointerMove(e, setOrigin) {
            if (pressActive) {

                let posX = 0;
                let posY = 0;

                for (let i = 0;i<options.length;i++) {
                    let axis = options[i].axis

                    let min =  options[i].min;
                    let max =  options[i].max;
                    let origin = options[i].origin;

                    if (axis === 'PRESS') {
                        statusMap[axis] = 1;
                    } else {

                        let axisLength = max - min;
                        let margin = options[i].margin * axisLength;

                        let offsetFrac = MATH.calcFraction(min, max, origin);
                        let centerPcnt = offsetFrac*100;
                        if (setOrigin === true) {
                            //    pressOrigin[axis] = pointerPcnt
                            if (options[i].additive === true) {
                                //    pressMoveSum[axis] = pressEndMove[axis];
                                //    console.log("Start Press stored state", pressMoveSum[axis] || centerPcnt)

                                if (pressMoveSum[axis] === null) {
                                    pressMoveSum[axis] = centerPcnt
                                }


                            } else {
                                //        console.log("Start Press clear state", options)
                                pressMoveSum[axis] = centerPcnt;
                            }

                        }

                        pressMoveSum[axis] = centerPcnt + axisPosFunctions[axis](e);
                        let pointerPcnt = pressMoveSum[axis];
                        //    pointerPcnt = pressOrigin[axis]

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
                        translateElement3DPercent(inputElement, posX, posY, 0);
                    }

                }


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

                let keyAdd = null;
                let keySub = null;

                if (options[i].keys) {
                    let keys = options[i].keys;
                    keyAdd = keys.add;
                    keySub = keys.sub;
                }






                if (typeof (statusMap[axis+'_add']) === 'string') {
                    keyAdd = statusMap[axis+'_add']
                }

                if (typeof (statusMap[axis+'_sub']) === 'string') {
                    keySub = statusMap[axis+'_sub']
                }

                let min =  options[i].min;
                let max =  options[i].max;
                let origin = options[i].origin;
                let autoZero = options[i].autoZero;

                let offsetFrac = MATH.calcFraction(min, max, origin);

                let keySum = keyToValue(keyAdd)

                    if (typeof (keySub) === 'string') {
                        keySum -=keyToValue(keySub)
                    }

                    if (keySum !== 0) {
                        hasKeyState = true;

                        if (axis === 'PRESS') {
                            statusMap[axis] = keySum;
                            continue;
                        }

                        keyMove[axis] += keySum*getFrame().tpf

                        let inputPos = MATH.clamp(keyMove[axis], min, max);


                        let inputFrac = (MATH.calcFraction(min, max, inputPos) - offsetFrac) * 100;

                        statusMap['AXIS_'+axis] = inputPos // * getFrame().tpf*3;

                        let invert = options[i].invert;
                        if (invert === true) {
                            inputFrac = 100 - inputFrac;
                        }

                        if (axis === 'X') {
                            posX = inputFrac
                        }

                        if (axis === 'Y') {
                            posY = inputFrac
                        }

                    } else {
                        if (autoZero === true) {
                            keyMove[axis] = 0;
                        }
                    }

                if (hasKeyState && axis !== 'PRESS') {
                    translateElement3DPercent(inputElement, posX, posY, 0);
                }

            }

            if (hasKeyState) {

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

        function activatePressSurface(surfaceElem, inputElem, sMap, opts) {
            surfaceElement = surfaceElem;
            inputElement = inputElem;
            statusMap = sMap;
            options = opts

            addPressStartFunction(surfaceElement, pressStart)
            addPressEndFunction(surfaceElement, pressEnd)
        }

        function getActive() {
            return pressActive;
        }

        function setActive(bool) {
            pressActive = bool;
        }

        this.call = {
            activateDragSurface:activateDragSurface,
            activatePressSurface:activatePressSurface,
            updateKeyState:updateKeyState,
            getActive:getActive,
            setActive:setActive
        }
    }
}

export { InputDragPointer }