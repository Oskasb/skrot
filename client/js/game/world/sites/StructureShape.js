import {poolFetch, poolReturn} from "../../../application/utils/PoolUtils.js";
import {Object3D} from "../../../../../libs/three/core/Object3D.js";
import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {initBatchedShape} from "./BatchedShape.js";
import {
    bodyForObj3dByParams, getBodyPointer,
    registerBodyActivationCB,
    transformBody
} from "../../../application/utils/PhysicsUtils.js";
import {MATH} from "../../../application/MATH.js";
import {Box3} from "three";
import {
    physIndexForPos,
    registerPhysicsGridCallback,
    unregisterPhysicsGridCallback
} from "../../../application/physics/PhysicsLodGrid.js";
import {Vector2} from "../../../../../libs/three/math/Vector2.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {evt} from "../../../application/event/evt.js";
import {debugDrawBuilding, debugDrawToPos} from "../../../application/utils/DebugUtils.js";
import {getFrame} from "../../../application/utils/DataUtils.js";

class StructureShape{
    constructor() {

        const obj3d = new Object3D();

        const info = {
            obj3d:obj3d,
            registered:false,
            physIndexPos:new Vector2(),
            pos:obj3d.position,
            box:new Box3(),
            visual:null,
            body:null,
            dynamicMass:0,
            activating:false,
            deactivating:false,
            dynamicActive:false,
            json:null,
            parent:null,
            activationTime:0
        }

        const bodyParams = {}
        this.info = info;

        function applyTrx(trxObj) {
            obj3d.position.copy(trxObj.position);
            obj3d.quaternion.copy(trxObj.quaternion);
            obj3d.scale.copy(trxObj.scale)
            info.box.setFromCenterAndSize(obj3d.position, obj3d.scale)
            if (info.registered === false) {
                info.registered = true;
                physIndexForPos(obj3d.position, info.physIndexPos)
            }
        }

        function update() {

            if (info.body) {

                const now = getFrame().gameTime;

                if (now-info.activationTime > 5) {
                    const relaxing = AmmoAPI.testBodyRelaxing(info.body);
                    if (relaxing) {
                    //    debugDrawToPos(obj3d.position)
                        deactivatePhysicsSimulation();
                    } else {
                    //    debugDrawToPos(obj3d.position, 'RED')
                    }
                }

                if (info.visual) {
                //    debugDrawToPos(obj3d.position, 'YELLOW')
                    info.visual.call.stickToBody(info.body)
                } else {
                    if (info.deactivating === true) {
                        deactivatePhysicsSimulation();
                        detachBody()
                    }
                }
            }

        }

        function activatePhysicsSimulation(bool) {

            if (bodyParams.mass === 0) {
                return;
            }

            if (bool) {

                if (info.dynamicActive === false) {
                    info.dynamicActive = true;
                    if (info.body !== null) {
                    //    console.log("requestBodyActivation", info)
                        AmmoAPI.requestBodyActivation(info.body);
                    }
                //
                    ThreeAPI.registerPrerenderCallback(update);

                }

            } else {
                deactivatePhysicsSimulation()
            }
        }

        function deactivatePhysicsSimulation() {
            info.dynamicActive = false;
            ThreeAPI.unregisterPrerenderCallback(update);
            if (info.body !== null) {
                AmmoAPI.requestBodyDeactivation(info.body);
            }
        }

        function notifyDynamicActivation() {
            info.activationTime = getFrame().gameTime;
            if (info.dynamicActive === false) {
                if (info.parent) {
                    info.parent.info.building.call.activateDynamicPhysics(true);
                }
            }
        }

        function attachBody(body) {
            if (info.body !== null) {
                if (info.body !== body) {
                    AmmoAPI.excludeBody(info.body);
                }
            }
            info.body = body
            info.activating = false;

            if (bodyParams.mass !== 0) {
                AmmoAPI.requestBodyDeactivation(info.body);
                registerBodyActivationCB(getBodyPointer(info.body), notifyDynamicActivation)
            }
        }

        function detachBody() {

            if (info.dynamicActive === false) {
                if (info.body !== null) {
                    AmmoAPI.excludeBody(info.body);
                    info.body = null;
                }
            } else {
                info.deactivating = true;
            }

        }

        function physicsActivationCB(value) {
            if (value !== 0) {
                if (info.body === null) {
                    if (info.activating === false) {
                        info.activating = true;
                    //    debugDrawToPos(obj3d.position, 'GREEN')
                        bodyForObj3dByParams(obj3d, bodyParams, attachBody)
                    }
                }
            } else {
             //   debugDrawToPos(obj3d.position, 'RED')
                detachBody()
            }
        }

        function activatePhysics() {
            registerPhysicsGridCallback(info.physIndexPos, physicsActivationCB)
        }

        function deactivatePhysics() {
            deactivatePhysicsSimulation()
            detachBody();
            unregisterPhysicsGridCallback(info.physIndexPos, physicsActivationCB)
        }

        function activateVisualStructure() {

            if (info.visual !== null) {
                console.log("Visual not null", info)
                return;
            }

            const batched = info.json['batched'];
            if (typeof (batched) === 'string') {
                info.visual = initBatchedShape(batched, obj3d)
            }
        }

        function deactivateVisualStructure() {
            if (info.visual !== null) {
                info.visual.call.closeShape();
                info.visual = null;
            }
        }

        function setJson(jsn) {

            info.json = jsn;
            const physicalId = jsn['physical'];

            if (typeof (physicalId) === 'string') {

                function onJson(cfg) {
                    const volume = obj3d.scale.x*obj3d.scale.y*obj3d.scale.z;
                    bodyParams.shape = cfg['shape'];
                    info.dynamicMass = cfg['mass']*volume;
                    bodyParams.mass = info.dynamicMass;
                    bodyParams.friction = cfg['friction'];
                    bodyParams.scale = cfg['scale'];
                    bodyParams.assetId = null;
                    bodyParams.convex = false;
                    bodyParams.children = false;
                    activatePhysics()
                }
                jsonAsset(physicalId, onJson)

            }

        }

        this.call = {
            activateVisualStructure:activateVisualStructure,
            deactivateVisualStructure:deactivateVisualStructure,
            activatePhysicsSimulation:activatePhysicsSimulation,
            deactivatePhysics:deactivatePhysics,
            setJson:setJson,
            applyTrx:applyTrx
        }

    }

    removeShape() {
        this.call.deactivateVisualStructure();
        this.call.deactivatePhysics();
        this.info.activating = false;
        this.info.deactivating = false;
        this.info.registered = false;
        this.info.parent = null;
        poolReturn(this);
    }

    getPos() {
        return this.info.pos;
    }

}



function createStructureShape(fileName, trxObj) {
    const struct = poolFetch('StructureShape')
    struct.call.applyTrx(trxObj);
    jsonAsset(fileName, struct.call.setJson);
    return struct;
}

export {
    StructureShape,
    createStructureShape
}