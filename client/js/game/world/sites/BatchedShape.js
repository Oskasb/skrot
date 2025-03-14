import {Object3D} from "../../../../../libs/three/core/Object3D.js";
import {jsonAsset, loadBatchGeometry} from "../../../application/utils/AssetUtils.js";
import {MATH} from "../../../application/MATH.js";
import {poolFetch, poolReturn} from "../../../application/utils/PoolUtils.js";
import {bodyTransformToObj3d} from "../../../application/utils/PhysicsUtils.js";

class BatchedShape {
    constructor() {
        const batchedShape = this;
        const obj3d = new Object3D();
        let assetBatchGeometry = null;
        let json = null;
        let fileName = null;
        const batchInstances = [];
        let shapeIsActive = false;

        function activateInstance() {

            shapeIsActive = true;
                if (batchInstances.length === 0) {
                    let modelName = json['model'];
                    let modelInstance = assetBatchGeometry.call.activateBatchInstance(modelName);
                    modelInstance.call.transformObj(obj3d);
                    batchInstances.push(modelInstance);
                }
        }

        function activateBatchGeometries(batchGeo) {
            assetBatchGeometry = batchGeo;
            activateInstance();
        }

        function setJson(jsn) {
            if (shapeIsActive) {
                closeShape()
            }
            json = jsn;
            loadBatchGeometry(json.batch, activateBatchGeometries);
        }

        function init(fName, trxObj3d) {
            fileName = fName;
            obj3d.position.copy(trxObj3d.position);
            obj3d.quaternion.copy(trxObj3d.quaternion);
            obj3d.scale.copy(trxObj3d.scale)
            jsonAsset(fileName, setJson);
        }

        function closeShape() {
            shapeIsActive = false;
            while( batchInstances.length) {
                assetBatchGeometry.call.deactivateBatchInstance(batchInstances.pop());
            }
            poolReturn(batchedShape);
        }

        function getObj3d() {
            return obj3d;
        }

        function applyTrx(trxObj) {
            obj3d.position.copy(trxObj.position);
            obj3d.quaternion.copy(trxObj.quaternion);
            obj3d.scale.copy(trxObj.scale)

            for (let i = 0; i < batchInstances.length; i++) {
                batchInstances[i].call.transformObj(obj3d);
            }
        }

        function stickToBody(body) {
            bodyTransformToObj3d(body, obj3d);
            for (let i = 0; i < batchInstances.length; i++) {
                batchInstances[i].call.transformObj(obj3d);
            }
        }

        this.call = {
            init:init,
            closeShape:closeShape,
            stickToBody:stickToBody,
            getObj3d:getObj3d,
            applyTrx:applyTrx
        }
    }

    getPos() {
        return this.call.getObj3d().position;
    }

    applyTransformObj3d(obj3d) {
        this.call.applyTrx(obj3d)
    }

}

function initBatchedShape(fileName, trxObj3d) {
    let bShape = poolFetch('BatchedShape');
    bShape.call.init(fileName, trxObj3d);
    return bShape;
}

export {
    BatchedShape,
    initBatchedShape
}