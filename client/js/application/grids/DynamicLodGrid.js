import {DynamicGrid} from "./DynamicGrid.js";
import {poolFetch, poolReturn} from "../utils/PoolUtils.js";
import { Vector3} from "../../../../libs/three/math/Vector3.js";
import {detachConfig} from "../utils/ConfigUtils.js";
import {getSetting} from "../utils/StatusUtils.js";

class DynamicLodGrid {
    constructor() {
        this.lastLodCenter = new Vector3();
        this.dynamicGrid = null;
        this.lodElements = [];
        this.dynamicGrid = null;
    }

    activateLodGrid(cfg) {
        let config = detachConfig(cfg);
        config['tile_range'] += getSetting(ENUMS.Settings.VEGETATION_RANGE);
        if (this.dynamicGrid === null) {
            this.dynamicGrid = poolFetch( 'DynamicGrid')
        }
        this.debug = config['debug'] || false;
        this.config = config;
        this.lodLevels = config['lod_levels'] || 6;
        this.maxDistance = config['tile_range'] * config['tile_spacing'];
        this.dynamicGrid.activateDynamicGrid(config)
    }

    processLodVisibility(lodCenter, tileUpdateCallback, coarseness, margin, centerIsUpdated, preUpdateTime) {
        let tiles = this.dynamicGrid.dynamicGridTiles;
        for (let i = 0; i < tiles.length; i++) {
            for (let j = 0; j < tiles[i].length;j++) {
                let tile = tiles[i][j];
                tile.processDynamicTileVisibility(this.maxDistance, this.lodLevels, lodCenter,  tileUpdateCallback, coarseness, margin, centerIsUpdated, preUpdateTime)
                if (this.debug) {
                //    tile.debugDrawTilePosition(2, 'RED');
                }

            }
        }
    }

    getTiles = function() {
        return this.dynamicGrid.dynamicGridTiles;
    }

    updateDynamicLodGrid(lodCenter, tileUpdateCallback, coarseness, margin, preUpdateTime) {
    //    if (this.lastLodCenter.distanceToSquared(lodCenter) > 0.01) {

        if (this.dynamicGrid === null) {
            return;
        }

            let centerTile = this.dynamicGrid.getTileAtPosition(lodCenter);
            if (!centerTile) {
                console.log("Bad tile", lodCenter)
                return;
            }

            let updated = this.dynamicGrid.updateDynamicGrid(centerTile.tileX, centerTile.tileZ)
            this.lastLodCenter.copy(lodCenter);
            this.processLodVisibility(this.lastLodCenter, tileUpdateCallback, coarseness, margin, updated, preUpdateTime)


    //    }

    }

    deactivateLodGrid() {
        if (this.dynamicGrid === null) {
            return;
        }
        this.clearLodGrid();

        this.dynamicGrid.deactivateDynamicGrid();
        poolReturn(this.dynamicGrid);
        this.dynamicGrid = null;
    }

    clearLodGrid() {
        while (this.lodElements.length) {
            this.lodElements.pop();
        }

        let tiles = this.dynamicGrid.dynamicGridTiles;
        for (let i = 0; i < tiles.length; i++) {
            for (let j = 0; j < tiles[i].length;j++) {
                let tile = tiles[i][j];
                tile.isVisible = false;
                tile.lodLevel = -2;
            }
        }


    }

}

export { DynamicLodGrid }