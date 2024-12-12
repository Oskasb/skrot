import {ExpandingPool} from "../../../../application/utils/ExpandingPool.js";
import {Instantiator} from "../../instancer/Instantiator.js";
import {Plant} from "./Plant.js";
import {ConfigData} from "../../../../application/utils/ConfigData.js";
import {VegetationLodGrid } from "./VegetationLodGrid.js";
import {poolStats} from "../../../../application/utils/PoolUtils.js";
import {getSetting} from "../../../../application/utils/StatusUtils.js";
import {pipelineAPI} from "../../../../application/utils/DataUtils.js";

let count = 0;
let cache = {};
let debugStats = {
    procTime: 0,
    ptchCnt : 0,
    visPtcs: 0,
    ptchPlnts : 0,
    plntDlta: 0,
    plntPool: 0,
    poolAdds: 0,
    poolActs: 0
};

let plantActive = 0;
let preUpdateTime = 0;
let postUpdateTime = 0;
let poolStatsStore = {};


let setupDebug = function(vegetation) {

    let collectDebugStats = function() {

        poolStats('Plant', poolStatsStore)
        debugStats.procTime = (postUpdateTime - preUpdateTime)*1000;
        debugStats.plntPool = poolStatsStore.size;
        debugStats.poolAdds = poolStatsStore.added;
        debugStats.poolActs = poolStatsStore.active;
        debugStats.ptchCnt = 0;
        debugStats.visPtcs = 0;
        debugStats.ptchPlnts = 0;
        for (let i = 0; i < vegetation.vegetationLodGrids.length; i++) {
            let grid = vegetation.vegetationLodGrids[i];
            let patches = grid.vegetationPatches;
            debugStats.ptchCnt += patches.length;
            for (let j = 0; j < patches.length; j++)  {
                let patch = patches[j];
                debugStats.ptchPlnts+=patch.plants.length;
                if (patch.nearness > 0) {
                    debugStats.visPtcs++;
                }
            }
        }

        debugStats.plntDlta = plantActive - debugStats.plants;
        if (!cache['DEBUG']) {
            cache = pipelineAPI.getCachedConfigs();
            if (!cache['DEBUG']) {
                cache.DEBUG = {};
            }
        }

        if (!cache['DEBUG']['VEGETATION']) {
            cache.DEBUG.VEGETATION = debugStats;
        }

        debugStats.grids = vegetation.vegetationLodGrids.length;
        debugStats.plants = plantActive;
    }

    evt.on(ENUMS.Event.COLLECT_DEBUG_STATS, collectDebugStats)
}

class Vegetation {
    constructor() {

        count++;



        this.init = 0;
        this.areaGrids = [];
        this.config = {};
        this.plantConfigs = {};
        this.instanceAssetKeys = [];
        this.instantiator = new Instantiator();
        this.plantPools = {};

        this.vegetationLodGrids = [];

        let populateSector = function(sector, plantCount) {
            this.populateVegetationSector(sector, plantCount)
        }.bind(this);

        let depopulateSector = function(sector) {
            this.depopulateVegetationSector(sector)
        }.bind(this);

        let getPlantConfigs = function(key) {
            return this.plantConfigs[key]
        }.bind(this);

        let setupLodGrids = function(cfg, plantsConfig) {
        //    console.log("setupLodGrids")
            while (this.vegetationLodGrids.length) {
                let grid = this.vegetationLodGrids.pop();
                grid.deactivateLodGrid()
            }

            for (let i = 0; i < cfg['lod_levels'].length; i++) {
                let lodGrid =  new VegetationLodGrid()
                lodGrid.activateLodGrid(cfg['lod_levels'][i], plantsConfig)
                this.vegetationLodGrids[i] =lodGrid;
            }
        }.bind(this)


        this.callbacks = {
            setupLodGrids:setupLodGrids,
            populateSector:populateSector,
            depopulateSector:depopulateSector,
            getPlantConfigs:getPlantConfigs
        }




    };

    initVegetation(vegReadyCB) {
        let dataId = "plants_default"
        let vegGridData = new ConfigData('VEGETATION', 'GRID')
        let plantsData = new ConfigData('VEGETATION', 'PLANTS')

        let dataInit = 0;
        let plantInit = 0;



        let plantDataReady = function(data) {
        //    console.log("Plants data",this.init,  data[0].data);
            this.applyPlantConfig(data[0].data);
            this.callbacks.setupLodGrids(this.config, this.plantConfigs)
            if (plantInit === 0) {
                plantInit = 1;
                vegReadyCB()
            } else {
                console.log("Reflow Vegetation Plants")
            }

        }.bind(this);


        let onDataReady = function(data) {
        //    console.log("Veg data",this.init, data[0].data);
            this.applyConfig(data[0].data);

            if (dataInit === 0) {
                dataInit = 1;
                this.setupInstantiator();
                plantsData.addUpdateCallback(plantDataReady)
            } else {
                console.log("Reflow Vegetation Grids")
                this.callbacks.setupLodGrids(this.config, this.plantConfigs)
            }

        }.bind(this);

    //    console.log("init Veg data", vegGridData);
        vegGridData.addUpdateCallback(onDataReady)
        vegGridData.fetchData('vegetation_grid');

        plantsData.fetchData(dataId);

        setupDebug(this);

    };

    applyConfig(config) {

        for (let key in config) {
            this.config[key] = config[key];
        }

    };

    applyPlantConfig(config) {

        for (let key in config) {
            this.plantConfigs[key] = config[key];
        }

    };

    setupInstantiator() {

        let addPlant = function(poolKey, callback) {
            callback(poolKey, new Plant(poolKey, plantActivate, plantDectivate))
        };

        let densitySetting = getSetting(ENUMS.Settings.VEGETATION_DENSITY)

        this.instantiator.addInstanceSystem(this.config.asset_id, this.config.sys_key, this.config.asset_id, this.config.pool_size * densitySetting, this.config.render_order);

        this.plantPools[this.config.asset_id] = new ExpandingPool(this.config.asset_id, addPlant);

        let plantActivate = function(plant) {
            this.activateVegetationPlant(plant)
        }.bind(this);

        let plantDectivate = function(plant) {
            this.deactivateVegetationPlant(plant)
        }.bind(this);

    };

    buildBufferElement(poolKey, cb) {
        this.instantiator.buildBufferElement(poolKey, cb)
    };


    createPlant(assetId, cb) {

        let getPlant = function(key, plant) {
            plantActive++;
            cb(plant);
        }.bind(this);

        this.plantPools[assetId].getFromExpandingPool(getPlant)

    };


    activateVegetationPlant(plant) {
        this.buildBufferElement(plant.poolKey, plant.getElementCallback())
    };

    deactivateVegetationPlant(plant) {
        plantActive--;
        this.instantiator.recoverBufferElement(plant.poolKey, plant.getPlantElement());
        plant.bufferElement = null;
    };

    populateVegetationSector(sector, plantCount) {
        //    "asset_vegQuad" gets replaced when instancing buffer is fetched.. redundant maybe...
        for (let i = 0; i < plantCount; i++) {
            this.createPlant("asset_vegQuad", sector.getAddPlantCallback());
        }
    };

    depopulateVegetationSector(sector) {
        sector.deactivateSectorPlants();
    };

    updateVegetation() {
        preUpdateTime = performance.now();
        let frame = GameAPI.getFrame().frame;
        for (let i = 0; i < this.vegetationLodGrids.length; i++) {
            this.vegetationLodGrids[i].updateVegLodGrid(frame, preUpdateTime)
        }

        this.instantiator.updateInstantiatorBuffers();
        postUpdateTime = performance.now();
    };

    resetVegetationGrids = function() {
        this.callbacks.setupLodGrids(this.config, this.plantConfigs)
    };

};

export {Vegetation}