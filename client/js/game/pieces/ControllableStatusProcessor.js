import {ENUMS} from "../../application/ENUMS.js";
import {MATH} from "../../application/MATH.js";
import {Quaternion} from "../../../../libs/three/Three.Core.js";

let tempQuat = new Quaternion();

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