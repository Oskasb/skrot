import {Vector2} from "three/webgpu";
import {Object3D} from "../../../../../libs/three/core/Object3D.js";
import {jsonAsset, loadBatchGeometry} from "../../../application/utils/AssetUtils.js";
import {terrainAt} from "../../../3d/three/terrain/ComputeTerrain.js";
import {evt} from "../../../application/event/evt.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {registerGroundLodCallback, unregisterGroundLodCallback} from "../../../application/grids/GroundBoundLodBox.js";
import {MATH} from "../../../application/MATH.js";

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

const tempObj = new Object3D();

class ForestTreeLodable {
    constructor() {
        let indexPos = new Vector2();
        let minLodLevel
        let obj3d = new Object3D();
        let lodLevel = 0;
        let debugDrawing = false;

        let assetBatchGeometry = null;
        let json = null;

        const batchInstances = [];


        function debugUpdate() {
        //    if (debugDrawing === true) {
         //       debugDrawTree(obj3d, lodLevel)
        //    }
        }

        function setLodLevel(lodL) {
            lodLevel = lodL;

            if (assetBatchGeometry === null) {
                return;
            }

            if (lodLevel > minLodLevel) {

                let height = obj3d.position.y;

                if (height < 2) {
                    return;
                }

                if (batchInstances.length === 0) {

                    let trunkName = MATH.getRandomArrayEntry(json['trunks']);
                    let branchName = MATH.getRandomArrayEntry(json['branches']);

                    let trunkInstance = assetBatchGeometry.call.activateBatchInstance(trunkName);
                    let branchInstance = assetBatchGeometry.call.activateBatchInstance(branchName);
                    tempObj.position.copy(obj3d.position);
                    tempObj.quaternion.copy(obj3d.quaternion);
                    tempObj.scale.copy(obj3d.scale);
                    trunkInstance.call.transformObj(tempObj);

                    tempObj.position.y += obj3d.scale.y*0.5 +5;
                    branchInstance.call.transformObj(tempObj);
                    batchInstances.push(trunkInstance);
                    batchInstances.push(branchInstance);

                }

            //    closeLodTree()
                if (debugDrawing === false) {
                //    ThreeAPI.registerPrerenderCallback(debugUpdate);
                    debugDrawing = true;
                } else {

                }
            } else {
                closeLodTree()
            }
        }


        function activateBatchGeometries(batchGeo) {
        //    console.log("activateBatchGeometries", batchGeo);
            assetBatchGeometry = batchGeo;
            if (lodLevel !== 0) {
                setLodLevel(lodLevel);
            }
        }


        function setTreeJson(jsn) {
            json = jsn;
            let size = MATH.randomBetween(json.size[0], json.size[1]);
            obj3d.scale.set(size, size, size)
            obj3d.up.set(0, 1, 0);
            obj3d.lookAt(obj3d.up);
            obj3d.position.y = terrainAt(obj3d.position);
            loadBatchGeometry(json.batch, activateBatchGeometries);
        //    console.log("setTreeJson")
        }

        function initForestTree(fileName, trxObj3d, indPos, minLodLvl) {
            indexPos.copy(indPos);
            minLodLevel = minLodLvl;
            obj3d.position.copy(trxObj3d.position);
            obj3d.quaternion.copy(trxObj3d.quaternion);
            obj3d.scale.copy(trxObj3d.scale)
            jsonAsset(fileName, setTreeJson);
        }

        function closeLodTree() {
        //    console.log("Close closeLodTree")

            while( batchInstances.length) {
                assetBatchGeometry.call.deactivateBatchInstance(batchInstances.pop());
            }

        //    ThreeAPI.unregisterPrerenderCallback(debugUpdate);
            debugDrawing = false
        }

        this.call = {
            initForestTree:initForestTree,
            setLodLevel:setLodLevel
        }

    }


}

export { ForestTreeLodable }