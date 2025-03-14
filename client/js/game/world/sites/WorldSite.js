import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {Vector3} from "three/webgpu";
import {MATH} from "../../../application/MATH.js";
import {createBuilding} from "./SiteBuilding.js";
import {Object3D} from "../../../../../libs/three/core/Object3D.js";

const tempObj3d = new Object3D();

class WorldSite {
    constructor(fileName) {

        this.info = {
            pos:new Vector3(),
            label:'N/A',
            buildings:[]
        }

        const info = this.info;

        function setJson(jsn) {
            info.label = jsn['label'];
            MATH.vec3FromArray(info.pos, jsn['pos'])

            if (jsn['buildings']) {
                for (let i = 0; i < jsn['buildings'].length; i++) {
                    MATH.obj3dFromConfig(tempObj3d, jsn['buildings'][i])
                    tempObj3d.position.add(info.pos);
                    info.buildings.push(createBuilding(jsn['buildings'][i].id, tempObj3d))
                }
            }

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