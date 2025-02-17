import {Object3D, Quaternion, Vector3} from "../../../../libs/three/Three.Core.js";
import {bodyTransformToObj3d, getBodyVelocity} from "../../application/utils/PhysicsUtils.js";
import {ENUMS} from "../../application/ENUMS.js";
import {evt} from "../../application/event/evt.js";
import {MATH} from "../../application/MATH.js";
import {getSetting} from "../../application/utils/StatusUtils.js";

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

            let force = MATH.curveQuad(stateValue) * prop.force * stepTime * 10
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

            let aoaX = MATH.aoaXFromVelAndUp(tempForwardVec3, localUp)
            let aoaY = MATH.aoaYFromVelAndUp(tempForwardVec3, localUp)

            controllablePiece.setStatusKey(ENUMS.ControllableStatus.STATUS_AOA_X, aoaX);
            controllablePiece.setStatusKey(ENUMS.ControllableStatus.STATUS_AOA_Y, aoaY);


            stepTime = AmmoAPI.getStepTime();
            speedSq = velocity.lengthSq();
            let speed = MATH.curveSqrt(speedSq)

            let frameSpeed = speed;

            let inputYaw = controllablePiece.getControlStateValue('INPUT_YAW');
            let inputRoll = controllablePiece.getControlStateValue('INPUT_ROLL');
            let inputPitch = controllablePiece.getControlStateValue('INPUT_PITCH');


            forceSum.set(0, 0, 0);
            torqueSum.set(0, 0, 0)
            tempVec1.set(0, 0, 0);




            let addUpForce = mass*MATH.curveQuad(getSetting(ENUMS.Settings.ADD_SURFACE_UP_FORCE) * 0.01);


        //    let fuselage = null;

            for (let key in surfaces) {
                let point = controllablePiece.getDynamicPoint(key);
                if (point) {
                    if (key === 'FUSELAGE') {
                        point.updateDynamicPoint();
                        let surface = surfaces[key];
                        surface.updateSurfacePointStatus(point, frameTransform);
                        rootTransform.quaternion.copy(point.getQuat())
                        rootTransform.position.copy(frameTransform.position);
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
                        aoaX = surface.getStatus(ENUMS.SurfaceStatus.AOA_X)
                    //    rootTransform.quaternion.copy(point.getQuat())
                    //    rootTransform.position.copy(frameTransform.position);
                    }

                    let globalPoint = point.getObj3d();

                    localLift.set(0, 0, 0);
                    localSlip.set(0, 0, 0);
                    tempVec1.copy(surface.velocity);
                    speedSq = tempVec1.lengthSq();
                    localDrag.copy(tempVec1).normalize();

                    let liftX = 0;
                    let liftY = 0;
                    let inducedDrag = 0;

                    if (surface.scale.x > 0) {

                        let aoaX = surface.getStatus(ENUMS.SurfaceStatus.AOA_X)
                        let surfaceArea = surface.scale.x * surface.scale.z;
                        liftY = 1.2 * MATH.curveLift(aoaX) * speedSq * surfaceArea * airDensity + addUpForce * 5 //*  surfaceArea * 0.1 // * surfaceArea // *0.5;

                        let inducedForcesSQ = liftY*liftY;
                        inducedDrag += inducedForcesSQ / (1.5 * airDensity * speedSq * surface.scale.x * 3.14)

                    }

                    if (surface.scale.y > 0) {
                        let aoaY = surface.getStatus(ENUMS.SurfaceStatus.AOA_Y)
                        let surfaceArea = surface.scale.y * surface.scale.z;
                        liftX = MATH.curveLift(aoaY) * speedSq * surfaceArea * airDensity // *0.5;

                        let inducedForcesSQ = liftX*liftX;
                        inducedDrag += inducedForcesSQ / (1.5 * airDensity * speedSq * surface.scale.y * 3.14)
                    }

                    localLift.set(liftX*0, liftY , 0);
                    localDrag.multiplyScalar(-inducedDrag);

                    surface.setStatusKey(ENUMS.SurfaceStatus.LIFT_X, liftX);
                    surface.setStatusKey(ENUMS.SurfaceStatus.LIFT_Y, localLift.y);
                    surface.setStatusKey(ENUMS.SurfaceStatus.DRAG_N, inducedDrag);
                    point.status.setStatusKey(ENUMS.PointStatus.FORCE_Y, localLift.y / (mass*60))

                //    tempVec.set(surface.trxLocalObj.position.x, surface.trxLocalObj.position.y , surface.trxLocalObj.position.z);

                    localDrag.multiplyScalar(stepTime);
                    localLift.multiplyScalar(stepTime);

                //    MATH.addToTorqueVec(localLift, tempVec, torqueSum)

                    localLift.applyQuaternion(rootTransform.quaternion)

                //
                    localLift.add(localDrag);
                //    localDrag.applyQuaternion(frameTransform.quaternion)
                //    tempVec.copy(surface.trxLocalObj.position);
                //    tempVec.set(0, 0, 1)
                //    tempVec.applyQuaternion(frameTransform.quaternion)
                //    MATH.addToTorqueVec(localDrag, tempVec, torqueSum)
                //    localDrag.multiplyScalar(stepTime);
                //    tempVec.set(0, 0, 0);
                 //   tempVec.applyQuaternion(frameTransform.quaternion);

                //    AmmoAPI.applyForceAtPointToBody(localLift, tempVec, body)

                    forceSum.add(localLift);

                    if (getSetting(ENUMS.Settings.SHOW_FLIGHT_FORCES) === 1) {

                        tempVec.copy(surface.trxLocalObj.position);
                        tempVec.applyQuaternion(rootTransform.quaternion)
                        tempVec.add(rootTransform.position)
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec, size:0.1, color:'RED'});
                   //
                        tempVec2.set(0, localLift.y, 0);
                        tempVec2.multiplyScalar(0.01)
                        tempVec2.applyQuaternion(rootTransform.quaternion)
                        tempVec2.add(tempVec)
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec, to:tempVec2, color:'YELLOW'});

                        tempVec2.copy(localDrag);
                        tempVec2.multiplyScalar(0.1)
                    //    tempVec2.applyQuaternion(frameTransform.quaternion)
                        tempVec2.add(tempVec)
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec, to:tempVec2, color:'RED'});

                        tempVec2.copy(point.getVel())
                        const spd = tempVec2.length()
                        tempVec2.normalize();
                        tempVec2.multiplyScalar(MATH.curvePow(spd, 0.2)*2);
                        tempVec2.add(tempVec)
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec, to:tempVec2, color:'CYAN'});

                        tempVec2.copy(surfaceUp)
                        tempVec2.applyQuaternion(rootTransform.quaternion)
                        tempVec2.multiplyScalar(1);
                        tempVec2.add(tempVec)
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec, to:tempVec2, color:'BLUE'});

                    }

                }
            }

        //    forceSum.applyQuaternion(frameTransform.quaternion)
        //    tempObj.lookAt(velocity) //.copy(rootTransform.quaternion)
        //    tempObj.rotateZ(3.14)
            tempVec2.set( -MATH.curveLift(aoaX) * frameSpeed, aoaX * frameSpeed*0, 0);
            tempVec2.applyQuaternion(frameTransform.quaternion)
            tempVec2.multiplyScalar(mass * stepTime * 100);

        //    tempVec2.applyQuaternion(frameTransform.quaternion)
        //    torqueSum.multiplyScalar(-1)

            //     AmmoAPI.applyForceAtPointToBody(forceSum, torqueSum, body)
        //    tempVec.set(0, 0, 0);

            let torqueBoost = MATH.curveQuad(getSetting(ENUMS.Settings.TORQUE_BOOST));
            tempVec2.set(inputPitch, -inputYaw, -inputRoll)
            const inputAmount = tempVec2.lengthSq();
            let cheatTorque = mass * 1000 * torqueBoost * stepTime;
            let speedTorque = mass * 200 * MATH.curveSqrt(speedSq*0.5) * stepTime
            tempVec2.multiplyScalar(cheatTorque + speedTorque)
            tempVec2.applyQuaternion(frameTransform.quaternion)

            let waterContact = controllablePiece.getAssetInstanceStatus(ENUMS.InstanceStatus.WEIGHT_ON_WATER) || 0;

            AmmoAPI.setBodyDamping(body, 0.00001  + speed*0.000001 + waterContact*0.2 +waterContact*speed*0.05, 0.1 + MATH.curveSqrt(speed*0.06) * 0.1 + waterContact*0.1);

            AmmoAPI.applyForceAndTorqueToBody(forceSum, tempVec2, body)
        //    tempVec2.applyQuaternion(frameTransform.quaternion)
            if (getSetting(ENUMS.Settings.SHOW_FLIGHT_FORCES) === 1) {

                tempVec2.multiplyScalar(0.01)

                tempVec2.add(frameTransform.position)
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:frameTransform.position, to:tempVec2, color:'YELLOW'});
            }
        //    torqueSum.multiplyScalar(0)

            if (cheatTorque !== 0 && inputAmount > 0.01) {
                //    AmmoAPI.applyForceAndTorqueToBody(tempVec1, tempVec2, body)
                //    tempVec1.set(1, 1, 1);
                //    MATH.addToTorqueVec(tempVec2, tempVec1, torqueSum)
                if (getSetting(ENUMS.Settings.SHOW_FLIGHT_FORCES) === 1) {
                    //   tempVec2.copy(torqueSum);
                    tempVec2.multiplyScalar(0.0001)
                    //    tempVec2.applyQuaternion(frameTransform.quaternion)
                    tempVec2.add(frameTransform.position)
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:frameTransform.position, to:tempVec2, color:'GREEN'});
                }

            }

        }

        AmmoAPI.registerPhysicsStepCallback(update);

    }
}

export { ControllableForceProcessor };