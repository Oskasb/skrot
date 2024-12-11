import {ElementListeners} from './ElementListeners.js';
import { GuiPointer} from "../gui/elements/GuiPointer.js";

class InputState {

    constructor (gameScreen) {
        this.POINTER_STATE = {};
        let index = 0;

        let pointerState = function(index) {
            this.index = index;
            this.x = 0;
            this.y = 0;
            this.dx = 0;
            this.dy = 0;
            this.wheelDelta = 0;
            this.startDrag = [0, 0];
            this.dragDistance = [0, 0];
            this.action = [0, 0];
            this.lastAction = [0, 0];
            this.pressFrames = 0;
            this.pressStartTime = 0;
            this.longPressTime = 0.35;
            this.longPressProgress = 0;
            this.guiPointer = new GuiPointer(this)
        };



        this.POINTER_STATE.touches = [];

        for (let i = 0; i < ENUMS.Numbers.TOUCHES_COUNT; i++) {

            this.POINTER_STATE.touches[i] = new pointerState(index)
            index++;
        }
        this.POINTER_STATE.mouse = new pointerState(index);

        this.POINTER_STATE.touches.push(this.POINTER_STATE.mouse);

        this.elementListeners = new ElementListeners(this.POINTER_STATE, gameScreen);
    }


    setupUpdateCallback = function(cb) {
        this.elementListeners.attachUpdateCallback(cb);
    };

    getPointerState = function() {
        return this.POINTER_STATE;
    };

    processDragState = function(inputState) {
        inputState.dragDistance[0] = inputState.x - inputState.startDrag[0];
        inputState.dragDistance[1] = inputState.y - inputState.startDrag[1];
    };

    updateInputState = function(inputState) {
        inputState.lastAction[0] = inputState.action[0];
        inputState.lastAction[1] = inputState.action[1];

        this.elementListeners.sampleMouseState(inputState);

        if (inputState.lastAction[0] !== inputState.action[0]) {

            if (inputState.action[0] + inputState.action[1]) {
                this.mouseButtonEmployed(inputState);
                //        evt.fire(evt.list().CURSOR_PRESS, this.inputState);
            } else {
                if (inputState.pressingButton) {
                    //            evt.fire(evt.list().CURSOR_RELEASE, this.inputState);
                }
            }
        }

        if (inputState.lastAction[1] !== inputState.action[1]) {
            if (inputState.action[1]) {
                inputState.pressingButton = 1;
            } else {
                if (inputState.pressingButton) {
                    inputState.pressingButton = 0;
                }
            }
        }

        if (inputState.action[0] + inputState.action[1]) {

        } else {
            inputState.dragDistance[0] = 0;
            inputState.dragDistance[1] = 0;
        }
    };

    mouseButtonEmployed = function(inputState) {

        if (inputState.action[0]) {
            this.handleLeftButtonPress(inputState);
        }
    };

    handleLeftButtonPress = function(inputState) {

        if (inputState.pressFrames === 0) {
            console.log(inputState.dragDistance)
            inputState.startDrag[0] = inputState.x;
            inputState.startDrag[1] = inputState.y;
        }

        inputState.pressingButton = 1;
    };

}

export { InputState }