import {poolFetch, poolReturn} from "../../../application/utils/PoolUtils.js";
import {Object3D} from "../../../../../libs/three/core/Object3D.js";
import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {createStructureShape} from "./StructureShape.js";
import {MATH} from "../../../application/MATH.js";
import {inheritAsParent} from "../../../application/utils/ModelUtils.js";
import {Box3} from "three";
import {ENUMS} from "../../../application/ENUMS.js";
import {evt} from "../../../application/event/evt.js";
import {minLodLevelByBoxSize} from "../../../application/grids/GroundBoundLodGrid.js";

const tempObj3d = new Object3D();

class BuildingStructure{
    constructor() {

        const obj3d = new Object3D();
        const bStruct = this;

        const info = {
            obj3d:obj3d,
            pos:obj3d.position,
            box:new Box3(),
            shapes:[],
            visibleOn:false,
            physicalOn:false,
            lodMax:4
        }

        this.info = info;

        function applyTrx(trxObj) {
            obj3d.position.copy(trxObj.position);
            obj3d.quaternion.copy(trxObj.quaternion);
            obj3d.scale.copy(trxObj.scale)
            info.box.makeEmpty();
            info.box.expandByPoint(obj3d.position);
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
                const sShape = createStructureShape(shape, tempObj3d)
                info.shapes.push(sShape)
                info.box.expandByPoint(sShape.info.box.min);
                info.box.expandByPoint(sShape.info.box.max);
            }

            info.box.getSize(tempObj3d.scale);
            info.lodMax = minLodLevelByBoxSize(tempObj3d.scale)
        }

        function removeShapes() {
            while (info.shapes.length) {
                const shape = info.shapes.pop();
                shape.removeShape();
            }
        }


        function debugDraqw() {
            info.box.color = 'CYAN'
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:obj3d.position, to:ThreeAPI.getCameraCursor().getPos(), color:'GREEN'});
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, info.box)
        }

        function showShapes() {
            for (let i = 0; i < info.shapes.length; i++) {
                const shape = info.shapes[i];
                shape.call.activateVisualStructure()
            }
            ThreeAPI.registerPrerenderCallback(debugDraqw);
        }

        function hideShapes() {
            for (let i = 0; i < info.shapes.length; i++) {
                const shape = info.shapes[i];
                shape.call.deactivateVisualStructure()
            }
            ThreeAPI.unregisterPrerenderCallback(debugDraqw);
        }

        function setVisible(bool) {

            if (info.visibleOn !== bool) {
                info.visibleOn = bool;
                if (bool) {
                    showShapes()
                } else {
                    hideShapes()
                }
            }

        }

        function setPhysical(bool) {

        }

        this.call = {
            setVisible:setVisible,
            setPhysical:setPhysical,
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