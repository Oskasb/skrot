import { Vector3 } from "../../../../../libs/three/math/Vector3.js";
import {ENUMS} from "../../../ENUMS.js";
import {getSetting} from "../../../utils/StatusUtils.js";
import {applyZoomDelta} from "../../../../3d/camera/CameraFunctions.js";

let tempVec3 = new Vector3();

class InputSystem {
    constructor() {

        this.uiSysId;
        this.surfaceElements = [];
        this.setupListener();
    };

    initInputSystem = function(callback) {

        let _this = this;

        let onInputSetting = function(src, data) {
            _this.uiSysId = src;
            GuiAPI.addUiSystem(src, data.config["sprite_atlas"],  data.config["mesh_asset"],   data.config["pool_size"], data.config["render_order"]);
            callback();
        };

        let backplates = function(src, data) {
            GuiAPI.addUiSystem(src, data.config["sprite_atlas"],  data.config["mesh_asset"],   data.config["pool_size"], data.config["render_order"]);
            GuiAPI.getGuiSettings().initGuiSettings(["UI_ELEMENTS_MAIN"], onInputSetting);
        };

        GuiAPI.getGuiSettings().initGuiSettings(["UI_ELEMENTS_BACK"], backplates);



    };


    getIntersectingElement = function(x, y, inputIndex) {
        let element;
        for (let i = 0; i < this.surfaceElements.length; i++) {
            let surface = this.surfaceElements[i];
            let intersects = surface.testIntersection(x, y);
            let interactiveElem = surface.getInteractiveElement();
            if (intersects) {
                element = interactiveElem;
            } else {
                interactiveElem.notifyInputOutside(inputIndex)
            }
        }
        return element;
    };



    updateInteractiveElements = function(pointer, x, y) {
        let inputIndex = pointer.inputIndex;
        let interactiveElem;
        if (pointer.getIsSeeking()) {

          //  if (pointer.getPointerInteractiveElement()) {
          //      pointer.updatePointerInteractiveElement();
          //      return;
          //  }

        //    interactiveElem = this.getIntersectingElement(x, y, inputIndex);

            if (interactiveElem) {
        //        pointer.pointerPressElementStart(interactiveElem);
        //        interactiveElem.notifyPointerPress(inputIndex);
            } else {
        //        pointer.setIsSeeking(false);
            }

        } else {
            interactiveElem = this.getIntersectingElement(x, y, inputIndex);
            if (interactiveElem) {
                interactiveElem.notifyHoverStateOn(inputIndex);
            }
        }

    };


    setupListener = function() {

        let _this = this;

        let sampleInput = function(inputIndex, pointerState) {
            let guiPointer = pointerState.guiPointer;

            if (inputIndex !== guiPointer.inputIndex) {
                console.log("bad")
            }

            let tempVec = tempVec3;
            tempVec.x = pointerState.posX ;
            tempVec.y = pointerState.posY ;
            tempVec.z = 0;

            GameScreen.fitView(tempVec);

            guiPointer.setPointerPosition(tempVec)

            let interactiveElem = _this.getIntersectingElement(tempVec.x, tempVec.y, inputIndex);
            let currentPressedElement = guiPointer.getPointerInteractiveElement();

            // check if button is down
            if (pointerState.action[0]) {
                // check is first frame
                if (pointerState.pressFrames === 1) {

                    pointerState.startDrag[0] = pointerState.x;
                    pointerState.startDrag[1] = pointerState.y;
                    pointerState.dragDistance[0] = 0;
                    pointerState.dragDistance[1] = 0;
                    
                    guiPointer.setIsSeeking(true);
                    if (!interactiveElem) {
                        // handle world pointer here
                        // guiPointer.setPointerHovering(true)
                        guiPointer.pointerPressWorldStart();
                    } else {
                        // pressing and interactive element;
                        interactiveElem.notifyPointerPress(inputIndex, guiPointer);
                    //    guiPointer.setPointerInteractiveElement(interactiveElem);
                        guiPointer.pointerPressElementStart(interactiveElem);
                        // no more state handling this frame...
                        return;
                    }
                } else {
                    // handle mouse and touches that move around while pressed

                    if (!interactiveElem) {
                        if (currentPressedElement) {
                            // enter hovering pointer state if pointer departs element while pressed
                            currentPressedElement.notifyInputOutside(inputIndex);
                            guiPointer.setPointerInteractiveElement(null);
                            guiPointer.setPointerHovering(true)
                        }
                    } else {
                        interactiveElem.notifyHoverStateOn(inputIndex);
                    }
                }

            } else {

                // check world space pointer here for activating...



                    if (interactiveElem === currentPressedElement) {
                    //    GuiAPI.printDebugText("RELEASE POINTER ON ACTIVE ELEMENT");

                        interactiveElem.onPressActivate(inputIndex);
                    }



                //    GuiAPI.printDebugText("RELEASE POINTER ON WORLD"+inputIndex);
                if (guiPointer.getIsSeeking()) {
                    if (interactiveElem) {
                        GuiAPI.unregisterWorldSpacePointer(guiPointer)
                    }

                    guiPointer.releasePointer();
                    guiPointer.setPointerHovering(true)
                }

                if (interactiveElem) {
                    interactiveElem.notifyHoverStateOn(inputIndex);
                } else {
                        let wheelDelta = guiPointer.inputState.wheelDelta;
                        if (wheelDelta !== 0) {
                            applyZoomDelta(wheelDelta);
                        }
                }

            }
        //    _this.updateInteractiveElements( guiPointer, pointerState.posX, pointerState.posY)


        };

        GuiAPI.addInputUpdateCallback(sampleInput);
    };

    registerInteractiveSurfaceElement = function(surfaceElement) {
        //    console.log("registerInteractiveSurfaceElement: ", surfaceElement)
        if (this.surfaceElements.indexOf(surfaceElement) === -1) {
            this.surfaceElements.push(surfaceElement);
        } else {
            console.log("Element already registered")
        }
    };

    unregisterInteractiveSurfaceElement = function(surfaceElement) {
        MATH.splice(this.surfaceElements, surfaceElement);
    };

}

export { InputSystem }