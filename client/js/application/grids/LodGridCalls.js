import {TerrainForestSection} from "../../game/world/woods/TerrainForestSection.js";
import {poolFetch} from "../utils/PoolUtils.js";
import {MATH} from "../MATH.js";

const forestSections = [];

function getLodBoxForestSection(lodBox) {
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

function terrainLodUpdate(lodBox) {
    let lodLevel = lodBox.lodLevel;
    let section = getLodBoxForestSection(lodBox);
    if (lodLevel !== 0) {
        section.setLodLevel(lodLevel);
    } else {
        section.closeForestSection()
        MATH.splice(forestSections, section)
    }
}

const lodGridCalls = {}
lodGridCalls['TERRAIN_LOD_BOX_UPDATE'] = terrainLodUpdate


export {lodGridCalls}