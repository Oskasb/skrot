import {poolFetch} from "../../../application/utils/PoolUtils.js";
import {Object3D} from "../../../../../libs/three/core/Object3D.js";
import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {createStructure} from "./BuildingStructure.js";
import {MATH} from "../../../application/MATH.js";
import {inheritAsParent} from "../../../application/utils/ModelUtils.js";
import {terrainAt} from "../../../3d/three/terrain/ComputeTerrain.js";

const tempObj3d = new Object3D();

class SiteBuilding{
    constructor() {

        const obj3d = new Object3D();

        const info = {
            obj3d:obj3d,
            pos:obj3d.position,
            structures:[]
        }

        this.info = info;

        function applyTrx(trxObj) {
            obj3d.position.copy(trxObj.position);
            obj3d.position.y = terrainAt(obj3d.position);
            obj3d.quaternion.copy(trxObj.quaternion);
            obj3d.scale.copy(trxObj.scale)
        }

        function setJson(jsn) {
            clearBuilding()
            const structures = jsn['structures'];

            for (let i = 0; i < structures.length; i++) {
                MATH.obj3dFromConfig(tempObj3d, structures[i])
                inheritAsParent(tempObj3d, obj3d);
                info.structures.push(createStructure(structures[i].id, tempObj3d))
            }

        }

        function clearBuilding() {
            while (info.structures.length) {
                const struct = info.structures.pop();
                struct.removeStructure();
            }
        }

        this.call = {
            setJson:setJson,
            applyTrx:applyTrx
        }

    }

    getPos() {
        return this.info.pos;
    }

}

function createBuilding(fileName, trxObj) {
    const sBuilding = poolFetch('SiteBuilding')
    sBuilding.call.applyTrx(trxObj);
    jsonAsset(fileName, sBuilding.call.setJson);
    return sBuilding;
}

export {
    SiteBuilding,
    createBuilding
}