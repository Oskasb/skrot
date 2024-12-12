import { DomLoadScreen } from '../ui/dom/DomLoadScreen.js';
import { AssetLoader } from './AssetLoader.js';
import {loadVariationConfigs} from "../utils/ConfigUtils.js";
import {initLocalDB} from "../setup/Database.js";
import {pipelineAPI} from "../utils/DataUtils.js";

let notifyProgress;

class DataLoader {
    constructor() {
        this.loadStates= {
            SHARED_FILES:'SHARED_FILES',
            CONFIGS:'CONFIGS',
            THREEDATA:'THREEDATA',
            IMAGES:'IMAGES',
            COMPLETED:'COMPLETED'
        };

        this.loadState = this.loadStates.SHARED_FILES;
        this.loadProgress = new DomLoadScreen();
        this.assetLoader = new AssetLoader();

        notifyProgress = function(progress, msg, channel) {
            if (progress) {
                this.loadProgress.setProgress(progress);
            }
            if (msg) {
                this.loadProgress.logMessage(msg, null, channel);
            }
        }.bind(this)

        let progEvt = function(evt) {
            notifyProgress(evt.progress, evt.msg, evt.channel)
        }

        let loadCompleted = function(evt) {
            this.loadProgress.removeProgress();
        }.bind(this);

        evt.on(ENUMS.Event.NOTIFY_LOAD_PROGRESS, progEvt)
        evt.on(ENUMS.Event.NOTIFY_LOAD_COMPLETED, loadCompleted)
    }

    loadDataAsset = function(assetType, assetId, callback) {
        this.assetLoader.loadAsset(assetType, assetId, callback)
    };

    getLoadScreen = function() {
        return this.loadProgress
    };

        getStates = function() {
            return this.loadStates;
        };

        setupPipelineCallback = function(loadStateChange) {

        };

        loadData = function(dataPipelineSetup, onPipelineReadyCallback, onErrorCallback) {


            let _this = this;
            let loadScreen = _this.getLoadScreen();
            let loadStates = _this.loadStates;
            let loadingCompleted = function() {
                if (done) return;
                onPipelineReadyCallback('Loading Completed');
                done = true;
            };

            let loadStateChange = function(state) {
                //    console.log('loadStateChange', state)
                notifyProgress(null, 'Load State: '+state);
                if (state === _this.getStates().IMAGES) {

                }

                if (state === _this.getStates().COMPLETED) {
                    _this.loadState = _this.loadStates.THREEDATA;
                    loadingCompleted()
                }

            };

            let assetCount = 0;

            let done = false;
            function pipelineCallback(started, remaining, loaded, files) {
            //     console.log("SRL", _this.loadState, started, remaining, loaded, [files]);
                if (done) {
                    notifyProgress(loaded / started, 'Pipeline done');
                    return;
                }
                pipelineAPI.setCategoryKeyValue("STATUS", "FILE_CACHE", loaded);

                notifyProgress(loaded / started);

                if (_this.loadState === loadStates.THREEDATA && remaining === 0) {
                    //    console.log( "loadThreeData:", _this.loadState, started, remaining, loaded, [files]);
                    //   loadState = loadStates.COMPLETED;
                    notifyProgress(null, 'THREEDATA Done');
                    loadStateChange(loadStates.COMPLETED);

                }



                if (_this.loadState === loadStates.CONFIGS && remaining === 0) {
                 //   console.log( "json cached:", PipelineAPI.getCachedConfigs());

                remaining++

                    let loadCallback = function(asset) {
                //        console.log("requestAsset returns: ", asset)
                        assetCount--
                        remaining--
                        notifyProgress(null, asset.id, 'pipeline_message');
                        if (!assetCount) {
                            _this.loadState = loadStates.COMPLETED;
                            remaining--
                            notifyProgress(null, 'Assets Done');
                            setTimeout(function() {
                                if (done) {
                                    notifyProgress(null, 'Assets Done', 'pipeline_message');
                                    return;
                                }
                                loadStateChange(_this.loadState);
                            }, 20)

                        }
                    };

                    let subCallback = function(src, data) {
                        if (done) return;
                        for (let i = 0; i < data.length; i++) {
                            assetCount++
                            remaining++
                            client.dynamicMain.requestAsset(data[i], loadCallback)
                        }
                    };

                    let filesCallback = function(src, data) {
                        if (done) {
                            notifyProgress(null, 'Files Done');
                            return;
                        }
                        notifyProgress(null, src, 'pipeline_message');
                    //    console.log("Preload Files: ", data);
                        let loadCB = function(msg) {
                        //    console.log("Preload Asset: ", msg)
                            notifyProgress(null, msg);
                            assetCount--
                            remaining--
                        };

                        for (let i = 0; i < data.length; i++) {

                            assetCount++
                            remaining++
                            ThreeAPI.loadThreeAsset('FILES_GLB_', data[i], loadCB)
                        }

                        pipelineAPI.cacheCategoryKey("ASSETS", "LOAD_MODELS", subCallback);

                    };

                    pipelineAPI.cacheCategoryKey("ASSETS", "PRELOAD_FILES", filesCallback);



                }

                if (_this.loadState === loadStates.SHARED_FILES && remaining === 0) {
                //    console.log( "shared loaded....");
                    _this.loadState = loadStates.CONFIGS;
                    _this.assetLoader.initAssetConfigs();

                    ThreeAPI.initThreeLoaders(_this.assetLoader);
                //    ThreeAPI.loadThreeData();
                    let apiReadyCB = function(msg) {
                        notifyProgress(null, 'Fx: '+msg);
                     //   console.log('initEffectAPI', msg)
                    }
                    EffectAPI.initEffectAPI(apiReadyCB)
                    setTimeout(function() {
                        loadStateChange(_this.loadState);
                    }, 20)

                }
            }

            pipelineAPI.addProgressCallback(pipelineCallback);

            let onPipelineInitCallback = function(configCache) {
                window.CONFIGS = configCache.configs;
                console.log("CONFIGS:", configCache.configs)
                loadVariationConfigs();
                initLocalDB();
                notifyProgress(null, 'Init Loading');
            };

            pipelineAPI.dataPipelineSetup(dataPipelineSetup.jsonRegUrl, dataPipelineSetup, onPipelineInitCallback, onErrorCallback);

            _this.setupPipelineCallback(loadStateChange);

        };

        notifyCompleted = function() {

            let pollUrls = pipelineAPI.getCachedConfigs()['ASSETS']['POLL_INDEX'];
            pipelineAPI.prunePollUrlsExceptFor(pollUrls)

            let apiReadyCB = function(msg) {
                notifyProgress(null, 'GUI: '+msg);
        //        console.log(msg)
            }
            GuiAPI.initGuiApi(apiReadyCB)
            client.activateGui();
        };
    }

export { DataLoader }