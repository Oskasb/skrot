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
    'WHITE',
    'RED',
    'BLUE',
    'ORANGE',
    'CYAN',
    'GREEN',
    'YELLOW',
    'BLACK'
]

function debugForestInBox(box, lodLevel) {
    for (let i = 0; i < lodLevel * 3; i++) {

        let pos = MATH.sillyRandomPointInBox(box, i)
        let y = terrainAt(pos);
        tempVec3.copy(pos)
        tempVec3.y = y;
        pos.y = y+20;
        let color = lodLevelDebugColors[lodLevel];
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:tempVec3, color:'GREEN'})
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec3, size:5, color:'GREEN'})
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:ThreeAPI.getCameraCursor().getPos(), color:color})
    }
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

        function processForestConfig() {

            removeTrees()

            let lodDist = forestConfig['lod_distribution'];
            let sideSize = box.max.x - box.min.x;
            let subgridSideCount = Math.ceil( (forestConfig.density / sideSize) * sideSize);
            let subgridSideSize = sideSize / subgridSideCount;

            for (let i = 0; i < subgridSideCount; i++) {
                for (let j = 0; j < subgridSideCount; j++) {
                    let seed = box.min.x + box.min.z + i + j;
                    let lodSelection = Math.floor(MATH.sillyRandom(seed+1) * lodDist.length);
                    let lodProbability = lodDist[lodSelection];
                    if (lodProbability < MATH.sillyRandom(seed+2)) {

                        let fileName = selectFileFromList(forestConfig['lod_selections'], seed)
                        let tree = poolFetch('ForestTreeLodable');

                        tempObj3d.position.copy(box.min);
                        let randomVec = MATH.sillyRandomVector(seed+box.max.x);
                        randomVec.multiplyScalar(subgridSideSize * 0.5);
                        tempVec3.set(i*subgridSideSize, 0, j*subgridSideSize);
                        tempVec3.add(randomVec);
                        tempObj3d.position.add(tempVec3)

                        tree.call.initForestTree(fileName, tempObj3d, indexPos, lodSelection +1)
                        tree.call.setLodLevel(lodLevelCurrent);
                        lodTrees.push(tree);
                    }
                }
            }
        }


        let lodUpdated = function(lodLevel) {
            lodLevelCurrent = lodLevel;

                for (let i = 0; i < lodTrees.length; i++) {
                    lodTrees[i].call.setLodLevel(lodLevel);
                }

         //   debugForestInBox(this.box, lodLevel);
        }.bind(this)

        let setConfig = function(json) {
            forestConfig = json;
            processForestConfig()
            registerGroundLodCallback(this.indexPos, lodUpdated)
        }.bind(this);

        function removeTrees() {
            while (lodTrees.length) {
                let tree = lodTrees.pop()
                tree.call.setLodLevel(0)
                poolReturn(tree);
            }
        }

        let closeForestSection = function() {
            removeTrees()
            unregisterGroundLodCallback(this.indexPos, lodUpdated)
            this.indexPos.set(-0.1, -0.1) // hide from grid call
        }.bind(this);

        this.call = {
            closeForestSection:closeForestSection,
            setConfig:setConfig
        }

    }

    initTerrainForestSection(lodBox, configFileName) {
        this.indexPos.copy(lodBox.indexPos);
        this.box.copy(lodBox.box);
        jsonAsset(configFileName, this.call.setConfig)
    }

}

export { TerrainForestSection }