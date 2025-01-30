import {Vector2, Vector3} from "three/webgpu";
import {Box3} from "three";
import {terrainAt} from "../../../3d/three/terrain/ComputeTerrain.js";
import {MATH} from "../../../application/MATH.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {evt} from "../../../application/event/evt.js";
import {poolReturn} from "../../../application/utils/PoolUtils.js";
import {jsonAsset} from "../../../application/utils/AssetUtils.js";

const tempVec3 = new Vector3()

const lodLevelDebugColors = [
    'WHITE',
    'RED',
    'BLUE',
    'ORANGE',
    'CYAN',
    'GREEN',
    'YELLOW',
    'BLACK'
]

function debugForestInBox(box, lodLevel) {
    for (let i = 0; i < lodLevel * 3; i++) {

        let pos = MATH.sillyRandomPointInBox(box, i)
        let y = terrainAt(pos);
        tempVec3.copy(pos)
        tempVec3.y = y;
        pos.y = y+20;
        let color = lodLevelDebugColors[lodLevel];
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:tempVec3, color:'GREEN'})
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempVec3, size:5, color:'GREEN'})
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:ThreeAPI.getCameraCursor().getPos(), color:color})
    }
}

class TerrainForestSection {
    constructor() {
        this.indexPos = new Vector2();
        this.box = new Box3();
        this.lodLevel = 0;

        let lastLodLevel = 0;

        let update = function() {
            if (this.lodLevel !== lastLodLevel) {
                debugForestInBox(this.box, this.lodLevel);
                lastLodLevel = this.lodLevel;
            }

        }.bind(this);

        function setConfig(json) {

        };

        this.call = {
            update:update,
            setConfig:setConfig
        }

    }

    initTerrainForestSection(lodBox, configFileName) {
        this.indexPos.copy(lodBox.indexPos);
        this.box.copy(lodBox.box);

        jsonAsset(configFileName, this.call.setConfig)

    }

    setLodLevel(lodLevel) {
        this.lodLevel = lodLevel;
        this.call.update()
    }

    closeForestSection() {
        this.indexPos.set(-0.1, -0.1) // hide from grid call
        this.setLodLevel(0);
        poolReturn(this)
    }

}

export { TerrainForestSection }