import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {borrowBox, cubeTestVisibility} from "../../../../application/utils/ModelUtils.js";
import {poolFetch, poolReturn} from "../../../../application/utils/PoolUtils.js";

let index = 0;
let boxColor = {x:1, y:1, z:1}

let groundHeightData = [0, 0, 0, 0];

let tempVec = new Vector3(1, 1, 1)
let minExt = new Vector3();
let maxExt = new Vector3()
let tempPos = new Vector3(1, 1, 1)
let candidates = [];

function debugDrawPatch(patch, lodTile) {
    let nearness = lodTile.nearness;
        tempVec.set(nearness, nearness, nearness)
    let borrowedBox = borrowBox();
    borrowedBox.min.copy(patch.position).sub(tempVec);
    borrowedBox.max.copy(patch.position).add(tempVec);
    boxColor.x = Math.sin(patch.index*1.1);
    boxColor.y = Math.cos(patch.index*0.4);
    boxColor.z = Math.cos(patch.index*1.5);
    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:boxColor})
}




let terrainCandidates = [];
let groundCandiates = [];
let groundColor = {x:1, y:1, z:1, w: 1};

let processGroundCandidates = function(groundData) {
    MATH.emptyArray(groundCandiates);
    for (let i = 0; i < terrainCandidates.length; i++) {
        let candidate = terrainCandidates[i];
        let min = candidate['ground_min'];
        let max = candidate['ground_max'];

        if (MATH.valueIsBetween(groundData.y, min[1], max[1])) {
            if (MATH.valueIsBetween(groundData.z, min[2], max[2])) {
                if (MATH.valueIsBetween(groundData.x, min[0], max[0])) {
                    groundCandiates.push(candidate)
                }
            }
        }
    }
}

let processTerrainCandidates = function(plantsList, configs, pos, normalY) {
    MATH.emptyArray(terrainCandidates);
    let elevation = pos.y;
    for (let i = 0; i < plantsList.length; i++) {
        let key = plantsList[i];
        if (elevation > configs[key]['min_y']) {
            if  (elevation < configs[key]['max_y']) {
                if (configs[key]['normal_ymin'] > normalY) {
                    if  (configs[key]['normal_ymax'] < normalY) {
                        terrainCandidates.push(configs[key])
                    }
                }
            }
        }
    }


    ThreeAPI.groundAt(pos, groundColor);
    processGroundCandidates(groundColor)

};

let determinePlantConfig = function(patch, plant, min, max, seed, retries) {
    retries++
    tempPos.x = MATH.sillyRandomBetween(min.x, max.x, seed+3);
    tempPos.z = MATH.sillyRandomBetween(min.z, max.z, seed+4);
    tempPos.y = ThreeAPI.terrainAt(tempPos, plant.normal, groundHeightData)
    processTerrainCandidates(patch.plantsList, patch.plantsConfig.plants, tempPos, plant.normal.y)

    let config = MATH.getSillyRandomArrayEntry(groundCandiates, seed)

    if (!config) {
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:tempPos, color:'YELLOW', drawFrames:5});

        if (retries > 2) {
    //        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:tempPos, color:'YELLOW', drawFrames:5});

            return patch.plantsConfig.plants["rock_small"];
        }
        return determinePlantConfig(patch, plant, min, max, seed+retries, retries)
    }
    return config;
}

function addPlantsToPatch(patch, plantCount, lodTile) {

    if (patch.updateFrame === limitFrame) {
        return;
    }

    lodTile.getTileExtents(minExt, maxExt);
    let nearness = lodTile.nearness
    let plants = patch.plants;
    while (plants.length < plantCount) {

        if (frameAdds === frameLimit) {
            return;
        }
        frameAdds++;
        let seed = plants.length
        let plant = poolFetch('Plant');
        let config = determinePlantConfig(patch, plant, minExt, maxExt, seed, 1)

        let rgba = MATH.sillyRandomBetweenColors(config['color_min'], config['color_max'], seed+1);

        let size = MATH.sillyRandomBetween(config['size_min'], config['size_max'], seed+2);

        let groundShade = 1 - groundHeightData[2]*1;
        rgba.r *=groundShade;
        rgba.g *=groundShade;
        rgba.b *=groundShade;

        MATH.rgbaToXYZW(rgba, plant.vertexColor)

        let rotZ = MATH.sillyRandom(seed+5) * MATH.TWO_PI;
        plant.plantActivate("asset_vegQuad", config, tempPos, rotZ, size, nearness)
        plants.push(plant);
    }
}

function removePlantsFromPatch(patch, plantCount) {
    let plants = patch.plants;
    while (plants.length > plantCount) {
        let plant = plants.pop();
        plant.plantDeactivate()
        poolReturn(plant);
    }
}

let limitTestFrame = 0;
let frameAdds = 0;
let frameLimit = 30;
let limitFrame = 0;

class VegetationPatch {
    constructor() {
        this.index = index;
        index++
        this.updateFrame = 0;
        this.nearness = 0;
        this.plants = [];
        this.position = new Vector3();

    }

    setPatchConfig(plantsConfig,  plantsList, maxPlants) {
        this.maxPlants = maxPlants;
        this.plantsConfig = plantsConfig;
        this.plantsList = plantsList;

        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:this.position, color:'YELLOW', drawFrames:10});
    }

    setPatchPosition(posVec3) {
        this.position.copy(posVec3)

    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:this.position, color:'YELLOW', drawFrames:10});
    }

    applyGridVisibility(lodTile, updateFrame, preUpdateTime) {
        if (limitTestFrame !== updateFrame) {
            limitTestFrame = updateFrame;
            frameAdds = 0;
        }

        this.updateFrame = updateFrame;
        let plantCount = Math.ceil(MATH.clamp(0.2 +(lodTile.nearness*1.2), 0, 1)*this.maxPlants);

        let now = performance.now();

        if ((preUpdateTime - now) > 500) {
            frameLimit = this.maxPlants * 0.1;
        } else {
            frameLimit = this.maxPlants;
        }

            if (this.plants.length < plantCount) {
                addPlantsToPatch(this, plantCount, lodTile)
            }

            if (this.plants.length > plantCount) {
                removePlantsFromPatch(this, plantCount)
            }
        if (this.debug) {
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:this.position, color:'GREEN', drawFrames:2});
            debugDrawPatch(this, lodTile);
        }


    }

    clearVegPatch() {
        removePlantsFromPatch(this, 0)
    }

    recoverVegetationPatch() {
        this.clearVegPatch()
        poolReturn(this)
    }


}

export {VegetationPatch }