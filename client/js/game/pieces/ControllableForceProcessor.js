import {Object3D, Quaternion, Vector3} from "../../../../libs/three/Three.Core.js";
import {bodyTransformToObj3d, getBodyVelocity} from "../../application/utils/PhysicsUtils.js";
import {ENUMS} from "../../application/ENUMS.js";
import {evt} from "../../application/event/evt.js";
import {MATH} from "../../application/MATH.js";

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

        let controlStates = controllablePiece.controlStates;
        let propulsion = controllablePiece.propulsion;
        let surfaces = controllablePiece.surfaces;

        let stepTime = 0;
        let speedSq = 0;

        function applyEngineForce(point, prop, stateValue, body) {
            let force = stateValue * prop.force * stepTime * 10
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

            let velocity = getBodyVelocity(body);

            bodyTransformToObj3d(body, tempObj);
            updatePropulsion(body);


            tempForwardVec3.copy(velocity).normalize();

            localQuat.copy(tempObj.quaternion).invert()
            localUp.set(0, 1, 0);
            localUp.applyQuaternion(tempObj.quaternion);

        //    tempForwardVec3.applyQuaternion(localQuat);
            tempAoAVec3.set(0, 0, 1);
            tempAoAVec3.applyQuaternion(tempObj.quaternion);
            tempAoAVec3.sub(tempForwardVec3);

            stepTime = AmmoAPI.getStepTime();
            speedSq = velocity.lengthSq();


            let inputYaw = controllablePiece.getControlStateValue('INPUT_YAW');
            let inputRoll = controllablePiece.getControlStateValue('INPUT_ROLL');
            let inputPitch = controllablePiece.getControlStateValue('INPUT_PITCH');

            tempVec1.set(0, 0, 0);
            tempVec2.set(MATH.curveQuad(inputPitch), -MATH.curveQuad(inputYaw), -MATH.curveQuad(inputRoll)).multiplyScalar(500000000 * stepTime)
            tempVec2.applyQuaternion(tempObj.quaternion)
            AmmoAPI.applyForceAndTorqueToBody(tempVec1, tempVec2, body)

            for (let key in surfaces) {
                let surface = surfaces[key];
                let point = controllablePiece.getDynamicPoint(key);
                if (point) {

                    tempSurfaceShape.copy(surface.scale);
                    localLift.set(0, 0, 0);
                    localSlip.set(0, 0, 0);
                    localDrag.copy(velocity).normalize();
                    point.call.getLocalTransform(tempObj2);
                    tempObj2.quaternion.multiply(tempObj.quaternion);

                    localOrientationVec3.set(0, 0, 1);
                    localOrientationVec3.applyQuaternion(tempObj2.quaternion)


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

                    if (surface.scale.y !== 0) {
                        let surfaceArea = surface.scale.y * surface.scale.z;
                        localSlip.x = MATH.curveSin(tempAngleOfIncidence.x) * speedSq * surfaceArea;
                        inducedDrag+=Math.sqrt(Math.abs(localSlip.x));
                        localSlip.applyQuaternion(tempObj.quaternion)
                    }

                    localDrag.multiplyScalar(-inducedDrag)
                    tempVec1.addVectors(localSlip, localLift);

                    tempVec1.add(localDrag);
                    tempVec1.multiplyScalar(stepTime);

                    tempVec2.crossVectors(tempObj2.position, tempVec1)

                    AmmoAPI.applyForceAndTorqueToBody(tempVec1, tempVec2, body)
                    return;

                    // AmmoAPI.applyForceAtPointToBody(tempVec1, tempObj2.position, body);

                            tempObj2.position.add(tempObj.position);
                            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempObj2.position, size:0.05, color:'GREEN'});

                    tempVec2.copy(localLift);
                    tempVec2.multiplyScalar(0.01)
                    tempVec2.add(tempObj2.position)
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj2.position, to:tempVec2, color:'RED'});

                    tempVec2.copy(localSlip);
                    tempVec2.multiplyScalar(0.01)
                    tempVec2.add(tempObj2.position)
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj2.position, to:tempVec2, color:'RED'});

                    tempVec2.copy(localDrag);
                    tempVec2.multiplyScalar(0.01)
                    tempVec2.add(tempObj2.position)
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj2.position, to:tempVec2, color:'RED'});

                    tempVec2.copy(tempAngleOfIncidence);
                    tempVec2.add(tempObj2.position)
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj2.position, to:tempVec2, color:'ORANGE'});

                    tempVec2.copy(tempForwardVec3);
                    tempVec2.add(tempObj2.position)
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj2.position, to:tempVec2, color:'BLUE'});

                    tempVec2.copy(localOrientationVec3);
                    tempVec2.add(tempObj2.position);
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj2.position, to:tempVec2, color:'GREEN'});

                    tempVec2.copy(localUp);
                    tempVec2.add(tempObj2.position);
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj2.position, to:tempVec2, color:'GREEN'});

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