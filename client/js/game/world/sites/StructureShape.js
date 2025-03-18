import {poolFetch, poolReturn} from "../../../application/utils/PoolUtils.js";
import {Object3D} from "../../../../../libs/three/core/Object3D.js";
import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {initBatchedShape} from "./BatchedShape.js";
import {bodyForObj3dByParams, transformBody} from "../../../application/utils/PhysicsUtils.js";
import {MATH} from "../../../application/MATH.js";
import {Box3} from "three";


class StructureShape{
    constructor() {

        const obj3d = new Object3D();

        const info = {
            obj3d:obj3d,
            pos:obj3d.position,
            box:new Box3(),
            visual:null,
            body:null,
            json:null
        }

        const bodyParams = {}
        this.info = info;

        function applyTrx(trxObj) {
            obj3d.position.copy(trxObj.position);
            obj3d.quaternion.copy(trxObj.quaternion);
            obj3d.scale.copy(trxObj.scale)
            info.box.setFromCenterAndSize(obj3d.position, obj3d.scale)
        }

        function update() {
            if (info.visual && info.body) {
                info.visual.call.stickToBody(info.body)
            }
        }

        function activatePhysicsSimulation() {
            AmmoAPI.requestBodyActivation(info.body);
            ThreeAPI.registerPrerenderCallback(update);
        }

        function deactivatePhysicsSimulation() {
            ThreeAPI.unregisterPostrenderCallback(update);
            AmmoAPI.requestBodyDeactivation(info.body);
        }

        function attachBody(body) {
            if (info.body !== null) {
                if (info.body !== body) {
                    AmmoAPI.excludeBody(info.body);
                }
            }
            info.body = body
            activatePhysicsSimulation()
        }

        function detachBody() {
            AmmoAPI.excludeBody(info.body);
        }

        function activatePhysics() {
            bodyForObj3dByParams(obj3d, bodyParams, attachBody)
        }

        function activateVisualStructure() {

            const batched = info.json['batched'];
            if (typeof (batched) === 'string') {
                info.visual = initBatchedShape(batched, obj3d)
            }
        }

        function deactivateVisualStructure() {
            if (info.visual !== null) {
                info.visual.call.closeShape();
            }
        }

        function setJson(jsn) {

            info.json = jsn;
            const physicalId = jsn['physical'];

            if (typeof (physicalId) === 'string') {

                function onJson(cfg) {
                    const volume = obj3d.scale.x*obj3d.scale.y*obj3d.scale.z;
                    bodyParams.shape = cfg['shape'];
                    bodyParams.mass = cfg['mass']*volume;
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
            activatePhysics:activatePhysics,
            detachBody:detachBody,
            setJson:setJson,
            applyTrx:applyTrx
        }

    }

    removeShape() {
        this.call.deactivateVisualStructure()
        if (this.info.body) {
            this.call.detachBody();
            this.info.body = null;
        }
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