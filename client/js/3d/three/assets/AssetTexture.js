import {getJsonByFileName, loadImageAsset} from "../../../application/utils/DataUtils.js";
import {getGroupMesh} from "../../../application/utils/ModelUtils.js";
import {MATH} from "../../../application/MATH.js";
import {CanvasTexture, RepeatWrapping, Texture} from "../../../../../libs/three/Three.Core.js";

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

            let json = getJsonByFileName(txName);

            loadImageAsset(json.file, assetLoaded)
        }

        function subscribe(cb) {
            subscribers.push(cb);
            if (settings.bitmap !== null) {
                cb(settings.assetTexture);
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