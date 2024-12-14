import {getConfigs, pipeMsgLoadInitCB} from "./DataUtils.js";
import {getLoader} from "./LoaderUtils.js";
import {poolFetch} from "./PoolUtils.js";


let loadCalls = {};
let loadedAssets = {};
let loadedModels = {};
let loadedMaterials = {};
let loadedGeometries = {};

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


function loadAssetModel(modelFileName, callback) {
    if (!loadedModels[modelFileName]) {
        loadedModels[modelFileName] = poolFetch('ModelAsset');
        loadedModels[modelFileName].initModelAsset(modelFileName);
    }
    loadedModels[modelFileName].subscribeToModel(callback);
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

export {
    loadAsset,
    loadAssetModel,
    loadAssetMaterial,
    loadModelGeometry
}