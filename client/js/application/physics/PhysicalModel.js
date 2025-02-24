import {
    ammoTranformToObj3d,
    bodyTransformToObj3d,
    calcBoxSubmersion,
    getBodyVelocity,
    getPhysicalWorld,
    rayTest, setBodyVelocity, transformBody
} from "../utils/PhysicsUtils.js";
import {Vector3} from "../../../../libs/three/Three.Core.js";
import {MATH} from "../MATH.js";
import {ENUMS} from "../ENUMS.js";
import {evt} from "../event/evt.js";
import {getFrame} from "../utils/DataUtils.js";
import {jsonAsset} from "../utils/AssetUtils.js";
import {AmmoVehicle} from "./AmmoVehicle.js";
import {Object3D} from "three/webgpu";
import {Quaternion} from "three";
import {getSetting} from "../utils/StatusUtils.js";

const tempVec = new Vector3();

const tempVec2 = new Vector3();
const tempVec3 = new Vector3();

const lineFrom = new Vector3();
const lineTo = new Vector3();

const tempObj = new Object3D();

const posArray = [];
const rotArray = [];

const lineEvt = {
    from:lineFrom,
    to:lineTo,
    color:"YELLOW"
}

const splashEvt ={
    pos:new Vector3(),
    normal:new Vector3(),
    velocity: new Vector3(),
    hitDot:0
}

class PhysicalModel {
    constructor(obj3d, fileName, assetStatus) {

        let buoyancy = []

        let wheelStates = [];
        this.wheelStates = wheelStates;

        let velocity = new Vector3();
        let acceleration = new Vector3();
        let forceG = 1;

        MATH.testVec3ForNaN (obj3d.position)

        function updateFloatation() {
            MATH.testVec3ForNaN (obj3d.position)
            splashEvt.velocity.copy(getBodyVelocity(obj3d.userData.body));
            let isFloating = 0;
            let time = getFrame().gameTime
            for (let i = 0; i < buoyancy.length; i++) {
                tempVec.x = buoyancy[i].pos.x;
                tempVec.y = buoyancy[i].pos.y;
                tempVec.z = buoyancy[i].pos.z;

                let size = buoyancy[i].size;
                let splash = buoyancy[i].splash;

                tempVec.applyQuaternion(obj3d.quaternion);
                tempVec3.copy(tempVec)
                tempVec.add(obj3d.position);

                tempVec2.set(0, 0, 0);

                let waveHeight = Math.cos(time*0.8+(tempVec.x+tempVec.z*0.2)*0.04)
                let submersion = calcBoxSubmersion(tempVec.y  + waveHeight, size)

                if (submersion > 0) {
                    isFloating = 1;
                    tempVec2.y = submersion * 100000 * AmmoAPI.getStepTime();
                    AmmoAPI.applyForceAtPointToBody(tempVec2, tempVec3, obj3d.userData.body)

                    if (splash > Math.random()) {
                        tempVec3.add(obj3d.position)
                        lineFrom.copy(tempVec);
                        lineTo.copy(tempVec3);

                        lineTo.y = 0;

                        MATH.randomVector(tempVec)
                        //    tempVec.set(Math.sin(getFrame().gameTime)*50, 0, Math.cos(getFrame().gameTime)*50)
                        tempVec.multiplyScalar(size);
                        //    tempVec.applyQuaternion(obj3d.quaternion)
                        tempVec.y = 0;
                        //    tempVec.copy(tempVec3);
                        //    tempVec.add(obj3d.position)
                        lineFrom.add(tempVec)
                        lineFrom.y = 0;

                        let hit = rayTest(lineFrom, lineTo, splashEvt.pos, splashEvt.normal, false);

                        if (hit) {
                            tempVec.copy(splashEvt.velocity).normalize();
                            splashEvt.normal.y = 0.5;
                            splashEvt.hitDot = (tempVec.dot(splashEvt.normal)+1)/2
                            if (splashEvt.hitDot > Math.random() * 0.9) {
                                evt.dispatch(ENUMS.Event.SPLASH_OCEAN, splashEvt)
                            }
                        }
                    }
                }
            }
            assetStatus.setStatusKey(ENUMS.InstanceStatus.WEIGHT_ON_WATER, isFloating);
        }


        let lastG = 0;

        function updateBodyObj3d() {

            const attachedToPoint = obj3d.userData.attachedToPoint;

            if (attachedToPoint !== null) {
                attachedToPoint.getTransformWS(tempObj);
                transformBody(tempObj, obj3d.userData.body)
                setBodyVelocity(obj3d.userData.body, attachedToPoint.getVel())
            }

            acceleration.copy(velocity);
            let ammoVel = obj3d.userData.body.getLinearVelocity();
            MATH.testVec3ForNaN (obj3d.position)
            velocity.set(ammoVel.x(), ammoVel.y(), ammoVel.z());
            let speed = velocity.length();
            velocity.applyQuaternion(obj3d.quaternion);
            acceleration.sub(velocity);
            acceleration.y += 9.81;
            lastG = acceleration.y;
            assetStatus.setStatusKey('SPEED_AIR', speed);

            if (speed < 0.5 && assetStatus.getStatus(ENUMS.InstanceStatus.WEIGHT_ON_WHEELS) === 1) {
                assetStatus.setStatusKey('TAXI_SLOW',1);
            } else {
                assetStatus.setStatusKey('TAXI_SLOW',0);
            }

            assetStatus.setStatusKey('FORCE_G',acceleration.y * 0.1);

            updateFloatation()
        }

        function updateWheeledVehicle() {
            let vehicle = ammoVehicle.vehicle;
            //    console.log(vehicle);
            vehicle.updateWheelTransformsWS();

            const inputYaw = assetStatus.getStatus(ENUMS.InstanceStatus.STEERING_YAW) || 0;
            const inputBrake = assetStatus.getStatus(ENUMS.InstanceStatus.STATUS_BRAKE) || 0;
            const mass = assetStatus.getStatus(ENUMS.InstanceStatus.STATUS_MASS) || 1000;

            const wheels = vehicle.getNumWheels();

            let groundContact = false;

            const isAttached = obj3d.userData.attachedToPoint

            for (let i = 0; i < wheels; i++) {



                if (!wheelStates[i]) {
                    wheelStates[i] = {
                        suspensionCompression:0,
                        wheelRotation:0,
                        quaternion:new Quaternion(),
                        position:new Vector3(),
                        wheelYaw:inputYaw,
                        wheelContact:false,
                        contactPoint: new Vector3(),
                        contactNormal: new Vector3()
                    }
                }
                let wInfo = vehicle.getWheelInfo(i);

                if (wInfo.m_bIsFrontWheel) {
                //    console.log(wInfo)
                    vehicle.setSteeringValue(inputYaw, i);
                }

                vehicle.setBrake(inputBrake * mass* 0.05, i)

                //    wInfo.updateWheel()
                let rayInfo = wInfo.get_m_raycastInfo();
                let maxTravel = wInfo.get_m_maxSuspensionTravelCm()*0.01;
                let suspTotal = wInfo.get_m_suspensionRestLength1();
                let currentLength = rayInfo.get_m_suspensionLength();

                let radius = wInfo.get_m_wheelsRadius();

                let isInContact = rayInfo.get_m_isInContact();
                wheelStates[i].wheelContact = isInContact;
                if (isAttached === null) {
                    wheelStates[i].wheelRotation = -wInfo.get_m_rotation();
                }

                if (isInContact) {
                    let contactPoint = rayInfo.get_m_contactPointWS();
                    let contactNormal = rayInfo.get_m_contactNormalWS();
                    wheelStates[i].contactPoint.set(contactPoint.x(), contactPoint.y(), contactPoint.z());
                    wheelStates[i].contactNormal.set(contactNormal.x(), contactNormal.y(), contactNormal.z());
                    let compressFraction = MATH.calcFraction(0, maxTravel, suspTotal-currentLength);

                    if (isAttached === null) {
                        wheelStates[i].suspensionCompression = compressFraction*0.5 + wheelStates[i].suspensionCompression * 0.5;
                    } else {
                        wheelStates[i].suspensionCompression = compressFraction*0.05 + wheelStates[i].suspensionCompression * 0.95;
                    }

                    groundContact = true;
                } else {
                    wheelStates[i].suspensionCompression = 0;
                }

                assetStatus.setStatusKey('SUSP_COMP_WHEEL_'+i, wheelStates[i].suspensionCompression);
                assetStatus.setStatusKey('ROTATION_WHEEL_'+i, wheelStates[i].wheelRotation);
                //    console.log("rayInfo ", rayInfo);

                if (getSetting(ENUMS.Settings.DEBUG_VIEW_WHEELS)) {

                    if (isInContact) {
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:wheelStates[i].contactPoint, size:wheelStates[i].suspensionCompression, color:'RED'});
                    }

                    let ammoTrx = vehicle.getWheelTransformWS(i);
                    ammoTranformToObj3d(ammoTrx, wheelStates[i]);
                    lineFrom.copy(wheelStates[i].position);
                    lineTo.set(0, 0, currentLength);
                    lineTo.applyQuaternion(wheelStates[i].quaternion)
                    lineTo.add(lineFrom);
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, lineEvt);
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:lineFrom, size:0.2, color:'GREEN'});
                }

            }

            if (groundContact) {
                assetStatus.setStatusKey(ENUMS.InstanceStatus.WEIGHT_ON_WHEELS, 1);
            } else {
                assetStatus.setStatusKey(ENUMS.InstanceStatus.WEIGHT_ON_WHEELS, 0);
            }


        }

        function alignVisualModel() {
            const body = obj3d.userData.body;

            bodyTransformToObj3d(body, obj3d);

                if (ammoVehicle !== null) {
                    updateWheeledVehicle();
                }

            MATH.testVec3ForNaN (obj3d.position)
        }

        /*
        Ray Info:

get_m_contactNormalWS
get_m_contactPointWS
get_m_groundObject
get_m_hardPointWS
get_m_isInContact
get_m_suspensionLength
get_m_wheelAxleWS
get_m_wheelDirectionWS

        wheelInfo:

        getSuspensionRestLength
get_m_bIsFrontWheel
get_m_brake
get_m_chassisConnectionPointCS
get_m_clippedInvContactDotSuspension
get_m_deltaRotation
get_m_engineForce
get_m_frictionSlip
get_m_maxSuspensionForce
get_m_maxSuspensionTravelCm
get_m_raycastInfo
get_m_rollInfluence
get_m_rotation
get_m_skidInfo
get_m_steering
get_m_suspensionRelativeVelocity
get_m_suspensionRestLength1
get_m_suspensionStiffness
get_m_wheelAxleCS
get_m_wheelDirectionCS
get_m_wheelsDampingCompression
get_m_wheelsDampingRelaxation
get_m_wheelsRadius
get_m_wheelsSuspensionForce
get_m_worldTransform
         */


        let ammoVehicle = null;

        function onConf(config) {
            console.log("Physical Config", config);

            function bodyReadyCB(body) {
                if (config['tuning']) {
                    ammoVehicle = new AmmoVehicle(getPhysicalWorld(), body, config['wheels'], config['tuning'])
                    console.log("ammoVehicle:", ammoVehicle); // getChassisWorldTransform

                //    body = ammoVehicle.body;
                }
                console.log("body added", body);
                obj3d.userData.body = body;
                obj3d.userData.mass = mass;
                assetStatus.setStatusKey(ENUMS.InstanceStatus.STATUS_MASS, mass);
                AmmoAPI.registerPhysicsStepCallback(updateBodyObj3d)
                ThreeAPI.addPostrenderCallback(alignVisualModel)
            }


            if (config['buoyancy']) {
                for (let i = 0; i < config['buoyancy'].length; i++) {
                    let buoy = config['buoyancy'][i];
                    let point = {
                        pos:new Vector3(),
                        size: buoy.size,
                        splash:buoy.splash || 0
                    };
                    MATH.vec3FromArray(point.pos, buoy.pos)

                    buoyancy[i] = point;
                }
            }

            let mass = 0;

            for (let i = 0; i < config.shapes.length; i++) {
                let conf = config.shapes[i];
                mass += conf['mass'];

                MATH.vec3ToArray(obj3d.position, posArray);
                MATH.rotObj3dToArray(obj3d, rotArray)
                AmmoAPI.setupRigidBody(obj3d, conf['shape'], conf['mass'], conf['friction'], posArray, rotArray, conf['scale'], conf['asset'], conf['convex'], conf['children'], bodyReadyCB)
            }
        }

       jsonAsset(fileName, onConf)

    }

    getWheelStates() {
        return this.wheelStates;
    }

}

export { PhysicalModel }