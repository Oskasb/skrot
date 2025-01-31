import {Object3D} from "../../../../../libs/three/core/Object3D.js";
import {evt} from "../../../application/event/evt.js";
import {ENUMS} from "../../../application/ENUMS.js";


const hideObj = new Object3D();

class BatchInstance {
    constructor() {

        let id = null;
        let batchedMesh = null;

        function activateInstance(n, bMesh) {
            id = n;
            batchedMesh = bMesh;
        }

        function transformObj(obj3d) {

            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:obj3d.position, to:ThreeAPI.getCameraCursor().getPos(), color:"YELLOW"})
            obj3d.updateMatrix();
            batchedMesh.setMatrixAt(id, obj3d.matrix)
        }

        function getId() {
            return id;
        }

        function hide() {
            batchedMesh.setMatrixAt(id, hideObj.matrix)
        }

        this.call = {
            activateInstance:activateInstance,
            transformObj:transformObj,
            getId:getId,
            hide:hide
        }

    }


}

export { BatchInstance }