import {AmmoVehicleProcessor} from "./AmmoVehicleProcessor.js";

let wheelsMat = [
    [-1, 0.9, 1], [1, 0.9, 1],
    [-1, -0.9, 1], [1, -0.9, 1]
];

class AmmoVehicle {
    constructor(physicsWorld, body) {

        let Ammo = AmmoAPI.getAmmo();

        let width = 15;
        let height = 15;
        let length = 18;
        let clearance = 15;
        let mass = 21400000

        let wOpts = {};

        let DISABLE_DEACTIVATION = 4;

        let wheelMatrix =  wheelsMat;

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

        body.setActivationState(DISABLE_DEACTIVATION);

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

            let pos = new Ammo.btVector3(0.5 * -width * wheelMatrix[i][0], wheelY + wheelMatrix[i][1], 0.5 * length * wheelMatrix[i][2]);

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
        this.processor = new AmmoVehicleProcessor(vehicle, wheelMatrix, dynamic);
    }
}

export { AmmoVehicle }








