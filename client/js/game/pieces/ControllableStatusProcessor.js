import {ENUMS} from "../../application/ENUMS.js";
import {MATH} from "../../application/MATH.js";
import {Quaternion, Vector3} from "../../../../libs/three/Three.Core.js";

let tempQuat = new Quaternion();
let tempVec = new Vector3();

function sampleSpatialState(controllable) {
    let rootNode = controllable.getObj3d();
    tempQuat.copy(rootNode.quaternion)

    let pitch = MATH.horizonAttitudeFromQuaternion(rootNode.quaternion) //  + MATH.HALF_PI // MATH.pitchFromQuaternion(rootNode.quaternion);
    let roll = MATH.rollAttitudeFromQuaternion(rootNode.quaternion);
    let yaw = MATH.compassAttitudeFromQuaternion(rootNode.quaternion);

 //   roll = rootNode.rotation.z;

    controllable.setStatusKey(ENUMS.ControllableStatus.STATUS_PITCH, pitch);
    controllable.setStatusKey(ENUMS.ControllableStatus.STATUS_ROLL, roll);
    controllable.setStatusKey(ENUMS.ControllableStatus.STATUS_YAW, yaw);
    controllable.setStatusKey(ENUMS.ControllableStatus.STATUS_ELEVATION, Math.round(rootNode.position.y));
    controllable.setStatusKey(ENUMS.ControllableStatus.STATUS_ANGLE_NORTH, yaw);
    controllable.setStatusKey(ENUMS.ControllableStatus.STATUS_ANGLE_EAST, MATH.angleInsideCircle(yaw+MATH.HALF_PI));
    controllable.setStatusKey(ENUMS.ControllableStatus.STATUS_ANGLE_SOUTH, MATH.angleInsideCircle(yaw+MATH.HALF_PI*2));
    controllable.setStatusKey(ENUMS.ControllableStatus.STATUS_ANGLE_WEST, MATH.angleInsideCircle(yaw-MATH.HALF_PI));

    if (controllable.assetInstance) {
        const ammoVel = controllable.assetInstance.getObj3d().userData.body.getLinearVelocity();
        const assetStatus = controllable.assetInstance.status;
        tempVec.set(ammoVel.x(), ammoVel.y(), ammoVel.z());
        controllable.setStatusKey(ENUMS.ControllableStatus.STATUS_SPEED, MATH.numberToDigits(assetStatus.getStatus(ENUMS.InstanceStatus.SPEED_AIR), 0));
        controllable.setStatusKey(ENUMS.ControllableStatus.STATUS_CLIMB_RATE, MATH.numberToDigits(ammoVel.y(), 1, 1));
    }

}

function processControllableStatus(controllable) {
    sampleSpatialState(controllable)
}


class ControllableStatusProcessor {

    constructor(controllable) {


        for (let key in ENUMS.ControllableStatus) {
            controllable.setStatusKey(ENUMS.ControllableStatus[key], 0);
        }

        function updateControllableStatus() {
            processControllableStatus(controllable)
        }

        ThreeAPI.addPrerenderCallback(updateControllableStatus)
    }
}

export { ControllableStatusProcessor }