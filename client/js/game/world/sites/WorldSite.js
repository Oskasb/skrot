import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {Vector3} from "three/webgpu";
import {MATH} from "../../../application/MATH.js";
import {createBuilding} from "./SiteBuilding.js";
import {Object3D} from "../../../../../libs/three/core/Object3D.js";
import {registerLowFrequencySpatialCallback} from "../../player/PlayerCamera.js";

const tempObj3d = new Object3D();

class WorldSite {
    constructor(fileName) {

        this.info = {
            isActive:false,
            pos:new Vector3(),
            lowResPoint:[0, 0, 0],
            label:'N/A',
            buildings:[],
            json:null
        }

        const info = this.info;

        function activateSite() {
            info.isActive = true;
            const jsn = info.json;
            if (jsn['buildings']) {
                for (let i = 0; i < jsn['buildings'].length; i++) {
                    MATH.obj3dFromConfig(tempObj3d, jsn['buildings'][i])
                    tempObj3d.position.add(info.pos);
                    info.buildings.push(createBuilding(jsn['buildings'][i].id, tempObj3d))
                }
            }
        }

        function deactivateSite() {
            info.isActive = false;
            while (info.buildings.length) {
                const siteBuilding = info.buildings.pop();
                siteBuilding.call.clearBuilding();
            }
        }

        function onLowResSpatialUpdate(lowResXYZ) {
            let dst = MATH.lowResMaxDistance(lowResXYZ, info.lowResPoint);
            if (info.isActive === false) {
                if (dst < 100) {
                    activateSite()
                }
            } else {
                if (dst > 100) {
                    deactivateSite()
                }
            }
        }

        function setJson(jsn) {
            deactivateSite();
            info.label = jsn['label'];
            MATH.vec3FromArray(info.pos, jsn['pos'])
            MATH.posToLowResPoint(info.pos, info.lowResPoint)
            info.json = jsn;
            registerLowFrequencySpatialCallback(onLowResSpatialUpdate)
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