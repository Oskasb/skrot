import {TerrainForestSection} from "../../game/world/woods/TerrainForestSection.js";
import {poolFetch, poolReturn} from "../utils/PoolUtils.js";
import {MATH} from "../MATH.js";

const forestSections = [];

function activateLodBoxForestSection(lodBox) {
    for (let i = 0; i < forestSections.length; i++) {
        let section = forestSections[i];
        if (section.indexPos.distanceToSquared(lodBox.indexPos) === 0) {
            return section;
        }
    }
    let section = poolFetch('TerrainForestSection')
    section.initTerrainForestSection(lodBox, lodBox.settings['config_file']);
    return section;
}

function terrainLodForest(lodBox, activate) {
    let section = activateLodBoxForestSection(lodBox);
    if (activate === false) {
        section.call.closeForestSection()
        MATH.splice(forestSections, section)
        poolReturn(section)
    }
}

const lodGridCalls = {}
lodGridCalls['TERRAIN_LOD_FOREST'] = terrainLodForest


export {lodGridCalls}