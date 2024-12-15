import {getConfigs, pipeMsgLoadInitCB} from "./DataUtils.js";
import {getLoader} from "./LoaderUtils.js";
import {poolFetch} from "./PoolUtils.js";


let loadCalls = {};
let loadedAssets = {};
let loadedModels = {};
let loadedMaterials = {};
let loadedGeometries = {};
let loadedTextures = {};

function loadAsset(fileName, fileType, callback) {
    pipeMsgLoadInitCB('load '+fileType, fileName+'.'+fileType);

    let configs = getConfigs();
    let files = configs['files'];
    let assetCfgs = files[fileType];
    let assetCfg = assetCfgs[fileName];
    let url = assetCfg.url;
 //   console.log("load url:", url);


    if (loadedAssets[url]) {

    }

    if (loadCalls[url]) {

    } else {
        loadCalls[url] = []
    }

    let loader = getLoader(fileType);
    loader.load(url, callback);
}


function loadAssetModel(modelFileName, callback, obj3d) {
    if (!loadedModels[modelFileName]) {
        loadedModels[modelFileName] = poolFetch('ModelAsset');
        loadedModels[modelFileName].initModelAsset(modelFileName);
    }
    loadedModels[modelFileName].subscribeToModel(callback, obj3d);
}

function loadAssetMaterial(materialFileName, callback) {
    if (!loadedMaterials[materialFileName]) {
        loadedMaterials[materialFileName] = poolFetch('ModelMaterial');
        loadedMaterials[materialFileName].initModelMaterial(materialFileName);
    }
    loadedMaterials[materialFileName].subscribeToMaterial(callback)
}

function loadModelGeometry(geometryFileName, callback) {
    if (!loadedGeometries[geometryFileName]) {
        loadedGeometries[geometryFileName] = poolFetch('ModelGeometry');
        loadedGeometries[geometryFileName].initModelGeometry(geometryFileName);
    }
    loadedGeometries[geometryFileName].subscribeToGeometry(callback);
}

function loadAssetTexture(textureFileName, callback) {
    if (!loadedTextures[textureFileName]) {
        loadedTextures[textureFileName] = poolFetch('AssetTexture');
        loadedTextures[textureFileName].initAssetTexture(textureFileName);
    }
    loadedTextures[textureFileName].subscribeToTexture(callback);
}

function loadAssetInstance(assetName, callback) {
    let instance = poolFetch('AssetInstance')
    instance.call.instantiate(assetName, callback);
}

function applyMaterial(mesh, materialName) {
    // console.log("applyMaterial", materialName, mesh);
    //    console.log("applyMaterial", call, materialName, mesh);
    function matCB(matSetting) {
        mesh.material = matSetting.material;
    }

    loadAssetMaterial(materialName, matCB)
}

export {
    loadAsset,
    loadAssetModel,
    loadAssetMaterial,
    loadModelGeometry,
    loadAssetTexture,
    loadAssetInstance,
    applyMaterial
}