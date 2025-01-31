import {TerrainForestSection} from "../../game/world/woods/TerrainForestSection.js";
import {poolFetch, poolReturn} from "../utils/PoolUtils.js";
import {MATH} from "../MATH.js";
import {groundAt, terrainAt} from "../../3d/three/terrain/ComputeTerrain.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";

const forestSections = [];
const tempVec = new Vector3();
const groundData = {};

function validateLodBoxForForest(lodBox) {
    let height = terrainAt(lodBox.center);
    if (height < 5) {
        return false;
    }

    if (height > 900) {
        return false;
    }

    let foundGreen = false;

    groundAt(lodBox.center, groundData)

    if (groundData.y > 0.2) {
        return true;
    }

    groundAt(lodBox.box.min, groundData)

    if (groundData.y > 0.2) {
        return true;
    }

    groundAt(lodBox.box.max, groundData)

    if (groundData.y > 0.2) {
        return true;
    }

    tempVec.set(lodBox.box.max.x, 0, lodBox.box.min.z);

    groundAt(tempVec, groundData)

    if (groundData.y > 0.2) {
        return true;
    }

    tempVec.set(lodBox.box.min.x, 0, lodBox.box.max.z);

    groundAt(tempVec, groundData)

    if (groundData.y > 0.2) {
        return true;
    }

    return false;

}


function activateLodBoxForestSection(lodBox) {

    let forestValid = validateLodBoxForForest(lodBox)
    if (forestValid === false) {
        return;
    }

    let section = getActiveForestSection(lodBox)
    if (!section) {
        section = poolFetch('TerrainForestSection')
        forestSections.push(section);
        section.call.activateBox(lodBox, lodBox.settings['config_file']);
    }

  //  return section;
}



function getActiveForestSection(lodBox) {
    for (let i = 0; i < forestSections.length; i++) {
        let section = forestSections[i];
        if (section.indexPos.distanceToSquared(lodBox.indexPos) === 0) {
            return section;
        }
    }
}

function terrainLodForest(lodBox, activate) {

    if (activate === true) {
        activateLodBoxForestSection(lodBox);
    } else {
    //    console.log("close lodBox section.. ", lodBox);
        let section = getActiveForestSection(lodBox)
        if (!section) {
        //    console.log("section for box is not in list.. ", lodBox);
            return;
        }
        section.call.unregisterCallbacks()
        MATH.splice(forestSections, section)
        poolReturn(section)


    }
}

const lodGridCalls = {}
lodGridCalls['TERRAIN_LOD_FOREST'] = terrainLodForest


export {lodGridCalls}