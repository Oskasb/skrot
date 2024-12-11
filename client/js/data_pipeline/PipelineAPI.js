import { ConfigCache } from './data/ConfigCache.js';
import { ExpandingPool} from "../application/utils/ExpandingPool.js";

class PipelineAPI {
    constructor() {
        this.configCache = null;
        this.pipeOptions = {};
        this.expandingPools = {};
    };

    addExpandingPool = function(dataKey, createFuntcion) {
        if(!this.expandingPools[dataKey]) {
            this.expandingPools[dataKey] = new ExpandingPool(dataKey, createFuntcion);
        }
        return this.expandingPools[dataKey];
    };

    initConfigCache = function(pipeReadyCB, pipeMsgCB) {
        this.configCache = new ConfigCache(pipeReadyCB, pipeMsgCB)
    };

    addReadyCallback = function(cb) {
        this.configCache.addReadyCallback(cb);
    };

    checkReadyState = function() {
        return this.configCache.getReady();
    };

    addProgressCallback = function(callback) {
        this.configCache.addProgressCallback(callback);
    };

    removeProgressCallback = function(callback) {
        this.configCache.removeProgressCallback(callback);
    };

    readCachedConfigKey = function(category, key) {
        return this.configCache.getConfigKey(category, key)
    };

    subscribeToCategoryUpdate = function(category, onDataCallback) {
        return this.configCache.registerCategoryUpdatedCallback(category, onDataCallback)
    };

    cacheCategoryKey = function(category, key, onDataCallback) {
        this.configCache.cacheCategoryKey(category, key, onDataCallback)
    };

    removeCategoryKeySubscriber = function(category, key, onDataCallback) {
        this.configCache.unsubscribeCategoryKey(category, key, onDataCallback)
    };

    removeAllSubscribers = function() {
        this.configCache.removeAllConfigSubscribers()
    };

    removeAllPollFiles = function() {
        this.configCache.removeAllPipelinePollUrls()
    };

    meshCombineEntityList = function(entityList, combineDone) {
        this.configCache.combineEntities(entityList, combineDone);
    };

    subscribeToConfigUrl = function(url, success, fail) {
        this.configCache.cacheFromUrl(url, success, fail)
    };

    cacheSvgFromUrl = function(url, success, fail) {
        this.configCache.cacheSvgFromUrl(url, success, fail)
    };

    cacheImageFromUrl = function(url, success, fail) {
        this.configCache.cacheImageFromUrl(url, success, fail)
    };

    subscribeToImage = function(subscriberId, imageId, callback) {
        this.configCache.subscribeToImageId(subscriberId, imageId, callback)
    };

    getCachedConfigs = function() {
        return this.configCache.getCachedConfigs();
    };

    storeDataKey = function(data, dataKey) {
        for (let key in data[dataKey]) {
            PipelineAPI.setCategoryData(key, data[dataKey][key]);
        }
    };

    saveJsonFileOnServer = function(jsonData, url) {
        console.log("Save Json to Server", url, [jsonData]);
        this.configCache.storeJsonAtUrl(jsonData, url);
    };

    setCategoryData = function(category, data) {
        let store = {};

        store[category] = data;
        return this.configCache.dataCombineToKey(category, 'local', store);
    };

    setCategoryKeyValue = function(category, key, value) {
        let store = {};

        store[category] = {};
        store[category][key] = value;
        return this.configCache.dataCombineToKey(category, 'local', store);
    };

    dataPipelineSetup = function(jsonIndexUrl, options, pipelineReady, pipelineError) {
        for (let key in options) {
            this.pipeOptions[key] = options[key];
        }
        this.configCache.applyDataPipelineOptions(jsonIndexUrl, options, pipelineReady, pipelineError);
    };

    prunePollUrlsExceptFor = function(urlList) {
        this.configCache.gameDataPipeline.jsonPipe.pruneUrlsExceptFor(urlList)
    }

    pollFileUrl = function(url) {
        this.configCache.registerPollUrl(url);
    };

    fetchConfigData = function(configId, key, dataId, callback) {
    //    console.log("Fetch data ", configId, key, dataId)
        let configs = this.getCachedConfigs();

        let data = configs[configId][key]

        for (let i = 0; i < data.length; i ++) {
            if (data[i].id === dataId) {
                callback(dataId, data[i].data)
                return;
            }

        }
        console.log("No data for:", configId, key, dataId)


    }

    cancelFileUrlPoll = function(url) {
        this.configCache.removePollUrl(url);
    };

    getPipelineOptions = function(key) {
        return pipeOptions[key];
    };

    sampleCacheReadCount = function() {
        let reads = this.configCache.getCacheReads();
        this.configCache.resetCacheReads();
        return reads;
    };

    tickPipelineAPI = function(tpf) {
        this.configCache.tickConfigCache(tpf);
    };


}
export { PipelineAPI };