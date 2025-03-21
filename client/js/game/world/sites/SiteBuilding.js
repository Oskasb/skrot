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

        const building = this;

        const info = {
            obj3d:obj3d,
            indexPos:new Vector2(),
            pos:obj3d.position,
            structures:[],
            json:null,
            physicallyDynamic:false
        }

        this.info = info;

        function applyTrx(trxObj, posY) {
            obj3d.position.copy(trxObj.position);
            if (posY === 0) {
                obj3d.position.y = terrainAt(obj3d.position);
            }
            obj3d.quaternion.copy(trxObj.quaternion);
            obj3d.scale.copy(trxObj.scale)
            gridIndexForPos(obj3d.position, info.indexPos, getBaseGridSize())
        }

        function debugUpdate() {
            debugDrawStructures('GREEN')
        }

        function lodUpdated(lod) {
            console.log("Lod Updated building ", lod, info)

            for (let i = 0; i < info.structures.length; i++) {
                const struct = info.structures[i];

                /*
                if (lod > 7) {
                    ThreeAPI.registerPrerenderCallback(debugUpdate);
                } else {
                    ThreeAPI.unregisterPrerenderCallback(debugUpdate);
                }
*/

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

                const bStruct = createStructure(structures[i].id, tempObj3d)
                bStruct.info.building = building;
                info.structures.push(bStruct)
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

        function activateDynamicPhysics(bool) {
            if (info.physicallyDynamic !== bool) {
                info.physicallyDynamic = bool;
                for (let i = 0; i < info.structures.length; i++) {
                    info.structures[i].call.simulatePhysical(bool)
                }
            }
        }

        function debugDrawStructures(color) {
            for (let i = 0; i < info.structures.length; i++) {
                info.structures[i].call.debugDraqBStruct(color)
            }
        }

        this.call = {
            setJson:setJson,
            activateDynamicPhysics:activateDynamicPhysics,
            clearBuilding:clearBuilding,
            applyTrx:applyTrx,
            debugDrawStructures:debugDrawStructures
        }

    }

    getPos() {
        return this.info.pos;
    }

}

function createBuilding(fileName, trxObj, posY) {
    const sBuilding = poolFetch('SiteBuilding')
    sBuilding.call.applyTrx(trxObj, posY);
    jsonAsset(fileName, sBuilding.call.setJson);
    return sBuilding;
}

export {
    SiteBuilding,
    createBuilding
}