class PipelineObject {

        constructor(category, key, onDataCallback) {

            this.category = category;
            this.key = key;
            this.data = {};
            this.configs = {};
            this.subscribe(onDataCallback)
        };


        subscribe = function(onDataCallback) {


            let dataCallback = function(src, data) {

                    this.data = data;
                    if (typeof(onDataCallback) === 'function') {
                        onDataCallback(src, data);
                    }

            }.bind(this);

            this.dataCallback = dataCallback;

            PipelineAPI.cacheCategoryKey(this.category, this.key, dataCallback);

        };

        buildConfig = function(dataName) {

            if (!dataName) dataName = 'data';

            this.data = PipelineAPI.readCachedConfigKey(this.category, this.key);
            this.configs = {};

            if (this.data.length) {
                for (let i = 0; i < this.data.length; i++) {
                    this.configs[this.data[i].id] = this.data[i][dataName];
                }
            } else {
                console.log("Data not Array Type", this.category, this.key, this.data)
            }

            return this.configs;
        };

        setData = function(data) {
            PipelineAPI.setCategoryKeyValue(this.category, this.key, data);
        };

        getElementId = function(id) {
            this.data = PipelineAPI.readCachedConfigKey(this.category, this.key);
            this.configs = {};

            if (this.data.length) {
                for (let i = 0; i < this.data.length; i++) {
                    this.configs[this.data[i].id] = this.data[i];
                }
            } else {
                console.log("Data not Array Type", this.category, this.key, this.data)
            }
        };

        getConfigs = function() {
            return this.configs;
        };

        readData = function() {
            return PipelineAPI.readCachedConfigKey(this.category, this.key);
        };

        removePipelineObject = function() {
            return PipelineAPI.removeCategoryKeySubscriber(this.category, this.key, this.dataCallback);
        };

    }

export { PipelineObject }