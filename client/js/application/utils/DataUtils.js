import { PipelineAPI } from "../../data_pipeline/PipelineAPI.js";
import {isDev} from "./DebugUtils.js";
import {poolFetch} from "./PoolUtils.js";
import {loadAsset} from "./AssetUtils.js";

let pipelineAPI = new PipelineAPI();

let loadCalls = [];
let frame = {
    tpf:0.01,
    tpfAvg:0.01,
    gameTime:0.01,
    systemTime:0.01,
    elapsedTime:0.01,
    frame:0
};

let configs = null;

let loadDoneCBs = [];

function pipeMsgCB(msg, e, url) {
//    console.log("Pipeline Msg ", msg, e, url);

    let entry = null;

    for (let i = 0; i < loadCalls.length; i++) {
        if (loadCalls[i].key === url) {
            entry = loadCalls[i];
            entry.closeQueueEntry()
        }
    }

    if (loadCalls.length === 0) {
        while (loadDoneCBs.length) {
            loadDoneCBs.pop()(msg);
        }
    }

}

function pipeMsgLoadInitCB(msg, url) {
//    console.log("pipeMsgLoadInitCB", url);
    for (let i = 0; i < loadCalls.length; i++) {
        if (loadCalls[i].key === url) {
        //    console.log("Request already sent before return", url);
        //    return;
        }
    }

    let queueEntry = poolFetch('AsynchQueueFeedback');
    let splits = url.split('.');
    loadCalls = queueEntry.initQueueEntry(url, splits[1]);
}

function initPipelineAPI(pipeReadyCB) {
    pipelineAPI.initConfigCache(pipeReadyCB, pipeMsgCB)
}

function loadEditIndex(url, callback) {
  //  console.log("loadEditIndex", pipelineAPI, url, callback)
    loadDoneCBs.push(callback);


    const dataPipelineOptions = {
        "jsonRegUrl":url,
        "jsonConfigUrl":"data/",
        "jsonPipe":{
            "polling":{
                "enabled":isDev(),
                "frequency":15
            }
        }
    };

    function onError(err, x, y, z) {
        console.log("Pipelinje setup error ", err, x, y, z)
    }

    let loadInitOk = function(msg) {
        configs = msg;
        console.log("Load init Ok", configs);
    }

    pipelineAPI.dataPipelineSetup(url, dataPipelineOptions, loadInitOk, onError, pipeMsgLoadInitCB)
}

function urlFromIndexEntry(id, entry) {
    return entry.path + entry.root + '/' + entry.folder+ '/' + id + '.' + entry.format;
}

function urlFromMessageEntry(entry) {
    return './data/' + entry[2]+ '/'+entry[3]+ '/'+entry[4]+ '/' + entry[0] + '.' + entry[1];
}

function getCachedConfigs() {
    return pipelineAPI.getCachedConfigs();
}

function getFrame() {
    return frame;
}

function getGameTime() {
    return frame.gameTime;
}

function jsonLoadFail(e) {
    console.log("Json load fail", e)
}

function loadJsonFile(url, callback) {
    pipelineAPI.configCache.requestJsonFile(url, callback, jsonLoadFail)
}

function loadModelAsset(assetId, callback) {
    loadAsset(assetId, 'glb', callback)
}

function loadImageAsset(assetId, callback) {
    loadAsset(assetId, 'png', callback)
}

function getConfigs() {
    return configs;
}

function getJsonByFileName(fileName) {
    let file = configs.files['json'][fileName];

    if (!file) {
        console.log("No file!", fileName);
    }

    let url = 'data/'+file.url;
    return configs['urls'][url];

}

function getJsonUrlByFileName(fileName) {
    let file = configs.files['json'][fileName];

    if (!file) {
        console.log("No file!", fileName);
    }

    return './data/'+file.url;
}

export {
    pipeMsgCB,
    pipeMsgLoadInitCB,
    urlFromMessageEntry,
    urlFromIndexEntry,
    initPipelineAPI,
    loadEditIndex,
    getCachedConfigs,
    pipelineAPI,
    getFrame,
    getGameTime,
    loadJsonFile,
    loadImageAsset,
    loadModelAsset,
    getConfigs,
    getJsonByFileName,
    getJsonUrlByFileName
}