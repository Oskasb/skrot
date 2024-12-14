import {MeshStandardMaterial} from "../../../../../libs/three/materials/Materials.js";
import {getJsonByFileName} from "../../../application/utils/DataUtils.js";

let materials = {};
material['MeshStandardMaterial'] = MeshStandardMaterial;
class ModelMaterial {
    constructor() {
        this.settings = {};
        this.subscribers = [];
    }

    initModelMaterial(materialFileName) {
        this.settings.materialFileName = materialFileName;
        let json = getJsonByFileName(materialFileName);
        console.log("material JSON:", json);
    }

    subscribeToMaterial(callback) {
        this.subscribers.push(callback);
    }


}




export { ModelMaterial };