import {TerrainForestSection} from "../../game/world/woods/TerrainForestSection.js";

const forestSections = [];

function getLodBoxForestSection(lodBox) {
    for (let i = 0; i < forestSections.length; i++) {
        let section = forestSections[i];
        if (section.indexPos.distanceToSquared(lodBox.indexPos) === 0) {
            return section;
        }
    }
    let section = new TerrainForestSection();
    section.initTerrainForestSection(lodBox);
    return section;
}

function terrainLodUpdate(lodBox) {
    let lodLevel = lodBox.lodLevel;
    let settings = lodBox.settings;
    let section = getLodBoxForestSection(lodBox);
    if (lodLevel !== 0) {
        section.setLodLevel(lodLevel);
    } else {
        section.closeForestSection()
    }
}

const lodGridCalls = {}
lodGridCalls['TERRAIN_LOD_BOX_UPDATE'] = terrainLodUpdate


export {lodGridCalls}