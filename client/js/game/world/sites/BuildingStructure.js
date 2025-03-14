import {poolFetch, poolReturn} from "../../../application/utils/PoolUtils.js";
import {Object3D} from "../../../../../libs/three/core/Object3D.js";
import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {createStructureShape} from "./StructureShape.js";
import {MATH} from "../../../application/MATH.js";
import {inheritAsParent} from "../../../application/utils/ModelUtils.js";

const tempObj3d = new Object3D();

class BuildingStructure{
    constructor() {

        const obj3d = new Object3D();

        const bStruct = this;

        const info = {
            obj3d:obj3d,
            pos:obj3d.position,
            shapes:[]
        }

        this.info = info;

        function applyTrx(trxObj) {
            obj3d.position.copy(trxObj.position);
            obj3d.quaternion.copy(trxObj.quaternion);
            obj3d.scale.copy(trxObj.scale)
        }

        function setJson(jsn) {

            if (info.shapes.length) {
                removeShapes()
                setTimeout(function() {
                    setJson(jsn)
                }, 400)
                return;
            }

            const shapes = jsn['shapes'];

            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i]['id'];
                MATH.obj3dFromConfig(tempObj3d, shapes[i]);
                inheritAsParent(tempObj3d, obj3d);
                info.shapes.push(createStructureShape(shape, tempObj3d))
            }
        }

        function removeShapes() {
            while (info.shapes.length) {
                const shape = info.shapes.pop();
                shape.removeShape();
            }
        }

        this.call = {
            setJson:setJson,
            applyTrx:applyTrx,
            removeShapes:removeShapes
        }

    }

    removeStructure() {
        this.call.removeShapes();
        poolReturn(this)
    }

    getPos() {
        return this.info.pos;
    }

}

function createStructure(fileName, trxObj) {
    const struct = poolFetch('BuildingStructure')
    struct.call.applyTrx(trxObj);
    jsonAsset(fileName, struct.call.setJson);
    return struct;
}

export {
    BuildingStructure,
    createStructure
}