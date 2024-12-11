
import {Box3} from "../../../../libs/three/math/Box3.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {TerrainElementModel} from "./TerrainElementModel.js";
import {TerrainSectionInfo} from "./TerrainSectionInfo.js";


let tempVec = new Vector3()
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
let maxLodLevel = 6;
let terrainContext = null;
let heightmapContext = null;
let terrainUpdate = false;

let globalUpdateFrame = 0;

let oceanPlane = null;

let debugWorld = null;
let ctx;
let setupHeightmapData = function(originalModelMat) {
    terrainMaterial = originalModelMat;
    let terrainmapTx = terrainMaterial.terrainmap;
    let terrainData = terrainmapTx.source.data;
    terrainWidth = terrainData.width;
    terrainHeight = terrainData.height;

    let terrainCanvas = document.createElement('canvas');
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
    debugWorld.material.map = terrainmapTx.clone() // new THREE.CanvasTexture(canvas);
    debugWorld.material.map.flipY = false;
 //   debugWorld.material.map.repeat.y = -1;
    debugWorld.material.needsUpdate = true;
 //   terrainMaterial.needsUpdate = true;
 //   context.drawImage(heightmapTx.source.data, 0, 0, width, height);
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
    heightmapContext.fillStyle = "rgba(255, 255, 0, 1)";
    heightmapContext.globalCompositeOperation = "darken";
    heightmapContext.fillRect(0, 0, 2048, 2048);

//    heightmapContext.fillStyle = "rgba(9, 0, 0, 1)";
    heightmapContext.globalCompositeOperation = "lighter";
//    heightmapContext.fillRect(0, 0, 2048, 2048);

/*
    setTimeout(function() {
        terrainmap = terrainContext.getImageData(0, 0, terrainWidth, terrainHeight).data;
        console.log(terrainmap)
    }, 3000)
*/
  //  console.log(terrainMaterial, [heightmap], [terrainmap])
}

let containsPoint = function(geo, posVec) {

}

let probeForHeightMinMax = function(geo) {
    let pos = geo.obj3d.position
    let bounds = geo.boundingBox;
    tempVec.copy(bounds.min)
    geo.registerContainsHeight(ThreeAPI.terrainAt(tempVec))
    tempVec.x = pos.x;
    geo.registerContainsHeight(ThreeAPI.terrainAt(tempVec))
    tempVec.copy(bounds.max)
    geo.registerContainsHeight(ThreeAPI.terrainAt(tempVec))
    tempVec.x = pos.x;
    geo.registerContainsHeight(ThreeAPI.terrainAt(tempVec))

    geo.registerContainsHeight(ThreeAPI.terrainAt(pos))

    tempVec.set(bounds.min.x, 0, bounds.max.z)
    geo.registerContainsHeight(ThreeAPI.terrainAt(tempVec))
    tempVec.z = pos.z;
    geo.registerContainsHeight(ThreeAPI.terrainAt(tempVec))
    tempVec.set(bounds.max.x, 0, bounds.min.z)
    geo.registerContainsHeight(ThreeAPI.terrainAt(tempVec))
    tempVec.z = pos.z;
    geo.registerContainsHeight(ThreeAPI.terrainAt(tempVec))
}

class TerrainGeometry{
    constructor(obj3d, segmentScale, x, y, vertsPerSegAxis, tiles, tx_width,groundTxWidth, groundConfig, sectionInfoCponfig) {
        this.gridX = x;
        this.gridY = y;
        this.minY = MATH.bigSafeValue();
        this.maxY = -MATH.bigSafeValue();
        this.obj3d = obj3d;
        this.groundConfig = groundConfig;
        this.instance = null; // this gets rendered by the shader
        this.oceanInstance = null;
        this.terrainSectionInfo = new TerrainSectionInfo(this, sectionInfoCponfig);
        this.terrainElementModels = new TerrainElementModel(this);
        this.terrainElementModels.loadData(this.groundConfig['terrain_elements'])
        this.posX = obj3d.position.x;
        this.posZ = obj3d.position.z;
        this.size = segmentScale;
        this.vertsPerSegAxis = vertsPerSegAxis;
        this.tiles = tiles;
        this.tx_width = tx_width;
        this.groundTxWidth = groundTxWidth;
        this.isActive = false;
        this.wasVisible = false;
        this.isVisible = false;
        this.updateMinMax = true;

        this.addedLodCallbacks = [];

        let box3min = new Vector3();
        box3min.x = this.posX - this.size*0.75;
        box3min.y = 0;
        box3min.z = this.posZ - this.size*0.75;
        let box3Max = new Vector3();

        box3Max.x = this.posX + this.size*0.75;
        box3Max.y = 60;
        box3Max.z = this.posZ + this.size*0.75;

        this.boundingBox = new Box3(box3min, box3Max);

        this.updateFrame = 0;

        this.levelOfDetail = -1;

        this.lodUpdateCallbaks = [];

    }

    registerContainsHeight(posY) {
        if (posY < this.minY) {
            this.minY = posY;
            this.boundingBox.min.y = posY;
        }

        if (posY > this.maxY) {
            this.maxY = posY;
            this.boundingBox.max.y = posY;
        }
    }

    addLodUpdateCallback = function(cb) {
        if (this.lodUpdateCallbaks.indexOf(cb) === -1) {
            this.lodUpdateCallbaks.push(cb)
            this.addedLodCallbacks.push(cb);

        } else {
            console.log("Lod CB already added to tile")
        }
    }

    removeLodUpdateCallback = function(cb) {
        MATH.splice(this.lodUpdateCallbaks, cb)
    }

    getExtentsMinMax(storeMin, storeMax) {
        storeMin.copy(this.obj3d.position);
        storeMin.x -= this.size*0.5;
        storeMin.z -= this.size*0.5;
        storeMax.copy(storeMin);
        storeMax.x += this.size;
        storeMax.z += this.size;
    }

    applyLodLevelChange(lodLevel) {
                this.levelOfDetail = lodLevel;
                this.terrainSectionInfo.applyLodLevel(this.levelOfDetail, maxLodLevel);
                this.terrainElementModels.applyLevelOfDetail(this.levelOfDetail, this.terrainSectionInfo);
                MATH.callAll(this.lodUpdateCallbaks, this.levelOfDetail);
    }

    clearTerrainGeometry() {
        this.levelOfDetail = -1;
        this.terrainSectionInfo.deactivateTerrainSection();
        this.terrainElementModels.dectivateTerrainElementodels();


    }

    getOrigin() {
        return this.obj3d.position;
    }

    updateVisibility(lodLevel, frame) {

        if (this.updateMinMax === true) {
            probeForHeightMinMax(this);
            this.updateMinMax = false
        };


        if (lodLevel !== this.levelOfDetail) {
            this.applyLodLevelChange(lodLevel)
            MATH.emptyArray(this.addedLodCallbacks)
        } else {
            while (this.addedLodCallbacks.length) {
                this.addedLodCallbacks.pop()(lodLevel)
            }
        }

        this.updateFrame = frame;
    }

}

export {TerrainGeometry}