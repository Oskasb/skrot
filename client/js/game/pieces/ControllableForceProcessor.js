import {Object3D, Quaternion, Vector3} from "../../../../libs/three/Three.Core.js";
import {applyActivationProbe, bodyTransformToObj3d, getBodyVelocity} from "../../application/utils/PhysicsUtils.js";
import {ENUMS} from "../../application/ENUMS.js";
import {evt} from "../../application/event/evt.js";
import {MATH} from "../../application/MATH.js";
import {getSetting} from "../../application/utils/StatusUtils.js";
import {radToDeg} from "../../../../libs/three/math/MathUtils.js";
import {activatePhysicsProbe} from "../../application/physics/PhysicsLodGrid.js";

let frameTransform = new Object3D();
let pointTransform = new Object3D();
let rootTransform = new Object3D();
let tempObj = new Object3D();
let tempObj2 = new Object3D();
let tempVec = new Vector3();
let tempVec1 = new Vector3();
let tempVec2 = new Vector3();
let surfaceUp = new Vector3();

let tempQuat = new Quaternion();

let forceSum = new Vector3();
let torqueSum = new Vector3();
let dragTorqueSum = new Vector3();

let surfaceForwardVec3 = new Vector3();
let tempForwardVec3 = new Vector3();

let localLift = new Vector3();
let localDrag = new Vector3();
let localSlip = new Vector3();
let localUp = new Vector3();

class ControllableForceProcessor {
    constructor(controllablePiece) {

        let stepTime = 0;
        let speedSq = 0;

        function applyEngineForce(point, prop, stateValue, body) {

            let force = stateValue * prop.force * stepTime
            tempVec1.set(0, 0, -force);

            point.updateDynamicPoint();
            // point.call.getLocalTransform(pointTransform);
            MATH.transformToLocalSpace(point.getObj3d(), frameTransform, pointTransform)
            tempVec1.applyQuaternion(pointTransform.quaternion)
            MATH.addToTorqueVec(tempVec1, pointTransform.position, torqueSum)

            tempVec1.applyQuaternion(frameTransform.quaternion)
            forceSum.add(tempVec1);

        //    tempVec2.copy(pointTransform.position).multiplyScalar(force*0.0);
        //    torqueSum.add(tempVec2)

            if (getSetting(ENUMS.Settings.SHOW_FLIGHT_FORCES) !== 0) {
                pointTransform.position.applyQuaternion(frameTransform.quaternion);
                pointTransform.position.add(frameTransform.position);
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:pointTransform.position, size:0.4, color:'YELLOW'});
                tempVec1.multiplyScalar(0.01);

                tempVec1.add(pointTransform.position);
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pointTransform.position, to:tempVec1, color:'YELLOW'});
            }

        }

        function updatePropulsion(body) {

            forceSum.set(0, 0, 0);
            torqueSum.set(0, 0, 0)

            let propulsion = controllablePiece.propulsion;
            for (let key in propulsion) {
                let prop = propulsion[key];
                let point = controllablePiece.getDynamicPoint(key);
                if (point) {
                    let ctrlDyn = controllablePiece.getControlByName(key)
                    if (ctrlDyn) {
                        let stateValue = ctrlDyn.state.value;
                        if (typeof stateValue === 'number') {
                            applyEngineForce(point, prop, ctrlDyn.state.value, body)
                        } else {
                            console.log("Bad state value applyEngineForce");
                        }
                    }
                }
            }

            AmmoAPI.applyForceAndTorqueToBody(forceSum, torqueSum, body);

        }

        function applySurfaceForces() {

        }

        function update() {

            let body = controllablePiece.getAmmoBody();
            if (!body) {
                return;
            }
            stepTime = AmmoAPI.getStepTime();
            let airDensity = MATH.valueFromCurve(controllablePiece.getStatus(ENUMS.ControllableStatus.STATUS_ELEVATION), MATH.curves["densityByAlt"]);
            let liftCoeff = 1;

            let mass = controllablePiece.getMass();
            let surfaces = controllablePiece.surfaces;
            let velocity = getBodyVelocity(body);

            bodyTransformToObj3d(body, frameTransform);
            updatePropulsion(body);

            tempForwardVec3.copy(velocity).normalize();

            localUp.set(0, 1, 0);
            localUp.applyQuaternion(frameTransform.quaternion)

            speedSq = velocity.lengthSq();
            let speed = MATH.curveSqrt(speedSq)

            let frameSpeed = speed;

            let inputYaw = controllablePiece.getControlStateValue('INPUT_YAW');
            let inputRoll = controllablePiece.getControlStateValue('INPUT_ROLL');
            let inputPitch = controllablePiece.getControlStateValue('INPUT_PITCH');

            forceSum.set(0, 0, 0);
            torqueSum.set(0, 0, 0)
            tempVec1.set(0, 0, 0);
            dragTorqueSum.set(0, 0, 0)

            let addUpForce = mass*MATH.curveQuad(getSetting(ENUMS.Settings.ADD_SURFACE_UP_FORCE) * 0.01);


        //    let fuselage = null;

            for (let key in surfaces) {
            //    let surface = surfaces[key];
                let point = controllablePiece.getDynamicPoint(key);
                if (point) {
                    if (key === 'FUSELAGE') {
                        point.updateDynamicPoint();
                        let surface = surfaces[key];
                        surface.updateSurfacePointStatus(point, frameTransform);
                        rootTransform.quaternion.copy(frameTransform.quaternion)
                        rootTransform.position.copy(frameTransform.position);
                        activatePhysicsProbe(frameTransform.position)
                        let aoaX = surface.getStatus(ENUMS.SurfaceStatus.AOA_X)
                        let aoaY = surface.getStatus(ENUMS.SurfaceStatus.AOA_Y)

                        controllablePiece.setStatusKey(ENUMS.ControllableStatus.STATUS_AOA_X, MATH.numberToDigits(radToDeg(aoaX), 1, 1));
                        controllablePiece.setStatusKey(ENUMS.ControllableStatus.STATUS_AOA_Y, MATH.numberToDigits(radToDeg(aoaY), 1, 1));
                        controllablePiece.setStatusKey(ENUMS.ControllableStatus.STATUS_FORCE_G, MATH.numberToDigits(surface.acc.length()  + 1, 1, 1));
                    }
                }
            }


            for (let key in surfaces) {

                let surface = surfaces[key];
                let point = controllablePiece.getDynamicPoint(key);
                if (point) {

                    if (key !== 'FUSELAGE') {
                        point.updateDynamicPoint();
                        let surface = surfaces[key];
                        surface.updateSurfacePointStatus(point, rootTransform);
                    }

                    let globalPoint = point.getObj3d();

                    localLift.set(0, 0, 0);
                    localSlip.set(0, 0, 0);
                    tempVec1.copy(surface.velocity);
                    speedSq = tempVec1.lengthSq();
                    localDrag.copy(tempVec1).normalize();

                    applyActivationProbe(globalPoint.position, tempVec1)

                    let liftX = 0;
                    let liftY = 0;
                    let inducedDrag = 0;

                    let baseDrag = 0;

                    if (surface.scale.x > 0) {

                        let aoaX = surface.getStatus(ENUMS.SurfaceStatus.AOA_X)
                        let surfaceArea = surface.scale.x * surface.scale.z;
                        liftY = 1.2 * MATH.curveLift(aoaX) * speedSq * surfaceArea * airDensity + addUpForce * 5 //*  surfaceArea * 0.1 // * surfaceArea // *0.5;

                        liftY = liftY*0.5 + surface.getStatus(ENUMS.SurfaceStatus.LIFT_Y)*0.5

                        let inducedForcesSQ = liftY*liftY;
                        inducedDrag += inducedForcesSQ / (4.5 * airDensity * speedSq * surface.scale.x * 3.14)
                        baseDrag += surface.scale.x*surface.scale.y * speedSq * airDensity * 0.1;
                    }

                    if (surface.scale.y > 0) {
                        let aoaY = surface.getStatus(ENUMS.SurfaceStatus.AOA_Y)
                        let surfaceArea = surface.scale.y * surface.scale.z;
                        liftX = MATH.curveYaw(aoaY) * speedSq * surfaceArea * airDensity // *0.5;
                        liftX = liftX*0.5 + surface.getStatus(ENUMS.SurfaceStatus.LIFT_X)*0.5
                        let inducedForcesSQ = liftX*liftX;
                    //    inducedDrag += inducedForcesSQ / (5.5 * airDensity * speedSq * surface.scale.y * 3.14)
                    //    baseDrag += surface.scale.x*surface.scale.y * speedSq * airDensity * 0.05;
                    }

                    localLift.set(liftX, liftY, 0);
                    localDrag.multiplyScalar(-(inducedDrag + baseDrag));

                    surface.setStatusKey(ENUMS.SurfaceStatus.LIFT_X, liftX);
                    surface.setStatusKey(ENUMS.SurfaceStatus.LIFT_Y, localLift.y);
                    surface.setStatusKey(ENUMS.SurfaceStatus.DRAG_N, inducedDrag);
                    point.status.setStatusKey(ENUMS.PointStatus.FORCE_Y, localLift.y / (mass*60))

                    tempVec2.set(surface.trxLocalObj.position.x, surface.trxLocalObj.position.y, surface.trxLocalObj.position.z);

                    MATH.addToTorqueVec(localLift, tempVec2, torqueSum)
                //    MATH.addToTorqueVec(localDrag, tempVec2, torqueSum)
                    localDrag.multiplyScalar(stepTime);
                    localLift.multiplyScalar(stepTime);

                    localLift.applyQuaternion(rootTransform.quaternion)

                    localLift.add(localDrag);

                    forceSum.add(localLift);

                    if (getSetting(ENUMS.Settings.SHOW_FLIGHT_FORCES) === 1) {

                        tempVec.copy(surface.trxLocalObj.position);
                        tempVec.applyQuaternion(rootTransform.quaternion)
                        tempVec.add(rootTransform.position)
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec, size:0.1, color:'RED'});
                   //
                        tempVec2.set(0, liftY, 0);
                        tempVec2.multiplyScalar(0.00002)
                        tempVec2.applyQuaternion(rootTransform.quaternion)
                        tempVec2.add(tempVec)
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec, to:tempVec2, color:'YELLOW'});

                        tempVec2.set(liftX,0,  0);
                        tempVec2.multiplyScalar(0.00005)
                        tempVec2.applyQuaternion(rootTransform.quaternion)
                        tempVec2.add(tempVec)
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec, to:tempVec2, color:'GREEN'});

                        tempVec2.copy(localDrag);
                        tempVec2.multiplyScalar(0.01)
                    //    tempVec2.applyQuaternion(frameTransform.quaternion)
                        tempVec2.add(tempVec)
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec, to:tempVec2, color:'RED'});

                        tempVec2.copy(point.getVel())
                        const spd = tempVec2.length()
                        tempVec2.normalize();
                        tempVec2.multiplyScalar(MATH.curvePow(spd, 0.2)*2);
                        tempVec2.add(tempVec)
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec, to:tempVec2, color:'CYAN'});

                    }
                }
            }

            let torqueBoost = MATH.curveQuad(getSetting(ENUMS.Settings.TORQUE_BOOST));
            if (torqueBoost !== 0) {
                tempVec2.set(inputPitch, -inputYaw, -inputRoll)
                const inputAmount = tempVec2.lengthSq();
                let cheatTorque = mass * 1000 * torqueBoost * stepTime;
                let speedTorque = mass * 200 * MATH.curveSqrt(speedSq*0.5) * stepTime
                tempVec2.multiplyScalar(cheatTorque + speedTorque)
                tempVec2.applyQuaternion(frameTransform.quaternion)
                if (cheatTorque !== 0 && inputAmount > 0.01) {
                    //    AmmoAPI.applyForceAndTorqueToBody(tempVec1, tempVec2, body)
                    //    tempVec1.set(1, 1, 1);
                    //    MATH.addToTorqueVec(tempVec2, tempVec1, torqueSum)
                    if (getSetting(ENUMS.Settings.SHOW_FLIGHT_FORCES) === 1) {
                        //   tempVec2.copy(torqueSum);
                    //    tempVec2.multiplyScalar(0.0001)
                        //    tempVec2.applyQuaternion(frameTransform.quaternion)
                        tempVec2.add(frameTransform.position)
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:frameTransform.position, to:tempVec2, color:'GREEN'});
                    }
                }
            }

            let waterContact = controllablePiece.getAssetInstanceStatus(ENUMS.InstanceStatus.WEIGHT_ON_WATER) || 0;

            AmmoAPI.setBodyDamping(body,   waterContact*0.1+waterContact*speed*0.04, 0.0001 + speed*0.0002 + waterContact*0.3);

            torqueSum.applyQuaternion(frameTransform.quaternion)
            torqueSum.multiplyScalar(1)
             tempVec2.add(torqueSum);

            dragTorqueSum.applyQuaternion(frameTransform.quaternion)
            dragTorqueSum.multiplyScalar(10)
            //    tempVec2.add(dragTorqueSum);

            AmmoAPI.applyForceAndTorqueToBody(forceSum, tempVec2, body)


        }

        AmmoAPI.registerPhysicsStepCallback(update);

    }
}

export { ControllableForceProcessor };