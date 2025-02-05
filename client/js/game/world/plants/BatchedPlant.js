import {Vector2} from "three/webgpu";
import {Object3D} from "../../../../../libs/three/core/Object3D.js";
import {jsonAsset, loadBatchGeometry} from "../../../application/utils/AssetUtils.js";
import {groundAt, terrainAt} from "../../../3d/three/terrain/ComputeTerrain.js";
import {evt} from "../../../application/event/evt.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {registerGroundLodCallback, unregisterGroundLodCallback} from "../../../application/grids/GroundBoundLodBox.js";
import {MATH} from "../../../application/MATH.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {poolReturn} from "../../../application/utils/PoolUtils.js";

const tempVec = new Vector3();

const lodLevelDebugColors = [
    'WHITE',
    'RED',
    'BLUE',
    'ORANGE',
    'CYAN',
    'GREEN',
    'YELLOW',
    'BLACK'
]

function debugDrawTree(obj3d, lodLevel) {
    let color = lodLevelDebugColors[lodLevel];
    let y = terrainAt(obj3d.position);
    obj3d.position.y = y;

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:obj3d.position, to:ThreeAPI.getCameraCursor().getPos(), color:color})

}

const groundData = {};

function positionsuitsTree(pos) {
    groundAt(pos, groundData)

    if (groundData.y > 0.5) {
        return true;
    }
    return false;
}

const tempObj = new Object3D();

class BatchedPlant {
    constructor() {
        const batchedPlant = this;

        const obj3d = new Object3D();


        let assetBatchGeometry = null;
        let json = null;

        let fileName = null;

        const batchInstances = [];

        let plantIsActive = false;



        function activateInstance() {

            plantIsActive = true;

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
            if (plantIsActive) {
                closePlant()
            }
         //   closeLodTree()
            json = jsn;
            let size = MATH.randomBetween(json.size[0], json.size[1]);
            obj3d.scale.set(size, size, size)

            loadBatchGeometry(json.batch, activateBatchGeometries);

        }


        function init(fName, trxObj3d) {
            fileName = fName;
            obj3d.position.copy(trxObj3d.position);
            obj3d.quaternion.copy(trxObj3d.quaternion);
            obj3d.scale.copy(trxObj3d.scale)
            jsonAsset(fileName, setJson);
        }


        function closePlant() {
            plantIsActive = false;
            while( batchInstances.length) {
                assetBatchGeometry.call.deactivateBatchInstance(batchInstances.pop());
            }
            poolReturn(batchedPlant);
        }

        this.call = {
            init:init,
            closePlant:closePlant
        }

    }


}

export { BatchedPlant }