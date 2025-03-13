import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {Vector3} from "three/webgpu";
import {MATH} from "../../../application/MATH.js";

class WorldSite {
    constructor(fileName) {

        this.info = {
            pos:new Vector3(),
            label:'N/A'
        }

        const info = this.info;

        function setJson(jsn) {
            info.label = jsn['label'];
            MATH.vec3FromArray(info.pos, jsn['pos'])
        }

        jsonAsset(fileName, setJson)

    }

    getPos() {
        return this.info.pos;
    }

    getLabel() {
        return this.info.label;
    }

}

export { WorldSite }