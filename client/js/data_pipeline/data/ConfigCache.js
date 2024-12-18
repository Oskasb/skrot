"use strict";
import { GameDataPipeline } from '../GameDataPipeline.js';
import {urlFromIndexEntry} from "../../application/utils/DataUtils.js";
import { MATH } from "../../application/MATH.js";

let reverseMap = {};

function addToReverseMap(configKey, root, folder) {
    if (!reverseMap[configKey]) {
        reverseMap[configKey] = [];
    }
    reverseMap[configKey].push({root:root, folder:folder});
}

class ConfigCache {

    constructor(pipeReadyCB, pipeMsgCB) {
        this.gameDataPipeline = new GameDataPipeline(pipeReadyCB, pipeMsgCB);
        this.pipelineReadyFlag = false;
        this.configs = {
            urls:{}
        };

        this.readyCallbacks = [];
        this.fileReadCallbacks = [];
        this.categories = {};
        this.dataConfigs = {};
        this.images = {};
        this.imageSubs = {};
        this.masterReset = function() {};
        this.progressCallbacks = [];
        this.requestedUrls = [];
        this.loadedUrls = [];
        this.remainingUrls = [];
        this.cacheReads = 0
    }


    pipelineReady = function(bool) {
        this.pipelineReadyFlag = bool;
        if (this.pipelineReadyFlag) {
            for (let i = 0; i < this.readyCallbacks.length; i++) {
                this.readyCallbacks[i]();
            }
            this.readyCallbacks.length = 0;
        }
    };

    getReady = function() {
        return this.pipelineReadyFlag;
    };

    getCacheReads = function() {
        return this.cacheReads;
    };

    resetCacheReads = function() {
        this.cacheReads = 0;
    };

    addReadyCallback = function(cb) {
        this.readyCallbacks.push(cb);
    };

    storeJsonAtUrl = function(json, url) {
        this.gameDataPipeline.storeJson(json, url)
    };


    applyDataPipelineOptions = function(jsonIndexUrl, opts, pipelineReadyCb, pipelineErrorCb, loadInitCB) {
        if (this.fileReadCallbacks.indexOf(loadInitCB) === -1) {
            this.fileReadCallbacks.push(loadInitCB)
        }

        let _this = this;
        let files = {};
        this.configs.files = files;
        let loadFail = function(url, error) {
            console.log("JSON Pipe Fail! ", url, error);
        };

        let indexLoaded = function(url, json) {
        //	console.log("JSON Pipe: ", _this.configs, url, json);

            _this.gameDataPipeline.applyPipelineOptions(opts, pipelineErrorCb, _this);

            let jsonFiles = [];

            for (let key in json) {
            //    if (key !== 'index' || key !== 'synch_list') {
                    let entry = json[key];
                    let format = entry.format;
                    let url = urlFromIndexEntry(key, entry)

                    if (!files[format]) {
                        files[format] = {};
                    }
                    files[format][key] = {url:url, id:key};

                    if (format === 'json') {
                        jsonFiles.push(url);
                    }
             //   }
            }

            pipelineReadyCb(_this.configs);

            let jsonFiledAdded = function(iurl, jsn) {
                //    console.log("JSON File Indexed: ", iurl, jsn);
            };

            if (jsonFiles.length) {

            }

            function preCacheUrl(url) {
                _this.cacheFromUrl(opts.jsonConfigUrl+url, jsonFiledAdded, loadFail);
            }

         //   setTimeout(function() {
                for (let i = 0; i < jsonFiles.length;i++) {
                    preCacheUrl(jsonFiles[i])
                }
          //  }, 100)


        };

        this.cacheFromUrl(jsonIndexUrl, indexLoaded, loadFail);

    };

    addProgressCallback = function(callback) {
        this.progressCallbacks.push(callback)
    };

    removeProgressCallback = function(callback) {
        if (this.progressCallbacks.indexOf(callback) !== -1) {
            this.progressCallbacks.splice(this.progressCallbacks.indexOf(callback), 1)
        }
    };

    setMasterResetFunction = function(callback) {
        this.masterReset = callback;
    };

    storeImageRef = function(id, image) {
        this.notifyUrlReadRequest(image.url);
        this.images[id] = image;
    };

    getImageRef = function(id) {
        return this.images[id];
    };

    addCategory = function(category) {
        this.configs[category] = {};
        this.categories[category] = {
            callbacks:[],
            subscription:{}
        }
    };

    fireCategoryCallbacks = function(key) {
        if (!this.categories[key]) return;
        let _this = this;

        let fireCallbacks = function(callbacks, id, data) {
            for (let i = 0; i < callbacks.length; i++) {
                _this.cacheReads++;
                callbacks[i](id, data);
            }
        };
        fireCallbacks(this.categories[key].callbacks, key, this.configs[key]);
    };

    fireCategoryKeyCallbacks = function(category, key) {
        if (!this.categories[category]) return;

        let _this = this;

        let fireCallbacks = function(callbacks, id, data) {
            for (let i = 0; i < callbacks.length; i++) {
                _this.cacheReads++;
                callbacks[i](id, data);
            }
        };

        if (this.categories[category].subscription[key]) {
            fireCallbacks(this.categories[category].subscription[key], key, this.configs[category][key]);
        }

    };


    combineArrayData(cache, add) {

        for (let i = 0; i < add.length; i++) {

            if (!add[i].id) {
                console.log("Bad array data, no ID:", i, add)
            } else {
                let currentIndex;
                for (let j = 0; j < cache.length; j++) {
                    if (cache[j].id === add[i].id) {
                        currentIndex = j;
                    }
                }

                if (currentIndex === -1) {
                    cache.push(add[i]);
                } else {
                    cache[currentIndex] = add[i];
                }
            }
        }
    };

    combineArray(source, target, idx) {

        let replace = function(t, s, i) {

            if (s.id) {
                for (let j = 0; j < t.length; j++) {
                    if (s.id === t[j].id) {
                        t[j] = s;
                        return true;
                    }
                }
                t.push(s);
            } else {
                t[idx] = s;
            }
        };

        for (let i = 0; i < source.length; i++) {
            replace(target, source[i], i)
        }
    }


    dataCombineToKey = function(key, url, data) {
        if (!this.configs[key]) {
            this.addCategory(key);
        }
        for (let index in data[key]) {

            if (!this.configs[key][index]) {
                this.configs[key][index] = data[key][index];
            } else {
                if (this.configs[key][index] && data[key][index]) {

                    if (this.configs[key][index].length && typeof(this.configs[key][index]) !== 'string') {
                        this.combineArray(data[key][index], this.configs[key][index], index)
                        //    this.configs[key][index] = data[key][index];
                    } else {
                        this.configs[key][index] = data[key][index];
                    }

                } else {
                    this.configs[key][index] = data[key][index];
                }
            }

            this.fireCategoryKeyCallbacks(key, index);
        }

        this.fireCategoryCallbacks(key);
    };

    getBuiltCategoryKeyConfig = function(category, key) {
        let data = this.dataConfigs[category];
        if (!data) return "No data "+category;
        if (!data[key]) return "No entry for key "+key+" in category "+category;
        return data[key];
    };

    getCategory = function(category) {
        let data = this.configs[category];
        if (!data) return "No data "+category;
        return data;
    };

    getConfigKey = function(category, key) {
        let data = this.getCategory(category)[key];
        if(typeof(data) === 'undefined') return key;
        return data;
    };

    registerCategoryKeySubscriber = function(category, key, callback) {
        if (!this.categories[category]) {
            this.addCategory(category);
        }

        if (!this.categories[category].subscription[key]) {
            this.categories[category].subscription[key] = [];
        }


        if (this.categories[category].subscription[key].indexOf(callback) === -1) {
            this.categories[category].subscription[key].push(callback);
        }

    };


    unsubscribeCategoryKey = function(category, key, callback) {
        if (!this.categories[category]) {
            console.log("No Category to unsubscribe from", category)
        }

        if (!this.categories[category].subscription[key]) {
            this.categories[category].subscription[key] = [];
            console.log("Category nas no key to unsubscribe from", category, key)
        }

        this.categories[category].subscription[key].splice(this.categories[category].subscription[key].indexOf(callback), 1);

    };

    removeAllConfigSubscribers =function() {
        for (let category in this.categories) {
            this.categories[category].callbacks = [];
            let subs = this.categories[category].subscription;
            for (let sub in subs) {
                subs[sub] = [];
            }
        }
    }

    registerCategoryUpdatedCallback = function(category, callback) {
        if (!this.categories[category]) {
            ConfigCache.addCategory(category);
        }
        this.categories[category].callbacks.push(callback);
        return this.configs[category];
    };

    subscribeToCategoryKey = function(category, key, callback) {
        let data = this.getConfigKey(category, key);
        if (data != key) {
            //    console.log("reject string", data)
            this.cacheReads++;
            callback(key, data);
        }
        this.registerCategoryKeySubscriber(category, key, callback);
    };

    cacheCategoryKey = function(category, key, callback) {
        let data = this.getConfigKey(category, key);
        if (data !== key) {
            //    console.log("reject string", data)
            this.cacheReads++;
            callback(key, data);

         //   this.unsubscribeCategoryKey(category, key, callback)
        }
        this.registerCategoryKeySubscriber(category, key, callback);
    };

    registerImageSub = function(subscriberId, imageId, callback) {
        if (!this.imageSubs[imageId]) this.imageSubs[imageId] = {};
        this.imageSubs[imageId][subscriberId] = callback
    };

    subscribeToImageId = function(subscriberId, imageId, callback) {
        let data = ConfigCache.getImageRef(imageId);

        if (data) {
            if (data.loaded) {
                this.cacheReads++;
                callback(imageId, data);
            }
        }

        ConfigCache.registerImageSub(subscriberId, imageId, callback);
    };

    imageDataLoaded = function(id) {
        ConfigCache.notifyUrlReceived(ConfigCache.getImageRef(id).url);
        if (!this.imageSubs[id]) return;
        for (let sub  in this.imageSubs[id]) {
            this.imageSubs[id][sub](id, ConfigCache.getImageRef(id))
        }
    };

    notifyLoadStateChange = function() {
        for (let i = 0; i < this.progressCallbacks.length; i++) {
            this.progressCallbacks[i](this.requestedUrls.length, this.remainingUrls.length, this.loadedUrls.length, this.remainingUrls)
        }
        //	console.log("CacheState, Requested:", requestedUrls.length, "Remaining:",remainingUrls.length, "Loaded:",loadedUrls.length)
    };

    notifyUrlReadRequest = function(url) {
        if (this.requestedUrls.indexOf(url) === -1) {
            this.requestedUrls.push(url);
            this.remainingUrls.push(url);
            this.notifyLoadStateChange();
        }

    };

    notifyUrlReceived = function(url) {
        if (this.remainingUrls.indexOf(url) !== -1) {
            this.remainingUrls.splice(this.remainingUrls.indexOf(url), 1);
        }

        if (this.loadedUrls.indexOf(url) === -1) {
            this.loadedUrls.push(url);

        }
        this.notifyLoadStateChange();
    };


    cacheFromUrl = function(url, success, fail) {
        this.notifyUrlReadRequest(url);
        let _this = this;
        let onLoaded = function(remoteUrl, data) {
            _this.notifyUrlReceived(remoteUrl);
            _this.configs.urls[remoteUrl] = data;
            for (let i = 0; i < data.length; i++) {
                for (let key in data[i]) {
                    _this.dataCombineToKey(key, url, data[i]);
                }
            }
            success(remoteUrl, data)
        };
        MATH.callAll(this.fileReadCallbacks, "Request init:",url)
        this.gameDataPipeline.loadConfigFromUrl(url, onLoaded, fail);
    };


    cacheImageFromUrl = function(url, success, fail) {
        let _this = this;
        _this.notifyUrlReadRequest(url);
        let onLoaded = function(remoteUrl, svgData) {
            _this.notifyUrlReceived(remoteUrl);
            success(remoteUrl, svgData)
        };

        this.gameDataPipeline.loadImageFromUrl(url, onLoaded, fail);
    };


    loadBundleMaster = function(path, goo, masterUrl, assetUpdated, fail, notifyLoaderProgress) {

    };

    combineEntities = function(entityList, combineDone) {

    };

    getCachedConfigs = function() {
        return this.configs;
    };

    registerPollUrl = function(url) {
        this.gameDataPipeline.registerUrlForPoll(url);
    };

    removePollUrl = function(url) {
        this.gameDataPipeline.removeUrlFromPoll(url);
    };

    tickConfigCache = function(tpf) {
        this.gameDataPipeline.tickDataLoader(tpf);
    };

    removeAllPipelinePollUrls() {
        this.gameDataPipeline.jsonPipe.pollIndex = [];
        this.gameDataPipeline.imagePipe.pollIndex = [];
    };

    requestJsonFile(file, onOk, onFail) {
        this.gameDataPipeline.jsonPipe.loadJsonFromUrl(file, onOk, onFail)
    }
}

export { ConfigCache }