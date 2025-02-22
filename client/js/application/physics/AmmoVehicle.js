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
        let susStiffness = 25; // wheelMatrix.length;

        let frictionSlip = 3;

        let suspensionDamping = wOpts.suspensionDamping || 2.7;
        let dampingRelaxation = wOpts.dampingRelaxation || 6;
        let dampingCompression = wOpts.dampingCompression || 2.7;

        let rollInfluence = wOpts.rollInfluence || 0.1;
        let radius = wOpts.radius || 0.5;

        let wheelY = -height / 2 + radius - clearance;


        body.setActivationState(DISABLE_DEACTIVATION);


        let mainTuning = tuningCfg['main']



        let suspensionCompression = wOpts.suspensionCompression || 4.4;
        let suspensionRestLength = mainTuning['sus_length'] || 2.6;


        maxSusForce = mainTuning['max_sus_force'] || maxSusForce
        let suspLength = mainTuning['sus_length'] || 2.6;
        susStiffness = mainTuning['sus_stiffness'] || susStiffness
        let suspensionTravelCm = suspLength * 50;
        let wheelTuning = new Ammo.btVehicleTuning();
        wheelTuning.set_m_maxSuspensionTravelCm(suspensionTravelCm);
        wheelTuning.set_m_maxSuspensionForce(maxSusForce);
        wheelTuning.set_m_frictionSlip(frictionSlip);
        wheelTuning.set_m_suspensionDamping(suspensionDamping);
        wheelTuning.set_m_suspensionStiffness(susStiffness);
        wheelTuning.set_m_suspensionCompression(suspensionCompression);

        let rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
        console.log("Vehicle Ray Caster: ", rayCaster);
        let vehicle = new Ammo.btRaycastVehicle(wheelTuning, body, rayCaster);

        vehicle.setCoordinateSystem(0, 1, 2);
        physicsWorld.addAction(vehicle);

        // Wheels
        let wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);

        let wheelAxleCS = new Ammo.btVector3(1, 0, 0);

        let oddEven = 1;


        function addWheel(wheelCfg) {

            oddEven = -oddEven;

            let pos = new Ammo.btVector3(wheelCfg.pos[0], wheelCfg.pos[1], wheelCfg.pos[2]);


            let isFront = wheelCfg['front'] || false;

            suspensionRestLength = mainTuning['sus_length'] || 2.6;
            maxSusForce = mainTuning['max_sus_force'] || maxSusForce;

            if (isFront) {
                let frontTuning = tuningCfg['front']
                suspensionRestLength = frontTuning['sus_length'] || 2.6;
                maxSusForce = frontTuning['max_sus_force'] || maxSusForce
                radius = frontTuning['radius'] || 0.5;
            } else {
                radius = mainTuning['radius'] || 0.5;
            }


            let wheelInfo = vehicle.addWheel(
                pos,
                wheelDirectionCS0,
                wheelAxleCS,
                suspensionRestLength,
                radius,
                wheelTuning,
                isFront);

            wheelInfo.set_m_maxSuspensionForce(maxSusForce);
            wheelInfo.set_m_suspensionStiffness(susStiffness);
            wheelInfo.set_m_wheelsDampingRelaxation(dampingRelaxation);
            wheelInfo.set_m_wheelsDampingCompression(dampingCompression);
            wheelInfo.set_m_frictionSlip(frictionSlip);
            wheelInfo.set_m_rollInfluence(rollInfluence);
            console.log("wheel info", wheelInfo);
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








