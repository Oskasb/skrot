
import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {borrowBox, cubeTestVisibility, aaBoxTestVisibility} from "../../../application/utils/ModelUtils.js";
import {getPhysicalWorld} from "../../../application/utils/PhysicsUtils.js";
import {loadSavedBuffer, saveDataTexture} from "../../../application/utils/ConfigUtils.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {TerrainSliceCallback} from "./TerrainSliceCallback.js";
import {getPlayerActor} from "../../../application/utils/ActorUtils.js";
import {getPlayerStatus, getSetting} from "../../../application/utils/StatusUtils.js";
import {loadStoredImages} from "../../../application/setup/Database.js";
import {getUrlParam} from "../../../application/utils/DebugUtils.js";

let bigWorld = null;
let bigOcean = null;
let lodCenter = null;
let originalMat = null;

let terrainAmmoBody = null;

let groundUpdate = false;
let terrainMaterial = null;
let oceanMaterial = null
let heightmap = null;
let terrainmap = null;
let heightGrid = [];
let width = null;
let height = null;
let terrainWidth = null;
let terrainHeight = null;
let terrainUnitSize = null;
let yMin = null;
let yMax = null;
let maxLodLevel = 6;
let terrainContext = null;
let heightmapContext = null;
let terrainUpdate = false;
let terrainConfig = null;

let terrainParams = {}
let terrainCanvas;
let groundInstances = [];
let oceanInstances = [];

let globalUpdateFrame = 0;

let groundUpdateRect = {}
let heightUpdateRect = {}

let worldLevels = {}

let setupHeightmapData = function(originalModelMat) {
    terrainMaterial = originalModelMat;
    let terrainmapTx = terrainMaterial.terrainmap;
    let terrainData = terrainmapTx.source.data;
    terrainWidth = terrainData.width;
    terrainHeight = terrainData.height;

    terrainCanvas = document.createElement('canvas');
    terrainContext = terrainCanvas.getContext('2d',  { willReadFrequently: true })
    terrainContext.getContextAttributes().willReadFrequently = true;
//    console.log(terrainContext, terrainContext.getContextAttributes())
    terrainCanvas.width = terrainWidth;
    terrainCanvas.height = terrainHeight;
    terrainContext.drawImage(terrainData, 0, 0, terrainWidth, terrainHeight);
//    terrainContext.fillStyle = "rgb(255, 0, 0)";
    terrainContext.globalCompositeOperation = "lighter";
//    terrainContext.fillRect(0, 0, terrainWidth, terrainHeight);

    terrainmap = terrainContext.getImageData(0, 0, terrainWidth, terrainHeight).data;

    let terrainMapCanvasTx = new THREE.CanvasTexture(terrainCanvas)
    terrainMapCanvasTx.generateMipmaps = false;
    terrainMapCanvasTx.flipY = false;
    terrainMaterial.terrainmap = terrainMapCanvasTx;
    terrainMaterial.uniforms.terrainmap.value = terrainMapCanvasTx;

    let heightmapTx = terrainMaterial.heightmap;
    let imgData = heightmapTx.source.data
    width = imgData.width;
    height = imgData.height;
//    console.log(terrainMaterial, heightmapTx, heightmapTx.source.data, imgData , this);

    let heightCanvas = document.createElement('canvas');
    heightmapContext = heightCanvas.getContext('2d', { willReadFrequently: true } )

    heightCanvas.width = width;
    heightCanvas.height = height;

    heightmapContext.drawImage(imgData, 0, 0, width, height);

    heightmap = heightmapContext.getImageData(0, 0, width, height).data;


    let heightMapCanvasTx = new THREE.CanvasTexture(heightCanvas)
    heightMapCanvasTx.generateMipmaps = false;
    heightMapCanvasTx.flipY = false;
    terrainMaterial.heightmap = heightMapCanvasTx;
    terrainMaterial.uniforms.heightmap.value = heightMapCanvasTx;
    terrainMaterial.heightmap.needsUpdate = true;
    terrainMaterial.uniforms.needsUpdate = true;
    terrainMaterial.uniformsNeedUpdate = true;
    terrainMaterial.needsUpdate = true;
    //  heightMapCanvasTx.fillStyle = createGradient(canvasContext, size, tx+0, tz+0);
 //   heightmapContext.fillStyle = "rgba(255, 255, 0, 1)";
 //   heightmapContext.globalCompositeOperation = "darken";
 //   heightmapContext.fillRect(0, 0, 2048, 2048);

//    heightmapContext.fillStyle = "rgba(9, 0, 0, 1)";
//    heightmapContext.globalCompositeOperation = "lighter";
//    heightmapContext.fillRect(0, 0, 2048, 2048);

    terrainMaterial.uniforms.heightmaptiles.value.x = 1;
    terrainMaterial.uniforms.heightmaptiles.value.y = 1;
    terrainMaterial.uniforms.heightmaptiles.value.z = 1024;
    terrainMaterial.needsUpdate = true;


    oceanMaterial.heightmap = heightMapCanvasTx;
    oceanMaterial.uniforms.heightmap.value = heightMapCanvasTx;
    oceanMaterial.heightmap.needsUpdate = true;
    oceanMaterial.uniforms.needsUpdate = true;
    oceanMaterial.uniformsNeedUpdate = true;
    oceanMaterial.needsUpdate = true;

    oceanMaterial.uniforms.heightmaptiles.value.x = 1;
    oceanMaterial.uniforms.heightmaptiles.value.y = 1;
    oceanMaterial.uniforms.heightmaptiles.value.z = 1024;
    oceanMaterial.needsUpdate = true;

    registerWorldLevel("20");
    addWorldLevelMaterial("20", terrainMaterial)
    MATH.clearUpdateRect(groundUpdateRect);
    MATH.clearUpdateRect(heightUpdateRect);
    /*
        setTimeout(function() {
            terrainmap = terrainContext.getImageData(0, 0, terrainWidth, terrainHeight).data;
            console.log(terrainmap)
        }, 3000)
    */
    //  console.log(terrainMaterial, [heightmap], [terrainmap])
}


let bigWorldOuter = null;

//  bigWorldOuter.setAttributev4('texelRowSelect',{x:1, y:1, z:groundInstances.length, w:groundInstances.length*2})

let centerSize = 30;
let lodLayers = 5;
let oceanLayers = 5;
let gridOffsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
let layerScale = [1, 3, 9, 27, 81, 243]
let tempPoint = new Vector3();

let activeGround = [];
let activeOcean = [];
let availableGround = [];
let availableOcean = [];


let rgbaR = [];

function setupAmmoTerrainBody(canvasData, config) {
 //   console.log("Setup Terrain Body", [canvasData], config)
    if (terrainAmmoBody !== null) {
        AmmoAPI.excludeBody(terrainAmmoBody);
        terrainAmmoBody = null;
    }

    for (let i = 0; i < canvasData.length / 4; i++) {
        let txR = i*4;
        rgbaR[i] = (canvasData[txR]+1) * (100/256);
    }

    let heightfieldData = new Float32Array( rgbaR );

    let w = (config.dimensions['tx_width']-1) * terrainUnitSize;

    terrainAmmoBody = AmmoAPI.buildPhysicalTerrain(rgbaR, w, w*0.5, w*0.5, terrainParams.yMin, terrainParams.yMax);
    getPhysicalWorld().registerTerrainBody(terrainAmmoBody)

}

let addGroundSection = function(lodScale, x, z, index) {

    if (activeGround[index]) {
        console.log("Old not removed!")
        return;
    }

    let groundCB = function(ground) {
        activeGround[index] = ground;
        positionSectionInstance(ground, lodScale, x, 0.0, z);
    }

    let assetId = "asset_ground_big"
    if (getUrlParam('hi')) {
    //    assetId= "asset_ground_big_hi"
    }

    client.dynamicMain.requestAssetInstance(assetId, groundCB)

}

let attachSection = function(lodScale, x, z, index) {

    if (availableGround.length === 0) {
        addGroundSection(lodScale, x, z, index)
    } else {
        let ground = availableGround.pop();
        activeGround[index] = ground;
        positionSectionInstance(ground, lodScale, x, 0.0, z);
    }

}

let positionSectionInstance = function(instance, lodScale, x, y, z) {
    instance.getSpatial().setPosXYZ(x, y, z);
    instance.setAttributev4('texelRowSelect',{x:terrainParams.unitScale, y:terrainParams.yMin, z:terrainParams.yMax, w:lodScale})
}

let detachSection = function(index) {

    activeGround[index].decommissionInstancedModel()
    positionSectionInstance(activeGround[index], 0, 9880, 4 + 2*index, 530)
    activeGround[index] = null;

}

let uploadSlices = 64;

let groundUpdateTimeout;

function sliceLoaded(sliceInfo, data) {
    let sliceId = sliceInfo.sliceId;
    let pxScale = sliceInfo.pxScale;
    let wl = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
    if (sliceInfo.wl !== wl) {
        return;
    }
//    console.log("Slice Loaded", sliceInfo, [data]);
    let folder = sliceInfo.folder;
    let pixelsPerSliceX = sliceInfo.w;
    let pixelsPerSliceY = sliceInfo.h;

    heightUpdateRect.minX = sliceInfo.x;
    heightUpdateRect.minY = sliceInfo.y;
    heightUpdateRect.maxX = heightUpdateRect.minX+pixelsPerSliceX;
    heightUpdateRect.maxY = heightUpdateRect.minY+pixelsPerSliceY;
    let iData = new ImageData(data, pixelsPerSliceX, pixelsPerSliceY);
    if (folder === 'height') {
        heightmapContext.globalCompositeOperation = 'source-over';
        heightmapContext.putImageData(iData, heightUpdateRect.minX, heightUpdateRect.minY);
        ThreeAPI.canvasTextureSubUpdate(terrainMaterial.heightmap, heightmapContext, heightUpdateRect)
        clearTimeout(physicsUpdateTimeout);
        physicsUpdateTimeout = setTimeout(function() {
            heightmap = heightmapContext.getImageData(0, 0, width, height).data;
            setupAmmoTerrainBody(heightmap, terrainConfig)
        }, 400)
    }
    if (folder === 'ground') {
    //    console.log("Load ground slice", sliceInfo, [data])
        terrainContext.globalCompositeOperation = 'source-over';
        terrainContext.putImageData(iData, heightUpdateRect.minX, heightUpdateRect.minY);
        ThreeAPI.canvasTextureSubUpdate(terrainMaterial.terrainmap, terrainContext, heightUpdateRect)
        clearTimeout(groundUpdateTimeout)

        groundUpdateTimeout = setTimeout(function() {
            terrainmap = terrainContext.getImageData(0, 0, terrainWidth, terrainHeight).data;
            }, 500);

    }

    MATH.clearUpdateRect(heightUpdateRect);
}

let listeners = {}
let slicesX = 8;
let slicesZ = 8;

function setupBufferListeners(folder, worldLevel, x, z, w, h) {
    let pixelsPerSliceX = w/uploadSlices;
    let pixelsPerSliceY = h/uploadSlices;
    let pxScale = w/2048;

    if (!listeners[folder]) {
        listeners[folder] = [];
        for (let i = 0; i < slicesX; i++) {
            listeners[folder].push([])
            for (let j = 0; j < slicesZ; j++) {
                let sliceCallback = new TerrainSliceCallback(folder, pixelsPerSliceX, pixelsPerSliceY, sliceLoaded)
                listeners[folder][i][j] = sliceCallback;
            }
        }
    }

    let centerSliceX = MATH.clamp(Math.floor((x+w*0.5)/pixelsPerSliceX), slicesX/2, uploadSlices-slicesX/2)
    let centerSliceY = MATH.clamp(Math.floor((z+h*0.5)/pixelsPerSliceY), slicesZ/2, uploadSlices-slicesZ/2)

    let grid = listeners[folder];

        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                let xMin = (centerSliceX*pixelsPerSliceX + (pixelsPerSliceX * (i - grid[i].length*0.5)));
                let yMin = (centerSliceY*pixelsPerSliceY + (pixelsPerSliceY * (j - grid[j].length*0.5)));

                let sliceCallback = grid[i][j];

                sliceCallback.call.setSliceParams(worldLevel, xMin, yMin, pxScale);
                loadSavedBuffer(sliceCallback.call.getSliceId(), sliceCallback.call.sliceUpdated)

            }
        }
}

function updateBufferListeners(worldLevel, x, z) {
  //  console.log("updateBufferListeners", worldLevel)
    if (isNaN(x) || isNaN(z)) {
        return;
    }
    setupBufferListeners("height", worldLevel, x, z, width, height);
    setupBufferListeners("ground", worldLevel, x*2, z*2, terrainCanvas.width, terrainCanvas.height);

}

function uploadUpdateRect(folder, updateRect, ctx, maxWidth, maxHeight) {
    let pixelsPerSliceX = maxWidth/uploadSlices;
    let pixelsPerSliceY = maxHeight/uploadSlices;
    let sliceXmin = Math.floor(updateRect.minX/pixelsPerSliceX)
    let slixeXMax = Math.ceil(updateRect.maxX/pixelsPerSliceX)
    let sliceYmin = Math.floor(updateRect.minY/pixelsPerSliceY)
    let slixeYMax = Math.ceil(updateRect.maxY/pixelsPerSliceY)
    let totalX = slixeXMax-sliceXmin;
    let totalY = slixeYMax-sliceYmin;
    let worldLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
    console.log("uploadUpdateRect", totalX, totalY, pixelsPerSliceX, pixelsPerSliceY, sliceXmin, sliceYmin)

    for (let i = 0; i < totalX; i++) {
        for (let j = 0; j < totalY; j++) {
            let xMin = sliceXmin*pixelsPerSliceX + pixelsPerSliceX*i;
            let yMin = sliceYmin*pixelsPerSliceY + pixelsPerSliceY*j;
            let subImage = ctx.getImageData(xMin, yMin, pixelsPerSliceX, pixelsPerSliceY).data;
            saveDataTexture("terrain", folder, folder+"_"+worldLevel+"_"+xMin+"_"+yMin, subImage);
        }
    }

//
}

let physicsUpdateTimeout;
let visibilityList = [];
let visibleCount = 0;
let lastPosX = 0;
let lastPosZ = 0;
let lastWorldLevel = 20;
let updateListeners = true;
let updateBigGeo = function(tpf) {
    let camY = ThreeAPI.getCamera().position.y;
//    lodCenter.copy(ThreeAPI.getCameraCursor().getLookAroundPoint())
    let posX = Math.floor(lodCenter.x)
    let posZ = Math.floor(lodCenter.z)

    let wLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)

    if (Math.abs(lastPosX - posX) > 20 || Math.abs(lastPosZ - posZ) > 20 || wLevel !== lastWorldLevel) {
        lastWorldLevel = wLevel;
        lastPosX = posX;
        lastPosZ = posZ;
        updateListeners = true;
    }

    if (updateListeners === true) {
        updateBufferListeners(wLevel, posX, posZ)
        updateListeners = false;
    }

//    bigOcean.getSpatial().setPosXYZ(posX, -3.0, posZ);
  //  oceanInstances[0].getSpatial().setPosXYZ(posX, -3.0, posZ);
  //  oceanInstances[1].getSpatial().setPosXYZ(posX, -3.0, posZ);
    for (let i = 0; i < oceanInstances.length; i++) {
        if (i === 1) {
            positionSectionInstance(oceanInstances[i], 1, posX, 0.0, posZ);
            // oceanInstances[i].getSpatial().setPosXYZ(posX, 0.0, posZ);
        }
    }


  //  groundInstances[0].getSpatial().setPosXYZ(posX, 0.0, posZ);
  //  groundInstances[0].setAttributev4('texelRowSelect',{x:terrainUnitSize*0.8, y:1, z:1, w:1})

    positionSectionInstance(groundInstances[0], 1, posX, 0.0, posZ);

    let index = 1;
    visibleCount = 0;

    let elevAdjustedLayers = lodLayers // Math.clamp(1 + Math.floor(MATH.curveSqrt(camY*0.25) / 4), 1, lodLayers)

    let scaleFactor = terrainUnitSize*centerSize

    for (let l = 0; l < elevAdjustedLayers; l++) {
        let lodLayer = l;

        for (let i = 0; i < gridOffsets.length; i++) {
            let lodScale = layerScale[lodLayer]
        //    let tileIndex = index+lodLayer*

            tempPoint.set(posX + scaleFactor*gridOffsets[i][0]*lodScale, 0.0, posZ + scaleFactor*gridOffsets[i][1]*lodScale)
        //    let visible = ThreeAPI.testPosIsVisible(tempPoint);

            let visible = aaBoxTestVisibility(tempPoint, scaleFactor*lodScale, terrainParams.yMax , scaleFactor*lodScale)
            let borrowedBox = borrowBox();


            if (!visible) {
                if (visibilityList[index] === true) {
                    detachSection(index);
                    visibilityList[index] = false
                }
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:lodCenter, to:tempPoint, color:'RED'});
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:'RED'})
            } else {
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:'CYAN'})
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:lodCenter, to:tempPoint, color:'GREEN'});
                visibleCount++
                if (visibilityList[index] !== true) {
                    attachSection(lodScale, tempPoint.x, tempPoint.z, index)
                    visibilityList[index] = true;
                } else {
                    positionSectionInstance(activeGround[index], lodScale, tempPoint.x, 0.0, tempPoint.z);
                //    positionSectionInstance(activeOcean[index], lodScale, tempPoint.x, -3.0, tempPoint.z);
                }
            }

            index++
        }
    }

    if (terrainUpdate) {

        if (heightUpdateRect.maxX !== 0) {
            ThreeAPI.canvasTextureSubUpdate(terrainMaterial.heightmap, heightmapContext, heightUpdateRect)
            uploadUpdateRect('height', heightUpdateRect, heightmapContext, width, height)
            MATH.clearUpdateRect(heightUpdateRect);
        } else {
            terrainMaterial.heightmap.needsUpdate = true;
        }
        heightmap = heightmapContext.getImageData(0, 0, width, height).data;
        terrainUpdate = false;

        while (onTerrainUpdateCallbacks.length) {
            onTerrainUpdateCallbacks.pop()()
        }

        clearTimeout(physicsUpdateTimeout);
        physicsUpdateTimeout = setTimeout(function() {
            setupAmmoTerrainBody(heightmap, terrainConfig)
        }, 400)
    }

}

let materialModel = function(model) {
    originalMat = model.originalModel.material.mat;
    setupHeightmapData(originalMat)
    bigWorld = model;
 //   console.log("big world model:", model)

}

let oceanModel = function(model) {
    oceanMaterial = model.originalModel.material.mat;
}

function registerWorldLevel(worldLevel) {
    if (!worldLevels[worldLevel]) {


        worldLevels[worldLevel] = {
            heightCanvas : document.createElement('canvas'),
            terrainCanvas : document.createElement('canvas'),
        };

        worldLevels[worldLevel].heightCanvas.width = width
        worldLevels[worldLevel].heightCanvas.height = height
        worldLevels[worldLevel].terrainCanvas.width = terrainCanvas.width
        worldLevels[worldLevel].terrainCanvas.height = terrainCanvas.height
        worldLevels[worldLevel].heightCtx = worldLevels[worldLevel].heightCanvas.getContext('2d')
        worldLevels[worldLevel].terrainCtx = worldLevels[worldLevel].terrainCanvas.getContext('2d')
    }
}

function fillContextWithImage(ctx, imgData) {
    let width = imgData.width;
    let height = imgData.height;
    ctx.globalCompositeOperation = "source-over"
    ctx.drawImage(imgData, 0, 0, width, height);
}

function addWorldLevelMaterial(worldLevel, material) {
  //  console.log("addWorldLevelMaterial", material)
    let wLevel = worldLevels[worldLevel];
    let heightCtx = wLevel.heightCtx;
    let terrainCtx = wLevel.terrainCtx;

    let newHeightmap = material.heightmap;
    let newTerrainMap = material.terrainmap;

    let heightImageData = newHeightmap.source.data; // source.data is a canvas
    let terrainImageData = newTerrainMap.source.data;
    fillContextWithImage(heightCtx, heightImageData);
    fillContextWithImage(terrainCtx, terrainImageData);
}

function setHeightDataImage(imgData, worldLevel) {
    fillContextWithImage(heightmapContext, imgData)
}

function setTerrainDataImage(imgData, worldLevel) {
    fillContextWithImage(terrainContext, imgData)
}


let onGroundUpdateCallbacks = []
let onTerrainUpdateCallbacks = []

class TerrainBigGeometry {
    constructor() {

        this.onGroundUpdateCallbacks = onGroundUpdateCallbacks
        this.onTerrainUpdateCallbacks = onTerrainUpdateCallbacks

        this.call = {

            updateBigGeo:updateBigGeo
        }
    }


    applyGroundMaterial(material, worldLevel) {

        if (worldLevel === '19') {
            let actor = getPlayerActor();
            if (actor) {
                worldLevel = getPlayerStatus(ENUMS.PlayerStatus.PLAYER_ID);
                loadStoredImages(worldLevel);
            }
        }

        if (!worldLevels[worldLevel]) {
            registerWorldLevel(worldLevel)
            addWorldLevelMaterial(worldLevel, material);
            console.log("WorldLevels ", worldLevels);
        }

        let wLevel = worldLevels[worldLevel];
    //    let newHeightmap = material.heightmap;
    //    let newTerrainMap = material.terrainmap;

        let heightImageData = wLevel.heightCanvas;
        let terrainImageData = wLevel.terrainCanvas;
        setHeightDataImage(heightImageData);
        setTerrainDataImage(terrainImageData);
        console.log("applyGroundMaterial", [terrainMaterial, worldLevel, worldLevels]);

        this.updateGroundCanvasTexture()
        this.updateHeightmapCanvasTexture()
        updateListeners = true;
        updateBigGeo(0.01);
    }

    getVisibleCount() {
        return visibleCount;
    }

    getHeightmapData() {
        return heightmap;
    }

    getGroundCanvas() {
        return terrainContext;
    }

    getHeightmapCanvas() {
        return heightmapContext;
    }



    getGroundData() {
        if (groundUpdate) {
            terrainmap = terrainContext.getImageData(0, 0, terrainWidth, terrainHeight).data;
            groundUpdate = false;
        }
        return terrainmap;
    }

    updateGroundCanvasTexture(updateRect) {

        if (typeof (updateRect) === 'object') {
            ThreeAPI.canvasTextureSubUpdate(terrainMaterial.terrainmap, terrainContext, updateRect);
            uploadUpdateRect('ground', updateRect, terrainContext, terrainCanvas.width, terrainCanvas.height)
        } else {
            terrainMaterial.uniforms.terrainmap.value = terrainMaterial.terrainmap;
            terrainMaterial.terrainmap.needsUpdate = true;
            terrainMaterial.uniforms.terrainmap.needsUpdate = true;
            terrainMaterial.uniformsNeedUpdate = true;
            terrainMaterial.needsUpdate = true;
        }
        clearTimeout(groundUpdateTimeout);
        groundUpdateTimeout = setTimeout(function() {
            groundUpdate = true;

            while (onGroundUpdateCallbacks.length) {
                updateListeners = true;
                onGroundUpdateCallbacks.pop()()
            }

        }, 100);
    }

    getTerrainMaterial() {
        return terrainMaterial;
    }


    updateHeightmapCanvasTexture(updateRect) {
        console.log("updateHeightmapCanvasTexture", updateRect)
        if (typeof (updateRect) === 'object') {
            if (typeof (updateRect) === 'object') {
                MATH.fitUpdateRect(updateRect, heightUpdateRect);
            }
        }

        //    if (MATH.isEvenNumber(GameAPI.getFrame().frame * 0.25)) {
        terrainUpdate = true;
        //    }
    }


    getTerrainParams() {
        return terrainParams;
    }

    initBigTerrainGeometry(lodC, heightMapData, transform) {
    //    return;
        // "asset_big_loader"
        lodCenter = lodC;
        let dims = heightMapData['dimensions'];
        terrainConfig = heightMapData;
        // gridMeshAssetId = dims['grid_mesh'];
        let txWidth = dims['tx_width'];
        let groundTxWidth = dims['ground_tx_width'];
        let mesh_segments = dims['mesh_segments'];
        lodLayers = dims['lod_layers'] || 2;
        lodLayers += getSetting(ENUMS.Settings.TERRAIN_RANGE);
   //     console.log("Constructs Big Terrain", txWidth, mesh_segments);


        terrainParams.tx_width = txWidth;
        terrainParams.groundTxWidth = groundTxWidth;



        let worldLevel = GameAPI.getPlayer().getStatus(ENUMS.PlayerStatus.PLAYER_WORLD_LEVEL)
        let levelCfg = GameAPI.gameMain.getWorldLevelConfig(""+worldLevel)
        console.log("WORLD LEVEL CONFIG >>> ", levelCfg);
        terrainUnitSize = levelCfg.unit || 1;

        terrainParams.yMin = levelCfg.y_min || 0;
        terrainParams.yMax = levelCfg.y_max || 100;
        terrainParams.unitScale = terrainUnitSize;

        dims.min_height = terrainParams.yMin;
        dims.max_height = terrainParams.yMax;

        terrainParams.minHeight = dims.min_height;
        terrainParams.maxHeight = dims.max_height;


    //    terrainParams.tiles = tiles;

        let updateBigGeo = this.call.updateBigGeo;

        let groundCB = function(model) {
            if (groundInstances.length === 0) {
                materialModel(model)
                ThreeAPI.addPrerenderCallback(updateBigGeo)
                model.setAttributev4('texelRowSelect',{x:1, y:1, z:1, w:1})
            }
            groundInstances.push(model);

        }


        let oceanOuterCB = function(model)  {
            model.setAttributev4('texelRowSelect',{x:1, y:1, z:1, w:1})
            oceanInstances.push(model);
        }

        let oceanCB = function(model) {
            if (oceanInstances.length === 0) {
                oceanModel(model)
                model.setAttributev4('texelRowSelect',{x:1, y:1, z:1, w:1})
            }
            oceanInstances.push(model);
            client.dynamicMain.requestAssetInstance("asset_ocean_big_outer", oceanOuterCB)

            let assetId = "asset_ground_big"
            if (getUrlParam('hi')) {
            //    assetId= "asset_ground_big_hi"
            }

            client.dynamicMain.requestAssetInstance(assetId, groundCB)

        }

        client.dynamicMain.requestAssetInstance("asset_ocean_big", oceanCB)

    }






}

export {TerrainBigGeometry}