"use strict";

import { DataPipelineMessageHandler } from './DataPipelineMessageHandler.js';
import { ENUMS } from "../application/ENUMS.js";

class DataWorker {

    onUpdateCallbacks = {};

    constructor(pipeName, workerReadyCB, pipelineMessageCB) {
        this.dataPipelineMessageHandler = new DataPipelineMessageHandler(pipelineMessageCB)
        const messageHandler = this.dataPipelineMessageHandler;

        if (typeof(Worker) !== 'undefined') {
            this.worker = new Worker('./../client/js/data_pipeline/worker/WorkerMain.js');

            let _this = this;

            this.worker.onmessage = function(msg) {
                if (msg.data[0] === 'ready') {
                    workerReadyCB(msg, ENUMS.getKey('Worker', pipeName));
                }
                if (msg.data[0] === 'ok') {
                    _this.onUpdateCallbacks[msg.data[1]][0](msg.data[1], msg.data[2]);
                    messageHandler.handleDataUpdated(msg.data[1]);
                }
                if (msg.data[0] === 'fail') messageHandler.handleWorkerError(msg.data[1], msg.data[2]);
                if (msg.data[0] === 'error_resolved') messageHandler.handleErrorUpdate(msg.data[1], msg.data[2]);
                if (msg.data[0] === 'error_unchanged') messageHandler.handleErrorUpdate(msg.data[1], msg.data[2]);
                if (msg.data[0] === 'error_changed') messageHandler.handleErrorUpdate(msg.data[1], msg.data[2]);
            };

        }
    }


        fetchJsonData = function(url, onDataUpdate, fail) {
            this.onUpdateCallbacks[url] = [onDataUpdate, fail];
            this.worker.postMessage(['json', url]);
        };

        saveJsonData = function(json, url) {
            this.worker.postMessage(['storeJson', url, json]);
        };


        fetchSvgData = function(url, onDataUpdate, fail) {
            this.onUpdateCallbacks[url] = [onDataUpdate, fail];
            this.worker.postMessage(['svg', url]);
        };

        fetchBinaryData = function(url, onDataUpdate, fail) {
            this.onUpdateCallbacks[url] = [onDataUpdate, fail];
            this.worker.postMessage(['bin', url]);
        }

    }

export { DataWorker }