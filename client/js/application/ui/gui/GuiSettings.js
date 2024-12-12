import {pipelineAPI} from "../../utils/DataUtils.js";

class GuiSettings {

    constructor() {
        this.sprites = {};
        this.textLayouts = {};
        this.settings = {
            sprites:this.sprites,
            textLayouts:this.textLayouts
        };
    //    console.log("GUI SETTINGS: ", this.settings)

        let settings = this.settings;

        let fetchSetting = function(conf, key, dataId, cb) {

            if (!settings[key]) {
                settings[key] = {};
            }

            if (!settings[key][dataId]) {
                settings[key][dataId] = {};
            }


                let settingUpdate = function(src, data) {

                    for (let i = 0; i < data.length; i ++) {
                        settings[key][src][data[i].id] = data[i];
                    }
                    //        console.log("SETTING:", src, settings);
                    cb(src, settings[key][src]);
                };

            pipelineAPI.fetchConfigData(conf, key, dataId, settingUpdate);


        };

        this.calls = {
            fetchSetting:fetchSetting,
        }

    };


    initGuiSprite = function(key, dataId) {
        let sprites = this.settings.sprites;

        let dataSprites = function(src, data) {

            if (typeof (data) === 'undefined') {
                console.log("Bad data fetch;", src);
                return;
            }

            sprites[src] = {};
            for (let i = 0; i < data.length; i ++) {
                sprites[src][data[i].id] = [data[i].tiles[0][0], data[i].tiles[0][1]]
            }
        //        console.log("GUI SPRITES:", sprites[src]);
        };

        pipelineAPI.fetchConfigData("ASSETS", key, dataId, dataSprites);

    };


    loadUiConfig = function(key, dataId, cb) {
        this.calls.fetchSetting("UI", key, dataId, cb)
    };


    initGuiSettings = function(UI_SYSTEMS, onGuiSetting) {

        let settings = this.settings;


        let systemDataCb = function(src, data) {
            onGuiSetting(src, data['gui_buffer']);
        };

        for (let i = 0; i < UI_SYSTEMS.length; i++) {
            this.calls.fetchSetting("UI", "UI_SYSTEMS", UI_SYSTEMS[i], systemDataCb)
        }

    };


    getUiSprites = function(key) {
        return this.sprites[key];
    };

    getSettingConfig = function(setting, configId) {
        return this.settings[setting][configId];
    };

    getSettingData = function(setting, configId, dataId) {
        return this.settings[setting][configId][dataId];
    };

    getSettingDataConfig = function(setting, configId, dataId) {

        if (!this.settings[setting]) {
            console.log("Bad setting: ", setting);
            return;
        }

        if (!this.settings[setting][configId]) {
            console.log("Bad settings configId: ", setting, configId);
            return;
        }

        if (!this.settings[setting][configId][dataId]) {
            console.log("Bad settings lookup: ", setting, configId, dataId);
            return;
        }
        return this.settings[setting][configId][dataId].config;
    };

}

export { GuiSettings }