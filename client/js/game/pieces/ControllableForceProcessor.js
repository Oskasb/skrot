import {Object3D, Quaternion, Vector3} from "../../../../libs/three/Three.Core.js";
import {bodyTransformToObj3d, getBodyVelocity} from "../../application/utils/PhysicsUtils.js";
import {ENUMS} from "../../application/ENUMS.js";
import {evt} from "../../application/event/evt.js";
import {MATH} from "../../application/MATH.js";
import {getSetting} from "../../application/utils/StatusUtils.js";

let frameTransform = new Object3D();
let pointTransform = new Object3D();
let tempObj = new Object3D();
let tempObj2 = new Object3D();
let tempVec = new Vector3();
let tempVec1 = new Vector3();
let tempVec2 = new Vector3();
let surfaceUp = new Vector3();
let localQuat = new Quaternion();
let tempQuat = new Quaternion();

let forceSum = new Vector3();
let torqueSum = new Vector3();

let surfaceForwardVec3 = new Vector3();
let localOrientationVec3 = new Vector3();
let tempAoAVec3 = new Vector3();
let tempForwardVec3 = new Vector3();
let tempAngleOfIncidence = new Vector3();

let tempSurfaceShape = new Vector3();

let localLift = new Vector3();
let localDrag = new Vector3();
let localSlip = new Vector3();
let localUp = new Vector3();

class ControllableForceProcessor {
    constructor(controllablePiece) {

        let stepTime = 0;
        let speedSq = 0;

        function applyEngineForce(point, prop, stateValue, body) {

            let force = stateValue * prop.force * stepTime * 1
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

            if (getSetting(ENUMS.Settings.SHOW_FLIGHT_FORCES) === 1) {
                tempVec2.copy(torqueSum);
                tempVec2.multiplyScalar(0.01)
                tempVec2.add(frameTransform.position)
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec2, size:2.2, color:'YELLOW'});
                //     localLift.applyQuaternion(frameTransform.quaternion)
                tempVec1.addVectors(forceSum, tempObj2)
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec2, to:tempVec1, color:'CYAN'});

            }
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

            localQuat.copy(frameTransform.quaternion).invert()
            localUp.set(0, 1, 0);
            localUp.applyQuaternion(frameTransform.quaternion)
            tempAoAVec3.set(0, 0, 1);
            tempAoAVec3.applyQuaternion(frameTransform.quaternion)

            let aoaX = MATH.aoaXFromVelAndUp(tempForwardVec3, localUp)
            let aoaY = MATH.aoaYFromVelAndUp(tempForwardVec3, localUp)
            tempAoAVec3.set(aoaX, aoaY, 0);

            controllablePiece.setStatusKey(ENUMS.ControllableStatus.STATUS_AOA_X, aoaX);
            controllablePiece.setStatusKey(ENUMS.ControllableStatus.STATUS_AOA_Y, aoaY);


         //   tempAoAVec3.sub(tempForwardVec3);

            stepTime = AmmoAPI.getStepTime();
            speedSq = velocity.lengthSq();
            let speed = MATH.curveSqrt(speedSq)

            let inputYaw = controllablePiece.getControlStateValue('INPUT_YAW');
            let inputRoll = controllablePiece.getControlStateValue('INPUT_ROLL');
            let inputPitch = controllablePiece.getControlStateValue('INPUT_PITCH');




            tempVec1.set(0, 0, 0);
            let torqueBoost = MATH.curveQuad(getSetting(ENUMS.Settings.TORQUE_BOOST));
            tempVec2.set(inputPitch, -inputYaw, -inputRoll)
            let cheatTorque = mass * 1000 * torqueBoost * stepTime;
            let speedTorque = mass * 200 * MATH.curveSqrt(speedSq*0.5) * stepTime
            tempVec2.multiplyScalar(cheatTorque + speedTorque)
            tempVec2.applyQuaternion(frameTransform.quaternion)

            let waterContact = controllablePiece.getAssetInstanceStatus(ENUMS.InstanceStatus.WEIGHT_ON_WATER) || 0;

            if (cheatTorque !== 0) {
                AmmoAPI.applyForceAndTorqueToBody(tempVec1, tempVec2, body)
            }

        //
            AmmoAPI.setBodyDamping(body, 0.01  + speed*0.001 + waterContact*0.2 +waterContact*speed*0.05, 0.01 + MATH.curveSqrt(speed*0.1) * 0.2 + waterContact*0.1);


            let addUpForce = mass*MATH.curveQuad(getSetting(ENUMS.Settings.ADD_SURFACE_UP_FORCE) * 0.01);


            forceSum.set(0, 0, 0);
            torqueSum.set(0, 0, 0)


            for (let key in surfaces) {

                let surface = surfaces[key];
                let point = controllablePiece.getDynamicPoint(key);
                if (point) {

                    point.updateDynamicPoint();
                    let globalPoint = point.getObj3d();

                    MATH.transformToLocalSpace(globalPoint, frameTransform, pointTransform)

                    const pos = pointTransform.position;
                    const quat = pointTransform.quaternion;

                    surfaceUp.set(0, 1, 0);
                    tempAoAVec3.set(0, 0, 1);
                    tempAoAVec3.applyQuaternion(quat)
                    surfaceUp.applyQuaternion(quat)
                    surfaceForwardVec3.copy(point.getVel());
                    speedSq = surfaceForwardVec3.lengthSq();
                //    surfaceForwardVec3.normalize();
                    tempSurfaceShape.copy(surface.scale);


                    surface.setStatusKey(ENUMS.SurfaceStatus.POS_X, pos.x);
                    surface.setStatusKey(ENUMS.SurfaceStatus.POS_Y, pos.y);
                    surface.setStatusKey(ENUMS.SurfaceStatus.POS_Z, pos.z);
                    surface.setStatusKey(ENUMS.SurfaceStatus.SCALE_X, surface.scale.x);
                    surface.setStatusKey(ENUMS.SurfaceStatus.SCALE_Y, surface.scale.y);
                    surface.setStatusKey(ENUMS.SurfaceStatus.SCALE_Z, surface.scale.z);
                    surface.setStatusKey(ENUMS.SurfaceStatus.VEL_X, surfaceForwardVec3.x);
                    surface.setStatusKey(ENUMS.SurfaceStatus.VEL_Y, surfaceForwardVec3.y);
                    surface.setStatusKey(ENUMS.SurfaceStatus.VEL_Z, surfaceForwardVec3.z);
                    surface.setStatusKey(ENUMS.SurfaceStatus.QUAT_X, quat.x);
                    surface.setStatusKey(ENUMS.SurfaceStatus.QUAT_Y, quat.y);
                    surface.setStatusKey(ENUMS.SurfaceStatus.QUAT_Z, quat.z);
                    surface.setStatusKey(ENUMS.SurfaceStatus.QUAT_W, quat.w);
                    surface.setStatusKey(ENUMS.SurfaceStatus.NORMAL_X, surfaceUp.x);
                    surface.setStatusKey(ENUMS.SurfaceStatus.NORMAL_Y, surfaceUp.y);
                    surface.setStatusKey(ENUMS.SurfaceStatus.NORMAL_Z, surfaceUp.z);

                    tempObj.position.set(0, 0, 0);
                    tempObj.lookAt(surfaceForwardVec3);
                    tempVec.copy(surfaceForwardVec3)
                    tempQuat.copy(pointTransform.quaternion)
                    tempQuat.conjugate();
                    tempObj.position.set(0, 0, 0);
                    tempVec.applyQuaternion(tempQuat);
                    tempObj.lookAt(tempVec);
                    const angles = MATH.eulerFromQuaternion(tempObj.quaternion, 'XYZ')
                    let aoaX = MATH.angleInsideCircle(angles.x + Math.PI);
                    const anglesY = MATH.eulerFromQuaternion(tempObj.quaternion, 'YXZ')
                    let aoaY = MATH.angleInsideCircle(-anglesY.y + Math.PI);

                    surface.setStatusKey(ENUMS.SurfaceStatus.AOA_X, aoaX);
                    surface.setStatusKey(ENUMS.SurfaceStatus.AOA_Y, aoaY);

                    localLift.set(0, 0, 0);
                    localSlip.set(0, 0, 0);
                    localDrag.copy(velocity).normalize();

                    pointTransform.quaternion.multiply(frameTransform.quaternion);

                    localOrientationVec3.set(0, 0, 1);
                    localOrientationVec3.applyQuaternion(pointTransform.quaternion)


                    tempAngleOfIncidence.copy(localOrientationVec3).sub(surfaceForwardVec3);
                //    tempAngleOfIncidence.applyQuaternion(tempObj.quaternion)


                    let liftX = 0;
                    let liftY = 0;
                    let inducedDrag = 0;

                    if (surface.scale.x > 0) {

                        let aoaX = surface.getStatus(ENUMS.SurfaceStatus.AOA_X)
                        let surfaceArea = surface.scale.x * surface.scale.z;
                        liftY = MATH.curveLift(aoaX) * speedSq * surfaceArea * airDensity + addUpForce * 5 //*  surfaceArea * 0.1 // * surfaceArea // *0.5;


                        let inducedForcesSQ = liftY*liftY;
                        inducedDrag += inducedForcesSQ / (0.5 * airDensity * speedSq * surface.scale.x * 3.14)


                    }

                    if (surface.scale.y > 0) {
                        let aoaY = surface.getStatus(ENUMS.SurfaceStatus.AOA_Y)
                        let surfaceArea = surface.scale.y * surface.scale.z;
                        liftX = MATH.curveLift(aoaY) * speedSq * surfaceArea * airDensity // *0.5;

                        let inducedForcesSQ = liftX*liftX;
                        inducedDrag += inducedForcesSQ / (0.5 * airDensity * speedSq * surface.scale.y * 3.14)
                    }

                    localLift.set(liftX*0, liftY , inducedDrag*0);


                    surface.setStatusKey(ENUMS.SurfaceStatus.LIFT_X, liftX);
                    surface.setStatusKey(ENUMS.SurfaceStatus.LIFT_Y, localLift.y);
                    surface.setStatusKey(ENUMS.SurfaceStatus.DRAG_N, inducedDrag);


                //    tempVec2.cross(pointTransform.position);
                    localLift.multiplyScalar(stepTime);

                    localLift.applyQuaternion(pointTransform.quaternion)
                    MATH.addToTorqueVec(localLift, pointTransform.position, torqueSum)
                    localLift.applyQuaternion(frameTransform.quaternion)
                    forceSum.add(localLift);


                //    tempVec2.cross(localLift);

                //    tempVec2.applyQuaternion(frameTransform.quaternion)

                //    localLift.applyQuaternion(frameTransform.quaternion)
                //    tempVec1.add(localDrag);

                //
                //    localLift.applyQuaternion(pointTransform.quaternion)
                //    AmmoAPI.applyForceAtPointToBody(localLift, pointTransform.position, body)





                    if (getSetting(ENUMS.Settings.SHOW_FLIGHT_FORCES) === 1) {
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:globalPoint.position, size:0.2, color:'RED'});
                   //     localLift.applyQuaternion(frameTransform.quaternion)
                        tempVec2.copy(localLift);
                        tempVec2.multiplyScalar(0.01)
                        tempVec2.add(globalPoint.position)
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:globalPoint.position, to:tempVec2, color:'YELLOW'});

                        tempVec2.copy(point.getVel())
                        tempVec2.multiplyScalar(0.1);
                        tempVec2.add(globalPoint.position)
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:globalPoint.position, to:tempVec2, color:'RED'});

                        tempVec2.copy(surfaceUp)
                        tempVec2.applyQuaternion(frameTransform.quaternion)
                        tempVec2.multiplyScalar(1);
                        tempVec2.add(globalPoint.position)
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:globalPoint.position, to:tempVec2, color:'BLUE'});

                    }

                }
            }

        //    forceSum.applyQuaternion(frameTransform.quaternion)
        //    torqueSum.applyQuaternion(frameTransform.quaternion)
          AmmoAPI.applyForceAndTorqueToBody(forceSum, torqueSum, body)
            //     AmmoAPI.applyForceAtPointToBody(forceSum, torqueSum, body)


            if (getSetting(ENUMS.Settings.SHOW_FLIGHT_FORCES) === 1) {
                tempVec2.copy(torqueSum);
                tempVec2.multiplyScalar(0.01)
                tempVec2.add(frameTransform.position)
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec2, size:2.2, color:'RED'});
                //     localLift.applyQuaternion(frameTransform.quaternion)

            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:globalPoint.position, to:tempVec2, color:'CYAN'});


            }

/*
            tempVec1.copy(velocity)
            tempVec1.add(tempObj.position)
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj.position, to:tempVec1, color:'CYAN'});
            tempAoAVec3.add(tempObj.position)
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj.position, to:tempAoAVec3, color:'RED'});

 */
        }

        AmmoAPI.registerPhysicsStepCallback(update);

    }
}

export { ControllableForceProcessor };