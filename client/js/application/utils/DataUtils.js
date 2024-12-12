import { PipelineAPI } from "../../data_pipeline/PipelineAPI.js";
import {isDev} from "./DebugUtils.js";
import { MATH } from "../MATH.js";
import {poolFetch} from "./PoolUtils.js";

let pipelineAPI = new PipelineAPI();

let loadCalls = [];
let frame = {
    tpf:0.01,
    gameTime:0.01,
    systemTime:0.01,
    elapsedTime:0.01,
    frame:0
};
function pipeMsgCB(msg, e, url) {
//    console.log("Pipeline Msg ", msg, e, url);

    let entry = null;

    for (let i = 0; i < loadCalls.length; i++) {
        if (loadCalls[i].key === url) {
            entry = loadCalls[i];
            entry.closeQueueEntry()
        }
    }

}

function pipeMsgLoadInitCB(msg, url) {

    for (let i = 0; i < loadCalls.length; i++) {
        if (loadCalls[i].key === url) {
            console.log("Request sent twice before return", url);
            return;
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

    pipelineAPI.dataPipelineSetup(url, dataPipelineOptions, callback, onError, pipeMsgLoadInitCB)
}

function urlFromIndexEntry(id, entry) {
    return entry.path + '/' + entry.root + '/' + entry.folder+ '/' + id + '.' + entry.format;
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

export {
    urlFromIndexEntry,
    initPipelineAPI,
    loadEditIndex,
    getCachedConfigs,
    pipelineAPI,
    getFrame,
    getGameTime
}