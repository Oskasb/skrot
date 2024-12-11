import {ConfigData} from "../../../application/utils/ConfigData.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {poolReturn, poolFetch} from "../../../application/utils/PoolUtils.js";

let tempObj = new Object3D();
let index = 0;
let modelCount = 0;
let maxLodLevel = 7;

let palettes = [
    'NATURE_DESERT',
    'NATURE_DESERT_2',
    'NATURE_SUMMER',
    'NATURE_SUMMER_2',
    'NATURE_FALL',
    'NATURE_FALL_2',
    'NATURE_FALL_LATE',
    'NATURE_FALL_LATE_2',
    'NATURE_WINTER',
    'NATURE_WINTER_2',
    'NATURE_WINTER',
    'NATURE_WINTER_2',
    'NATURE_DESERT',
    'NATURE_DESERT_2',
    'NATURE_DESERT',
    'NATURE_DESERT_2',
    'NATURE_DESERT',
    'NATURE_DESERT_2']
// palettes = ['NATURE_FALL_LATE']

function getNatureByGroundData(groundData) {
    return palettes[Math.floor(groundData.x * palettes.length)]
}

class TerrainElementModel {
    constructor(terrainGeo) {
        this.index = index;
        index++;
        this.terrainGeometry = terrainGeo;
        this.levelOfDetail = maxLodLevel;
        this.lodMap = null;
        this.lodLevelInstances = [];
        this.minY = 9999;
        this.maxY = -9999;
    //    this.instances = [];
    }

    getCount() {
        return index;
    }

    getModelCount() {
        return modelCount;
    }

    loadData = function(terrainTreesId) {
        let terrainListLoaded = function(data) {
            this.lodMap = data['lod_map'];
            this.applyConfig();
            for (let i = 0; i < this.lodMap.length; i++) {
                this.lodLevelInstances[i] = [];
            }
        }.bind(this);

        let configData = new ConfigData("TERRAIN", "GROUND_ELEMENTS", "ground_elements", 'data_key', 'config')
        configData.addUpdateCallback(terrainListLoaded);
        configData.parseConfig( terrainTreesId, terrainListLoaded)
    };

    updateElementModels(terrainSectionInfo, fromLod, toLod, maxLod) {

        for (let i = 0; i < this.lodLevelInstances.length; i++) {
            if (this.lodMap[i].length) {
                if (fromLod < toLod) {
                    for (let i = fromLod; i < toLod; i++) {
                        this.clearLodLevel(i);
                    }
                } else {
                    for (let i = toLod; i < maxLod; i++) {
                        this.populateLodLevel(terrainSectionInfo, i);
                    }


                }
            }
        }
    }

    applyConfig() {
        this.applyLevelOfDetail(-1);
    }

    populateLodLevel(terrainSectionInfo, lodLevel) {
        let lodInstances = this.lodLevelInstances[lodLevel];
        if (lodInstances.length) {
            return;
        }
   //     console.log("Populate lod level. ", lodLevel)
        let addLodInstance = function(instance, groundData) {
            let palette = poolFetch('VisualModelPalette')
            palette.initPalette()
            instance.getSpatial().setBaseSize(100)
            palette.applyPaletteSelection(getNatureByGroundData(groundData), instance);
            poolReturn(palette);
            modelCount++
            lodInstances.push(instance);
        }.bind(this);

        let lodAssets = this.lodMap[lodLevel]
        let groundElems = terrainSectionInfo.getLodLevelGroundElements(lodLevel);

        if (!groundElems) return;

        for (let i = 0; i < groundElems.length  ; i++) {
            for (let j = 0; j < lodAssets.length  ;j++) {
                if (groundElems[i].groundData.x > lodAssets[j].x_min && groundElems[i].groundData.x < lodAssets[j].x_max) {
                    if (groundElems[i].groundData.y > lodAssets[j].y_min && groundElems[i].groundData.y < lodAssets[j].y_max) {

                        groundElems[i].setupElementModel(lodAssets[j].asset, addLodInstance, lodAssets[j].shade)

                    }
                }
            }
        }
    }



    clearLodLevel(lodLevel) {
        let lodInstances = this.lodLevelInstances[lodLevel];
        if (lodInstances) {
            while (lodInstances.length) {
                //     console.log("Clear lod level. ", lodLevel)
                modelCount--;
                let model = lodInstances.pop();
                model.decommissionInstancedModel();
            }
        }
    }

    applyLevelOfDetail(lodLevel, terrainSectionInfo) {


        if (this.levelOfDetail === lodLevel || this.lodMap.length === 0) {
            return;
        }

        if (lodLevel === -1) {
            for (let i = 0; i < this.lodLevelInstances.length; i++) {
                this.clearLodLevel(i);
            }
            if (terrainSectionInfo) {
                terrainSectionInfo.deactivateTerrainSectionPhysics(terrainSectionInfo)
            }

            // console.log("clear trees")
        } else {
            // console.log("Update trees lod level. ", lodLevel)
        //    if (lodLevel === 0) {

            if (this.levelOfDetail === -1) {
                this.levelOfDetail = this.lodMap.length
            }
                this.updateElementModels(terrainSectionInfo, MATH.clamp(this.levelOfDetail, 0, this.lodMap.length), lodLevel,  this.lodMap.length);
        //    }

            if (lodLevel === 0 || lodLevel === 1) {
                if (terrainSectionInfo.physicsActive === false) {
                    terrainSectionInfo.activateTerrainSectionPhysics()
                }
            } else {
                terrainSectionInfo.deactivateTerrainSectionPhysics()
            }

        }
        this.levelOfDetail = lodLevel;
    }

    dectivateTerrainElementodels() {
        for (let i = 0; i < maxLodLevel; i++) {
            this.clearLodLevel(i);
        }
    }

}

export { TerrainElementModel }