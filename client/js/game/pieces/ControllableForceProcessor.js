import {Object3D, Vector3} from "../../../../libs/three/Three.Core.js";
import {bodyTransformToObj3d, getBodyVelocity} from "../../application/utils/PhysicsUtils.js";

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
                        }
                    }
                }
            }

            for (let key in surfaces) {
                let surface = surfaces[key];
                let point = controllablePiece.getControlByName(key);
                if (point) {
                    let ctrlDyn = controllablePiece.getControlByName(key)
                    if (ctrlDyn) {
                        let stateValue = ctrlDyn.state.value;
                        if (typeof stateValue === 'number') {
                            point.call.getLocalTransform(tempObj2);
                            tempObj2.quaternion.multiply(tempObj.quaternion);
                            tempVec1.copy(surface.scale);
                            tempVec1.applyQuaternion(tempObj2.quaternion);
                            tempVec1.set(0, velocity.length(), 0);
                            tempVec1.multiply(100 * stepTime);
                            AmmoAPI.applyForceAtPointToBody(tempVec1, tempObj2.position, body);
                        }
                    }
                }
            }




        }

        AmmoAPI.registerPhysicsStepCallback(update);

    }
}

export { ControllableForceProcessor };