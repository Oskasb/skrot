import {MeshPhysicalMaterial, MeshStandardMaterial} from "../../../../../libs/three/materials/Materials.js";
import {getFrame, getJsonByFileName, getJsonUrlByFileName} from "../../../application/utils/DataUtils.js";
import {MATH} from "../../../application/MATH.js";
import {jsonAsset, loadAsset, loadAssetTexture} from "../../../application/utils/AssetUtils.js";
import {JsonAsset} from "../../../application/load/JsonAsset.js";
import * as constants from "../../../../../libs/three/constants.js";
import {MeshStandardNodeMaterial} from "three/webgpu";
import {customTerrainUv, customOceanUv} from "../terrain/ComputeTerrain.js";


class MeshSpecialTerrainNodeMaterial extends MeshStandardNodeMaterial {

    setup( builder ) {
        builder.setContext( { ...builder.context,
            getUV: ( /*reqNode*/ ) => {
                return customTerrainUv(); // return a custom uv
            }
        } );

        return super.setup( builder );
    }
}

class MeshSpecialOceanNodeMaterial extends MeshStandardNodeMaterial {

    setup( builder ) {
        builder.setContext( { ...builder.context,
            getUV: ( /*reqNode*/ ) => {
                return customOceanUv(); // return a custom uv
            }
        } );

        return super.setup( builder );
    }
}



let mats = 0;
let materials = {};
materials['MeshStandardMaterial'] = MeshStandardMaterial;
materials['MeshStandardNodeMaterial'] = MeshStandardNodeMaterial;
materials['MeshPhysicalMaterial'] = MeshPhysicalMaterial;
materials['MeshSpecialTerrainNodeMaterial'] = MeshSpecialTerrainNodeMaterial
materials['MeshSpecialOceanNodeMaterial'] = MeshSpecialOceanNodeMaterial

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

        let callFrame = 0;

        function materialLoaded() {
            if (callFrame !== getFrame().frame) {
                settings.material.needsUpdate = true;
                MATH.callAll(subscribers, settings);
                ready = true;
                callFrame = getFrame().frame
            }
        }


        function addSlotTexture(slot, tx) {

            txLoads.push({tx:tx, slot:slot});


        }

        function loadTxList() {


            function loadSlotTx(slotTx) {
                function txCB(assetTx) {
                 //   console.log("assetTx:", assetTx, assetTx.texture);

                    if (slotTx.slot === 'aoMap') {
                        assetTx.texture.channel = 1;
                    }

                    settings.material[slotTx.slot] = assetTx.texture;
                    if (txLoads.length === 0) {
                        materialLoaded()
                    } else {
                        loadSlotTx(txLoads.pop());
                    }
                }

                loadAssetTexture(slotTx.tx, txCB);
            }

                loadSlotTx(txLoads.pop());

        }


        function initMaterial(name) {



            function onJsonLoaded(data) {
             //   console.log("material JSON", name, data);
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
                                    //    console.log("No element for", mat[key], key, element)
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
                    loadTxList()
                } else {
                    materialLoaded()
                }
            }

            jsonAsset(name, onJsonLoaded)
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