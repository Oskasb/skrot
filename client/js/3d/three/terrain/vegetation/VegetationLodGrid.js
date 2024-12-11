import {DynamicLodGrid} from "../../../../application/utils/DynamicLodGrid.js";
import {VegetationPatch} from "./VegetationPatch.js";
import {poolFetch, poolReturn, registerPool} from "../../../../application/utils/PoolUtils.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {getSetting} from "../../../../application/utils/StatusUtils.js";

let updateFrame = 0;
let releases = [];
let lodCenterVec3 = new Vector3();

function getPatchByPosition(vegPatches, pos) {
    let patch = null;

    for (let i = 0; i < vegPatches.length; i++) {
        patch = vegPatches[i];
        if (patch.position.x  === pos.x && patch.position.z === pos.z) {
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: pos, color:'WHITE', size:1.2})
            return patch;
        }
    }
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:tile.getPos(), color:'YELLOW', drawFrames:10});

    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: tile.getPos(), color:'RED', size:1.2})
}

function fitPatchToLodTile(freePatches, vegPatches, lodTile, preUpdateTime) {

    let pos = lodTile.getPos();
    let patch = getPatchByPosition(vegPatches, pos);
    if (!patch) {
        patch = freePatches.pop();
        if (!patch) {
        //    console.log("No free Patch...")
            return;
        }
        patch.setPatchPosition(pos)
    }
    patch.applyGridVisibility(lodTile, updateFrame, preUpdateTime);
}

class VegetationLodGrid {
    constructor() {
        this.dynamicLodGrid = new DynamicLodGrid();
        this.vegetationPatches = [];
        this.freePatches = [];

        let updateVisibility = function(lodTile, preUpdateTime) {
        //    lodTile.debug = true;
            if (lodTile.isVisible === true) {
               fitPatchToLodTile(this.freePatches, this.vegetationPatches, lodTile, preUpdateTime);

            }

        }.bind(this)

        this.call = {
            updateVisibility:updateVisibility
        }

    }

    releaseHiddenTiles = function() {

            for (let i = 0; i < this.vegetationPatches.length; i++) {
                let patch = this.vegetationPatches[i]
                if (patch.updateFrame !== updateFrame) {
                    if (this.freePatches.indexOf(patch) === -1) {
                        patch.clearVegPatch();
                        this.freePatches.push(patch)
                    }
                };
            }
    }


    activateLodGrid(config, plantsConfig) {

        let maxPlants = config['max_plants'] * getSetting(ENUMS.Settings.VEGETATION_DENSITY);
        console.log("maxPlants", maxPlants);
        this.dynamicLodGrid.activateLodGrid(config)
        let requestNewPatch = function() {
            let patch = poolFetch('VegetationPatch')
            patch.setPatchConfig(plantsConfig, config['plants'],  maxPlants)
            return patch;
        }

        let tiles = this.dynamicLodGrid.getTiles();
        for (let i = 0; i < tiles.length; i++) {
            for (let j = 0; j < tiles[i].length;j++) {
                let patch =  requestNewPatch()
                this.vegetationPatches.push(patch)
            }
        }
    }

    updateVegLodGrid(frame, preUpdateTime) {
        updateFrame = frame;
        let halfSize = this.dynamicLodGrid.maxDistance*0.45;
        lodCenterVec3.set(0, 0, -halfSize)
        lodCenterVec3.applyQuaternion(ThreeAPI.getCamera().quaternion);
        lodCenterVec3.add(ThreeAPI.getCamera().position)
        this.dynamicLodGrid.updateDynamicLodGrid(lodCenterVec3, this.call.updateVisibility, 0, 1.5, preUpdateTime)
        this.releaseHiddenTiles()
    }

    deactivateLodGrid() {
        while (this.vegetationPatches.length) {
            let patch = this.vegetationPatches.pop();
            patch.recoverVegetationPatch();
        }

        this.dynamicLodGrid.deactivateLodGrid();
    //    poolReturn(this.dynamicLodGrid);
    }

}

export { VegetationLodGrid }