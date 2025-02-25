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
        const mach = MATH.mpsAtAltToMach(assetStatus.getStatus(ENUMS.InstanceStatus.SPEED_AIR))
        controllable.setStatusKey(ENUMS.ControllableStatus.SPEED_MACH, MATH.numberToDigits(mach, 2, 2), rootNode.position.y);
        controllable.setStatusKey(ENUMS.ControllableStatus.STATUS_SPEED, MATH.numberToDigits(MATH.mpsToKmph(assetStatus.getStatus(ENUMS.InstanceStatus.SPEED_AIR)), 0));
        controllable.setStatusKey(ENUMS.ControllableStatus.STATUS_CLIMB_RATE, MATH.numberToDigits(ammoVel.y(), 1, 1));

        const throttle = assetStatus.getStatus(ENUMS.InstanceStatus.STATUS_THROTTLE);
        if (throttle < 0.4) {
            assetStatus.setStatusKey(ENUMS.InstanceStatus.STATUS_BRAKE, (0.4 - throttle)*2);
        } else {
            assetStatus.setStatusKey(ENUMS.InstanceStatus.STATUS_BRAKE, 0);
        }
        const pitchInput = assetStatus.getStatus(ENUMS.InstanceStatus.STATUS_PITCH_INPUT);

        if (pitchInput > 0.1) {
            if (mach < 0.6) {
                assetStatus.setStatusKey(ENUMS.InstanceStatus.SLAT_ENGAGE, 1);
            } else {
                assetStatus.setStatusKey(ENUMS.InstanceStatus.SLAT_ENGAGE, 0);
            }
        } else {
            assetStatus.setStatusKey(ENUMS.InstanceStatus.SLAT_ENGAGE, 0);
        }

        if (MATH.valueIsBetween(mach, 0.6, 1.7)) {
            assetStatus.setStatusKey(ENUMS.InstanceStatus.CANARD_ENGAGE, MATH.clamp(Math.abs(pitchInput)*2), 0, 1);
        }

        if (mach > 0.5) {
            const sweep = MATH.clamp(MATH.calcFraction(0.5, 0.95, mach), 0, 1);
            assetStatus.setStatusKey(ENUMS.InstanceStatus.SWEEP_ENGAGE, sweep);
        } else {
            assetStatus.setStatusKey(ENUMS.InstanceStatus.SWEEP_ENGAGE, 0);
        }

        if (mach < 0.001) {
            assetStatus.setStatusKey(ENUMS.InstanceStatus.FLAP_ENGAGE, 1);
        } else if (mach < 0.02) {
            assetStatus.setStatusKey(ENUMS.InstanceStatus.FLAP_ENGAGE, 1.1);
        } else if (mach < 0.17) {
            assetStatus.setStatusKey(ENUMS.InstanceStatus.FLAP_ENGAGE, 1.0);
        } else if (mach < 0.25) {
            assetStatus.setStatusKey(ENUMS.InstanceStatus.FLAP_ENGAGE, 0.5);
        } else {
            assetStatus.setStatusKey(ENUMS.InstanceStatus.FLAP_ENGAGE, 0);
        }

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