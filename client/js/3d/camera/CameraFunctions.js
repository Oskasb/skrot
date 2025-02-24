import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {getFrame} from "../../application/utils/DataUtils.js";
import {MATH} from "../../application/MATH.js";
import {Quaternion} from "../../../../libs/three/math/Quaternion.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";

let lastTargetPos = new Vector3();
let lastCamPos = new Vector3();
let posFrameDelta = new Vector3();
let tempVec = new Vector3();
let tempVec2 = new Vector3()
let tempQuat = new Quaternion();
let tempObj = new Object3D();


function CAM_ORBIT(controllable, orbitControls) {
    const pointName = 'CREW_VIEW_PILOT';
    const point = controllable.getDynamicPoint(pointName);
    if (!point) {
        return;
    }
    point.updateDynamicPoint()
    tempVec.set(0, 1, 0);
    lastCamPos.copy(orbitControls.target);
    orbitControls.target.copy(point.getPos());
    posFrameDelta.subVectors(orbitControls.target, lastCamPos)
    orbitControls.camera.position.add(posFrameDelta);

    orbitControls.camera.up.copy(tempVec)
    orbitControls.minDistance = 0.5;
    orbitControls.maxDistance = 8000;
    orbitControls.update();
    lastCamPos.copy(orbitControls.camera.position);
}

function CAM_FOLLOW(controllable, orbitControls) {
    const tpf = getFrame().tpf;
    const pointName = 'CREW_VIEW_PILOT';
    const point = controllable.getDynamicPoint(pointName);
    point.updateDynamicPoint()
    tempVec.set(0, 1, 0);
    tempVec.applyQuaternion(point.getQuat())
    tempObj.lookAt(tempVec);

    lastCamPos.copy(orbitControls.target);
    tempVec.multiplyScalar(3)

    orbitControls.target.copy(point.getPos());
    orbitControls.target.add(tempVec)
    posFrameDelta.subVectors(orbitControls.target, lastCamPos)

    orbitControls.camera.up.lerp(tempVec, tpf)
    orbitControls.minDistance = 50;
    orbitControls.maxDistance = 50;
    orbitControls.update();
    lastCamPos.copy(orbitControls.camera.position);
}

function CAM_PILOT(controllable, orbitControls) {

    const tpf = getFrame().tpf;
    const pointName = 'CREW_VIEW_PILOT';
    const point = controllable.getDynamicPoint(pointName);
    point.updateDynamicPoint()
    tempVec.set(0, 1, 0);

    if (orbitControls._pointers.length !== 0) {
        lastCamPos.copy(orbitControls.target);
        orbitControls.target.copy(point.getPos());
        posFrameDelta.subVectors(orbitControls.target, lastCamPos)
        orbitControls.camera.position.add(posFrameDelta);
        tempVec.applyQuaternion(point.getQuat())
        orbitControls.camera.up.copy(tempVec)
        orbitControls.update();
    } else {
        tempVec.applyQuaternion(point.getQuat())
        orbitControls.target.copy(point.getPos());
        orbitControls.camera.up.copy(tempVec)
        //  orbitControls.camera.quaternion.slerp(tempObj.quaternion, MATH.clamp(tpf * 2, 0, 0.5) )
        orbitControls.minDistance = 0.35;
        orbitControls.maxDistance = 0.35;
        orbitControls.update();
        lastCamPos.copy(orbitControls.camera.position);
    }


}

function CAM_WORLD(targetPos, orbitControls) {
    orbitControls.minDistance = 0.5;
    orbitControls.maxDistance = 8000;
    lastCamPos.copy(orbitControls.target);
    orbitControls.target.copy(targetPos);
    posFrameDelta.subVectors(orbitControls.target, lastCamPos)
    orbitControls.camera.position.add(posFrameDelta);
    orbitControls.update();
    lastCamPos.copy(orbitControls.camera.position);
}

function CAM_POINT(controllable, orbitControls, pointName, params) {
    const tpf = getFrame().tpf;
    const point = controllable.getDynamicPoint(pointName);
    point.updateDynamicPoint()
    tempVec.set(0, 1, 0);
    lastTargetPos.copy(orbitControls.target);
    orbitControls.target.copy(point.getPos());
    posFrameDelta.subVectors(orbitControls.target, lastTargetPos)
    orbitControls.camera.position.add(posFrameDelta);


    if (params['local_up']) {
        tempVec.applyQuaternion(point.getQuat())
    }

    orbitControls.camera.up.copy(tempVec)
    orbitControls.minDistance = params.min || 0.5;
    orbitControls.maxDistance = params.max || 8000;

    orbitControls.update();

    if (params['is_local']) {
        if (Math.abs(posFrameDelta.y) > 2) {
            posFrameDelta.y = 0;
        }
        orbitControls.camera.position.y += posFrameDelta.y;
    }

    lastCamPos.copy(orbitControls.camera.position);
}

const cameraFunctions = {}
cameraFunctions['CAM_ORBIT'] = CAM_ORBIT
cameraFunctions['CAM_FOLLOW'] = CAM_FOLLOW
cameraFunctions['CAM_PILOT'] = CAM_PILOT
cameraFunctions['CAM_WORLD'] = CAM_WORLD
cameraFunctions['CAM_POINT'] = CAM_POINT

export {cameraFunctions}