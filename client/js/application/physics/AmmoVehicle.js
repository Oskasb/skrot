import {AmmoVehicleProcessor} from "./AmmoVehicleProcessor.js";

let wheelsMat = [
    [-1, 0.9, 1], [1, 0.9, 1],
    [-1, -0.9, 1], [1, -0.9, 1]
];

let steerMat = [
    1, 1,
    0, 0
];

let brakeMat = [
    0.2, 0.2,
    1, 1
];

let transmissionMat = [
    1, 1,
    0, 0
];

let transmissionYawMat = [
    0, 0,
    0, 0
];
class AmmoVehicle {
    constructor(physicsWorld, bodyParams, pos, quat) {

        let width = bodyParams.width || 1.5;
        let length = bodyParams.length || 3.1;
        let height = bodyParams.height || 1.1;
        let clearance = bodyParams.clearance || 0.2;
        let mass = bodyParams.mass || 1000;

        let restitution = bodyParams.restitution || 0.5;
        let damping = bodyParams.damping || 0.5;
        let friction = bodyParams.friction || 2.9;

        let wOpts = bodyParams.wheelOptions || {};
        let DISABLE_DEACTIVATION = 4;

        let chassisWidth = width;
        let chassisHeight = height;
        let chassisLength = length;
        let massVehicle = mass;

        let wheelMatrix = bodyParams.wheelMatrix || wheelsMat;

        let steerMatrix = bodyParams.steerMatrix || steerMat;
        let brakeMatrix = bodyParams.brakeMatrix || brakeMat;
        let transmissionMatrix = bodyParams.transmissionMatrix || transmissionMat;
        let transmissionYawMatrix = bodyParams.transmissionYawMatrix || transmissionYawMat;

        let maxSusForce = (mass * 10 / wheelMatrix.length) * 50;
        let susStiffness = 10; // wheelMatrix.length;

        let frictionSlip = wOpts.frictionSlip || 2;
        let suspensionStiffness = susStiffness;
        let suspensionDamping = wOpts.suspensionDamping || 2.3;
        let dampingRelaxation = wOpts.dampingRelaxation || 5;
        let dampingCompression = wOpts.dampingCompression || 2;
        let suspensionCompression = wOpts.suspensionCompression || 4.4;
        let suspensionRestLength = wOpts.suspensionLength || 0.6;
        let suspensionTravelCm = wOpts.suspensionTravelCm || suspensionRestLength * 100;
        let rollInfluence = wOpts.rollInfluence || 0.1;
        let radius = wOpts.radius || 0.5;

        let wheelY = -height / 2 + radius - clearance;

        // Chassis
        let geometry = new Ammo.btBoxShape(new Ammo.btVector3(chassisWidth * .5, chassisHeight * .5, chassisLength * .5));
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y + height + radius + clearance, pos.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        let motionState = new Ammo.btDefaultMotionState(transform);
        let localInertia = new Ammo.btVector3(0, 1, 0);
        geometry.calculateLocalInertia(massVehicle, localInertia);

        let rbInfo = new Ammo.btRigidBodyConstructionInfo(massVehicle, motionState, geometry, localInertia)
        rbInfo.set_m_linearSleepingThreshold(0.0);
        rbInfo.set_m_angularSleepingThreshold(0.0);

        let body = new Ammo.btRigidBody(rbInfo);
        body.setActivationState(DISABLE_DEACTIVATION);

        body.setRestitution(restitution);
        body.setFriction(friction);
        body.setDamping(damping, damping);

        let tuning = new Ammo.btVehicleTuning();

        tuning.set_m_frictionSlip(frictionSlip);
        tuning.set_m_maxSuspensionForce(maxSusForce);
        tuning.set_m_maxSuspensionTravelCm(suspensionTravelCm);
        tuning.set_m_suspensionCompression(suspensionCompression);
        tuning.set_m_suspensionDamping(suspensionDamping);
        tuning.set_m_suspensionStiffness(susStiffness);


        let rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
        let vehicle = new Ammo.btRaycastVehicle(tuning, body, rayCaster);

        vehicle.setCoordinateSystem(0, 1, 2);
        physicsWorld.addAction(vehicle);

        // Wheels
        let wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);

        let wheelAxleCS = new Ammo.btVector3(1, 0, 0);

        let oddEven = 1;

        function addWheel(i) {

            oddEven = -oddEven;

            pos = new Ammo.btVector3(0.5 * -width * wheelMatrix[i][0], wheelY + wheelMatrix[i][1], 0.5 * length * wheelMatrix[i][2]);

            let isFront = false;
            if (i === 0 || i === 1) {
                isFront = true;
            }
            let wheelInfo = vehicle.addWheel(
                pos,
                wheelDirectionCS0,
                wheelAxleCS,
                suspensionRestLength,
                radius,
                tuning,
                isFront);

            wheelInfo.set_m_suspensionStiffness(suspensionStiffness);
            wheelInfo.set_m_wheelsDampingRelaxation(dampingRelaxation);
            wheelInfo.set_m_wheelsDampingCompression(dampingCompression);
            wheelInfo.set_m_frictionSlip(frictionSlip);
            wheelInfo.set_m_rollInfluence(rollInfluence);
        }

        for (let i = 0; i < wheelMatrix.length; i++) {
            addWheel(i);
        }

        let dynamic = {
            gearIndex: {state: 0},
            clutch: {state: 0},
            rpm: {state: 0},
            brake: {state: 0},
            brakeCommand: {state: 0}
        };

        this.body = body;
        this.vehicle = vehicle;
        this.processor = new AmmoVehicleProcessor(vehicle, bodyParams, dynamic);
    }
}

export { AmmoVehicle }








