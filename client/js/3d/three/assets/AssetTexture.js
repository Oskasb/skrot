import {getJsonByFileName, loadImageAsset} from "../../../application/utils/DataUtils.js";
import {getGroupMesh} from "../../../application/utils/ModelUtils.js";
import {MATH} from "../../../application/MATH.js";
import {CanvasTexture, RepeatWrapping, Texture} from "../../../../../libs/three/Three.Core.js";
import {JsonAsset} from "../../../application/load/JsonAsset.js";
import {jsonAsset} from "../../../application/utils/AssetUtils.js";

class AssetTexture {
    constructor(textureFileName) {

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
            //    settings.texture.preload()
                settings.texture.generateMipmaps = false;
                sendToSubscribers();
            }


            function onJson(data) {
                loadImageAsset(data.file, assetLoaded)
            }
            jsonAsset(txName, onJson);


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

        if (typeof (textureFileName) === "string") {
            initTx(textureFileName);
        }

    }

    initAssetTexture(textureFileName) {
        this.call.initTx(textureFileName);
    }

    subscribeToTexture(cb) {
        this.call.subscribe(cb);
    }

    subscribe(cb) {
        his.call.subscribe(cb);
    }

}



export {AssetTexture};