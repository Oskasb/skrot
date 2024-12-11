"use strict";
import { DataWorker } from '../DataWorker.js';
import { ENUMS } from "../../application/ENUMS.js";

class ImagePipe {

        constructor(pipeReadyCB, pipelineMessageCB) {
            this.dataWorker = new DataWorker(ENUMS.Worker.IMAGE_PIPE, pipeReadyCB, pipelineMessageCB);
        }


		pollDelay = 1;
		pollCountdown = this.pollDelay;
		loadedData = {};
		lastPolledIndex = 0;
		pollIndex = [];
		pollCallbacks = {};

		options = {
			"polling":{
				"enabled":false,
				"frequency":1
			}
		};

		registerPollCallback = function(url, onUpdateCallback) {
			if (!this.pollCallbacks[url]) {
                this.pollCallbacks[url] = [];
			}
            this.pollCallbacks[url].push(onUpdateCallback);
            this.pollIndex.push(url);
		};

        pollUrl = function(url) {
        	if (!this.pollCallbacks[url]) return;
            if (this.pollIndex.indexOf(url) === -1) {
                this.pollIndex.push(url);
            }
        };

        removeUrlPoll = function(url) {
            if (this.pollIndex.indexOf(url) !== -1) {
                this.pollIndex.splice(pollIndex.indexOf(url));
            }
        };


        callUrlCallbacks = function(url, img) {

     //       console.log(url, pollCallbacks)

            for (var i = 0; i < this.pollCallbacks[url].length; i++) {
                this.pollCallbacks[url][i](url, img);
            }

            this.loadedData[url] = img;
        };

		storeData = function(url, svg, success) {
            this.loadedData[url] = svg;
			success(url, svg);
		};

		loadImage = function(url, dataUpdated, fail) {

			let _this = this;

			var onLoaded = function(img, fileUrl) {
                _this.callUrlCallbacks(fileUrl, img);

			};

			var onWorkerOk = function(resUrl, res) {
				onLoaded(res, resUrl);
			};
			var onWorkerFail = function(res) {
				console.error("Worker error: ", res)
			};

            this.dataWorker.fetchBinaryData(url, onWorkerOk, onWorkerFail);
		};

		tickImagePipe = function(tpf) {
			if (!this.options.polling.enabled) return;
            this.pollDelay = 1/this.options.polling.frequency;
            this.pollCountdown -= this.pollIndex.length*tpf/(this.pollIndex.length+1);
			if (this.pollCountdown < 0) {
                this.lastPolledIndex += 1;
				if (this.lastPolledIndex >= this.pollIndex.length) {
                    this.lastPolledIndex = 0;
				}
				var pollFail = function(err) {
					console.error("Image Polling failed", err);
				};

                this.loadImage(this.pollIndex[this.lastPolledIndex], this.pollCallbacks[this.pollIndex[this.lastPolledIndex]], pollFail, false)
                this.pollCountdown = this.pollDelay;
			}
		};

		setImagePipeOpts = function(opts) {
			this.options = opts;
		};


}

export { ImagePipe }