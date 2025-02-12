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
let tempVec1 = new Vector3();
let tempVec2 = new Vector3();
let surfaceUp = new Vector3();
let localQuat = new Quaternion();

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
            let force = stateValue * prop.force * stepTime * 3
            tempVec1.set(0, 0, -force);
        //    point.updateDynamicPoint();
            point.call.getLocalTransform(pointTransform);
            pointTransform.quaternion.multiply(frameTransform.quaternion);
            tempVec1.applyQuaternion(pointTransform.quaternion)
            AmmoAPI.applyForceAtPointToBody(tempVec1, pointTransform.position, body);

            if (getSetting(ENUMS.Settings.SHOW_FLIGHT_FORCES) !== 0) {
                pointTransform.position.add(frameTransform.position);
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:pointTransform.position, size:0.4, color:'YELLOW'});
                tempVec1.multiplyScalar(0.01);
                tempVec1.add(pointTransform.position);
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pointTransform.position, to:tempVec1, color:'YELLOW'});
            }

        }


        function updatePropulsion(body) {
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

        //    AmmoAPI.applyForceAndTorqueToBody(tempVec1, tempVec2, body)
            AmmoAPI.setBodyDamping(body, 0.01  + speed*0.001 + waterContact*0.2 +waterContact*speed*0.05, 0.01 + MATH.curveSqrt(speed*0.1) * 0.2 + waterContact*0.1);


            let addUpForce = mass*MATH.curveQuad(getSetting(ENUMS.Settings.ADD_SURFACE_UP_FORCE) * 0.01);



            for (let key in surfaces) {

                let surface = surfaces[key];
                let point = controllablePiece.getDynamicPoint(key);
                if (point) {

                    point.updateDynamicPoint();
                    point.call.getLocalTransform(pointTransform);
                    const pos = pointTransform.position;
                    const quat = pointTransform.quaternion;

                    surfaceUp.set(0, 1, 0);
                    tempAoAVec3.set(0, 0, 1);
                    tempAoAVec3.applyQuaternion(quat)
                    surfaceUp.applyQuaternion(quat)
                    surfaceForwardVec3.copy(point.getVel());
                    speedSq = surfaceForwardVec3.lengthSq();
                    surfaceForwardVec3.normalize();
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

                    localLift.set(0, 0, 0);
                    localSlip.set(0, 0, 0);
                    localDrag.copy(velocity).normalize();

                    pointTransform.quaternion.multiply(frameTransform.quaternion);

                    localOrientationVec3.set(0, 0, 1);
                    localOrientationVec3.applyQuaternion(pointTransform.quaternion)


                    tempAngleOfIncidence.copy(localOrientationVec3).sub(surfaceForwardVec3);
                //    tempAngleOfIncidence.applyQuaternion(tempObj.quaternion)
                    let inducedDrag = 0;

                    if (surface.scale.x !== 0) {

                        let rotY = point.getObj3d().rotation.y;



                        //    let aoaX = point.getObj3d().rotation.y - tempObj.rotation.y;
                        let aoaX = MATH.aoaXFromVelAndUp(surfaceForwardVec3, surfaceUp)

                        let surfaceArea = surface.scale.x * surface.scale.z;
                        let lift = aoaX * speedSq * surfaceArea * airDensity;
                        localLift.set(0, (lift + addUpForce*surfaceArea), 0);
                    //    localLift.multiplyScalar(lift + addUpForce);
                    //    inducedDrag+=Math.sqrt(Math.abs(lift));
                        point.call.setAppliedForce(localLift);
                        localLift.applyQuaternion(frameTransform.quaternion)
                    //    localLift.crossVectors(tempAoAVec3, tempForwardVec3);
                    //    localLift.multiplyScalar(speedSq * surfaceArea * 3.6)




                    }

                    if (surface.scale.y === -1) {
                        let surfaceArea = surface.scale.y * surface.scale.z;
                        localSlip.x = MATH.curveSin(tempAngleOfIncidence.x) * speedSq * surfaceArea;
                        inducedDrag+=Math.sqrt(Math.abs(localSlip.x));
                        localSlip.applyQuaternion(frameTransform.quaternion)
                    }


                //    localDrag.multiplyScalar(-inducedDrag)
                    tempVec1.addVectors(localSlip, localLift);

                //    tempVec1.add(localDrag);
                    tempVec1.multiplyScalar(stepTime);

                    AmmoAPI.applyForceAtPointToBody(tempVec1, pointTransform.position, body)

                //    AmmoAPI.applyForceAndTorqueToBody(tempVec1, tempVec2, body)

                    if (getSetting(ENUMS.Settings.SHOW_FLIGHT_FORCES) === 1) {
                        let globalPoint = point.getObj3d();
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:globalPoint.position, size:0.2, color:'RED'});

                        tempVec2.copy(localLift);
                        tempVec2.multiplyScalar(0.001)
                        tempVec2.add(globalPoint.position)
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:globalPoint.position, to:tempVec2, color:'YELLOW'});

                        tempVec2.copy(point.getVel())
                        tempVec2.multiplyScalar(0.1);
                        tempVec2.add(globalPoint.position)
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:globalPoint.position, to:tempVec2, color:'PURPLE'});

                        tempVec2.copy(surfaceUp)
                        tempVec2.multiplyScalar(1);
                        tempVec2.add(globalPoint.position)
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:globalPoint.position, to:tempVec2, color:'BLUE'});

                    }

                }
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