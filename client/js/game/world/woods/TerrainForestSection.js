import {Vector2, Vector3} from "three/webgpu";
import {Box3} from "three";
import {terrainAt} from "../../../3d/three/terrain/ComputeTerrain.js";
import {MATH} from "../../../application/MATH.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {evt} from "../../../application/event/evt.js";

const tempVec3 = new Vector3()

function debugForestInBox(box, lodLevel) {
    for (let i = 0; i < lodLevel * 3; i++) {

        let pos = MATH.sillyRandomPointInBox(box, i)
        let y = terrainAt(pos);
        tempVec3.copy(pos)
        tempVec3.y = y;
        pos.y = y+20;
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:tempVec3, color:'GREEN'})
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec3, size:5, color:'GREEN'})
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:ThreeAPI.getCameraCursor().getPos(), color:'GREEN'})
    }
}

class TerrainForestSection {
    constructor() {
        this.indexPos = new Vector2();
        this.box = new Box3();
        this.lodLevel = 0;

        let update = function() {
            debugForestInBox(this.box, this.lodLevel);
        }.bind(this);

        this.call = {
            update:update
        }

    }

    initTerrainForestSection(lodBox) {
        this.indexPos.copy(lodBox.indexPos);
        this.box.copy(lodBox.box);
    //    ThreeAPI.registerPrerenderCallback(this.call.update);
    }

    setLodLevel(lodLevel) {
        this.lodLevel = lodLevel;
        this.call.update()
    }

    closeForestSection() {
    //    ThreeAPI.unregisterPrerenderCallback(this.call.update);
    }

}

export { TerrainForestSection }