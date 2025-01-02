import {Object3D, Vector3} from "../../../../libs/three/Three.Core.js";
import {bodyTransformToObj3d} from "../../application/utils/PhysicsUtils.js";

let tempObj = new Object3D();
let tempVec1 = new Vector3();
let tempVec2 = new Vector3();

class ControllableForceProcessor {
    constructor(controllablePiece) {

        let controlStates = controllablePiece.controlStates;
        let propulsion = controllablePiece.propulsion;

        function update() {

            let body = controllablePiece.getAmmoBody();
            if (!body) {
                return;
            }

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
                            tempVec1.set(0, 0, force);
                            point.call.getLocalTransform(tempObj);
                            tempVec1.applyQuaternion(tempObj.quaternion)
                            AmmoAPI.applyForceAtPointToBody(tempVec1, tempObj.position, body);
                        }
                    }
                }
            }

        }

        AmmoAPI.registerPhysicsStepCallback(update);

    }
}

export { ControllableForceProcessor };