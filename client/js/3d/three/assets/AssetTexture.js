import {getJsonByFileName, loadImageAsset} from "../../../application/utils/DataUtils.js";
import {getGroupMesh} from "../../../application/utils/ModelUtils.js";
import {MATH} from "../../../application/MATH.js";
import {CanvasTexture, RepeatWrapping, Texture} from "../../../../../libs/three/Three.Core.js";
import {JsonAsset} from "../../../application/load/JsonAsset.js";

class AssetTexture {
    constructor() {

        let ready = false;

        let settings = {
            assetTexture:this,
            bitmap:null
        }

        let subscribers = [];
        function sendToSubscribers() {
            MATH.callAll(subscribers, settings)
            ready = true;
        }

        function initTx(txName) {
            settings.txName = txName;
            let assetLoaded = function(image) {
                settings.bitmap = image;
            //    console.log("bitmap assetLoaded", image);
                settings.texture = new Texture(image);
                settings.texture.wrapS = RepeatWrapping;
                settings.texture.wrapT = RepeatWrapping;
                settings.texture.flipY = false;
                settings.texture.updateMatrix()
                settings.texture.needsUpdate = true;
                sendToSubscribers();
            }

            let jsonAsset = new JsonAsset(txName);

            function onJson(data) {
                loadImageAsset(data.file, assetLoaded)
            }
            jsonAsset.subscribe(onJson)

        }

        function subscribe(cb) {
            subscribers.push(cb);
            if (settings.bitmap !== null) {
                cb(settings);
            }
        }

        function getTexture() {
            return settings.texture;
        }

        this.call = {
            getTexture:getTexture,
            initTx:initTx,
            subscribe:subscribe
        }

    }

    initAssetTexture(textureFileName) {
        this.call.initTx(textureFileName);
    }

    subscribeToTexture(cb) {
        this.call.subscribe(cb);
    }

}



export {AssetTexture};