import {ThreeTerrain} from "./ThreeTerrain.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {Ocean} from "../water/Ocean.js";
import {VegetationSystem} from "./vegetation/VegetationSystem.js";
import {isDev} from "../../../application/utils/DebugUtils.js";

let tempVec = new Vector3();
let threeTerrain = new ThreeTerrain();
let vegetationSystem = new VegetationSystem();

let scatter = 0;

let gridSpacing = 2000;
let gridWidth = 2;
let minX = 1000;
let minZ = 1000;
let spawnCount = 0;
let row = 0;
let col = 0;

let gridPosX = function() {
    row = MATH.moduloPositive(spawnCount, gridWidth);
    return minX + row*gridSpacing + Math.random()*scatter
};

let gridPosZ = function() {
    col = Math.floor(spawnCount / gridWidth);
    return minZ + col*gridSpacing+ Math.random()*scatter
};

let activateTerrainSystem = function() {
    ThreeAPI.addPostrenderCallback(threeTerrain.updateThreeTerrainGeometry)
    client.terrainReady();
}

class TerrainSystem {
    constructor() {
        this.sysReady = false;
        this.vegReady = false;
        this.plantsReady = false;
        this.allLodCallbacks = [];
    };

    initTerrainSystem = function(callback) {
        threeTerrain.loadData(callback);
    };

    getTerrain() {
        return threeTerrain;
    }

    testReady = function() {
        if (this.sysReady) {

            let shadeCompleted = function() {
                activateTerrainSystem();
                vegetationSystem.activateVegetationSystem()

                setTimeout(function() {
                    setTimeout(function() {
                        evt.on(ENUMS.Event.TERRAIN_APPLY_EDIT, threeTerrain.call.applyTerrainEdit);
                        evt.dispatch(ENUMS.Event.SET_CAMERA_MODE, {mode:'world_display'})
                    }, 500)

                    evt.dispatch(ENUMS.Event.NOTIFY_LOAD_COMPLETED, {})
                }, 500)
            }

            let shadeProgCB = function(prog) {

                if (prog.remaining === 0) {
                    evt.dispatch(ENUMS.Event.NOTIFY_LOAD_PROGRESS, prog)
                    threeTerrain.saveGroundShadeTexture();
                    console.log("Terrain Ground Shade Done")
                    shadeCompleted();
                } else if (prog.done % 20 === 0) {
                    evt.dispatch(ENUMS.Event.NOTIFY_LOAD_PROGRESS, prog)
                    //console.log(prog.progress)
                }
            }


            let txCallback = function(image) {
                if (image) {
                    evt.dispatch(ENUMS.Event.NOTIFY_LOAD_PROGRESS, {msg:"Ground Shade Loaded"})
                    threeTerrain.setGroundShadeFromImage(image);
                    shadeCompleted();
                } else {
                    evt.dispatch(ENUMS.Event.NOTIFY_LOAD_PROGRESS, {msg:"Generate Ground Shade"})
                    threeTerrain.buildGroundShadeTexture(shadeProgCB);
                }
            }

            threeTerrain.fetchGroundShadeTexture(txCallback)

        }
    }

    rebuildTerrainData() {
        threeTerrain.call.clearTerrainGeometries()
        threeTerrain.call.populateTerrainGeometries();
        console.log("Rebuild Terrain Data")

        let shadeProgCB = function(prog) {

            if (prog.remaining === 0) {
                evt.dispatch(ENUMS.Event.NOTIFY_LOAD_PROGRESS, prog)
                threeTerrain.saveGroundShadeTexture();
                threeTerrain.call.getTerrainBigGeo().updateHeightmapCanvasTexture()
                console.log("Terrain Ground Shade Done")

            } else if (prog.done % 20 === 0) {
                evt.dispatch(ENUMS.Event.NOTIFY_LOAD_PROGRESS, prog)
                console.log(prog.progress)
            }
        }

        threeTerrain.buildGroundShadeTexture(shadeProgCB);
        threeTerrain.saveGroundDataTexture()
    }

    getTerrainHeight() {
        return threeTerrain.call.getTerrainScale().y;
    }

    getTerrainHeightAndNormal = function(pos, normalStore, groundData) {
        return threeTerrain.call.getHeightAndNormal(pos, normalStore, groundData);
    };

    getTerrainGroundDataAtPos = function(pos, dataStore) {
        return threeTerrain.call.getTerrainData(pos, dataStore);
    }

    shadeTerrainGround = function(pos, size, channelIndex, operation, intensity) {
        threeTerrain.call.shadeTerrainDataCanvas(pos, size, channelIndex, operation, intensity);
    }

    adjustGroundToAABB = function(aabb) {
        threeTerrain.call.alignDataCanvasToAABB(aabb);
    }

    imprintGroundModelAABB = function(aabb, imprintCallback) {
        threeTerrain.call.imprintGroundInAABB(aabb, imprintCallback);
    }

    registerLodUpdateCB = function(pos, callback) {

        if (this.allLodCallbacks.indexOf(callback) === -1) {
            threeTerrain.call.subscribeToLodUpdate(pos, callback);
            this.allLodCallbacks.push(callback);
        } else {
            console.log("Lod CB already added, not properly removed?")
        }

    }

    clearLodUpdates = function(callback) {
        if (this.allLodCallbacks.indexOf(callback) === -1) {
            if (isDev()) {
                console.log("Callback not registered..")
            }

        } else {
            MATH.splice(this.allLodCallbacks, callback);
            threeTerrain.call.removeLodUpdateCB(callback);
        }
    }

    forceTerrainGlobalLodState(state) {
        for (let i = 0; i < this.allLodCallbacks.length; i++) {
            this.allLodCallbacks[i](state);
        }
    }

    clearAllLodCallbacks() {
        threeTerrain.call.removeAllLodUpdateCBs();
    }

    rebuildGround() {
        vegetationSystem.processGroundDataUpdate()
    }

    getVegetationSystem() {
        return vegetationSystem
    }

}

export {TerrainSystem}