import {getJsonByFileName} from "../../../application/utils/DataUtils.js";
import {MATH} from "../../../application/MATH.js";

class ModelAsset {
    constructor() {
        let settings = {}
        let subscribers = [];

        let ready = false;

        let loadCalls = [];

        let root = null;
        let children = [];

        function instantiate() {

        }

        function sendToSubscribers() {
            MATH.callAll(subscribers, instantiate())
        }

        function initAsset(modelFileName) {
            settings.modelFileName = modelFileName;
            let json = getJsonByFileName(modelFileName);
            console.log("modelJson", json);

            let assets = json.assets;

            for (let i = 0; i < assets.length; i++) {

            }

            // let children = json.children;
        }

        function subscribe(cb) {
            subscribers.push(cb);
            if (ready === true) {
                cb(instantiate());
            }
        }

        this.call = {
            initAsset:initAsset,
            subscribe:subscribe
        }

    }

    initModelAsset(modelFileName) {
        this.call.initAsset(modelFileName);

    }

    subscribeToModel(callback) {
        this.call.subscribe(callback);
    }

}

export { ModelAsset }