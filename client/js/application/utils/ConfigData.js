import {pipelineAPI} from "./DataUtils.js";


let dataIdMap = {};
let configKeyMap = {}

function addToReverseMap(configKey, root, folder) {
    if (!configKeyMap[configKey]) {
        configKeyMap[configKey] = [];
    }
    configKeyMap[configKey].push({root:root, folder:folder});
}


class ConfigData {
    constructor(root, folder, dataId, dataKey, configKey, onReady) {
        this.root = root;
        this.folder = folder;

        this.dataId = dataId;
        this.dataKey = dataKey;
        this.configKey = configKey;

        this.config = null;
        this.data = {};
        this.updateCount = 0;

        this.onUpdateCallbacks = []

        if (typeof (configKey) === 'string') {
            addToReverseMap(configKey, root, folder)
        }

        if (dataId) {
            dataIdMap[dataId] = {root:root, folder:folder};
            return;
        }


        let postInit = function(data) {
            if (typeof(onReady) === 'function') {
                onReady(this.config)
            }
            MATH.callAll(this.onUpdateCallbacks, this.config);
        }.bind(this);
        let onDataCb = function(data) {
            setTimeout(function() { postInit(data), 0 })
        };

        let onConfig = function(src, data) {
            this.config = data;
            onDataCb(data);
        }.bind(this);

        pipelineAPI.cacheCategoryKey(this.root, this.folder, onConfig)
    };

    addUpdateCallback = function(callback) {
        this.onUpdateCallbacks.push(callback)
    }
    parseConfig(parseKey, onUpdate) {
        let updateCount = 0;
        let onDataCb = function(data) {
            if (typeof(this.configKey) === 'string') {
                data = this.parseConfigData()[parseKey].data;

                let config = MATH.getFromArrayByKeyValue(data, this.dataKey, this.dataId)[this.configKey];
                onUpdate(config, updateCount)
            } else {
            //    console.log("parseConfig without configKey set is not right", this);
                if (typeof (onUpdate) === 'function') {
                    onUpdate(data, updateCount);
                }
            }
            updateCount++
        }.bind(this);

        let onConfig = function(src, data) {
            this.config = data;

            onDataCb(data);
        }.bind(this);

        pipelineAPI.cacheCategoryKey(this.root, this.folder, onConfig)

    }

    fetchData = function(dataId) {
        let dataUpdate = function(src, data) {
             for (let key in data) {
                this.data[key] = data[key];
            }
        }.bind(this);

        pipelineAPI.fetchConfigData(this.root, this.folder, dataId, dataUpdate);
    };

    readDataKey = function(dataKey) {
        return this.data[dataKey];
    };

    parseConfigData = function(data) {
        let config = {};

        if (!data) {
            data = this.config;
        }

        for (let i = 0; i < data.length;i++) {
            config[data[i].id] = data[i];
        }
        return config;
    };


    reapplyDataToConfig(data, config, dataId) {
        let applyData = function(conf, data) {
            for (let key in data) {
                conf[key] = data[key]
            }
        }

        for (let i = 0; i < data.length;i++) {
            if (data[i].id === dataId) {
                applyData(config, data[i].data);
            }
        }
    }

    readConfigKey = function(dataKey) {
        return this.config[dataKey];
    };
    getConfigKeyMap() {
        return configKeyMap;
    }
}

export { ConfigData }