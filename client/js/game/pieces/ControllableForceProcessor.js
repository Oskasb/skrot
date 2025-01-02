import {Object3D, Vector3} from "../../../../libs/three/Three.Core.js";
import {bodyTransformToObj3d, getBodyVelocity} from "../../application/utils/PhysicsUtils.js";
import {ENUMS} from "../../application/ENUMS.js";
import {evt} from "../../application/event/evt.js";
import {MATH} from "../../application/MATH.js";

let tempObj = new Object3D();
let tempObj2 = new Object3D();
let tempVec1 = new Vector3();
let tempVec2 = new Vector3();

class ControllableForceProcessor {
    constructor(controllablePiece) {

        let controlStates = controllablePiece.controlStates;
        let propulsion = controllablePiece.propulsion;
        let surfaces = controllablePiece.surfaces;

        function update() {

            let body = controllablePiece.getAmmoBody();
            if (!body) {
                return;
            }

            let velocity = getBodyVelocity(body);

            bodyTransformToObj3d(body, tempObj);

            let stepTime = AmmoAPI.getStepTime();

            for (let key in propulsion) {
                let prop = propulsion[key];
                let point = controllablePiece.getDynamicPoint(key);
                if (point) {
                    let ctrlDyn = controllablePiece.getControlByName(key)
                    if (ctrlDyn) {
                        let stateValue = ctrlDyn.state.value;
                        if (typeof stateValue === 'number') {
                            let force = stateValue * prop.force * stepTime * 100
                            tempVec1.set(0, 0, -force);
                            point.call.getLocalTransform(tempObj2);
                            tempObj2.quaternion.multiply(tempObj.quaternion);
                            tempVec1.applyQuaternion(tempObj2.quaternion)
                            AmmoAPI.applyForceAtPointToBody(tempVec1, tempObj2.position, body);
                            tempObj2.position.add(tempObj.position);
                            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempObj2.position, size:0.4, color:'YELLOW'});
                            tempVec1.multiplyScalar(0.001);
                            tempVec1.add(tempObj2.position);
                            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj2.position, to:tempVec1, color:'YELLOW'});
                        }
                    }
                }
            }

            for (let key in surfaces) {
                let surface = surfaces[key];
                let point = controllablePiece.getDynamicPoint(key);
                if (point) {
                //    let ctrlDyn = controllablePiece.getControlByName(key)
                //    if (ctrlDyn) {
                //        let stateValue = ctrlDyn.state.value;
                 //       if (typeof stateValue === 'number') {
                            point.call.getLocalTransform(tempObj2);
                            tempObj2.quaternion.multiply(tempObj.quaternion);

                            tempVec1.set(0, 0, 1);
                            tempVec1.applyQuaternion(tempObj2.quaternion)

                    let angZ = MATH.angleZFromVectorToVector(tempVec1, velocity);
                    let lift = Math.sin(-angZ) * velocity.lengthSq();
                            tempVec2.set(0, lift, 0);
                            tempVec2.applyQuaternion(tempObj.quaternion)
                            //tempVec2.cross(tempVec1);
                    tempVec2.multiplyScalar(1 * stepTime);
                    tempVec1.copy(tempVec2);
                            AmmoAPI.applyForceAtPointToBody(tempVec1, tempObj2.position, body);

                    tempVec2.set(0, 0, 1);
                    tempVec2.applyQuaternion(tempObj2.quaternion);
                            tempObj2.position.add(tempObj.position);
                            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempObj2.position, size:0.2, color:'YELLOW'});
                    tempVec2.add(tempObj2.position);
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj2.position, to:tempVec2, color:'YELLOW'});
                //    tempVec1.copy(velocity);
                    tempVec1.add(tempObj2.position)
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj2.position, to:tempVec1, color:'GREEN'});
                  //      }
                //    }
                }
            }

            tempVec1.copy(velocity)
            tempVec1.add(tempObj.position)
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj.position, to:tempVec1, color:'CYAN'});


        }

        AmmoAPI.registerPhysicsStepCallback(update);

    }
}

export { ControllableForceProcessor };