import { GuiWidget} from "../elements/GuiWidget.js";
import {isPressed} from "../../input/KeyboardState.js";
import {getPlayerStatus, getSetting} from "../../../utils/StatusUtils.js";



function sampleAxisSetting(options, axis, scale) {
    if (options.settings) {
        if (options.settings.axis) {
            let axisKey = options.settings.axis[axis];
            if (ENUMS.Settings[axisKey]) {
                let settingValue = getSetting(ENUMS.Settings[axisKey]);
                return settingValue * scale;
            }
        }
    }
    return 0;
}

let applyPositionOffset = function(guiAxisSlider) {
    let options = guiAxisSlider.options
    guiAxisSlider.pos.x = options.offsets[0] + (guiAxisSlider.offset.x*0.5) +sampleAxisSetting(options, 0, 0.001);
    guiAxisSlider.pos.y = options.offsets[1] + guiAxisSlider.offset.y       +sampleAxisSetting(options, 1, 0.001);

    guiAxisSlider.guiWidget.offsetWidgetPosition(guiAxisSlider.pos);
};

let onPressStart = function(guiAxisSlider) {
    for (let i = 0; i < guiAxisSlider.onActivateCallbacks.length; i++) {
        guiAxisSlider.onActivateCallbacks[i](1);
    }
    notifyInputUpdated(guiAxisSlider)
};

let onPressActivate = function(guiAxisSlider) {
//    console.log("SLider press activate", guiAxisSlider);
    for (let i = 0; i < guiAxisSlider.onActivateCallbacks.length; i++) {
        guiAxisSlider.onActivateCallbacks[i](2);
    }
    notifyInputUpdated(guiAxisSlider)
};

let onSurfaceRelease = function(guiAxisSlider) {
    guiAxisSlider.activeGuiPointer = null;
    guiAxisSlider.interactiveSurface = null;
    guiAxisSlider.pressActive = false;
    guiAxisSlider.inputIndex = -1;
    guiAxisSlider.releaseTime = 0;
}

let onInputUpdated = function(guiAxisSlider, pointerState) {
    //    console.log("handleSliderInputUpdated", input, pointerState)
    let options = guiAxisSlider.options
    guiAxisSlider.pressActive  = pointerState.action[0] // GuiAPI.readInputBufferValue(input, pointerState, ENUMS.InputState.ACTION_0);
    guiAxisSlider.offset.x = pointerState.dragDistance[0]*0.00185 * Math.abs(options.axis[0]);
    guiAxisSlider.offset.y = -pointerState.dragDistance[1]*0.00185 * Math.abs(options.axis[1]);
    guiAxisSlider.offset.x = MATH.clamp(guiAxisSlider.offset.x, -options.range[0], options.range[0])
    guiAxisSlider.offset.y = MATH.clamp(guiAxisSlider.offset.y, -options.range[1], options.range[1])

};

let notifyInputUpdated = function(guiAxisSlider) {
    let options = guiAxisSlider.options
    guiAxisSlider.applyValues[0] = MATH.clamp(options.axis[0] * guiAxisSlider.offset.x *1.2 / options.range[0], -1, 1);
    guiAxisSlider.applyValues[1] = MATH.clamp(options.axis[1] * guiAxisSlider.offset.y *1.2 / options.range[1], -1, 1);
    for (let i = 0; i < guiAxisSlider.applyInputCallbacks.length; i++) {
        guiAxisSlider.applyInputCallbacks[i](guiAxisSlider.applyValues);
    }
};

let onFrameUpdate = function(guiAxisSlider, tpf, time) {

    if (!guiAxisSlider.pressActive) {
        let options = guiAxisSlider.options

        if (guiAxisSlider.releaseTime === 0) {
            onPressActivate(guiAxisSlider)
        }

        guiAxisSlider.releaseTime += tpf;

        let releaseX = guiAxisSlider.options.release[0];
        let releaseY = guiAxisSlider.options.release[1]

        if (releaseX || releaseY) {
            let releaseProgress = guiAxisSlider.releaseTime-guiAxisSlider.releaseDuration;
            let releaseFraction = 1 - MATH.calcFraction(-guiAxisSlider.releaseDuration, guiAxisSlider.releaseDuration, releaseProgress)
            let releaseFactor = MATH.curveSqrt(releaseFraction);

            if (guiAxisSlider.offset.lengthSq() !== 0) {
                if (guiAxisSlider.offset.lengthSq() < 0.0001) {
                    guiAxisSlider.offset.set(0, 0, 0);
                } else {
                    if (releaseX) {
                        guiAxisSlider.offset.x *= releaseX * releaseFactor;
                    }
                    if (releaseY) {
                        guiAxisSlider.offset.y *= releaseY * releaseFactor;
                    }
                }
                notifyInputUpdated(guiAxisSlider)
            }
        } else {

        }

    } else {
        notifyInputUpdated(guiAxisSlider)
    }

    applyPositionOffset(guiAxisSlider);

};

let applyKeyMapToAxisSlider = function(guiAxisSlider, keyMap) {
    let options = guiAxisSlider.options
    let pressActive = false;
    let inputChanged = false;
    let targetX = 0;
    let targetY = 0;
    for (let i= 0; i < keyMap.length; i++) {
        let keyAxis = keyMap[i];
        let pressed = isPressed(keyAxis.key);
        if (pressed !== keyAxis.pressed) {
            keyAxis.pressed = pressed;
            inputChanged = true;
        }

        if (pressed === true) {
            pressActive = true;

            if (keyAxis.axisIndex === 0) {
                targetX += keyAxis.value * Math.abs(options.axis[0]) * 0.1;
            } else {
                targetY -= keyAxis.value * Math.abs(options.axis[1]) * 0.1;
            }
        }
    }


    if (inputChanged === true) {
        if (guiAxisSlider.pressActive === false) {
            guiAxisSlider.inputIndex = 0;
            onPressStart(guiAxisSlider)
        }
    guiAxisSlider.offset.x = MATH.clamp(targetX, -options.range[0], options.range[0])
    guiAxisSlider.offset.y = MATH.clamp(targetY, -options.range[1], options.range[1])

        if (pressActive === false) {
            onSurfaceRelease(guiAxisSlider)
        }
        guiAxisSlider.pressActive = pressActive;
    }
}

class GuiAxisSlider {
    constructor(options) {

        this.options = {
            "anchor": "stick_bottom_right",
            "icon": "directional_arrows",
            "axis": [1, 1],
            // "axis_keys":[["a", "d"],["w", "s"]]
            "release": [1, 1],
            "range": [0.08, 0.08],
            "offsets": [0, 0]
        };
        for (let key in options) {
            this.options[key] = options[key];
        }

        let axisKeys = null;

        let keyMap = [];

        if (this.options['axis_keys']) {
            axisKeys = this.options['axis_keys'];

            for (let i = 0; i < axisKeys.length; i++) {
                for (let j = 0; j < axisKeys[i].length; j++) {
                    let keyAxis = {key: axisKeys[i][j], axisIndex:i, value: -1 + j*2, pressed:false}
                    keyMap.push(keyAxis);
                }
            }

        }

        this.pos = new THREE.Vector3();
        this.origin = new THREE.Vector3();
        this.offset = new THREE.Vector3();



        this.applyValues = [];

        this.releaseTime = 0;
        this.releaseDuration = 0.25;

        this.inputIndex = -1;
        this.pressActive = false;
        this.applyInputCallbacks = [];
        this.onActivateCallbacks = [];
        this.activeGuiPointer = null;

        let guiAxisSlider = this;

        let pressStart = function(index, guiPointer) {
            guiAxisSlider.activeGuiPointer = guiPointer;
            if (guiAxisSlider.inputIndex === -1) {
                guiAxisSlider.inputIndex = index;
                onPressStart(guiAxisSlider)
            }
        };

        let onActivate = function(index) {
            if ( guiAxisSlider.inputIndex === index) {
                onPressActivate(guiAxisSlider)
            }

        }

        let inputUpdate = function(index, pointerState) {
            if (guiAxisSlider.activeGuiPointer === pointerState.guiPointer) {
                if (pointerState.action[0]) {
                    onInputUpdated(guiAxisSlider, pointerState)
                } else {
                    onSurfaceRelease(guiAxisSlider)
                }
            }
        };



        let frameUpdate = function(tpf, time) {
            let keyInputActive = false;
            if (keyMap.length) {
                let inputActive = getPlayerStatus(ENUMS.PlayerStatus.CHAT_INPUT_ACTIVE)
                if (!inputActive) {
                    applyKeyMapToAxisSlider(guiAxisSlider, keyMap);
                }
            }
            onFrameUpdate(guiAxisSlider, tpf, time)
        };

        this.callbacks = {
            onPressStart:pressStart,
            onActivate:onActivate,
            onInputUpdate:inputUpdate,
            onFrameUpdate:frameUpdate
        }
    };

    initGuiWidget = function(widgetConfig, onReady) {
        let widgetRdy = function(widget) {
            widget.applyWidgetOptions(this.options)
            widget.getWidgetSurface().addOnPressStartCallback(this.callbacks.onPressStart);
            widget.getWidgetSurface().addOnActivateCallback(this.callbacks.onActivate);
            widget.enableWidgetInteraction();
            onReady(this)
        }.bind(this);
        this.guiWidget = new GuiWidget(widgetConfig);
        this.guiWidget.initGuiWidget(null, widgetRdy);
        GuiAPI.addInputUpdateCallback(this.callbacks.onInputUpdate);
        ThreeAPI.addPrerenderCallback(this.callbacks.onFrameUpdate);
    };

    addInputUpdateCallback = function(applyInputUpdate) {
        this.applyInputCallbacks.push(applyInputUpdate)
    };

    addOnActivateCallback = function(onActivateCB) {
        this.onActivateCallbacks.push(onActivateCB)
    };

    removeGuiWidget = function() {
        ThreeAPI.unregisterPrerenderCallback(this.callbacks.onFrameUpdate);
        GuiAPI.removeInputUpdateCallback(this.callbacks.onInputUpdate);
        MATH.emptyArray(this.applyInputCallbacks);
        MATH.emptyArray(this.onActivateCallbacks);
        this.guiWidget.recoverGuiWidget()
    };

}

export { GuiAxisSlider }