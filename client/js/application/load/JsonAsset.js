import {getJsonUrlByFileName, loadJsonFile, pipeMsgCB, pipeMsgLoadInitCB} from "../utils/DataUtils.js";
import {MATH} from "../MATH.js";


class JsonAsset {
    constructor(name) {
        this.url = getJsonUrlByFileName(name);
        this.name = name;
        this.json = null;

        this.subscribers = [];

        let onDataUpdated = function(url,data) {
            this.json = data;
        //    console.log("Json Data Updated", url, data)
            pipeMsgCB('load OK', 'json', this.name+'.json')
            MATH.callAll(this.subscribers, this.json)
        }.bind(this);

        this.call = {
            onDataUpdated:onDataUpdated
        }

        this.loadJsonAsset();
    }

    loadJsonAsset() {
        pipeMsgLoadInitCB('load json', this.name+'.json');
        loadJsonFile(this.url, this.call.onDataUpdated)
    }

    subscribe(callback) {
        this.subscribers.push(callback);
        if (this.json !== null) {
            console.log("Already loaded", this.json)
            callback(this.json);
        }
    }

}

export {JsonAsset}