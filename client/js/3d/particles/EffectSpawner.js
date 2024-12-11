import { Instantiator } from "../three/instancer/Instantiator.js";

class EffectSpawner {
    constructor() {

        let elementPools = {};
            this.config = {};
            this.instantiator = new Instantiator('fxInstantiator', elementPools);

            let populateSector = function(sector, area, plantCount, parentPlant) {
                this.populateVegetationSector(sector, area, plantCount, parentPlant)
            }.bind(this);

        let depopulateSector = function(sector, area) {
                this.depopulateVegetationSector(sector, area)
            }.bind(this);

        let getPlantConfigs = function(key) {
                return this.plantConfigs[key]
            }.bind(this);

            this.callbacks = {
                populateSector:populateSector,
                depopulateSector:depopulateSector,
                getPlantConfigs:getPlantConfigs
            }
        };

        applyConfig = function(config) {
            for (var key in config) {
                this.config[key] = config[key];
            }
        };

        setupInstantiator = function() {
            this.instantiator.addInstanceSystem(this.config.spawner, this.config.spawner, this.config.asset_id, this.config.pool_size, this.config.render_order);
        };


        buildBufferElement = function(poolKey, cb) {
            this.instantiator.buildBufferElement(poolKey, cb)
        };

        deactivateEffect = function(effect) {
        //    console.log("Deactivate effect", effect)
            effect.getParticleEffectBuffer().scaleUniform(0)
            this.instantiator.recoverBufferElement(effect.getSpawnerId(), effect.getParticleEffectBuffer());
            effect.bufferElement = null;
        };

        updateEffectSpawner = function() {
            this.instantiator.updateInstantiatorBuffers();
        };

        resetEffectSpawner = function() {
            this.instantiator.updateInstantiatorBuffers();
        };

    }

export { EffectSpawner }