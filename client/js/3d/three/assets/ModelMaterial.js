import {MeshStandardMaterial} from "../../../../../libs/three/materials/Materials.js";
import {getJsonByFileName} from "../../../application/utils/DataUtils.js";
import {MATH} from "../../../application/MATH.js";

let materials = {};
materials['MeshStandardMaterial'] = MeshStandardMaterial;
class ModelMaterial {
    constructor() {
        let settings = {
            modelMaterial:this,
            fileName:""
        };
        let ready = false;
        let subscribers = [];

        function materialLoaded() {
            MATH.callAll(subscribers, settings);
            ready = true;
        }


        function initMaterial(name) {
            let json = getJsonByFileName(name);
            console.log("material JSON", json);
            settings.fileName = name;
            settings.material = new materials[json.material]();
            materialLoaded()
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