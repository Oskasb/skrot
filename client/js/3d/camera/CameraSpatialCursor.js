
import { Vector3 } from "../../../libs/three/math/Vector3.js";
import { Object3D } from "../../../libs/three/core/Object3D.js";
import * as CursorUtils from "./CursorUtils.js";
import {notifyCameraStatus, viewEncounterSelection} from "./CameraFunctions.js";
import { CameraControls} from "./CameraControls.js";
import {ENUMS} from "../../application/ENUMS.js";

let cameraControls = new CameraControls()
let cameraStatus = {}

let calcVec = new Vector3()
let tempVec3 = new Vector3();
let walkDirVec = new Vector3();
let cursorObj3d = new Object3D()
let movePiecePos = new Vector3();
let dragFromVec3 = new Vector3();
let dragToVec3 = new Vector3();
let camTargetPos = new Vector3();
let camPosVec = new Vector3();
let camLookAtVec = new Vector3();
let cursorTravelVec = new Vector3();
let cursorForward = new Vector3();
let walkForward = new Vector3();
let viewTargetPos = new Vector3();
let zoomDistance =15;
let actorQuat = null;

let navLookAt = new Vector3();
let navLookFrom = new Vector3();

let lookAroundPoint = new Vector3(677, 0, 1139)

let posMod = new Vector3();
let lookAtMod = new Vector3();
let pointerDragVector = new Vector3()
let tpf = 0.01;
let lerpFactor = 0.01;
let pointerActive = false;
let tilePath = null;

let focusObj3d = null;
let camHomePos = null;

let camParams = {
    camCallback : function() {},
    mode : null,
    pos : [0, 0, 0],
    lookAt :[0, 0, 0],
    offsetPos : [0, 0, 0],
    offsetLookAt : [0, 0, 0]
}

let camModes = ENUMS.CameraModes;


let setFocusObj3d = function(obj3d) {
    focusObj3d = obj3d;
}

let debugDrawCursor = function() {
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:cursorObj3d.position, color:'CYAN', size:0.5})
    calcVec.copy(cursorObj3d.position);
    calcVec.y = ThreeAPI.terrainAt(calcVec, tempVec3);
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:calcVec, color:'GREEN', size:0.5})
    tempVec3.add(calcVec);
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:calcVec, to:tempVec3, color:'YELLOW'});
}

let updateCursorFrame = function() {
//    calcVec.copy(camPosVec);
    //   rayTest(camLookAtVec, camPosVec, calcVec);

    camParams.pos[0] = camPosVec.x // + posMod.x;
    camParams.pos[1] = camPosVec.y // + posMod.y;
    camParams.pos[2] = camPosVec.z // + posMod.z;
    camParams.lookAt[0] = camLookAtVec.x // + lookAtMod.x;
    camParams.lookAt[1] = camLookAtVec.y //+ lookAtMod.y;
    camParams.lookAt[2] = camLookAtVec.z //+ lookAtMod.z;
    GameAPI.getGameCamera().updatePlayerCamera(camParams)
}


let updateActorTurnMovement = function() {
    let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
    let actorPos = selectedActor.getSpatialPosition();

    calcVec.set(0, 0, 1)
    calcVec.applyQuaternion(focusObj3d.quaternion);
    calcVec.add(focusObj3d.position);
    calcVec.sub(actorPos);
    lerpFactor = tpf*2.5 + Math.clamp( tpf * 2 * (5 / calcVec.length()), 0, tpf*2);

    calcVec.multiplyScalar(0.8);
    tempVec3.addVectors(actorPos, calcVec);
    camLookAtVec.lerp(tempVec3, lerpFactor);

    cursorObj3d.position.copy(camLookAtVec);
 //   calcVec.multiplyScalar(-1.1);
 //   tempVec3.addVectors(actorPos, calcVec);
 //   tempVec3.y += calcVec.length()*2;
    camPosVec.lerp(camHomePos, lerpFactor*2)
}

let activePointers = 0;
let pointerTwo = null;
let pointerOne = null;
let startAtZoom = 0;
let startAtDistance = 0;

class CameraSpatialCursor {
    constructor() {

        cursorObj3d.position.copy(lookAroundPoint);
        camPosVec.copy(lookAroundPoint);
        camParams.mode = camModes.worldDisplay;

        let spatialCursor = this;
        spatialCursor.pointer = null;
        spatialCursor.isFirstPressFrame = false;
        spatialCursor.pointerReleased = false;

        let setCamMode = function(evt) {
            let selectedMode = evt.mode;
            if (selectedMode === camModes.worldDisplay) {
                notifyCameraStatus(ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_AUTO, true)
            }
        }

        let activePointerUpdate = function(pointer, isFirstPressFrame, released) {
            spatialCursor.pointer = pointer;
            spatialCursor.isFirstPressFrame = isFirstPressFrame;
            spatialCursor.pointerReleased = released;
            pointerActive = true;

            if (isFirstPressFrame) {

                activePointers++;
                if (activePointers === 1) {
                    pointerOne = pointer;
                    pointerTwo = null;
                }

                if (activePointers === 2) {
                    pointerTwo = pointer;
                    startAtZoom = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_ZOOM)
                    if (!pointerOne) {
                        console.log("Lost pointerOne")
                        pointerTwo = null;
                    } else {
                        startAtDistance = MATH.distanceBetween(pointerOne.pos, pointerTwo.pos);
                    }

                    console.log("Pointer Two:", pointer)
                }
           //     console.log("isFirstPressFrame", pointerOne, pointerTwo)
                notifyCameraStatus(ENUMS.CameraStatus.POINTER_ACTION, null, true)
                camPosVec.copy(ThreeAPI.getCamera().position);
                dragToVec3.copy( cursorObj3d.position)
            }

            if (released) {
                if (pointer === pointerTwo) {
                    pointerTwo = null;
                }
                if (pointer === pointerOne) {
                    pointerOne = null;
                    pointerTwo = null;
                }
                activePointers--
                notifyCameraStatus(ENUMS.CameraStatus.POINTER_ACTION, null, false)
            }

            dragFromVec3.copy(cursorObj3d.position);
            pointerDragVector.x = -pointer.dragDistance[0] * 0.1;
            pointerDragVector.y = 0;
            pointerDragVector.z = -pointer.dragDistance[1] * 0.1;

            dragToVec3.copy(pointerDragVector)
            dragToVec3.applyQuaternion(cursorObj3d.quaternion);
            dragToVec3.add(cursorObj3d.position)

            if (pointerOne !== null && pointerTwo !== null) {
                calcVec.copy(cursorObj3d.position)
            //    let zoomChange = (pointerTwo.dragDistance[0] - pointerOne.dragDistance[0])*0.005;
                let distance = MATH.distanceBetween(pointerOne.pos, pointerTwo.pos);
                let dtDist = distance - startAtDistance
                let newZoom = startAtZoom+dtDist
                calcVec.y += newZoom;
                GameAPI.getPlayer().setStatusKey(ENUMS.PlayerStatus.PLAYER_ZOOM, MATH.clamp(newZoom, 0.1, 4));
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:cursorObj3d.position, to:calcVec, color:'CYAN'});
            }

            if (camParams.mode === camModes.gameVehicle) {
                let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
                if (selectedActor) {
                    cursorObj3d.position.copy(selectedActor.getSpatialPosition())
                }
            }
        }

        this.call = {
            setCamMode:setCamMode,
            activePointerUpdate:activePointerUpdate,
            setFocusObj3d:setFocusObj3d
        }

        evt.on(ENUMS.Event.SET_CAMERA_STATUS, cameraControls.call.onCamStatusEvent)

    }

    getCameraControls() {
        return cameraControls;
    }


    setCursorPosition = function(vec3) {
        cursorObj3d.position.copy(vec3);
    }

    setZoomDistance(value) {
        zoomDistance = value;
    }

    getZoomDistance() {
        return zoomDistance;
    }

    getCursorObj3d = function() {
        return cursorObj3d
    }

    getLookAroundPoint = function() {
        return lookAroundPoint;
    }

    getPos = function() {

        return cursorObj3d.position;
    }

    getCamParams = function() {
        return camParams;
    }

    setPosMod = function(vec3) {
        posMod.copy(vec3);
    };

    setLookAtMod = function(vec3) {
        lookAtMod.copy(vec3);
    }



    setMode = function(mode) {

    }

    getPointAtDistanceAhead(distance) {
        tempVec3.set(0, 0, distance);
        tempVec3.applyQuaternion(cursorObj3d.quaternion);
        tempVec3.add(cursorObj3d.position);
        return tempVec3;
    }


    getLookAtVec3() {
        return camLookAtVec;
    }

    getCamTargetPosVec3() {
        return camTargetPos;
    }

    getForward() {
        tempVec3.set(0, 0, 1);
        tempVec3.applyQuaternion(cursorObj3d.quaternion);
        return tempVec3;
    }

    getNavLookAt() {
        return navLookAt;
    }

    getNavLookFrom() {
        return navLookFrom;
    }

    updateSpatialCursor = function() {
        let tpf = GameAPI.getFrame().avgTpf

        tempVec3.set(0, 1, 0);
        ThreeAPI.getCamera().up.lerp(tempVec3, tpf);
        ThreeAPI.copyCameraLookAt(tempVec3);
        tempVec3.y = ThreeAPI.camera.position.y;
        tempVec3.sub(ThreeAPI.camera.position);

        tempVec3.y = cursorObj3d.position.y;
        tempVec3.normalize();

        tempVec3.multiplyScalar(3)
        tempVec3.add(cursorObj3d.position);
        tempVec3.y = cursorObj3d.position.y;

        cursorObj3d.lookAt(tempVec3);
        cursorForward.set(0, 0, 1);
        cursorForward.applyQuaternion(cursorObj3d.quaternion);

        cursorTravelVec.subVectors(dragToVec3, cursorObj3d.position);
        cursorTravelVec.y = 0;

        cameraControls.applyCameraControls(tpf, pointerDragVector, dragToVec3, this, camLookAtVec, camPosVec)

        if (camParams.mode === camModes.gameVehicle) {
                let selectedActor = GameAPI.getGamePieceSystem().getSelectedGameActor();
                camLookAtVec.copy(cursorObj3d.position)
                let forward = selectedActor.getForward();
                let distance = MATH.clamp(MATH.distanceBetween(cursorObj3d.position, ThreeAPI.camera.position), 6, 20)
                forward.multiplyScalar(0.5 + MATH.curveSqrt(distance * 0.5 + selectedActor.getStatus(ENUMS.ActorStatus.STATUS_SPEED) * 4))
                camLookAtVec.add(forward);
                cursorObj3d.lookAt(ThreeAPI.camera.position)
                camTargetPos.copy(cursorObj3d.position)
                tempVec3.set(0, 0, distance);
                tempVec3.applyQuaternion(ThreeAPI.camera.quaternion);

                camTargetPos.add(tempVec3)
                camTargetPos.y += (distance * (4 - tempVec3.y) * (tpf + Math.abs(selectedActor.getStatus(ENUMS.ActorStatus.STATUS_CLIMB_RATE))));
                camPosVec.lerp(camTargetPos, tpf * 1) // + lerpFactor * 2)


                tempVec3.set(0, 1, 0);
                tempVec3.applyQuaternion(actorQuat);
                ThreeAPI.getCamera().up.lerp(tempVec3, tpf - 0.2 * tpf * Math.abs(selectedActor.getControl(ENUMS.Controls.CONTROL_ROLL)));

            }


        updateCursorFrame();

    //    debugDrawCursor();
    }

}

export { CameraSpatialCursor }