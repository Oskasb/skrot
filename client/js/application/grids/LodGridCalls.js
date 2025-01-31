import {TerrainForestSection} from "../../game/world/woods/TerrainForestSection.js";
import {poolFetch, poolReturn} from "../utils/PoolUtils.js";
import {MATH} from "../MATH.js";

const forestSections = [];




function activateLodBoxForestSection(lodBox) {

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
            console.log("section for box is not in list.. ", lodBox);
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