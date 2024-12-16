import {MeshStandardMaterial} from "../../../../../libs/three/materials/Materials.js";
import {getJsonByFileName} from "../../../application/utils/DataUtils.js";
import {MATH} from "../../../application/MATH.js";
import {loadAsset, loadAssetTexture} from "../../../application/utils/AssetUtils.js";

let mats = 0;
let materials = {};
materials['MeshStandardMaterial'] = MeshStandardMaterial;
class ModelMaterial {
    constructor() {
        let settings = {
            modelMaterial:this,
            fileName:""
        };
        mats++
        let ready = false;
        let subscribers = [];

        let txLoads = [];

        function materialLoaded() {
            console.log("materialLoaded", settings.fileName);
            MATH.callAll(subscribers, settings);
            ready = true;
        }



        function addSlotTexture(slot, tx) {

            txLoads.push(tx);

            function txCB(assetTx) {
            //    console.log("assetTx:", assetTx, assetTx.texture);
                MATH.splice(txLoads, assetTx.txName);

                if (slot === 'aoMap') {
                    assetTx.texture.channel = 1;
                }

                settings.material[slot] = assetTx.texture;
                if (txLoads.length === 0) {
                    settings.material.needsUpdate = true;
                    materialLoaded()
                }
            }

            loadAssetTexture(tx, txCB);
        }

        function initMaterial(name) {
            let json = getJsonByFileName(name);
            console.log("material JSON", mats, json);
            settings.fileName = name;
            settings.material = new materials[json.material]();

            if (json.settings) {

                let mat = settings.material;
                let matSettings = json.settings
                for (let key in matSettings) {
                    let values = matSettings[key];
                    if (typeof mat[key] === 'object') {
                        for (let element in values) {
                            if (typeof (mat[key][element]) === 'undefined') {
                                console.log("No element for", mat[key], key, element)
                            } else {
                                mat[key][element] = values[element];
                            }
                                                   }
                    } else {
                        mat[key] = values;
                    }
                }
            }

            if (json.textures) {
                for (let i= 0; i < json.textures.length; i++ ) {
                    let slot = json.textures[i].slot;
                    let tx = json.textures[i].tx;
                    addSlotTexture(slot, tx)
                }
            } else {
                materialLoaded()
            }


        }

        function subscribe(cb) {
            subscribers.push(cb);
            if (ready === true) {
                cb(settings);
            }
        }

        this.call = {
            initMaterial:initMaterial,
            subscribe:subscribe
        }

    }

    initModelMaterial(materialFileName) {
        this.call.initMaterial(materialFileName);
    }

    subscribeToMaterial(callback) {
        this.call.subscribe(callback);
    }


}




export { ModelMaterial };