import {SectorContent} from "./SectorContent.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";

let tempVec1 = new Vector3();
let tempVec2 = new Vector3();
let candidates = [];

class VegetationSector {
    constructor(sectorPlants, activate, deactivate, terrainArea, getPlantConfigs, plantsKey) {

        this.sectorContent = new SectorContent(sectorPlants);
        this.proximityFactor = -1;

        this.terrainArea = terrainArea;

        this.plantsKey = plantsKey;

        this.center = new THREE.Vector3();
        this.origin = new THREE.Vector3();
        this.extents = new THREE.Vector3();
        this.extMin = new THREE.Vector3();
        this.extMax = new THREE.Vector3();
        terrainArea.getExtentsMinMax(this.extMin, this.extMax);

        this.maxPlantCount = sectorPlants;

        this.isActive = false;
        this.isCenterSector = false;

        this.activateCallbacks = [activate];
        this.deactivateCallbacks = [deactivate];

        let addPlant = function(plant) {
            this.addPlantToSector(plant)
        }.bind(this);

        this.callbacks = {
            addPlant:addPlant,
            getPlantConfigs:getPlantConfigs
        }

    };

    setupAsGridSector = function(gridX, gridZ, xMax, zMax) {

        this.sectorSizeX = (this.extMax.x - this.extMin.x)/xMax;
        this.sectorSizeZ = (this.extMax.z - this.extMin.z)/zMax;
        this.gridX = gridX;
        this.gridZ = gridZ;

        this.origin.set(this.sectorSizeX * this.gridX, this.terrainArea.getOrigin().y, this.sectorSizeZ * this.gridZ);
        this.origin.add(this.terrainArea.getOrigin());

        this.setupSectorDimensions();

    };

    setupAsPatchSector = function(pos, config) {

        this.sectorSizeX = config.size;
        this.sectorSizeZ = config.size;
        this.gridX = Math.round(pos.x / config.size);
        this.gridZ = Math.round(pos.z / config.size);
        this.origin.set(pos.x - config.size/2, this.terrainArea.getOrigin().y, pos.z - config.size/2);
        this.setupSectorDimensions();
        this.patchConfig = config[this.plantsKey];
    };

    setupSectorDimensions = function() {

        tempVec1.x = this.sectorSizeX;
        tempVec1.y = 0;
        tempVec1.z = this.sectorSizeZ;

        this.extents.copy(this.getOrigin());
        this.extents.add(tempVec1);
        this.center.copy(tempVec1);
        this.center.multiplyScalar(0.5);
        this.center.add(this.getOrigin())
    };

    getCenter = function() {
        return this.center;
    };

    getOrigin = function() {
        return this.origin;
    };

    getExtents = function() {
        return this.extents;
    };

    getIsActive = function() {
        return this.isActive;
    };

    getIsCenterSector = function() {
        return  this.isCenterSector;
    };

    setIsCenterSector = function(bool) {
        this.isCenterSector = bool;
    };

    getAddPlantCallback = function() {
        return this.callbacks.addPlant;
    };

    checkPlantMaxSlope = function(plant, cfg) {
        return plant.normal.y >= cfg.normal_ymax
    };


    checkPlantIsLegit = function(plant, cfg) {
        if (plant.pos.y > cfg.min_y && plant.pos.y < cfg.max_y) {
            if (plant.normal.y <= cfg.normal_ymin) {
                return this.checkPlantMaxSlope(plant, cfg);
            }
        }
    };

    getAppropriatePlantConfig = function(plant) {
        let configs = this.callbacks.getPlantConfigs(this.plantsKey);

        for (let key in configs) {

            let cfg = configs[key];
            if (this.checkPlantIsLegit(plant, cfg)) {
                candidates.push(cfg);
            }
        }

        if (candidates.length) {
            let candidate = MATH.getRandomArrayEntry(candidates);
            MATH.emptyArray(candidates);
            return candidate;
        } else {
            this.maxPlantCount--;
        }

    };
    positionPlantRandomlyInSector = function(plant) {

        plant.pos.subVectors(this.extents, this.origin);
        plant.pos.x *= Math.random();
        plant.pos.z *= Math.random();
        plant.pos.add(this.origin);

    };

    positionPlantRandomlyNearSectorCenter = function(plant, compCfv) {

        plant.pos.set(0, 0, 0);
        tempVec1.set(1 , 0,1  )

        MATH.spreadVector(plant.pos, tempVec1);
        plant.pos.normalize();
        let dst = MATH.randomBetween(compCfv.dst_min|| 0.2, compCfv.dst_max || 1);
        plant.pos.multiplyScalar(this.sectorSizeX * dst);
        plant.pos.add(this.center);
    };

    getCfgByWeight = function(patchCfg) {

        let select = 0;
        let sumWeight = 0;
        let rnd = Math.random();

        for (let i = 0; i < patchCfg.length; i++) {
            sumWeight += patchCfg[i].weight;
        }

        for (let i = 0; i < patchCfg.length; i++) {
            select += patchCfg[i].weight;
            if (select / sumWeight > rnd) {
                return patchCfg[i];
            }
        }
    };

    addPlantToSector = function(plant) {

        let cfg;
        if (this.patchConfig) {

            let patchCfg = this.getCfgByWeight(this.patchConfig);

            this.positionPlantRandomlyNearSectorCenter(plant, patchCfg);
            plant.pos.y = ThreeAPI.terrainAt(plant.pos, plant.normal);

            cfg = this.callbacks.getPlantConfigs(this.plantsKey)[patchCfg.plant_id];

            if (!this.checkPlantMaxSlope(plant, cfg)) {
                return;
            }

            if (!cfg) {
                console.log("bad patch config", [this]);
                return;
            }

        } else {

            this.positionPlantRandomlyInSector(plant);
            plant.pos.y = ThreeAPI.terrainAt(plant.pos, plant.normal);
            cfg = this.getAppropriatePlantConfig(plant);
            if (!cfg) return;

        }

        plant.applyPlantConfig(cfg);

        this.sectorContent.addInactivePlant(plant);

        if (plant.config['patch']) {
            MainWorldAPI.getWorldSimulation().addVegetationPatch(plant.config['patch'], plant.pos)
        }

    };


    activateSectorPlants = function(count) {
        this.sectorContent.activatePlantCount(count);
    };

    deactivateSectorPlantCount = function(count) {
        this.sectorContent.deactivatePlantCount(count);
    };

    deactivateSectorPlants = function() {
        this.sectorContent.deactivateAllPlants();
    };


    updateProximityStatus = function(proximityFactor) {
        if (this.proximityFactor === proximityFactor) return;
        this.proximityFactor = proximityFactor;
        this.enableMissingPlants();
    };

    getMissingPlantCount = function() {
        return Math.floor(this.maxPlantCount * this.proximityFactor) - this.sectorContent.getActivePlantCount();
    };

    enableMissingPlants = function() {

        let missingPlants = this.getMissingPlantCount();

        if (missingPlants > 0) {
            MATH.callAll(this.activateCallbacks, this, missingPlants);
            this.activateSectorPlants(missingPlants);
        }

        if (missingPlants < 0) {
            this.deactivateSectorPlantCount(-missingPlants );
        }

    };

    activateVegetationSector = function() {
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:this.extMin, max:this.extMax, color:'GREEN'})

        this.isActive = true;
    };

    deactivateVegetationSector = function() {
        this.isActive = false;
        MATH.callAll(this.deactivateCallbacks, this);
    };

}

export { VegetationSector }
