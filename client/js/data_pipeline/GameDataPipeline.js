"use strict";

import { JsonPipe } from './pipes/JsonPipe.js';
import { ImagePipe } from './pipes/ImagePipe.js';

class GameDataPipeline {

		constructor(pipeReady, pipeMsgCB) {
			this.jsonPipe = new JsonPipe(pipeReady, pipeMsgCB);
            this.imagePipe = new ImagePipe(pipeReady, pipeMsgCB);
		}

		loadConfigFromUrl = function(url, dataUpdated, fail) {
            this.jsonPipe.loadJsonFromUrl(url, dataUpdated, fail)
		};

		storeJson = function(json, url) {
            this.jsonPipe.saveJsonToUrl(json, url)
		};


		loadImageFromUrl = function(url, dataUpdated, fail) {
            this.imagePipe.registerPollCallback(url, dataUpdated);
            this.imagePipe.loadImage(url, dataUpdated, fail)
		};


		tickDataLoader = function(tpf) {
            this.jsonPipe.tickJsonPipe(tpf);
            this.imagePipe.tickImagePipe(tpf);
		};

		applyPipelineOptions = function(opts, pipelineErrorCb, ConfigCache) {
            this.jsonPipe.setJsonPipeOpts(opts.jsonPipe, pipelineErrorCb, ConfigCache);
            this.imagePipe.setImagePipeOpts(opts.imagePipe, pipelineErrorCb);
		};

        registerUrlForPoll = function(url) {
            this.jsonPipe.pollUrl(url);
        };


        registerImageUrlForPoll = function(url) {
            this.imagePipe.pollUrl(url);
        };

        removeUrlFromPoll = function(url) {
            this.jsonPipe.removeUrlPoll(url);
            this.imagePipe.removeUrlPoll(url);
        };


	}

export { GameDataPipeline }