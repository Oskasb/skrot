import {
    getConfigs,
    loadImageAsset,
    loadJsonFile,
    loadModelAsset, pipeMsgCB,
    pipeMsgLoadInitCB,
    urlFromIndexEntry, urlFromMessageEntry
} from "./DataUtils.js";
import {getLoader} from "./LoaderUtils.js";
import {poolFetch} from "./PoolUtils.js";
import {ENUMS} from "../ENUMS.js";
import {evt} from "../event/evt.js";
import {Object3D} from "../../../../libs/three/Three.Core.js";
import {JsonAsset} from "../load/JsonAsset.js";

let loadCalls = {};
let loadedAssets = {};
let loadedModels = {};
let loadedMaterials = {};
let loadedGeometries = {};
let loadedTextures = {};

let jsonAssets = {};
let tempObj = new Object3D()


function jsonAsset(name, callback) {
    if (!jsonAssets[name]) {
        jsonAssets[name] = new JsonAsset(name);
    }

    jsonAssets[name].subscribe(callback);

}

function assetReloaded(e) {
    console.log("Asset Reloaded", e);
}

function notifyAssetUpdated(url, entry) {
    console.log("Asset Updated: ", url, entry)
    let locUrl = urlFromMessageEntry(entry)
    let fileType = entry[1];

    if (fileType === 'json') {

        if (!jsonAssets[entry[0]]) {
            console.log("No JsonAsset")
            loadJsonFile(locUrl, assetReloaded);
        } else {
            jsonAssets[entry[0]].loadJsonAsset();
        }

    } else if (fileType === 'png') {
        loadImageAsset(entry[0], assetReloaded)
    } else if (fileType === 'glb') {
        loadModelAsset(entry[0], assetReloaded)
    } else {
        console.log("Unhandled file type updated", entry, url);
    }
}

function loadAsset(fileName, fileType, callback) {
    pipeMsgLoadInitCB('load '+fileType, fileName+'.'+fileType);

    let configs = getConfigs();
    let files = configs['files'];
    let assetCfgs = files[fileType];
    let assetCfg = assetCfgs[fileName];

    if (!assetCfg) {
        console.log("Config error ", fileName, fileType)
    }

    let url = assetCfg.url;
 //   console.log("load url:", url);

    if (loadedAssets[url]) {

    }

    if (loadCalls[url]) {

    } else {
        loadCalls[url] = []
    }

    function onLoad(asset) {
        pipeMsgCB('load Ok', fileType,fileName+'.'+fileType);
        callback(asset)
    }

    let loader = getLoader(fileType);
    loader.load(url, onLoad);
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

        let shadows = matSetting.material.userData.shadows;
        if (shadows) {
            mesh.castShadow = shadows['cast']
            mesh.receiveShadow = shadows['receive'];
        }

    }

    loadAssetMaterial(materialName, matCB)
}

function getBoneByName(bones, name) {
    for (let i = 0; i < bones.length; i++) {
        if (bones[i].name === name) {
            return bones[i];
        }
    }
    console.log("No bone by name:", name);
}

function getAssetBoneByName(assetInstance, name) {
    let obj3d = assetInstance.getObj3d();
    let skeleton = obj3d.skeleton;
    let bone = getBoneByName(skeleton.bones, name);
    return bone;
}

function debugDrawSkeleton(assetInstance) {
    let obj3d = assetInstance.getObj3d();
    let skeleton = obj3d.skeleton;
    let bones = skeleton.bones;
    for (let i = 0; i < bones.length; i++) {
        getBoneWorldTransform(bones[i], tempObj)

        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:obj3d.position, to:tempObj.position, color:"GREEN"})
    }

}

function getBoneWorldTransform(bone, obj3d) {
    bone.matrixWorld.decompose(obj3d.position, obj3d.quaternion, obj3d.scale);
}


export {
    jsonAsset,
    notifyAssetUpdated,
    loadAsset,
    loadAssetModel,
    loadAssetMaterial,
    loadModelGeometry,
    loadAssetTexture,
    loadAssetInstance,
    applyMaterial,
    getAssetBoneByName,
    debugDrawSkeleton,
    getBoneWorldTransform
}