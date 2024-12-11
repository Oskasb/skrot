import { PipelineAPI } from "../../data_pipeline/PipelineAPI.js";
import {isDev} from "./DebugUtils.js";

let pipelineAPI = new PipelineAPI();

function pipeMsgCB(msg) {
    console.log("Pipeline Msg ", msg);
}

function initPipelineAPI(pipeReadyCB) {
    pipelineAPI.initConfigCache(pipeReadyCB, pipeMsgCB)
}

function loadEditIndex(url, callback) {
    console.log("loadEditIndex", pipelineAPI, url, callback)

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

    function onError(err) {
        console.log("Pipelinje setup error ", err)
    }

    pipelineAPI.dataPipelineSetup(url, dataPipelineOptions, callback, onError)
}

function urlFromIndexEntry(id, entry) {
    return entry.path + '/' + entry.root + '/' + entry.folder+ '/' + id + '.' + entry.format;
}

export {
    urlFromIndexEntry,
    initPipelineAPI,
    loadEditIndex
}