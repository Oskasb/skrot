import {Vector2, Vector3} from "three/webgpu";
import {Box3} from "three";
import {terrainAt} from "../../../3d/three/terrain/ComputeTerrain.js";
import {MATH} from "../../../application/MATH.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {evt} from "../../../application/event/evt.js";
import {poolFetch, poolReturn} from "../../../application/utils/PoolUtils.js";
import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {registerGroundLodCallback, unregisterGroundLodCallback} from "../../../application/grids/GroundBoundLodBox.js";
import {Object3D} from "../../../../../libs/three/core/Object3D.js";

const tempVec3 = new Vector3()
const tempObj3d = new Object3D();

const lodLevelDebugColors = [
    'BLACK',
    'RED',
    'BLUE',
    'ORANGE',
    'CYAN',
    'GREEN',
    'YELLOW',
    'BLACK'
]

function debugForestInBox(box, lodLevel) {
 //   for (let i = 0; i < lodLevel * 3; i++) {

    //    let pos = MATH.sillyRandomPointInBox(box, Math.random())
    let pos = tempVec3;
    box.getCenter(pos)
        let y = terrainAt(pos) + Math.random()*5;
        tempVec3.copy(pos)
        tempVec3.y = y;
        pos.y = y+20;
        let color = lodLevelDebugColors[lodLevel];
     //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:tempVec3, color:'GREEN'})
     //   evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec3, size:5, color:'GREEN'})
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:ThreeAPI.getCameraCursor().getPos(), color:color})
  //  }
}


function selectFileFromList(list, seed) {

    let entryIndex = Math.floor(MATH.sillyRandom(seed + list.length) * list.length)
    return list[entryIndex]

}

class TerrainForestSection {
    constructor() {
        this.indexPos = new Vector2();
        const indexPos = this.indexPos;
        this.box = new Box3();
        const box = this.box;

        let lodLevelCurrent = 0;
        let forestConfig = null;

        let lodTrees = [];
        let unspawnedTrees = []

        let streaming = false;

        const sectionInfo = {
            isActive:false,
            debugDraw:function() {
                if (sectionInfo.isActive === true) {
                    //  if (lodLevelCurrent !== 0) {
                    debugForestInBox(box, lodLevelCurrent)
                    //  }
                }
            },
            streamSpawn:function() {

                for (let i = 0; i < lodLevelCurrent + 1; i++) {
                    let tree = unspawnedTrees.pop();
                    if (tree) {
                        tree.call.activateForestTree();
                        tree.call.setLodLevel(lodLevelCurrent+1);
                        lodTrees.push(tree);
                    }
                }

                if (unspawnedTrees.length) {
                    streaming = true;
                    ThreeAPI.threeSetup.addPostrenderCallback(sectionInfo.streamSpawn)
                } else {
                    streaming = false;
                    ThreeAPI.threeSetup.removePostrenderCallback(sectionInfo.streamSpawn)
                }

            }
        }



        function processForestConfig() {
        //    console.log("processForestConfig", indexPos.x, indexPos.y)

            if (sectionInfo.isActive === true) {
                removeTrees()
            } else {

                //   ThreeAPI.registerPrerenderCallback(sectionInfo.debugDraw)
                registerGroundLodCallback(indexPos, lodUpdated)
                sectionInfo.isActive = true;
            }

            let lodDist = forestConfig['lod_distribution'];
            let lodSelections = forestConfig['lod_selections']
            let sideSize = box.max.x - box.min.x; // 500..
            let subgridSideCount = Math.ceil( sideSize / (1/forestConfig.density));
            let subgridSideSize = sideSize / subgridSideCount;

            for (let i = 0; i < subgridSideCount; i++) {
                for (let j = 0; j < subgridSideCount; j++) {
                    let seed = indexPos.x + indexPos.y*indexPos.x + i + j*indexPos.x + j;
                    let lodSelection = Math.floor(MATH.sillyRandom(seed+1) * lodSelections.length);
                    seed+=lodSelection;
                    let lodProbability = lodDist[lodSelection];
                //    if (lodProbability < MATH.sillyRandom(seed+2)) {

                        let fileName = selectFileFromList(lodSelections[lodSelection], seed)

                    //    if (typeof (fileName) === 'string') {
                            let tree = poolFetch('ForestTreeLodable');

                            tempObj3d.position.copy(box.min);
                            let randomVec = MATH.sillyRandomVector(seed+indexPos.y);
                            randomVec.multiplyScalar(subgridSideSize * 0.5);
                            tempVec3.set(i*subgridSideSize, 0, j*subgridSideSize);
                            tempVec3.add(randomVec);
                            tempObj3d.position.add(tempVec3)

                            tree.call.initForestTree(fileName, tempObj3d, indexPos, lodSelection +1)

                        //    tree.call.activateForestTree();
                            lodTrees.push(tree)
                            // unspawnedTrees.push(tree);
                    //    }

                 //   }
                }
            }
        }





        function lodUpdated(lodLevel) {
        //    console.log("Lod Update", lodLevel)

            lodLevelCurrent = lodLevel;

                for (let i = 0; i < lodTrees.length; i++) {
                    lodTrees[i].call.setLodLevel(lodLevel);
                }

        }



        function setConfig(json) {
            forestConfig = json;
            processForestConfig()
        }

        function removeTrees() {
            while (lodTrees.length) {
                let tree = lodTrees.pop()
                tree.call.setLodLevel(0)
                poolReturn(tree);
            }
            while (unspawnedTrees.length) {
                let tree = unspawnedTrees.pop()
                poolReturn(tree);
            }
            streaming = false;
        }


        function unregisterCallbacks() {
        //    console.log("unregisterCallbacks", indexPos.x, indexPos.y)
            removeTrees()
            unregisterGroundLodCallback(indexPos, lodUpdated)
        //    ThreeAPI.unregisterPrerenderCallback(sectionInfo.debugDraw)
            sectionInfo.isActive = false;
        }

        function activateBox(lodBox, configFileName) {
            unregisterCallbacks()
        //    console.log("activateBox", indexPos.x, indexPos.y, lodBox.indexPos.x, lodBox.indexPos.y)
            indexPos.copy(lodBox.indexPos);
            box.copy(lodBox.box);
            jsonAsset(configFileName, setConfig)
        }

        this.call = {
            unregisterCallbacks:unregisterCallbacks,
            activateBox:activateBox
        }

    }


}

export { TerrainForestSection }