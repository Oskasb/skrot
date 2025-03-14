import {poolFetch, poolReturn} from "../../../application/utils/PoolUtils.js";
import {Object3D} from "../../../../../libs/three/core/Object3D.js";
import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {initBatchedShape} from "./BatchedShape.js";
import {transformBody} from "../../../application/utils/PhysicsUtils.js";
import {MATH} from "../../../application/MATH.js";

const zero = [0, 0, 0];
const tempRot = [];
class StructureShape{
    constructor() {

        const obj3d = new Object3D();

        const info = {
            obj3d:obj3d,
            pos:obj3d.position,
            visual:null,
            body:null
        }

        this.info = info;

        function applyTrx(trxObj) {
            obj3d.position.copy(trxObj.position);
            obj3d.quaternion.copy(trxObj.quaternion);
            obj3d.scale.copy(trxObj.scale)
        }


        function update() {
            if (info.visual && info.body) {
                info.visual.call.stickToBody(info.body)
            }
        }

        function attachBody(body) {
          //  AmmoAPI.requestBodyDeactivation(body)
            info.body = body
            ThreeAPI.registerPrerenderCallback(update);
        }

        function detachBody() {
            ThreeAPI.unregisterPostrenderCallback(update);
            AmmoAPI.excludeBody(info.body);
        }

        function setJson(jsn) {

            const batched = jsn['batched'];
            const physicalId = jsn['physical'];


            if (typeof (batched) === 'string') {
                info.visual = initBatchedShape(batched, obj3d)
            }

            if (typeof (physicalId) === 'string') {

                function onJson(cfg) {
                    const volume = obj3d.scale.x*obj3d.scale.y*obj3d.scale.z;
                    MATH.rotObj3dToArray(obj3d, tempRot)
                    AmmoAPI.setupRigidBody(obj3d, cfg['shape'], volume*cfg['mass'], cfg['friction'], zero, tempRot, cfg['scale'], null, false, false, attachBody)
                }
                jsonAsset(physicalId, onJson)

            }

        }

        this.call = {
            detachBody:detachBody,
            setJson:setJson,
            applyTrx:applyTrx
        }

    }

    removeShape() {
        this.info.visual.call.closeShape();
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