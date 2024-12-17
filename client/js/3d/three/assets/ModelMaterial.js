import {MeshPhysicalMaterial, MeshStandardMaterial} from "../../../../../libs/three/materials/Materials.js";
import {getJsonByFileName, getJsonUrlByFileName} from "../../../application/utils/DataUtils.js";
import {MATH} from "../../../application/MATH.js";
import {loadAsset, loadAssetTexture} from "../../../application/utils/AssetUtils.js";
import {JsonAsset} from "../../../application/load/JsonAsset.js";
import * as constants from "../../../../../libs/three/constants.js";

let mats = 0;
let materials = {};
materials['MeshStandardMaterial'] = MeshStandardMaterial;
materials['MeshPhysicalMaterial'] = MeshPhysicalMaterial;
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
            settings.material.needsUpdate = true;
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

                    materialLoaded()
                }
            }

            loadAssetTexture(tx, txCB);
        }

        function initMaterial(name) {

            let jsonAsset = new JsonAsset(name);

            function onJsonLoaded(data) {
                console.log("material JSON", name, data);
                settings.fileName = name;

                if (data.settings) {
                    settings.material = new materials[data.material]();
                    let mat = settings.material;
                    let matSettings = data.settings
                    for (let key in matSettings) {
                        let values = matSettings[key];

                        if (typeof (values) === "string") {
                            mat[key] = constants[values];
                        } else {
                            if (typeof mat[key] === 'object') {
                                for (let element in values) {
                                    if (mat[key] === null) {

                                    }
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
                }

                if (data.textures) {
                    for (let i= 0; i < data.textures.length; i++ ) {
                        let slot = data.textures[i].slot;
                        let tx = data.textures[i].tx;
                        addSlotTexture(slot, tx)
                    }
                } else {
                    materialLoaded()
                }
            }

            jsonAsset.subscribe(onJsonLoaded)

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