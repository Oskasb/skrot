import {MATH} from "../MATH.js";
import {Quaternion, Vector3} from "../../../../libs/three/Three.Core.js";
import {AmmoInfoParser} from "./AmmoInfoParser.js";

let drive_train = {
    "rpm_min":200,
    "rpm_max":2500,
    "gears":[120, 40, 20, 12, 3, 2, 1],
    "enginePower": 1000,
    "brake"      : 800
};

let dyn = {
    gearIndex:   {state:0},
    clutch:      {state:0},
    rpm:         {state:0},
    brake:       {state:0},
    brakeCommand:{state:0}
};

let steerMat = [
    1, 1,
    0, 0
];

let brakeMat = [
    0.2,0.2,
    1  ,1
];

let transmissionMat = [
    1,1,
    0,0
];

let transmissionYawMat = [
    0,0,
    0,0
];

let getWheelInfo = function(vehicle) {
    return vehicle.getWheelInfo();
};

let superDrag = 0;
let vehicleQuat = new Quaternion();
let vec3 = new Vector3();
let calcVec = new Vector3();
let TRANSFORM_AUX;
let VECTOR_AUX;


    class AmmoVehicleProcessor {

    constructor(vehicle, wheelMatrix, dynamic) {

        let numWheels = vehicle.getNumWheels();

        if (!TRANSFORM_AUX) {
            let Ammo = AmmoAPI.getAmmo();
            TRANSFORM_AUX = new Ammo.btTransform();
            VECTOR_AUX = new Ammo.btVector3()
        }

        this.wheelInfos = [];

        for (let i = 0; i < numWheels; i++) {
            let info = vehicle.getWheelInfo(i);
            let transform = vehicle.getWheelTransformWS(i);
            this.wheelInfos.push(new AmmoInfoParser(info, transform));
        }

        this.driveTrain = drive_train;
        this.wheelMatrix =  wheelMatrix;
        this.steerMatrix =  steerMat;
        this.brakeMatrix =  brakeMat;
        this.transmissionMatrix = transmissionMat;
        this.transmissionYawMatrix =  transmissionYawMat;

        this.dynamic = dynamic || dyn;

        this.controls = {};

        this.lastInputState = 0;
        this.gearIndex = 0;

        this.lastbrakeState = 0;
        this.framelWheelRotation = 0;
        this.brakeCommand = 0;
    };

    sampleControlState(piece, controlMap) {

        for (let i = 0; i < controlMap.length; i++) {
            let state = piece.getPieceStateByStateId(controlMap[i].stateid).getValue();
            this.controls[controlMap[i].control] = state * controlMap[i].factor;
        }
    };

    determineRpm(dynamic, driveTrain, accelerateIntent) {

        let gears = driveTrain.gears;
        let transmissionScale = 0.001;
        let gearFactor = Math.abs(gears[this.gearIndex] * this.framelWheelRotation) * transmissionScale;
        let minRpm = driveTrain.rpm_min+1;
        let rpmSpan = driveTrain.rpm_max - minRpm;
        let revUpFrameLimit = 0.04 * rpmSpan;
        let maxRpm = minRpm + rpmSpan * 0.45 + rpmSpan* 0.55 * accelerateIntent;
        let targetRpm = gearFactor * maxRpm ;
        let clutch = 1-dynamic.clutch.state;

        if (accelerateIntent > 0) {
            targetRpm = Math.clamp(dynamic.rpm.state / driveTrain.rpm_max + clutch * revUpFrameLimit, minRpm, driveTrain.rpm_max) ;
        } else {
            targetRpm = Math.clamp((targetRpm - clutch * revUpFrameLimit*0.5), minRpm * 0.5, maxRpm*0.2) ;
        }

        if (targetRpm > dynamic.rpm.state * driveTrain.rpm_max) {

        } else {

        }

        dynamic.rpm.state = targetRpm / driveTrain.rpm_max;

    };

    determineGearIndex(dynamic, driveTrain, brake) {
        let gears = driveTrain.gears;
        dynamic.clutch.state = 0;
        let rpm = dynamic.rpm.state * driveTrain.rpm_max;
        let gearModulation = 1 // 0.8 - 0.2 * (driveTrain.rpm_max - driveTrain.rpm_min) * (gears.length - this.gearIndex) / gears.length * driveTrain.rpm_max;

        if (rpm * gearModulation < driveTrain.rpm_min + Math.random() * driveTrain.rpm_min * 0.1 + brake * driveTrain.rpm_max) {

            dynamic.clutch.state = 1;
            if (this.gearIndex === 0) {

            } else {
                this.gearIndex--;
            }

        } else if (rpm * gearModulation > driveTrain.rpm_max - Math.random() * driveTrain.rpm_max*0.1) {
            if (this.gearIndex === gears.length - 1) {
            } else {
                dynamic.clutch.state = 1;
                this.gearIndex++
            }
        }
        dynamic.gearIndex.state = this.gearIndex;

    };

    determineBrakeState(dynamic, speedInputState, driveTrain) {
        //    if ()
        let wheelFactor = speedInputState*this.framelWheelRotation * 1;
        let brakeState = MATH.clamp(-wheelFactor, 0, 1);
        let dirSwitch = speedInputState * this.lastInputState;

        if (this.lastbrakeState) {
            this.brakeCommand += 0.02;
        }

        if (speedInputState === this.lastInputState && Math.abs(this.lastbrakeState)) {
            this.brakeCommand += 0.02;
        }

        if (wheelFactor > 0) {
            if (Math.abs(speedInputState) > Math.abs(this.lastInputState)) {
                this.brakeCommand = 0;
            }
        } else {
            this.brakeCommand += 0.05;
        }

        if (dirSwitch < 0) {
            //    this.brakeCommand = 0;
        }

        if (Math.abs(speedInputState) > 0.1 && Math.abs(speedInputState) > Math.abs(this.lastInputState)) {
            this.brakeCommand = 0;
        }

        this.brakeCommand = MATH.clamp(this.brakeCommand, 0, 1);
        dynamic.brake.state = brakeState;
        dynamic.brakeCommand.state = this.brakeCommand;
        this.lastbrakeState = MATH.clamp(brakeState*this.brakeCommand + this.brakeCommand * 0.4, 0, 1);
        this.lastInputState = speedInputState;
    };

    determineForwardState(speedInputState) {
        if (speedInputState === 0) {
            return this.lastInputState;
        }

        return speedInputState;
    };



    applyControlState(target, controls) {

        let driveTrain = this.driveTrain;

        let dynamic = this.dynamic;

        let speedInputState = controls.forward_state + controls.reverse_state;

        let accelerateIntent = this.determineForwardState(speedInputState);

        this.determineBrakeState(dynamic, accelerateIntent, driveTrain);
        this.determineRpm(dynamic, driveTrain, accelerateIntent);
        this.determineGearIndex(dynamic, driveTrain, dynamic.brake.state);

        let yaw_state = controls.yaw_state + controls.steer_reverse;
        yaw_state *= driveTrain.gears.length / (driveTrain.gears.length + dynamic.gearIndex.state * 2);
        let powerState = accelerateIntent * driveTrain.enginePower * driveTrain.gears[dynamic.gearIndex.state] * dynamic.rpm.state;
        powerState *= (1-Math.abs(yaw_state*0.7));

        this.framelWheelRotation = 0;

        let numWheels = target.getNumWheels();
        let body = target.getRigidBody();
        body.getMotionState().getWorldTransform(TRANSFORM_AUX);

        if (!this.lastbrakeState) {
            superDrag = 0;
            VECTOR_AUX.setX(1);
            VECTOR_AUX.setY(1);
            VECTOR_AUX.setZ(1);
            body.setLinearFactor(VECTOR_AUX);
        } else {

            superDrag = Math.clamp(superDrag + this.brakeCommand, 0, 1);
            VECTOR_AUX.setX(1 - superDrag);
            VECTOR_AUX.setY(1);
            VECTOR_AUX.setZ(1 - superDrag);
            body.setLinearFactor(VECTOR_AUX);

        }

        let q = TRANSFORM_AUX.getRotation();

        vehicleQuat.set(q.x(), q.y(), q.z(), q.w());

        let steerYaw;
        let brake;

        for (let i = 0; i < numWheels; i++) {

            let yawFactor = this.transmissionYawMatrix[i] * yaw_state;

            steerYaw = yaw_state* this.steerMatrix[i];

            brake = 0;

            if (Math.abs(this.lastbrakeState)) {
                brake = this.lastbrakeState * this.brakeMatrix[i] * driveTrain.brake;
                steerYaw += MATH.clamp(this.transmissionYawMatrix[i] * this.lastbrakeState * 2, -1.0, 1.0);
                target.setBrake(brake, i);
                target.applyEngineForce(0, i);
            } else {
                target.setBrake(0, i);
                target.applyEngineForce(powerState * this.transmissionMatrix[i] + powerState * this.transmissionMatrix[i] * yawFactor , i);
            }

            target.setSteeringValue(steerYaw, i);
            target.updateWheelTransform(i, false);

            this.framelWheelRotation = this.wheelInfos[i].updateValue('deltaRotation', vehicleQuat) * (1 - superDrag);

        }

        this.lastbrakeState = 0;

    };

    interpretVehicleState(param, key, property) {

        if (param === "wheelInfos") {
            return this.wheelInfos[key].getValue(property);
        }

        return this[param][key][property];
    };

    clearFeedbackMap(piece, feedback) {
        let targetStateId = feedback.stateid;
        let state =         piece.getPieceStateByStateId(targetStateId);
        state.value =       0;
    };

    applyFeedbackMap(target, piece, feedback) {
        let param =         feedback.param;
        let key =           feedback.key;
        let property =      feedback.property;
        let targetStateId = feedback.stateid;
        let factor =        feedback.factor;
        let state =         piece.getPieceStateByStateId(targetStateId) ;
        state.value +=      this.interpretVehicleState(param, key, property) * factor;
    };

    //  let speed = vehicle.getCurrentSpeedKmHour();

    sampleVehicle(target, piece, feedbackMap) {

        for (let i = 0; i < feedbackMap.length; i++) {
            this.clearFeedbackMap(piece, feedbackMap[i]);
        }

        for (let i = 0; i < feedbackMap.length; i++) {
            this.applyFeedbackMap(target, piece, feedbackMap[i]);
        }

    };


    constrainRotation(body, threeObj) {
        let safeAngle = 0.6;
        let criticalAngle = 0.6;
        let slugX = 1;
        let slugZ = 1;
        let critical = false;

        vec3.set(0,1,0);
        vec3.applyQuaternion(threeObj.quaternion);

        if (Math.abs(vec3.x) > safeAngle) {
            slugX = 0.5;

            if (Math.abs(vec3.x) > criticalAngle) {
                critical = true;
            }
        }

        if (Math.abs(vec3.z) > safeAngle) {
            slugZ = 0.5;
            if (Math.abs(vec3.z) > criticalAngle) {
                critical = true;
            }
        }

        if (critical) {
            let y= threeObj.rotation.y;
            threeObj.rotation.x = 0;
            threeObj.rotation.z = 0;
            calcVec.set(0,0,1);
            calcVec.applyQuaternion(threeObj.quaternion);
            threeObj.quaternion.x = 0;
            threeObj.quaternion.y = y;
            threeObj.quaternion.z = 0;
            threeObj.quaternion.w = 1;

            threeObj.quaternion.normalize();

            let ms = body.getMotionState();
            ms.getWorldTransform(TRANSFORM_AUX);

            TRANSFORM_AUX.setIdentity();

            TRANSFORM_AUX.getOrigin().setX(threeObj.position.x);
            TRANSFORM_AUX.getOrigin().setY(threeObj.position.y);
            TRANSFORM_AUX.getOrigin().setZ(threeObj.position.z);

            TRANSFORM_AUX.getRotation().setX(0);
            TRANSFORM_AUX.getRotation().setY(y);
            TRANSFORM_AUX.getRotation().setZ(0);
            TRANSFORM_AUX.getRotation().setW(1);
            TRANSFORM_AUX.getRotation().normalize();
            ms.setWorldTransform(TRANSFORM_AUX);
            //    body.setWorldTransform(TRANSFORM_AUX);
            body.getAngularVelocity().setX(0);
            body.getAngularVelocity().setY(0);
            body.getAngularVelocity().setZ(0);
        }

        VECTOR_AUX.setX(slugX);
        VECTOR_AUX.setY(1);
        VECTOR_AUX.setZ(slugZ);
        body.setAngularFactor(VECTOR_AUX);

    };

    sampleState(body, piece, config) {

        let controlMap = config.control_map;
        let feedbackMap = config.feedback_map;
        let target = piece[config.shape];

        this.sampleControlState(piece, controlMap);
        this.applyControlState(target, this.controls);

        if (feedbackMap) {
            this.sampleVehicle(target, piece, feedbackMap);
            this.constrainRotation(body, piece.rootObj3D);
        }

    };

}


export { AmmoVehicleProcessor }