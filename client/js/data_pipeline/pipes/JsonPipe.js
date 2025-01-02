"use strict";
import { DataWorker } from '../DataWorker.js';
import { ENUMS} from "../../application/ENUMS.js";

class JsonPipe {

    constructor(pipeReadyCB, pipelineMessageCB) {
        this.dataWorker = new DataWorker(ENUMS.Worker.JSON_PIPE, pipeReadyCB, pipelineMessageCB);
    }

		pollDelay = 0.2;
		pollCountdown = this.pollDelay;
		loadedData = {};
		lastPolledIndex = 0;
		pollIndex = [];
		pollCallbacks = {};
		errorCallback = function() {};

		options = {
			"polling":{
				"enabled":false,
				"frequency":5
			}
		};

    resetPollState() {
        this.loadedData = {};
        this.lastPolledIndex = 0;
	}

		registerPollCallback = function(url, onUpdateCallback) {
            this.pollCallbacks[url] = onUpdateCallback;
            this.pollIndex.push(url);
		};

        pollUrl = function(url) {
            if (!this.pollCallbacks[url]) return;
            if (this.pollIndex.indexOf(url) === -1) {
                this.pollIndex.push(url);
            }
        };

    pruneUrlsExceptFor(urls) {
        let keepCalls = []
        this.pollIndex.length = 0;
        /*    /**/
                for (let i =0; i < urls.length; i++) {
                    let url ='client/json'+urls[i];

                    if (typeof(this.pollCallbacks[url])) {
                        keepCalls.push([url,this.pollCallbacks[url]])
                    }
                }

                this.pollCallbacks = {};
                for (let i = 0; i < keepCalls.length; i++) {
                    this.pollCallbacks[keepCalls[i][0]] = keepCalls[i][1];
                }

        for (let i = 0; i < urls.length; i++) {
            this.pollIndex.push('client/json'+urls[i]);
        }
    }

        removeUrlPoll = function(url) {
            if (this.pollIndex.indexOf(url) !== -1) {
                this.pollIndex.splice(pollIndex.indexOf(url));
            }
        };

		storeConfig(url, config, success) {
			this.loadedData[url] = config;
			success(url, config);
		};

		loadJsonFromUrl(url, dataUpdated, fail) {
		    let _this = this;
            let onLoaded = function(config, fileUrl) {
                _this.storeConfig(fileUrl, config, dataUpdated);
                _this.registerPollCallback(fileUrl, dataUpdated);
			};

            let onWorkerOk = function(resUrl, res) {
				onLoaded(res, resUrl);
			};

            let onWorkerFail = function(res) {
				fail("Worker fail: "+ res)
			};

            this.dataWorker.fetchJsonData(url, onWorkerOk, onWorkerFail);
		};

		saveJsonToUrl = function(json, url) {
            this.dataWorker.saveJsonData(json, url);
		};
		
		tickJsonPipe = function(tpf) {
			if (!this.options.polling.enabled) return;
            this.pollDelay = 1/this.options.polling.frequency;
            this.pollCountdown -= this.pollIndex.length*tpf/(this.pollIndex.length+1);
			if (this.pollCountdown < 0) {
                this.lastPolledIndex += 1;
				if (this.lastPolledIndex >= this.pollIndex.length) {
                    this.lastPolledIndex = 0;
				}
                let pollFail = function(err) {
                    this.errorCallback("Json: ", err);
				};
				this.loadJsonFromUrl(this.pollIndex[this.lastPolledIndex], this.pollCallbacks[this.pollIndex[this.lastPolledIndex]], pollFail, false);
                this.pollCountdown = this.pollDelay;
			}
		};

		setJsonPipeOpts = function(opts, pipelineErrorCb, ConfigCache) {
            this.options = opts;
            this.errorCallback = pipelineErrorCb;

            let statusUpdate = function(key, value) {
				if (value) {

				} else {

				}

                opts.polling.enabled = value;
			};
			ConfigCache.cacheCategoryKey('STATUS', "PIPELINE", statusUpdate)
		};


	}

export { JsonPipe }