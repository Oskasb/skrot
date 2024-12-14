import {loadModelAsset} from "../../../application/utils/DataUtils.js";
import {MATH} from "../../../application/MATH.js";

class ModelGeometry{
    constructor() {
        let settings = {};
        let subscribers = [];

        let geometry = null;

        function sendToSubscribers() {
            MATH.callAll(subscribers, geometry)
        }

        function initGeometry(fileGlb) {
            settings['fileGlb'] = fileGlb;
            geometry = null;

            let assetLoaded = function(model) {
                console.log("assetLoaded", model);
                geometry = model;
                sendToSubscribers();
            }

            loadModelAsset(fileGlb, assetLoaded)
        }

        function subscribe(cb) {
            subscribers.push(cb);
            if (geometry !== null) {
                cb(geometry);
            }
        }

        this.call = {
            initGeometry: initGeometry,
            subscribe:subscribe
        }

    }

    initModelGeometry(fileGlb) {
        this.call.initGeometry(fileGlb);
    }

    subscribeToGeometry(callback) {
        this.call.subscribe(callback);
    }


}

export {ModelGeometry};