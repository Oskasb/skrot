import { PipelineAPI } from "../../data_pipeline/PipelineAPI.js";
import {isDev} from "./DebugUtils.js";
import { MATH } from "../MATH.js";
import {poolFetch} from "./PoolUtils.js";
import {loadAsset} from "./AssetUtils.js";

let pipelineAPI = new PipelineAPI();

let loadCalls = [];
let frame = {
    tpf:0.01,
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

function getCachedConfigs() {
    return pipelineAPI.getCachedConfigs();
}

function getFrame() {
    return frame;
}

function getGameTime() {
    return frame.gameTime;
}

function loadModelAsset(assetId, callback) {
    loadAsset(assetId, 'glb', callback)
}

function getConfigs() {
    return configs;
}

function getJsonByFileName(fileName) {
    let file = configs.files['json'][fileName];

    let url = 'data/'+file.url;
    return configs['urls'][url];

}

export {
    pipeMsgCB,
    pipeMsgLoadInitCB,
    urlFromIndexEntry,
    initPipelineAPI,
    loadEditIndex,
    getCachedConfigs,
    pipelineAPI,
    getFrame,
    getGameTime,
    loadModelAsset,
    getConfigs,
    getJsonByFileName
}