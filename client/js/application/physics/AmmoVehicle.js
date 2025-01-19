import {AmmoVehicleProcessor} from "./AmmoVehicleProcessor.js";

let wheelsMat = [
    [-0.1, 0.0, 1], [0.1, 0.0, 1],
    [-1, 0.0, -1], [1, 0.0, -1]
];

class AmmoVehicle {
    constructor(physicsWorld, body, wheelsCfg, tuningCfg) {

        let Ammo = AmmoAPI.getAmmo();

        let width = 5;
        let height = 1;
        let length = 5;
        let clearance = 2;
        let mass = 200000

        let wOpts = {};

        let DISABLE_DEACTIVATION = 4;

        let wheelMatrix =  wheelsMat;

        let maxSusForce = (mass * 10 / wheelsCfg.length) * 10;
        let susStiffness = 5; // wheelMatrix.length;

        let frictionSlip = wOpts.frictionSlip || 2;
        let suspensionStiffness = susStiffness;
        let suspensionDamping = wOpts.suspensionDamping || 2.3;
        let dampingRelaxation = wOpts.dampingRelaxation || 5;
        let dampingCompression = wOpts.dampingCompression || 2;
        let suspensionCompression = wOpts.suspensionCompression || 4.4;
        let suspensionRestLength = wOpts.suspensionLength || 2.6;
        let suspensionTravelCm = wOpts.suspensionTravelCm || suspensionRestLength * 100;
        let rollInfluence = wOpts.rollInfluence || 0.1;
        let radius = wOpts.radius || 0.5;

        let wheelY = -height / 2 + radius - clearance;


        // Chassis
/*
        let geometry = new Ammo.btBoxShape(new Ammo.btVector3(width * .5, height * .5, length * .5));
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(1213, 102 + height + radius + clearance, 2540));
        transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
        let motionState = new Ammo.btDefaultMotionState(transform);
        let localInertia = new Ammo.btVector3(0, 1, 0);
        geometry.calculateLocalInertia(mass, localInertia);

        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, geometry, localInertia)
        rbInfo.set_m_linearSleepingThreshold(0.0);
        rbInfo.set_m_angularSleepingThreshold(0.0);

        body = new Ammo.btRigidBody(rbInfo);
*/

        body.setActivationState(DISABLE_DEACTIVATION);


        let mainTuning = tuningCfg['main']

        let tuning = new Ammo.btVehicleTuning();

        tuning.set_m_frictionSlip(frictionSlip);
        tuning.set_m_maxSuspensionForce(mainTuning['max_sus_force'] || maxSusForce);
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

        function addWheel(wheelCfg) {

            oddEven = -oddEven;

            let pos = new Ammo.btVector3(wheelCfg.pos[0], wheelCfg.pos[1], wheelCfg.pos[2]);

            let wheelTuning = tuning;

            let isFront = wheelCfg['front'] || false;

            if (isFront) {
                let frontTuning = tuningCfg['front']
                wheelTuning = new Ammo.btVehicleTuning();
                wheelTuning.set_m_frictionSlip(frictionSlip);
                wheelTuning.set_m_maxSuspensionForce(frontTuning['max_sus_force'] || maxSusForce);
                wheelTuning.set_m_maxSuspensionTravelCm(suspensionTravelCm);
                wheelTuning.set_m_suspensionCompression(suspensionCompression);
                wheelTuning.set_m_suspensionDamping(suspensionDamping);
                wheelTuning.set_m_suspensionStiffness(susStiffness);
            }

            let wheelInfo = vehicle.addWheel(
                pos,
                wheelDirectionCS0,
                wheelAxleCS,
                suspensionRestLength,
                radius,
                wheelTuning,
                isFront);

            wheelInfo.set_m_suspensionStiffness(suspensionStiffness);
            wheelInfo.set_m_wheelsDampingRelaxation(dampingRelaxation);
            wheelInfo.set_m_wheelsDampingCompression(dampingCompression);
            wheelInfo.set_m_frictionSlip(frictionSlip);
            wheelInfo.set_m_rollInfluence(rollInfluence);
        }

        for (let i = 0; i < wheelsCfg.length; i++) {
            addWheel(wheelsCfg[i]);
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
        this.processor = new AmmoVehicleProcessor(vehicle, wheelMatrix, dynamic);
    }
}

export { AmmoVehicle }








