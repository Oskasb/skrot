import {poolFetch} from "../../../application/utils/PoolUtils.js";
import {Object3D} from "../../../../../libs/three/core/Object3D.js";
import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {createStructure} from "./BuildingStructure.js";
import {MATH} from "../../../application/MATH.js";
import {inheritAsParent} from "../../../application/utils/ModelUtils.js";
import {terrainAt} from "../../../3d/three/terrain/ComputeTerrain.js";
import {registerGroundLodCallback, unregisterGroundLodCallback} from "../../../application/grids/GroundBoundLodBox.js";
import {Vector2} from "../../../../../libs/three/math/Vector2.js";
import {gridIndexForPos} from "../../../application/utils/GridUtils.js";
import {getBaseGridSize} from "../../../application/grids/GroundBoundLodGrid.js";

const tempObj3d = new Object3D();

class SiteBuilding{
    constructor() {

        const obj3d = new Object3D();

        const info = {
            obj3d:obj3d,
            indexPos:new Vector2(),
            pos:obj3d.position,
            structures:[],
            json:null
        }

        this.info = info;

        function applyTrx(trxObj) {
            obj3d.position.copy(trxObj.position);
            obj3d.position.y = terrainAt(obj3d.position);
            obj3d.quaternion.copy(trxObj.quaternion);
            obj3d.scale.copy(trxObj.scale)
            gridIndexForPos(obj3d.position, info.indexPos, getBaseGridSize())

        }


        function lodUpdated(lod) {
            console.log("Lod Updated building ", lod, info)

            for (let i = 0; i < info.structures.length; i++) {
                const struct = info.structures[i];
                if (struct.info.lodMax < lod) {
                    struct.call.setVisible(true);
                } else {
                    struct.call.setVisible(false);
                }
            }
        }

        function setJson(jsn) {
            clearBuilding()
            const structures = jsn['structures'];
            for (let i = 0; i < structures.length; i++) {
                MATH.obj3dFromConfig(tempObj3d, structures[i])
                inheritAsParent(tempObj3d, obj3d);
                info.structures.push(createStructure(structures[i].id, tempObj3d))
            }
            registerGroundLodCallback(info.indexPos, lodUpdated)
        }

        function clearBuilding() {
            unregisterGroundLodCallback(info.indexPos, lodUpdated)
            while (info.structures.length) {
                const struct = info.structures.pop();
                struct.removeStructure();
            }
        }

        this.call = {
            setJson:setJson,
            clearBuilding:clearBuilding,
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