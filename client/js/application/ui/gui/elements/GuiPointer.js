import { GuiPointerWidget} from "../widgets/GuiPointerWidget.js";
import { Object3D } from "../../../../../libs/three/core/Object3D.js";
let tempObj = new Object3D();
class GuiPointer {
    constructor(inputState) {
            this.intersects = false;
            this.dragDistance = inputState.dragDistance;
            this.pos = new THREE.Vector3(0, 0, 0);
            this.scale = new THREE.Vector3(1, 1, 1);
            this.interactiveElement = null;
            this.inputState = inputState;
            this.inputIndex = inputState.index;
            this.worldSpaceIndicator = null;
            this.worldSpaceTarget = null;
            this.isSeeking = false;
            this.isHovering = false;
            this.isLongPress = false;
            this.longPressProgress = 0;
            this.isMovementInput = false;
            this.guiPointerWidget = new GuiPointerWidget(this.inputIndex);
            this.setupPointerElement( this.configId);
            this.setInputIndex(this.inputIndex);

            this.onPointerUpdateCallbacks = [];

            let getLongPressProgress = function() {
                return inputState.longPressProgress;
            }

            this.call = {
                getLongPressProgress:getLongPressProgress
            }

        };

        setupPointerElement = function(configId) {

        let addWidgetCb = function(guiPointerWidget) {
            guiPointerWidget.setElementPosition(this.pos);
        //    guiPointerWidget.guiWidget.printWidgetText(''+this.inputIndex);
            this.deactivatePointerWidget();
        }.bind(this);

        this.guiPointerWidget.initPointerWidget(addWidgetCb)

    };

        setPointerInteractiveElement = function(interactiveElement) {
         //   GuiAPI.printDebugText("SET POINTER ELEM");
            this.interactiveElement = interactiveElement;
        };

        getPointerInteractiveElement = function() {
            return this.interactiveElement;
        };

        pointerPressElementStart = function(interactiveElem) {
            GuiAPI.unregisterWorldSpacePointer(this);
            this.guiPointerWidget.showPointerWidgetSeeking();
                this.setPointerInteractiveElement(interactiveElem);
             //   GuiAPI.printDebugText("ELEMENT POINTER - STATE: "+ENUMS.getKey('ElementState', interactiveElem.state));


        };

        pointerPressWorldStart = function() {
            this.guiPointerWidget.showPointerWorldSeeking();
            GuiAPI.registerWorldSpacePointer(this);
        };

        setIsSeeking = function(bool) {

            if (this.isSeeking !== bool){

                if (bool) {
               //     GuiAPI.printDebugText("WORLD POINTER");

                }

            } else {
                if (bool) {
                    this.guiPointerWidget.showPointerWidgetSeeking();
                }
            }

            this.isSeeking = bool;
        };

        getIsSeeking = function() {
            return this.isSeeking;
        };

        setInputIndex = function(inputIndex) {
        //    this.guiPointerWidget.guiWidget.printWidgetText(''+this.inputIndex);
            this.inputIndex = inputIndex;
        };

        getInputIndex = function() {
            return this.inputIndex;

        };

    setLongPressProgress(progress) {
        this.longPressProgress = progress;
        tempObj.quaternion.set(0, 0, 0, 1);
        tempObj.rotateZ(MATH.HALF_PI * progress);

        this.guiPointerWidget.setElementQuaternion( tempObj.quaternion);

        if (progress === 1) {
            this.guiPointerWidget.showPointerWidgetLongPressOn();
        } else {
            this.guiPointerWidget.showPointerWorldSeeking();
        }
    }

        setPointerPosition = function(vec3) {
            this.pos.copy(vec3);
            this.guiPointerWidget.setElementPosition(this.pos);
            this.notifyPointerUpdate()
        };

        setPointerHovering(bool) {
            if (bool) {
                this.guiPointerWidget.showPointerWidgetHovering();
            }
            this.isHovering = bool;
        }

        getPointerHovering() {
            return this.isHovering;
        }

    getPointerHasDragState() {
            return (Math.abs(this.dragDistance[0]) + Math.abs(this.dragDistance[1]))
    }

        deactivatePointerWidget() {
            this.guiPointerWidget.showPointerWidgetReleased();
        }


        notifyPointerUpdate() {
            MATH.callAll( this.onPointerUpdateCallbacks, this)
        }

        releasePointer = function() {
        //    GuiAPI.printDebugText("RELEASE")
            this.isSeeking = false;
            this.intersects = false;
            this.interactiveElement = null;

            GuiAPI.releaseWorldSpacePointer(this);
            this.deactivatePointerWidget();
            this.notifyPointerUpdate()
        };


    }

    export { GuiPointer }
