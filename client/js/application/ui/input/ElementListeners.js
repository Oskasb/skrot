import {InputActionListener} from './InputActionListener.js';


let progInputState;
class ElementListeners {

    constructor(P_STATE, gameScreen) {
        this.gameScreen = gameScreen;
        this.POINTER_STATE = P_STATE;
        this.actionListener = new InputActionListener();
        this.tempVec = new THREE.Vector3();
        this.x = 0;
        this.y = 0;
        this.dx = 0;
        this.dy = 0;
        this.wheelDelta = 0;
        this.inputUpdateCallbacks = [];
        this.setupInputListener(this);

        let updateLongPressProgress = function() {
            if (Math.abs(progInputState.dragDistance[0]) + Math.abs(progInputState.dragDistance[1]) < 50) {
                let lpProg = MATH.calcFraction(0, progInputState.longPressTime, GuiAPI.getUiSystemTime() - progInputState.pressStartTime)
                progInputState.longPressProgress = MATH.clamp(lpProg, 0, 1)
            //    console.log(progInputState.longPressProgress)
            } else {
            //    console.log("Cancel Long Press due to drag distance")
                progInputState.longPressProgress = 0
                ThreeAPI.unregisterPostrenderCallback(updateLongPressProgress)
            }
        }



        this.call = {
            updateLongPressProgress:updateLongPressProgress
        }

    }


    setupInputListener = function(_this) {
        let touch;
        let callInputUpdate = function(pState) {
            for (let i = 0; i < _this.inputUpdateCallbacks.length; i++) {
                _this.inputUpdateCallbacks[i](pState);
            }
        };

        this.actionListener.setupElementInputListener(this.gameScreen.getElement(), callInputUpdate, this.POINTER_STATE);

        let passive = {passive: false}

        if (!window.isMobile) {



            this.gameScreen.getElement().addEventListener('mousemove', function (e) {
                e.returnValue = false;
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                _this.x = (e.pageX);
                _this.y = (e.pageY);
                _this.dx = 2 * ((_this.x) - _this.gameScreen.getWidth() / 2) / _this.gameScreen.getWidth();
                _this.dy = 2 * ((_this.y) - _this.gameScreen.getHeight() / 2) / _this.gameScreen.getHeight();
                callInputUpdate(_this.POINTER_STATE.touches[10]);
            }, passive);

            this.gameScreen.getElement().addEventListener('mouseout', function (e) {
                e.returnValue = false;
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                _this.dx = 0;
                _this.dy = 0;
                callInputUpdate(_this.POINTER_STATE.touches[10]);
            }, passive);

            let zoomTimeout;

            this.gameScreen.getElement().addEventListener('mousewheel', function (e) {
                e.returnValue = false;
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                if (zoomTimeout) return;
                _this.wheelDelta = e.wheelDelta / 1200;
                setTimeout(function () {
                    zoomTimeout = false;
                }, 100);
                zoomTimeout = true;
                _this.POINTER_STATE.touches[10].wheelDelta = _this.wheelDelta;
                callInputUpdate(_this.POINTER_STATE.touches[10]);
            }, passive);
        }

        this.gameScreen.getElement().addEventListener('touchstart', function(e) {
            e.returnValue = false;
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            let touches = e.changedTouches;
            for (let i = 0; i < touches.length; i++) {
                let touch = touches[i]
                _this.x = touch.pageX;
                _this.y = touch.pageY;
                _this.dx = 0;
                _this.dy = 0;
                _this.POINTER_STATE.touches[touch.identifier].lastAction[0] = 0;
                _this.POINTER_STATE.touches[touch.identifier].action[0] = 1;

                callInputUpdate(_this.POINTER_STATE.touches[touch.identifier]);
            }

            if (touches.length === 0) {
                alert('changedTouches not supported')
            }

        }, passive);

        this.gameScreen.getElement().addEventListener('touchmove', function(e) {
            e.returnValue = false;
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            let touches = e.changedTouches;
            for (let i = 0; i < touches.length; i++) {
                let touch = touches[i]
            //    console.log(touch.identifier)
                _this.x = touch.pageX;
                _this.y = touch.pageY;
                _this.dx = 2 * ((_this.x) - _this.gameScreen.getWidth() / 2) / _this.gameScreen.getWidth();
                _this.dy = 2 * ((_this.y) - _this.gameScreen.getHeight() / 2) / _this.gameScreen.getHeight();

                _this.POINTER_STATE.touches[touch.identifier].action[0] = 1;
                callInputUpdate(_this.POINTER_STATE.touches[touch.identifier]);
            }
        }, passive);

        let touchend = function(e) {
            e.returnValue = false;
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            let touches = e.changedTouches
            for (let i = 0; i < touches.length; i++) {
                let touch = touches[i]
                _this.x = touch.pageX;
                _this.y = touch.pageY;
                _this.dx = 2 * ((_this.x) - _this.gameScreen.getWidth() / 2) / _this.gameScreen.getWidth();
                _this.dy = 2 * ((_this.y) - _this.gameScreen.getHeight() / 2) / _this.gameScreen.getHeight();
                _this.POINTER_STATE.touches[touch.identifier].lastAction[0] = 1;
                _this.POINTER_STATE.touches[touch.identifier].action[0] = 0;

                callInputUpdate(_this.POINTER_STATE.touches[touch.identifier]);
            }

            if (touches.length === 0) {
                alert('changedTouches not supported')
            }


        };


        this.gameScreen.getElement().addEventListener('touchend', touchend, passive);
        this.gameScreen.getElement().addEventListener('touchcancel', touchend, passive);

        window.addEventListener('resize', function() {
            callInputUpdate(_this.POINTER_STATE.touches[10]);
        });
    };

    sampleMouseState = function(inputState) {

        progInputState = inputState;

        if (inputState.action[0]) {
            inputState.pressFrames++;

            if (inputState.pressFrames === 1) {
/*
                    inputState.startDrag[0] = inputState.x;
                    inputState.startDrag[1] = inputState.y;
                    inputState.dragDistance[0] = 0;
                    inputState.dragDistance[1] = 0;
*/
                inputState.longPressProgress = 0;
                inputState.pressStartTime = GuiAPI.getUiSystemTime()-0.0001;
                GuiAPI.addGuiUpdateCallback(this.call.updateLongPressProgress)
            } else if (inputState.longPressProgress === 0) {
            //    console.log("Why release here?")
            //    GuiAPI.removeGuiUpdateCallback(this.call.updateLongPressProgress)
            //    inputState.longPressProgress = 0;
            }

            if (inputState.pressFrames > 1) {
                inputState.dragDistance[0] = inputState.x - inputState.startDrag[0]
                inputState.dragDistance[1] = inputState.y - inputState.startDrag[1]
            }

        } else {
            if (inputState.longPressProgress) {
                GuiAPI.removeGuiUpdateCallback(this.call.updateLongPressProgress)
            }

            inputState.pressFrames = 0;
        }


        inputState.x = this.x;
        inputState.y = this.y;



        let width = this.gameScreen.getWidth();
        let height = this.gameScreen.getHeight();
        this.tempVec.x = ((this.x) - width / 2) / width;
        this.tempVec.y = -((this.y) - height / 2) / height;
    //    GameScreen.fitView(this.tempVec);
        inputState.posX = this.tempVec.x * 0.83;
        inputState.posY = this.tempVec.y * 0.83;
        inputState.dx = this.dx;
        inputState.dy = this.dy;
        inputState.wheelDelta = this.wheelDelta;

        this.wheelDelta = 0;
        this.dx = 0;
        this.dy = 0;
    };

    attachUpdateCallback = function(callback) {
        this.inputUpdateCallbacks.push(callback);
    }

}

export { ElementListeners }