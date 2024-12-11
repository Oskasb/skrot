import { TargetIndicator } from "../gui/game/TargetIndicator.js";
import { Vector3 } from "../../../../libs/three/math/Vector3.js";
let tempVec3 = new Vector3()
let tempVec3b = new Vector3()

class GameWorldPointer {
    constructor() {
        this.isActive = false;
        this.posVec = new THREE.Vector3()
        this.lastSelectedTile = null;
        this.indicatedSelections = [];
        this.selectionEvent = {
            isOpen:null,
            piece:null,
            value:false,
            longPress:0
        }

        let exitLongPress = function(pointer, selectionEvent) {
            this.exitLongPress(pointer, selectionEvent)
        }.bind(this)

        let updateGameWorldPointer = function(pointer, isFirstPressFrame) {
            this.updateWorldPointer(pointer, isFirstPressFrame)
        }.bind(this)


        this.call = {
            pointerExitLongPress:exitLongPress,
            pointerEnterLongPress:this.enterLongPress,
            indicateSelection:this.indicateSelection,
            updateGameWorldPointer:updateGameWorldPointer
        }
    }



    worldPointerFindPath(pointer) {
        let playerPiece = GameAPI.getMainCharPiece();
        let targetPos = null
        if (pointer.worldSpaceTarget && (pointer.worldSpaceTarget !== playerPiece)) {
            //    targetPos = pointer.worldSpaceTarget.getPos();
            playerPiece.movementPath.setPathTargetPiece(pointer.worldSpaceTarget)
        } else {
            if (this.lastSelectedTile) {
                targetPos = this.lastSelectedTile.getPos();
                playerPiece.movementPath.determineGridPathToPos(targetPos)
            }
        }

    }



    indicateSelection = function(bool, pointer, selection) {
        if (bool) {

            if (MATH.arrayContains(this.indicatedSelections, selection)) {
                return pointer.worldSpaceIndicator;
            }
            this.indicatedSelections.push(selection);
            selection.pieceInfoGui.activatePieceInfoGui()
            let indicator = pointer.worldSpaceIndicator;
            if (!indicator) {
                indicator = new TargetIndicator()
                pointer.worldSpaceIndicator = indicator;
                indicator.indicateGamePiece(selection, 'effect_character_indicator', 1, 3, -1.5,1.2, 0, 4);
            }
            return indicator
        } else {
            MATH.splice(this.indicatedSelections, selection);
            pointer.worldSpaceIndicator.removeTargetIndicatorFromPiece(selection);
            pointer.worldSpaceIndicator.hideIndicatorFx();
            selection.pieceInfoGui.deactivatePieceInfoGui()
        }
    }

    enterLongPress(pointer, selectionEvent, calls) {
    //    console.log("Long Press: ", pointer, pointer.worldSpaceTarget)
        selectionEvent.longPress = pointer.call.getLongPressProgress();
        selectionEvent.piece = pointer.worldSpaceTarget;
        if (pointer.worldSpaceTarget === null) {
        //    console.log("Long press nothing")
        //    pointer.isMovementInput = true;
        //    calls.updateGameWorldPointer(pointer)
        } else {
        //    console.log("Long press", pointer.worldSpaceTarget)
            selectionEvent.value = true;
            selectionEvent.isOpen = pointer.worldSpaceTarget;
            evt.dispatch(ENUMS.Event.MAIN_CHAR_OPEN_TARGET,  selectionEvent);
        }

    }

    exitLongPress(pointer, selectionEvent) {
        if (selectionEvent.isOpen !== null) {
            console.log("Release Long Press: ", pointer.inputIndex, pointer.isLongPress, pointer.longPressProgress, pointer.worldSpaceTarget)
            selectionEvent.piece = selectionEvent.isOpen;
            selectionEvent.value = false;
            selectionEvent.isOpen = null;
            evt.dispatch(ENUMS.Event.MAIN_CHAR_OPEN_TARGET,  selectionEvent);
        }
    }
    worldPointerReleased = function(pointer) {
        ThreeAPI.getCameraCursor().call.activePointerUpdate(pointer, false, true);
    }
    updateWorldPointer = function(pointer, isFirstPressFrame) {
        ThreeAPI.getCameraCursor().call.activePointerUpdate(pointer, isFirstPressFrame);
    }

    worldPointerDeactivate(pointer) {
        pointer.isWorldActive = false;
    }

}

export { GameWorldPointer }