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
let localQuat = new Quaternion();

let localForwardVec3 = new Vector3();
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
            point.call.getLocalTransform(tempObj2);
            tempObj2.quaternion.multiply(tempObj.quaternion);
            tempVec1.applyQuaternion(tempObj2.quaternion)
            AmmoAPI.applyForceAtPointToBody(tempVec1, tempObj2.position, body);
            /*
            tempObj2.position.add(tempObj.position);
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempObj2.position, size:0.4, color:'YELLOW'});
            tempVec1.multiplyScalar(0.001);
            tempVec1.add(tempObj2.position);
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj2.position, to:tempVec1, color:'YELLOW'});

             */
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

            let surfaces = controllablePiece.surfaces;

            let velocity = getBodyVelocity(body);

            bodyTransformToObj3d(body, frameTransform);
            updatePropulsion(body);


            tempForwardVec3.copy(velocity).normalize();

            localQuat.copy(frameTransform.quaternion).invert()
            localUp.set(0, 1, 0);
            localUp.applyQuaternion(frameTransform.quaternion);

        //    tempForwardVec3.applyQuaternion(localQuat);
            tempAoAVec3.set(0, 0, 1);
            tempAoAVec3.applyQuaternion(frameTransform.quaternion);
            tempAoAVec3.sub(tempForwardVec3);

            stepTime = AmmoAPI.getStepTime();
            speedSq = velocity.lengthSq();
            let speed = MATH.curveSqrt(speedSq)

            let inputYaw = controllablePiece.getControlStateValue('INPUT_YAW');
            let inputRoll = controllablePiece.getControlStateValue('INPUT_ROLL');
            let inputPitch = controllablePiece.getControlStateValue('INPUT_PITCH');

            tempVec1.set(0, 0, 0);
            let torqueBoost = MATH.curveQuad(getSetting(ENUMS.Settings.TORQUE_BOOST));
            let mass = controllablePiece.getMass();
            tempVec2.set(inputPitch, -inputYaw, -inputRoll)
            let cheatTorque = mass * 1000 * torqueBoost * stepTime;
            let speedTorque = mass * 200 * MATH.curveSqrt(speedSq*0.5) * stepTime
            tempVec2.multiplyScalar(cheatTorque + speedTorque)
            tempVec2.applyQuaternion(frameTransform.quaternion)

            let waterContact = controllablePiece.getAssetInstanceStatus(ENUMS.InstanceStatus.WEIGHT_ON_WATER) || 0;

            AmmoAPI.applyForceAndTorqueToBody(tempVec1, tempVec2, body)
            AmmoAPI.setBodyDamping(body, 0.01  + speed*0.001 + waterContact*0.2 +waterContact*speed*0.05, 0.01 + MATH.curveSqrt(speed*0.1) * 0.2 + waterContact*0.1);


            for (let key in surfaces) {

                let surface = surfaces[key];
                let point = controllablePiece.getDynamicPoint(key);
                if (point) {

                    point.updateDynamicPoint();

                    tempSurfaceShape.copy(surface.scale);
                    localLift.set(0, 0, 0);
                    localSlip.set(0, 0, 0);
                    localDrag.copy(velocity).normalize();
                    point.call.getLocalTransform(pointTransform);
                    pointTransform.quaternion.multiply(frameTransform.quaternion);

                    localOrientationVec3.set(0, 0, 1);
                    localOrientationVec3.applyQuaternion(pointTransform.quaternion)


                    tempAngleOfIncidence.copy(localOrientationVec3).sub(tempForwardVec3);
                //    tempAngleOfIncidence.applyQuaternion(tempObj.quaternion)
                    let inducedDrag = 0;

                    if (surface.scale.x !== 0) {
                        let surfaceArea = surface.scale.x * surface.scale.z;
                        let lift = MATH.curveSin(tempAngleOfIncidence.y) * speedSq * surfaceArea
                        localLift.copy(localUp);
                        localLift.multiplyScalar(lift);
                        inducedDrag+=Math.sqrt(Math.abs(lift));
                    //    localLift.applyQuaternion(tempObj.quaternion)
                    }

                    if (surface.scale.y === -1) {
                        let surfaceArea = surface.scale.y * surface.scale.z;
                        localSlip.x = MATH.curveSin(tempAngleOfIncidence.x) * speedSq * surfaceArea;
                        inducedDrag+=Math.sqrt(Math.abs(localSlip.x));
                        localSlip.applyQuaternion(frameTransform.quaternion)
                    }



                    localDrag.multiplyScalar(-inducedDrag)
                    tempVec1.addVectors(localSlip, localLift);

                    tempVec1.add(localDrag);
                    tempVec1.multiplyScalar(stepTime);

                    tempVec2.copy(pointTransform.position)
                    tempVec2.cross(tempVec1)

                    AmmoAPI.applyForceAndTorqueToBody(tempVec1, tempVec2, body)

                //    if (getSetting(ENUMS.Settings.SHOW_FLIGHT_FORCES) === 0) {
                        let globalPoint = point.getObj3d();
                        tempVec2.copy(localUp);
                        tempVec2.applyQuaternion(frameTransform.quaternion);
                        tempVec2.add(globalPoint.position)
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:globalPoint.position, size:0.2, color:'RED'});
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:globalPoint.position, to:tempVec2, color:'ORANGE'});

                    tempVec2.copy(localLift);
                    tempVec2.applyQuaternion(frameTransform.quaternion);
                    tempVec2.add(globalPoint.position)
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:globalPoint.position, to:tempVec2, color:'YELLOW'});

                //    }

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