import {Vector3} from "../../../libs/three/math/Vector3.js";
import * as CursorUtils from "./CursorUtils.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";
import {getTerrainBodyPointer, updateViewObstruction} from "../../application/utils/PhysicsUtils.js";
import {isDev} from "../../application/utils/DebugUtils.js";
import {getPlayerStatus, getSetting} from "../../application/utils/StatusUtils.js";
import {ENUMS} from "../../application/ENUMS.js";

let CAM_MODES = {
    CAM_AUTO:CAM_AUTO,
    CAM_ORBIT:CAM_ORBIT,
    CAM_FLIGHT:CAM_FLIGHT,
    CAM_EDIT:CAM_EDIT,
    CAM_MOVE:CAM_MOVE,
    CAM_SELECT:CAM_SELECT,
    CAM_POINT:CAM_POINT,
    CAM_ENCOUNTER:CAM_ENCOUNTER,
    CAM_SEQUENCER:CAM_SEQUENCER,
    CAM_GRID:CAM_MOVE,
    CAM_MENU:CAM_MENU
}

let CAM_POINTS = {
    CAM_AHEAD:CAM_AHEAD,
    CAM_SHOULDER:CAM_SHOULDER,
    CAM_TARGET:CAM_TARGET,
    CAM_HIGH:CAM_HIGH,
    CAM_PARTY:CAM_PARTY,
    CAM_SEQUENCER:CAM_SEQUENCER
}

let orbitObj = new Object3D();
let camObj = new Object3D();
let tempObj = new Object3D();
camObj.position.y = 1.5;
let lerpFactor = 0.1;
let obscureTestVec3 = new Vector3();
let tempVec = new Vector3();
let tempVec2 = new Vector3();
let tempVec3 = new Vector3();
let lookAtMod = new Vector3();
let lookAt = new Vector3();
let offsetPos = new Vector3();
let camTargetPos = new Vector3()
let cameraTime = 0;
let zoomDistance = 6;
let tpf = 0.02;
let pointerAction ;
let lookAroundPoint;
let cursorObj3d;
let camPosVec;
let camLookAtVec;
let dragToVec3;
let cameraCursor;
let pointerDragVector;
let modeActive;
let lookAtActive;
let lookFromActive;
let isFirstPressFrame;
let pointerReleased;
let selectedActor;
let pointerActive = false;
let lookAtControlKey;
let lookFromControlKey;
let pointerControlKey
let activePointer;
let tileSelector;
let isTileSelecting = false;

let camFollowSpeed = 10;
let camLookSpeed = 10;
let camZoom = 10;
let startDragX = 0;
let startDragY = 0;
let dragDeltaX = 0;
let dragDeltaY = 0;
let camDragFactor = 30;

function updateCamParams(camParams) {
    tpf = camParams.tpf;
    selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
    tileSelector = null;
    isTileSelecting = false;
    lookAroundPoint = camParams.cameraCursor.getLookAroundPoint();
    cursorObj3d = camParams.cameraCursor.getCursorObj3d();
    cameraCursor =  camParams.cameraCursor
    activePointer = cameraCursor.pointer;
    camPosVec = camParams.camPosVec;
    camLookAtVec = camParams.camLookAtVec;
    pointerDragVector = camParams.pointerDragVector;
    dragToVec3 = camParams.dragToVec3;


    isFirstPressFrame = cameraCursor.isFirstPressFrame;
    pointerReleased= cameraCursor.pointerReleased;

    if (isFirstPressFrame) {
        startDragX = pointerDragVector.x;
        startDragY = pointerDragVector.z;
        dragDeltaX = 0;
        dragDeltaY = 0;
    } else {
        dragDeltaX = pointerDragVector.x -startDragX;
        dragDeltaY = pointerDragVector.z -startDragY;
        startDragX = pointerDragVector.x;
        startDragY = pointerDragVector.z;
    }

    if (selectedActor) {
        let walkGrid = selectedActor.getGameWalkGrid();
        if (selectedActor.getStatus(ENUMS.ActorStatus.SELECTING_DESTINATION) === 1) {
            tileSelector = walkGrid.gridTileSelector;
            isTileSelecting = tileSelector.hasValue();
        }

        camFollowSpeed = selectedActor.getStatus(ENUMS.ActorStatus.CAMERA_FOLLOW_SPEED)
        camLookSpeed = selectedActor.getStatus(ENUMS.ActorStatus.CAMERA_LOOK_SPEED)
        camZoom= selectedActor.getStatus(ENUMS.ActorStatus.CAMERA_ZOOM)
        camDragFactor= selectedActor.getStatus(ENUMS.ActorStatus.CAM_DRAG_FACTOR)
    }

    zoomDistance = cameraCursor.getZoomDistance() * camZoom*0.1;

    pointerAction = statusActive(camParams, ENUMS.CameraStatus.POINTER_ACTION)
    pointerControlKey  = statusControlKey(camParams, ENUMS.CameraStatus.POINTER_ACTION)
    lookAtActive = statusActive(camParams, ENUMS.CameraStatus.LOOK_AT)
    lookAtControlKey = statusControlKey(camParams, ENUMS.CameraStatus.LOOK_AT)
    lookFromActive = statusActive(camParams, ENUMS.CameraStatus.LOOK_FROM)
    lookFromControlKey = statusControlKey(camParams, ENUMS.CameraStatus.LOOK_FROM)
   // console.log("Look From ", lookFromActive, lookFromControlKey);

    modeActive = statusActive(camParams, ENUMS.CameraStatus.CAMERA_MODE)

}

function applyPointerMove() {

    if (!selectedActor) {
        return;
    }

    let mode = selectedActor.getStatus(ENUMS.ActorStatus.TRAVEL_MODE)
    if (mode === ENUMS.TravelMode.TRAVEL_MODE_GRID || mode === ENUMS.TravelMode.TRAVEL_MODE_BATTLE) {

    } else {
        return;
    }

    let walkGrid = selectedActor.getGameWalkGrid();
    let distance = 0;
    tileSelector = walkGrid.gridTileSelector;


    if (isFirstPressFrame) {
        if (walkGrid.isActive) {
            walkGrid.deactivateWalkGrid()
            selectedActor.actorText.say("Close Grid")
            return;
        }
    }

    if (!walkGrid.isActive) {
        selectedActor.activateWalkGrid(1+ selectedActor.getStatus(ENUMS.ActorStatus.MOVEMENT_SPEED) * 4 )
        selectedActor.actorText.say("Grid Camera")
        let pointerTile = walkGrid.getTileByScreenPosition(activePointer.pos)
        if (pointerTile) {
            tileSelector.setPos(selectedActor.getSpatialPosition())
        }
    } else {
        if (pointerActive === false) {
            if (walkGrid.getActivePathTiles().length < 2) {
                if (tileSelector) {
                //    walkGrid.clearGridTilePath();
                    tileSelector.text.say("Clear Blocked")

                    let pointerTile = walkGrid.getTileByScreenPosition(activePointer.pos)
                    if (pointerTile) {
                        selectedActor.prepareTilePath(pointerTile.getPos())
                        tileSelector.setPos(selectedActor.getSpatialPosition())
                    } else {
                        walkGrid.deactivateWalkGrid()
                        return 0;
                    }
                }
            } else {
                walkGrid.cancelActivePath()
                return 0;
            }
        }
    }

    let pointerTile = walkGrid.getTileByScreenPosition(activePointer.pos)
    if (pointerTile) {
     //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:selectedActor.getSpatialPosition(), to:pointerTile.getPos(), color:'YELLOW'});
        //    console.log(activePointer.pos);
        tileSelector.moveToPos(pointerTile.getPos())
    }

    selectedActor.getSpatialPosition(cursorObj3d.position)

        let moveAction = selectedActor.getControl(ENUMS.Controls.CONTROL_MOVE_ACTION);

            if (moveAction === 2) {
                selectedActor.setControlKey(ENUMS.Controls.CONTROL_MOVE_ACTION, 1)
            }
            selectedActor.setControlKey(ENUMS.Controls.CONTROL_TILE_X, pointerDragVector.x * 0.02)
            selectedActor.setControlKey(ENUMS.Controls.CONTROL_TILE_Z, pointerDragVector.z * 0.02 +0.01)
            pointerActive = true;


    return tileSelector.extendedDistance;
}

function applyPointerRelease() {
    orbitObj.quaternion.set(0, 0, 0, 1);
    let walkGrid = selectedActor.getGameWalkGrid();
    if (walkGrid.getActivePathTiles().length < 2) {
        selectedActor.actorText.say("Path too short")
    //    walkGrid.clearGridTilePath();
    //    walkGrid.deactivateWalkGrid();
        tileSelector = walkGrid.gridTileSelector;

        if (tileSelector) {
            selectedActor.getSpatialPosition(tileSelector.getPos())
            tileSelector.moveAlongX(0);
            tileSelector.moveAlongZ(0);
        }

        selectedActor.setControlKey(ENUMS.Controls.CONTROL_MOVE_ACTION, 0)
    } else {
        selectedActor.setControlKey(ENUMS.Controls.CONTROL_MOVE_ACTION, 2)
    }


    selectedActor.setControlKey(ENUMS.Controls.CONTROL_TILE_X, 0)
    selectedActor.setControlKey(ENUMS.Controls.CONTROL_TILE_Z, 0)
    pointerActive = false;

}

function lerpCameraPosition(towardsPos, alpha, testObscured) {
/*
    if (testObscured) {
        if (selectedActor) {
            obscureTestVec3.copy(selectedActor.getSpatialPosition());
            obscureTestVec3.y += selectedActor.getStatus(ENUMS.ActorStatus.HEIGHT);
            rayTest(obscureTestVec3, camPosVec, towardsPos);
        }

    }
*/

    let distance = MATH.distanceBetween(camPosVec, towardsPos);

    if (distance > 4) {
        alpha += MATH.curveQuad((distance-4)*0.02);
    }

    camPosVec.lerp(towardsPos, MATH.clamp(alpha * camFollowSpeed*0.1, 0.001, 0.5))

    if (testObscured) {
    //    rayTest(camLookAtVec, camPosVec, camPosVec);
    }

}

function lerpCameraLookAt(towardsPos, alpha) {

    let distance = MATH.distanceBetween(camLookAtVec, towardsPos);
    if (distance > 5) {
        alpha += MATH.curveQuad((distance-5)*0.06);
    }
    camLookAtVec.lerp(towardsPos, MATH.clamp(alpha * camFollowSpeed*0.1, 0.001, 0.5))
}

function applyViewObstruction(pos) {
    let hit = updateViewObstruction(pos)

    if (hit) {
        if (hit.ptr === getTerrainBodyPointer()) {
            //    camPosVec.copy(hit.position);
        } else {
            tempVec2.copy(ThreeAPI.getCamera().position);
            tempVec2.sub(hit.position);
            let obstructPush = getSetting(ENUMS.Settings.OBSTRUCTION_REACTIVITY) * 0.01;
            tempVec2.multiplyScalar(obstructPush);
            camPosVec.sub(tempVec2);
        }
    }

    let groundHeight = ThreeAPI.terrainAt(camPosVec);
    let settingMin = getSetting(ENUMS.Settings.CAMERA_TERRAIN_MIN) * 0.05;
    if ((groundHeight + settingMin) > camPosVec.y) {
        camPosVec.y = groundHeight+settingMin;
    }


}

function notifyCameraStatus(statusKey, controlKey, isActive) {
    evt.camEvt['status_key'] = ENUMS.CameraStatus[statusKey];
    evt.camEvt['control_key'] = ENUMS.CameraControls[controlKey];
    evt.camEvt['activate'] = isActive;
    evt.dispatch(ENUMS.Event.SET_CAMERA_STATUS, evt.camEvt)
}

let side = 1;
let leftOrRight = [1, -1]

function statusActive(camModeParams, controlKey) {
    return camModeParams.statusControls[ENUMS.CameraStatus[controlKey]]['isActive']
}

function statusControlKey(camModeParams, controlKey) {
    return camModeParams.statusControls[ENUMS.CameraStatus[controlKey]]['controlKey']
}

function viewTileSelect(sequencer) {
    return;
    let actor = sequencer.getGameActor()
    let seqTime = sequencer.getSequenceProgress()

    let camHome = GameAPI.call.getActiveEncounter().getEncounterCameraHomePosition()
    camTargetPos.copy(camHome)

    if (seqTime === 0) {
        side = MATH.getRandomArrayEntry(leftOrRight)
        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'actor_turn_movement', obj3d:sequencer.focusAtObj3d, camPos:camTargetPos})
    }

    tempVec.subVectors(actor.getGameWalkGrid().getTargetPosition() , actor.getSpatialPosition() )

    tempVec.multiplyScalar(seqTime);
    let distance = tempVec.length();
    camTargetPos.y += distance;
    tempVec2.copy(tempVec)
    tempVec.add(actor.getSpatialPosition())

    actor.prepareTilePath(tempVec)
    actor.turnTowardsPos(tempVec);
    tempVec2.multiplyScalar(0.5);
    tempVec2.add(actor.getSpatialPosition())
    sequencer.focusAtObj3d.position.copy(tempVec2)

}

function viewTargetSelection(sequencer, candidates) {
    let actor = sequencer.getGameActor()
    let seqTime = sequencer.getSequenceProgress()

    tempVec2.set(0, 0, 0)
    let biggestDistance = MATH.distanceBetween(actor.getSpatialPosition(), candidates[0].getSpatialPosition());
    let distance = 0;
    for (let i = 0; i < candidates.length; i++) {
        tempVec.copy(candidates[i].getSpatialPosition())

    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getSpatialPosition(), to:tempVec, color:'YELLOW'});
        tempVec.sub(actor.getSpatialPosition());
        distance = tempVec.length();

        if (biggestDistance < distance) {
            biggestDistance = distance;
        }

        tempVec2.add(tempVec);
    }
    distance = biggestDistance;

    tempVec.copy(tempVec2);

    tempVec2.multiplyScalar((seqTime*0.45+0.05) / candidates.length);
    tempVec2.add(actor.getSpatialPosition());

    actor.turnTowardsPos(tempVec2)

//    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:actor.getSpatialPosition(), to:tempVec2, color:'WHITE'});
 //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec2, color:'WHITE', size:0.25})
    sequencer.focusAtObj3d.position.copy(tempVec2);
    sequencer.focusAtObj3d.position.y -=0.5;


    let camHome = GameAPI.call.getActiveEncounter().getEncounterCameraHomePosition()

    calcAttackCamPosition(actor, distance*2 + 4, camTargetPos);
    camTargetPos.lerp(camHome,1-MATH.curveSigmoid(seqTime));
    // camTargetPos.y += Math.sin(seqTime * Math.PI*0.5)*5


}

let calcAttackCamPosition = function(actor, distance, storeVec) {
    storeVec.set(side * 0.5, 0.4, -0.5);
    storeVec.normalize();
    storeVec.multiplyScalar(distance);
    storeVec.applyQuaternion(actor.getSpatialQuaternion())
    storeVec.add(actor.getSpatialPosition())
    storeVec.y += actor.getStatus(ENUMS.ActorStatus.HEIGHT)*0.5
}

let calcShouldCamPosition = function(actor, distance, storeVec) {
    storeVec.set(side * 0.11, 0.2, -0.8);
    storeVec.normalize();
    storeVec.multiplyScalar(distance);
    storeVec.applyQuaternion(actor.getSpatialQuaternion())
    storeVec.add(actor.getSpatialPosition())
    storeVec.y += actor.getStatus(ENUMS.ActorStatus.HEIGHT)*1.1
}

let calcPositionAhead = function(actor, distance, storeVec) {
  //  storeVec.set(0, 0, 1);
  //  storeVec.normalize();
    storeVec.set(0, 0.25 + distance*0.3, distance);
    storeVec.applyQuaternion(actor.getSpatialQuaternion())
    storeVec.add(actor.getSpatialPosition())
    storeVec.y += actor.getStatus(ENUMS.ActorStatus.HEIGHT)*0.5
}

let calcPartyCenter = function(actor, distance, storeVec) {
    storeVec.set(side * 0.08, 0.4, -0.75);
    storeVec.normalize();
    storeVec.multiplyScalar(distance);
    storeVec.applyQuaternion(actor.getSpatialQuaternion())
    storeVec.add(actor.getSpatialPosition())
    storeVec.y += actor.getStatus(ENUMS.ActorStatus.HEIGHT)*0.5
}


function viewPrecastAction(sequencer, target) {

    let seqTime = sequencer.getSequenceProgress()
    let actor = sequencer.getGameActor()

    if (actor.isPlayerActor()) {
        calcShouldCamPosition(actor, 3, tempVec);
        tempVec2.copy(target.getVisualGamePiece().getCenterMass())

    } else {
        let distance = MATH.distanceBetween(actor.getSpatialPosition(), target.getSpatialPosition())
        calcAttackCamPosition(actor, distance * 2 + 6, tempVec);
        tempVec2.subVectors(target.getSpatialPosition(), actor.getSpatialPosition())
        tempVec2.multiplyScalar(0.5);
        tempVec2.add(actor.getSpatialPosition())
    }

    sequencer.focusAtObj3d.position.lerp(tempVec2, seqTime)
    camTargetPos.lerp(tempVec, seqTime)

}

function viewEncounterSelection(camTPos, camLookAt, tpf) {
    let sequencerSelection = GameAPI.call.getSequencerSelection()
    if (sequencerSelection) {
        tempVec.copy(sequencerSelection.getPos())
        tempVec.y -= 1;
        camLookAt.lerp(tempVec, tpf*4);
    }

    let partySelection = GameAPI.call.getPartySelection()
    if (partySelection) {

        if (!sequencerSelection) {
            calcPositionAhead(partySelection, 6, tempVec)
            camLookAt.lerp(tempVec, tpf);
        }

   //     partySelection.turnTowardsPos(camLookAt, tpf)
        calcShouldCamPosition(partySelection, 6, tempVec)
        //    tempVec.add(partySelection.getPos())

        camTPos.lerp(tempVec, tpf*8);
    }
}


function CAM_AUTO() {

    if (pointerAction) {
        notifyCameraStatus(ENUMS.CameraStatus.POINTER_ACTION, ENUMS.CameraControls.CAM_MOVE, true)
        tempVec.copy(pointerDragVector);
        tempVec.applyQuaternion(cursorObj3d.quaternion);
        tempVec.multiplyScalar(0.1)
        lookAroundPoint.add(tempVec)
    } else {
        notifyCameraStatus(ENUMS.CameraStatus.POINTER_ACTION, ENUMS.CameraControls.CAM_MOVE, false)
    }

    let offsetFactor = MATH.curveQuad(zoomDistance*0.65)
    if (modeActive) {
        cameraTime+= tpf;
        notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_AUTO, true)
    } else {
        notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_AUTO, false)
    }

    lookAtMod.x = Math.sin(cameraTime*0.15)*offsetFactor*0.2
    lookAtMod.z = Math.cos(cameraTime*0.15)*offsetFactor*0.2
    lookAtMod.y = 0 // ThreeAPI.terrainAt(cursorObj3d.position)+2
    cursorObj3d.position.copy(lookAroundPoint);
    cursorObj3d.position.y = ThreeAPI.terrainAt(lookAroundPoint);
    offsetPos.x = Math.sin(cameraTime*0.15)*offsetFactor
    offsetPos.y = offsetFactor*0.4 + zoomDistance*0.8 + Math.sin(GameAPI.getGameTime()*0.4)*zoomDistance*0.25
    offsetPos.z = Math.cos(cameraTime*0.18)*offsetFactor

    tempVec3.addVectors(lookAroundPoint, offsetPos)
//    camTargetPos.lerp(tempVec3, 0.01)
    lerpCameraPosition(tempVec3, tpf*2)

    tempVec3.y = cursorObj3d.position.y + 1.5;
    tempVec3.x = lookAroundPoint.x
    tempVec3.z = lookAroundPoint.z
    lerpCameraLookAt(tempVec3, tpf*4)
}

function CAM_ORBIT() {

    lerpFactor = tpf;
    cameraTime+= tpf;

    let distance = 5;
    zoomDistance = distance;
    let actorSpeed = 0;
    let actorQuat = cursorObj3d.quaternion
    offsetPos.set(0, 0, 0)
    let inMenu = false;

    if (selectedActor) {

        selectedActor.getSpatialPosition(cursorObj3d.position)
        actorSpeed += selectedActor.getStatus(ENUMS.ActorStatus.STATUS_FORWARD);
        camLookAtVec.copy(cursorObj3d.position)
        actorQuat = selectedActor.getSpatialQuaternion(cursorObj3d.quaternion);
        let rollAlpha = tpf;
        tempVec3.set(0, 1, 0);
        tempVec3.applyQuaternion(actorQuat);

        let navState = selectedActor.getStatus(ENUMS.ActorStatus.NAVIGATION_STATE)

        if (navState !== ENUMS.NavigationState.WORLD) {
            inMenu = true;
        } else {
            inMenu = false;
        }

        if (lookFromActive) {
            if (inMenu) {
                zoomDistance = 3;
            } else {
                zoomDistance = actorSpeed*2.5 + 25 + distance*0.4;
            }

            lerpCameraPosition(CAM_POINTS[lookFromControlKey](selectedActor), tpf*2, true);
            rollAlpha += 3 * tpf;
        }

        if (lookAtActive) {
            zoomDistance += actorSpeed * 0.5 + distance*0.4;
            lerpCameraLookAt(CAM_POINTS[lookAtControlKey](selectedActor), tpf*3);
            rollAlpha += 0.5 * tpf;
        }
        
        ThreeAPI.getCamera().up.lerp(tempVec3, rollAlpha);

    } else {
        tempVec3.set(0, 1, 0);
        ThreeAPI.getCamera().up.lerp(tempVec3, tpf);
        camLookAtVec.copy(cursorObj3d.position)
        camLookAtVec.y += 1.3;
    }

    if (pointerAction) {
        notifyCameraStatus(ENUMS.CameraStatus.POINTER_ACTION, ENUMS.CameraControls.CAM_TRANSLATE, true)
        distance += CursorUtils.processOrbitCursorInput(cursorObj3d, dragToVec3, offsetPos, cameraCursor.getForward(), pointerDragVector, zoomDistance)
        camPosVec.copy(cursorObj3d.position);
        camPosVec.add(offsetPos);
    //    CursorUtils.drawInputCursorState(cursorObj3d, dragToVec3, camTargetPos, cameraCursor.getForward(), camLookAtVec)
        tempVec.copy(cursorObj3d.position)
        lerpCameraLookAt(tempVec, tpf*2)
        camLookAtVec.y+=0.9;
    } else {

        if (inMenu) {
            notifyCameraStatus(ENUMS.CameraStatus.POINTER_ACTION, ENUMS.CameraControls.CAM_TRANSLATE, false)
            distance += CursorUtils.processOrbitCursorInput(cursorObj3d, dragToVec3, offsetPos, cameraCursor.getForward(), pointerDragVector, zoomDistance)
            camPosVec.copy(cursorObj3d.position);
            camPosVec.add(offsetPos);
        //    CursorUtils.drawInputCursorState(cursorObj3d, dragToVec3, camTargetPos, cameraCursor.getForward(), camLookAtVec)
        //    tempVec.set(0, 2.3, 0)
            tempVec.copy(cursorObj3d.position)
            lerpCameraLookAt(tempVec, tpf*2)
            camLookAtVec.y+=0.9;
            lerpCameraPosition(CAM_POINTS[lookFromControlKey](selectedActor), tpf*2, true);
            camTargetPos.y += 4.5;
        } else {
            offsetPos.set(0, 0, 0)
            notifyCameraStatus(ENUMS.CameraStatus.POINTER_ACTION, ENUMS.CameraControls.CAM_TRANSLATE, false)

            tempVec.set(0, 1.3, actorSpeed)
            tempVec.applyQuaternion(actorQuat);
            tempVec.add(cursorObj3d.position)

            lerpCameraLookAt(tempVec, lerpFactor * 3)
            tempVec2.copy(camLookAtVec);
            tempVec.set(0, 0, 1);
            tempVec.applyQuaternion(ThreeAPI.getCamera().quaternion);

            if (tempVec.y > 0.6) {
                tempVec.y = 0.6;
                tempVec.normalize();
            }

            tempVec.multiplyScalar(zoomDistance);
            tempVec.add(tempVec2);
            tempVec.add(offsetPos);
            lerpCameraPosition(tempVec, lerpFactor, true)
        }
    }
    applyViewObstruction(camLookAtVec)
}


function CAM_FLIGHT() {

    lerpFactor = tpf * getSetting(ENUMS.Settings.FLIGHT_STIFFNESS)*0.01;
    cameraTime+= tpf;

    let distance = 5;
    zoomDistance = distance;
    let actorSpeed = 0;
    let actorQuat = cursorObj3d.quaternion
    offsetPos.set(0, 0, 0)
    let inMenu = false;
    offsetPos.copy(cursorObj3d.position);
    lookAtMod.copy(cursorObj3d.position)
    if (selectedActor) {
        let forward = selectedActor.getStatus(ENUMS.ActorStatus.STATUS_FORWARD) * getSetting(ENUMS.Settings.THROTTLE_INFLUENCE)*0.01;
        let yaw =  selectedActor.getStatus(ENUMS.ActorStatus.STATUS_YAW) * getSetting(ENUMS.Settings.YAW_INFLUENCE)*0.01;
        let pitch =  selectedActor.getStatus(ENUMS.ActorStatus.STATUS_PITCH) * getSetting(ENUMS.Settings.PITCH_INFLUENCE)*0.01;
        let lookAbove = getSetting(ENUMS.Settings.FLIGHT_LOOK_ABOVE)*0.05;
        let lookAhead = getSetting(ENUMS.Settings.FLIGHT_LOOK_AHEAD)*0.1;
        let elevation = getSetting(ENUMS.Settings.FLIGHT_ELEVATION) * 0.02
        let overcompensate = getSetting(ENUMS.Settings.FLIGHT_ROTATION_COMPENSATION)*-0.1;
        zoomDistance = getPlayerStatus(ENUMS.PlayerStatus.PLAYER_ZOOM)*5
        selectedActor.getSpatialPosition(cursorObj3d.position)
        actorSpeed += selectedActor.getStatus(ENUMS.ActorStatus.STATUS_FORWARD);
        actorQuat = selectedActor.getSpatialQuaternion(cursorObj3d.quaternion);
        let rollAlpha = tpf * (getSetting(ENUMS.Settings.ROLL_INFLUENCE)*0.05 + overcompensate*0.1*selectedActor.getStatus(ENUMS.ActorStatus.STATUS_ROLL));
        tempVec3.set(0, 1, 0);
        tempVec3.applyQuaternion(actorQuat);

        let navState = selectedActor.getStatus(ENUMS.ActorStatus.NAVIGATION_STATE)

        if (navState !== ENUMS.NavigationState.WORLD) {
            inMenu = true;
        } else {
            inMenu = false;
        }

        tempVec.set(yaw*5, lookAbove + pitch + elevation * zoomDistance*0.6, lookAhead + forward-Math.abs(yaw));
        tempVec2.set(overcompensate*-yaw,  (overcompensate*pitch) + elevation, - (1 + zoomDistance ));
        tempVec2.multiplyScalar(zoomDistance);
        tempVec.applyQuaternion(actorQuat);
        tempVec2.applyQuaternion(actorQuat);

        if (lookAtActive) {
            lookAtMod.add(tempVec)
        }

        if (lookFromActive) {
            if (inMenu) {
                zoomDistance = 3;
                lerpCameraPosition(CAM_POINTS[lookFromControlKey](selectedActor), tpf*2, true);
            } else {
            //    zoomDistance = actorSpeed*2.5 + 25 + distance*0.4;
                offsetPos.add(tempVec2);
            }
        }

        ThreeAPI.getCamera().up.lerp(tempVec3, rollAlpha);

    } else {
        tempVec3.set(0, 1, 0);
        ThreeAPI.getCamera().up.lerp(tempVec3, tpf);

        lookAtMod.y += 1.3;
    }

    if (pointerAction) {
        notifyCameraStatus(ENUMS.CameraStatus.POINTER_ACTION, ENUMS.CameraControls.CAM_TRANSLATE, true)
        distance += CursorUtils.processOrbitCursorInput(cursorObj3d, dragToVec3, offsetPos, cameraCursor.getForward(), pointerDragVector, zoomDistance*0.01)

        camPosVec.add(offsetPos);
        //    CursorUtils.drawInputCursorState(cursorObj3d, dragToVec3, camTargetPos, cameraCursor.getForward(), camLookAtVec)
        tempVec.copy(cursorObj3d.position)
        lerpCameraLookAt(tempVec, tpf*2)
        camLookAtVec.y+=0.9;
    } else {

        if (inMenu) {
            notifyCameraStatus(ENUMS.CameraStatus.POINTER_ACTION, ENUMS.CameraControls.CAM_TRANSLATE, false)
            distance += CursorUtils.processOrbitCursorInput(cursorObj3d, dragToVec3, offsetPos, cameraCursor.getForward(), pointerDragVector, zoomDistance)
            camPosVec.copy(cursorObj3d.position);
            camPosVec.add(offsetPos);
            //    CursorUtils.drawInputCursorState(cursorObj3d, dragToVec3, camTargetPos, cameraCursor.getForward(), camLookAtVec)
            //    tempVec.set(0, 2.3, 0)
            tempVec.copy(cursorObj3d.position)
            lerpCameraLookAt(tempVec, tpf*2)
            camLookAtVec.y+=0.9;
            lerpCameraPosition(CAM_POINTS[lookFromControlKey](selectedActor), tpf*2, true);
            camTargetPos.y += 4.5;
        } else {

            notifyCameraStatus(ENUMS.CameraStatus.POINTER_ACTION, ENUMS.CameraControls.CAM_TRANSLATE, false)
            lerpCameraLookAt(lookAtMod, lerpFactor*3)
            lerpCameraPosition(offsetPos, lerpFactor, true)
        }
    }
    applyViewObstruction(camLookAtVec)
}

function CAM_TARGET(actor) {
    tempVec.copy(actor.getSpatialPosition())
    tempVec.y += actor.getStatus(ENUMS.ActorStatus.HEIGHT)*0.5
    return tempVec;
    let visualPiece = actor.getVisualGamePiece();
    if (!visualPiece) {
        return actor.getSpatialPosition();

    } else {
        return visualPiece.getCenterMass();
    }
}


function CAM_AHEAD(actor) {
    calcPositionAhead(actor, zoomDistance, tempVec);
 //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec, color:'RED', size:0.2})
    return tempVec;
}

function CAM_SHOULDER(actor) {
    calcShouldCamPosition(actor, zoomDistance, tempVec);
 //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec, color:'PURPLE', size:0.2})
    return tempVec;
}

function CAM_SELECT() {


    let targetActor = GameAPI.getActorById(selectedActor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET))

    if (!targetActor) {
        targetActor = selectedActor;
        selectedActor.turnTowardsPos(targetActor.getSpatialPosition())
    }

    if (lookAtActive) {
        zoomDistance = 3;
        lerpCameraLookAt(CAM_POINTS[lookAtControlKey](targetActor), tpf*3);
    }

    if (lookFromActive) {
        zoomDistance = 11;
        lerpCameraPosition(CAM_POINTS[lookFromControlKey](selectedActor), tpf*3);
    }
    applyViewObstruction(camLookAtVec)
}

function CAM_POINT() {

    let targetActor = GameAPI.getActorById(selectedActor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET))

    if (!targetActor) {
        targetActor = selectedActor;
    }

    if (pointerAction) {
        applyPointerMove();
    } else if (pointerActive) {
        applyPointerRelease()
    }

    if (lookAtActive) {
        zoomDistance = 3;
        selectedActor.turnTowardsPos(targetActor.getSpatialPosition())
        lerpCameraLookAt(CAM_POINTS[lookAtControlKey](targetActor), tpf*3);
    }

    if (lookFromActive) {
        zoomDistance = 11;
        let aPos = selectedActor.getSpatialPosition();
        let tPos = targetActor.getSpatialPosition();
        let distance = MATH.distanceBetween(aPos, tPos) * 0.2;

        if (isTileSelecting) {
            distance += tileSelector.extendedDistance;
        }

        tempVec.copy(aPos);
        tempVec.sub(tPos);
        tempVec.normalize()
        let actorHeight = selectedActor.getStatus(ENUMS.ActorStatus.HEIGHT)
        tempVec.multiplyScalar(actorHeight + distance * 2.5 + 1);
        tempVec.y =  actorHeight*2 + distance * 1.5;
        tempVec.add(aPos);
        lerpCameraPosition(tempVec, tpf*3, true);
    }
    applyViewObstruction(camLookAtVec)
}

function CAM_HIGH(actor) {
    calcPartyCenter(actor, zoomDistance, tempVec);
 //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec, color:'CYAN', size:0.2})
    return tempVec;
}

function CAM_PARTY(actor) {
    calcPartyCenter(actor, zoomDistance, tempVec);
 //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec, color:'CYAN', size:0.2})
    return tempVec;
}

function CAM_SEQUENCER() {

    if (!selectedActor) {
        return;
    }

    let CAMERA_HORIZONTAL = getSetting(ENUMS.Settings.CAMERA_HORIZONTAL) / 50;
    let CAMERA_VERTICAL = getSetting(ENUMS.Settings.CAMERA_VERTICAL) / 50;
    let ZOOM_MAX = getSetting(ENUMS.Settings.ZOOM_MAX) / 50;
    let ZOOM_MIN = getSetting(ENUMS.Settings.ZOOM_MIN) / 50;
    let LOOK_ABOVE = getSetting(ENUMS.Settings.LOOK_ABOVE) / 50;
    let LOOK_AHEAD = getSetting(ENUMS.Settings.LOOK_AHEAD) / 25;
    let ABOVE_HEIGHT = getSetting(ENUMS.Settings.ABOVE_HEIGHT) / 100;
    let RIG_STIFFNESS = getSetting(ENUMS.Settings.RIG_STIFFNESS) / 100;
    let ROTATION_COMPENSATION = getSetting(ENUMS.Settings.ROTATION_COMPENSATION) / 50;
    let CHARACTER_STIFFNESS = MATH.curveQuad(getSetting(ENUMS.Settings.CHARACTER_STIFFNESS) / 100);
    let OBSTRUCTION_REACTIVITY = getSetting(ENUMS.Settings.OBSTRUCTION_REACTIVITY) / 50;

    let targetActor = GameAPI.getActorById(selectedActor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET))

    let zoom = selectedActor.getStatus(ENUMS.ActorStatus.CAMERA_ZOOM) * GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_ZOOM);

    if (!targetActor) {
        targetActor = selectedActor;
    }

    let distance = 5;


    if (selectedActor.getStatus(ENUMS.ActorStatus.FRAME_TRAVEL_DISTANCE) !== 0) {
        camObj.quaternion.slerp(selectedActor.getSpatialQuaternion(), -MATH.clamp(tpf * CHARACTER_STIFFNESS, 0, 0.5));
    }


    if (pointerAction) {
        //    selectedActor.actorText.say(MATH.decimalify(pointerDragVector.x, 10) +' '+ MATH.decimalify(pointerDragVector.z, 10))
        orbitObj.quaternion.set(0, 0, 0, 1);

        orbitObj.rotateY(dragDeltaX * 0.5 * CAMERA_HORIZONTAL);
        camObj.quaternion.multiply(orbitObj.quaternion);

        let elevate = -dragDeltaY * CAMERA_VERTICAL*0.5

        camObj.position.y = MATH.clamp(camObj.position.y + elevate , -0.1, 2);

    //    applyPointerMove();

    } else if (pointerActive) {
    //    applyPointerRelease()
    }

/*
    if (isTileSelecting) {
        distance = tileSelector.extendedDistance;
        if (isDev()) {
            selectedActor.actorText.say('tile select')
        }

    } else {
        selectedActor.getDestination(tempVec3);
        distance = 0.5 + MATH.distanceBetween(tempVec3, selectedActor.getSpatialPosition()) * 6;
    }
*/
    let playerFocus = GameAPI.getPlayer().getFocusOnPosition();

    if (lookAtActive) {

        zoomDistance = 0.1 + MATH.curveQuad(distance*0.2);

        if (playerFocus !== null) {
            tempVec.copy(playerFocus);
        } else {
            lookAtMod.set(0, 0, LOOK_AHEAD*zoom*0.05);
            lookAtMod.applyQuaternion(selectedActor.getSpatialQuaternion());
            tempVec.copy(lookAtMod);
            tempVec.add(selectedActor.getPos())
            //    lookAt = CAM_POINTS[lookAtControlKey](targetActor);
        }


        tempVec.y += LOOK_ABOVE+ABOVE_HEIGHT
        lerpCameraLookAt(tempVec, tpf + tpf*RIG_STIFFNESS*4);
    }

    if (lookFromActive) {
        zoomDistance = 0.5*zoom + distance*0.4;

        if (playerFocus === null) {

            tempVec.set(0, 0, 1);
            tempVec.applyQuaternion(camObj.quaternion);

            tempVec.y += camObj.position.y;
            tempVec.multiplyScalar(zoomDistance);
            tempVec2.copy(tempVec)
            tempVec2.add(selectedActor.getSpatialPosition())
            //   camPosVec.copy(tempVec2)
            lookAtMod.multiplyScalar(-ROTATION_COMPENSATION);
            tempVec2.add(lookAtMod)
            tempVec2.y += ABOVE_HEIGHT;
            camPosVec.lerp(tempVec2, tpf + tpf*RIG_STIFFNESS*2);
            //   lerpCameraPosition(CAM_POINTS[lookFromControlKey](selectedActor), tpf + tpf*RIG_STIFFNESS*4, testObscured );
            //
        } else {

            tempVec.set(0, 0.5, -0.8);
            tempVec.multiplyScalar(zoomDistance);
            tempObj.position.copy(selectedActor.getSpatialPosition());
            tempObj.lookAt(playerFocus);
            tempVec.applyQuaternion(tempObj.quaternion);
            tempVec.add(selectedActor.getSpatialPosition())

            camPosVec.lerp(tempVec, tpf + tpf*RIG_STIFFNESS*4);
            //    lerpCameraPosition(CAM_POINTS[lookFromControlKey](selectedActor), tpf*2, testObscured );
        }

    }
    applyViewObstruction(selectedActor.getCenterMass())
}

function CAM_ENCOUNTER() {

    return;

    let turnActiveActor = GameAPI.call.getTurnActiveSequencerActor()
    if (!turnActiveActor) {
    //    console.log("No turn Active Actor for CAM_ENCOUNTER")
        return;
    }
    if (!selectedActor) {
        let partySelected = GameAPI.getGamePieceSystem().getPlayerParty().getPartySelection();
        if (partySelected) {
            selectedActor = partySelected;
        } else {
            selectedActor = GameAPI.getGamePieceSystem().selectedActor;
        }

        return;
    }
    let distance = 0
    if (turnActiveActor === selectedActor) {
        if (pointerAction) {
            applyPointerMove();
            if (tileSelector) {
                distance += tileSelector.extendedDistance;
            }
        } else if (pointerActive) {
            applyPointerRelease()
        }
    }




    let actorTarget = GameAPI.getActorById(turnActiveActor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET))
    if (actorTarget) {
        zoomDistance = 3 + distance;
        selectedActor.turnTowardsPos(actorTarget.getSpatialPosition())
    } else {
        zoomDistance = 3 + distance;
        actorTarget = selectedActor;
    }

    let isFar = 0;
     if (MATH.distanceBetween(turnActiveActor, ThreeAPI.getCamera().position) > 200) {
         isFar = 1;
     }

    if (lookAtActive) {
        if (actorTarget) {
            zoomDistance = 1;

            lerpCameraLookAt(CAM_POINTS[lookAtControlKey](turnActiveActor), tpf +isFar);
            lerpCameraLookAt(CAM_POINTS[lookAtControlKey](actorTarget), tpf +isFar);
        } else {
            lerpCameraLookAt(CAM_POINTS[lookAtControlKey](turnActiveActor), tpf*1 +isFar);
        }
    }

    if (lookFromActive) {

        tempVec3.copy(CAM_POINTS.CAM_SHOULDER(turnActiveActor));
        tempVec3.sub(CAM_POINTS.CAM_AHEAD(actorTarget));

        tempVec3.y = 0;
        tempVec3.normalize()
        tempVec3.y = 1;
        tempVec3.multiplyScalar(2);
        zoomDistance = 1 + distance * 0.6;
        tempVec2.copy(CAM_POINTS[lookFromControlKey](turnActiveActor))
        tempVec.copy(tempVec2);
        tempVec.x += tempVec3.x * (3 + distance*0.3);
        tempVec.y += 4 + distance * 0.8;
        tempVec.z += tempVec3.z * (3 + distance*0.3);

        lerpCameraPosition(tempVec, tpf*1.5+isFar, true);
    }

    applyViewObstruction(camLookAtVec)

}


function CAM_MOVE() {

    if (!selectedActor) {
        return;
    }

    let CAMERA_HORIZONTAL = getSetting(ENUMS.Settings.CAMERA_HORIZONTAL) / 50;
    let CAMERA_VERTICAL = getSetting(ENUMS.Settings.CAMERA_VERTICAL) / 50;
    let ZOOM_MAX = getSetting(ENUMS.Settings.ZOOM_MAX) / 50;
    let ZOOM_MIN = getSetting(ENUMS.Settings.ZOOM_MIN) / 50;
    let LOOK_ABOVE = getSetting(ENUMS.Settings.LOOK_ABOVE) / 50;
    let LOOK_AHEAD = getSetting(ENUMS.Settings.LOOK_AHEAD) / 25;
    let ABOVE_HEIGHT = getSetting(ENUMS.Settings.ABOVE_HEIGHT) / 100;
    let RIG_STIFFNESS = getSetting(ENUMS.Settings.RIG_STIFFNESS) / 100;
    let ROTATION_COMPENSATION = getSetting(ENUMS.Settings.ROTATION_COMPENSATION) / 50;
    let CHARACTER_STIFFNESS = MATH.curveQuad(getSetting(ENUMS.Settings.CHARACTER_STIFFNESS) / 100);
    let OBSTRUCTION_REACTIVITY = getSetting(ENUMS.Settings.OBSTRUCTION_REACTIVITY) / 50;

    let targetActor = GameAPI.getActorById(selectedActor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET))

    let zoom = selectedActor.getStatus(ENUMS.ActorStatus.CAMERA_ZOOM) * GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_ZOOM);

    if (!targetActor) {
        targetActor = selectedActor;
    }

    let distance = 0;


    if (selectedActor.getStatus(ENUMS.ActorStatus.FRAME_TRAVEL_DISTANCE) !== 0) {
        camObj.quaternion.slerp(selectedActor.getSpatialQuaternion(), -MATH.clamp(tpf * CHARACTER_STIFFNESS, 0, 0.5));
    }

    if (pointerAction) {
    //    selectedActor.actorText.say(MATH.decimalify(pointerDragVector.x, 10) +' '+ MATH.decimalify(pointerDragVector.z, 10))
        orbitObj.quaternion.set(0, 0, 0, 1);

        orbitObj.rotateY(dragDeltaX * 0.5 * CAMERA_HORIZONTAL);
        camObj.quaternion.multiply(orbitObj.quaternion);

        let elevate = -dragDeltaY * CAMERA_VERTICAL*0.5

        camObj.position.y = MATH.clamp(camObj.position.y + elevate , -0.1, 2);

        applyPointerMove();
    } else if (pointerActive) {
        applyPointerRelease()
    }

    if (isTileSelecting) {
        distance = tileSelector.extendedDistance;
        if (isDev()) {
            selectedActor.actorText.say('tile select')
        }

    } else {
        selectedActor.getDestination(tempVec3);
        distance = 0.5 + MATH.distanceBetween(tempVec3, selectedActor.getSpatialPosition()) * 6;
    }

    let playerFocus = GameAPI.getPlayer().getFocusOnPosition();

    if (lookAtActive) {

        zoomDistance = 0.1 + MATH.curveQuad(distance*0.2);

        if (playerFocus !== null) {
            tempVec.copy(playerFocus);
        } else {
            lookAtMod.set(0, 0, LOOK_AHEAD*zoom*0.05);
            lookAtMod.applyQuaternion(targetActor.getSpatialQuaternion());
            tempVec.copy(lookAtMod);
            tempVec.add(targetActor.getPos())
        //    lookAt = CAM_POINTS[lookAtControlKey](targetActor);
        }


        tempVec.y += LOOK_ABOVE+ABOVE_HEIGHT
        lerpCameraLookAt(tempVec, tpf + tpf*RIG_STIFFNESS*4);
    }

    if (lookFromActive) {
        zoomDistance = 0.5*zoom + distance*0.4;
        let testObscured = true;

        if (playerFocus === null) {
            /*
                      tempVec.set(0, 0, 1);
                      tempVec.applyQuaternion(orbitObj.quaternion);
                      tempVec.add(selectedActor.getSpatialPosition())
                      evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:selectedActor.getSpatialPosition(), empVec, color:'YELLOW'});
                      /*

             */
                      tempVec.set(0, 0, 1);
                      tempVec.applyQuaternion(camObj.quaternion);
              //        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:selectedActor.getSpatialPosition(), to:tempVec, color:'CYAN'});


                      /*


            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec, to:tempVec2, color:'CYAN'});
            tempVec2.sub(selectedActor.getSpatialPosition());


            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:selectedActor.getSpatialPosition(), to:tempVec2, color:'GREEN'});

                       */
            tempVec.y += camObj.position.y;
            tempVec.multiplyScalar(zoomDistance);
            tempVec2.copy(tempVec)
            tempVec2.add(selectedActor.getSpatialPosition())
            //   camPosVec.copy(tempVec2)
            lookAtMod.multiplyScalar(-ROTATION_COMPENSATION);
            tempVec2.add(lookAtMod)
            tempVec2.y += ABOVE_HEIGHT;
            camPosVec.lerp(tempVec2, tpf + tpf*RIG_STIFFNESS*2);
         //   lerpCameraPosition(CAM_POINTS[lookFromControlKey](selectedActor), tpf + tpf*RIG_STIFFNESS*4, testObscured );
         //
        } else {

            tempVec.set(0, 0.5, -0.8);
            tempVec.multiplyScalar(zoomDistance);
            tempObj.position.copy(selectedActor.getSpatialPosition());
            tempObj.lookAt(playerFocus);
            tempVec.applyQuaternion(tempObj.quaternion);
            tempVec.add(selectedActor.getSpatialPosition())

            camPosVec.lerp(tempVec, tpf + tpf*RIG_STIFFNESS*4);
        //    lerpCameraPosition(CAM_POINTS[lookFromControlKey](selectedActor), tpf*2, testObscured );
        }

    }
    applyViewObstruction(selectedActor.getCenterMass())
}

function CAM_MENU() {
    let navLookAt = ThreeAPI.getCameraCursor().getNavLookAt();
    let cursorPos = ThreeAPI.getCameraCursor().getLookAroundPoint()
    cursorPos.copy(navLookAt);
    ThreeAPI.getCameraCursor().getPos().copy(cursorPos);
    let cPos = ThreeAPI.getCameraCursor().getNavLookFrom()
    lerpCameraLookAt(navLookAt, tpf*3);
    lerpCameraPosition(cPos, tpf*2 );
}

function CAM_EDIT() {

  //  let cursorPos = ThreeAPI.getCameraCursor().getPos()
  //  ThreeAPI.getCameraCursor().getLookAroundPoint().copy(cursorPos);
    let cursorPos = ThreeAPI.getCameraCursor().getLookAroundPoint()
    ThreeAPI.getCameraCursor().getPos().copy(cursorPos);
    let controlValues = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.CONTROL_VALUES);
    let zoom = 0.0 + GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_ZOOM)*100;

    if (controlValues['CAM_FORWARD'] !== 0) {

        let newZoom = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_ZOOM)-controlValues['CAM_FORWARD']*0.01;
        GameAPI.getPlayer().setStatusKey(ENUMS.PlayerStatus.PLAYER_ZOOM, newZoom)
        controlValues['CAM_DISTANCE'] += controlValues['CAM_FORWARD'];
    }

    let distance = 0;

    if (pointerAction) {
        orbitObj.quaternion.set(0, 0, 0, 1);
        orbitObj.rotateY(dragDeltaX*0.005 * camDragFactor);
        camObj.quaternion.multiply(orbitObj.quaternion);
        tempVec.set(0, 0, -1);
        tempVec.applyQuaternion(camObj.quaternion);
        let elevate = -dragDeltaY * camDragFactor*0.05
        camObj.position.y = MATH.clamp(camObj.position.y + elevate * 0.05, -0.1, 2);
        applyPointerMove();
    } else if (pointerActive) {
        applyPointerRelease()
    }


    if (controlValues['CAM_TURN'] !== 0 || controlValues['CAM_PITCH'] !== 0) {
        orbitObj.quaternion.set(0, 0, 0, 1);
        orbitObj.rotateY(controlValues['CAM_TURN']*0.005 * camDragFactor);
        camObj.quaternion.multiply(orbitObj.quaternion);
        tempVec.set(0, 0, -1);
        tempVec.applyQuaternion(camObj.quaternion);
        let elevate = controlValues['CAM_PITCH'] * camDragFactor*0.05
        camObj.position.y = MATH.clamp(camObj.position.y + elevate * 0.05, -0.1, 2);
    }

    if (controlValues['CONTROL_FORWARD'] !== 0 || controlValues['CONTROL_STRAFE'] !== 0) {
        tempObj.position.copy(ThreeAPI.getCamera().position);
        tempObj.position.y = cursorPos.y;
        tempObj.lookAt(cursorPos);
        tempVec.set(-controlValues['CONTROL_STRAFE'], 0, controlValues['CONTROL_FORWARD']);
        tempVec.applyQuaternion(tempObj.quaternion);
        cursorPos.add(tempVec);
    }
    cursorPos.y = ThreeAPI.terrainAt(cursorPos);

        zoomDistance = 0.1 + MATH.curveQuad(distance*0.2);
        tempVec3.copy(cursorPos);
        tempVec3.y+=0.5 + 0.02*zoom;
        lerpCameraLookAt(tempVec3, tpf*5);

        zoomDistance = 0.5*zoom + distance*0.4;
        let testObscured = true;
        tempVec.set(0, 0, 1);
        tempVec.applyQuaternion(orbitObj.quaternion);
        tempVec.add(cursorPos)
     //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:selectedActor.getSpatialPosition(), to:tempVec, color:'YELLOW'});
        tempVec.set(0, 0, 1);
        tempVec.applyQuaternion(camObj.quaternion);
        tempVec.add(cursorPos)
     //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:selectedActor.getSpatialPosition(), to:tempVec, color:'CYAN'});
        tempVec2.addVectors(tempVec, camObj.position)
      //  evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec, to:tempVec2, color:'CYAN'});
        tempVec2.sub(cursorPos);
        tempVec2.multiplyScalar(zoomDistance);
        tempVec2.add(cursorPos)
     //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:selectedActor.getSpatialPosition(), to:tempVec2, color:'GREEN'});
        camPosVec.lerp(tempVec2, tpf * camFollowSpeed);
        lerpCameraPosition(camPosVec, tpf*2, testObscured );

    if (selectedActor) {
        let pos = selectedActor.getSpatialPosition();
        selectedActor.setSpatialVelocity(pos.sub(cursorPos).multiplyScalar(-1))
        selectedActor.setSpatialPosition(cursorPos);
        selectedActor.actorObj3d.position.copy(cursorPos);
    }

}

function CAM_GRID() {

    console.log("CAM_GRID")
  //  return;

    let turnActiveActor = GameAPI.call.getTurnActiveSequencerActor()
    if (turnActiveActor) {
        selectedActor = turnActiveActor;
    }

    if (!selectedActor) {
        return;
    }

    let targetActor = GameAPI.getActorById(selectedActor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET))

    if (!targetActor) {
        targetActor = selectedActor;
    }

    let zoom = selectedActor.getStatus(ENUMS.ActorStatus.CAMERA_ZOOM)*0.5

    let distance = 0;

    if (pointerAction) {
        applyPointerMove();
    } else if (pointerActive) {
        applyPointerRelease()
    }


    if (isTileSelecting) {
        distance = tileSelector.extendedDistance;
    } else {
        selectedActor.getDestination(tempVec3);

        distance = 0.5 + MATH.distanceBetween(tempVec3, selectedActor.getSpatialPosition()) * 3;
    }

    distance*=zoom*0.1;

    tempVec3.set(0, 0, 1);
    tempVec3.applyQuaternion(ThreeAPI.getCamera().quaternion);
    tempVec3.y = 0;
    tempVec3.normalize()
    tempVec3.y = 1;
    tempVec3.multiplyScalar(zoom*0.1);
    zoomDistance = 0.3*zoom + distance * 0.3;
    tempVec2.copy(CAM_POINTS[lookAtControlKey](targetActor))


    tempVec.copy(tempVec2);

    if (isTileSelecting) {
    //
        ThreeAPI.tempVec3.copy(tileSelector.translation);
        ThreeAPI.tempVec3.multiplyScalar(0.5* zoom*0.1);
        tempVec2.add(ThreeAPI.tempVec3)
        if (pointerAction) {
            tempVec.add(ThreeAPI.tempVec3)
        }
    }

    tempVec.x += (tempVec3.x * (5 + distance*0.3)) * zoom*0.1;
    tempVec.y += (8 + distance * 0.5) * zoom*0.2;
    tempVec.z += (tempVec3.z * (5 + distance*0.3)) * zoom*0.1;

    if (lookFromActive) {
        lerpCameraPosition(tempVec, tpf, true);
    }

    if (lookAtActive) {
        lerpCameraLookAt(tempVec2, tpf);
    }
//    applyViewObstruction(camLookAtVec)
}

function applyZoomDelta(dt) {
    let zoom = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_ZOOM)
    let gain = getSetting(ENUMS.Settings.ZOOM_STRENGTH) / 10;
    let min = getSetting(ENUMS.Settings.ZOOM_MIN) / 50;
    let max = getSetting(ENUMS.Settings.ZOOM_MAX) / 50;
    GameAPI.getPlayer().setStatusKey(ENUMS.PlayerStatus.PLAYER_ZOOM, MATH.clamp(zoom-dt*gain, min * 0.2, 2 + max*2))
}

export {
    applyZoomDelta,
    notifyCameraStatus,
    updateCamParams,
    viewTileSelect,
    viewTargetSelection,
    viewPrecastAction,
    viewEncounterSelection,
    CAM_MODES,
    CAM_POINTS

}