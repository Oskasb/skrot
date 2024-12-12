import { Vector3 } from "../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../libs/three/core/Object3D.js";
import * as CombatFxOptions from "../combat/feedback/CombatFxOptions.js";
import * as CombatFxUtils from "../combat/feedback/CombatFxUtils.js";
import {GridTile} from "../gamescenarios/GridTile.js";
import {Obj3DText} from "../../application/ui/gui/game/Obj3DText.js";
import {poolFetch, poolReturn} from "../../application/utils/PoolUtils.js";
import {aaBoxTestVisibility, borrowBox, cubeTestVisibility} from "../../application/utils/ModelUtils.js";
import {colorMapFx} from "../visuals/Colors.js";
import {
    physicalAlignYGoundTest,
    testProbeFitsAtPos
} from "../../application/utils/PhysicsUtils.js";

let up = new Vector3(0, 1, 0)
let normalHit = new Vector3();
let contactPoint = new Vector3();
let tempVec = new Vector3();
let tempObj = new Object3D();
let index = 0;
class DynamicTile {
    constructor() {
        this.index = index;
        this.rigidBodyPointer = null;
        index ++;
        this.text = new Obj3DText(new Vector3());
        this.step = 0;
        this.offset = 0;
    }

    activateTile = function(defaultSprite, defaultSize, spacing, hideTile, centerOffset, debug, isExit) {
        this.defaultSprite = defaultSprite || [7, 3]

        this.isExit = isExit;
        this.debug = debug;
        this.hideTile = hideTile;
        this.spacing = spacing || 1;

        if (centerOffset) {
            this.offset = spacing * 0.5
        } else {
            this.offset = 0;
        }

        this.defaultSize = this.spacing * defaultSize || 0.9

        this.exitSprite = [5, 6];
        this.groundSprite = [7, 1]

        this.requiresLeap = false;
        this.walkable = false;
        this.blocking = false;
        this.fitsCharacter = true;


        this.obj3d = new Object3D();

        this.obj3d.lookAt(up);
        this.tileX = 0;
        this.tileZ = 0;
        this.gridI = 0;
        this.gridJ = 0;
        this.gridTile = new GridTile(0, 0, 1, 0.1, this.obj3d)
        this.groundNormal = new Vector3();
        this.groundData = {x:0, y:0, z:0, w:0};

        this.rgba = {
            r : 0,
            g : 1,
            b : 0,
            a : 1
        }

        this.pathPoint = poolFetch('PathPoint');

        this.visualTile = null;
        if (!this.hideTile) {
            this.visualTile = poolFetch('VisualTile');
            this.visualTile.visualizeDynamicTile(this);
        }
    }

    setTileIndex = function(indexX, indexY, gridI, gridJ, attachVisualBox) {
        this.tileX = indexX;
        this.tileZ = indexY;

        this.gridI = gridI;
        this.gridJ = gridJ;

        this.rigidBodyPointer = null;

    //    this.gridTile.setTileXZ(indexX, indexY);
        this.obj3d.position.x = indexX*this.spacing + this.offset
        this.obj3d.position.z = indexY*this.spacing + this.offset;
        let fits = physicalAlignYGoundTest(this.obj3d.position, this.obj3d.position, 1.5, this.groundNormal)

    //    let height = ThreeAPI.terrainAt(this.obj3d.position, this.groundNormal);
    //    this.obj3d.position.y = height+0.01;

        if (fits === false) {
            this.fitsCharacter = false;
            this.blocking = true;
        } else {

            if (typeof(fits) === "object") {
                this.rigidBodyPointer = fits.ptr;
            }

            fits = testProbeFitsAtPos(this.obj3d.position, 0.9, false)

            if (fits !== true) {
                this.fitsCharacter = false;
                this.blocking = true;
            } else {

            }
        }

        this.pathPoint.setPos(this.obj3d.position)

        if (this.visualTile) {
            this.visualTile.dynamicTileUpdated(this)
            if (attachVisualBox) {
                this.visualTile.attachVisualBoxTile(this)
            }
        }
    }

    rayTestTile(debugDraw) {
        return testProbeFitsAtPos(this.getPos(), 0.9, debugDraw)
    }

    addExitVisuals() {
        tempVec.set(0, -1.0, -0.0);
        tempObj.quaternion.set(0, 0, 0, 1);
        let rotY = this.direction;
        tempObj.rotateX(-MATH.HALF_PI)
        tempObj.rotateZ(rotY)
        tempVec.applyQuaternion(tempObj.quaternion);
        tempVec.add(this.obj3d.position)
        this.visualTile.addTileFeedbackEffect(this, this.exitSprite, tempVec, tempObj.quaternion, colorMapFx['EXIT_TILE'])
    }

    indicatePath = function() {
    //    this.tileEffect.setEffectSpriteXY(7, 1);
        if (this.visualTile) {
            let rgba = this.visualTile.rgba;
            this.visualTile.setTileColor(CombatFxUtils.setRgba(rgba.r*2, rgba.g*2, rgba.b*2, rgba.a*2))
        }

     //   if (this.isExit) {
     //       GuiAPI.screenText("Exit Selected", ENUMS.Message.HINT)
     //   }
     }

    clearPathIndication = function() {
        if (this.visualTile) {
            let rgba = this.visualTile.rgba;
            this.visualTile.setTileColor(CombatFxUtils.setRgba(rgba.r, rgba.g, rgba.b, rgba.a))
        //    if (this.isExit) {
            this.visualTile.clearTileFeedbackEffects()
         //   }
        }

    }

    getPos() {
        return this.obj3d.position;
    }

    getTileExtents(minStore, maxStore) {
        let pos = this.getPos();
        minStore.x = pos.x - this.spacing*0.5;
        minStore.y = pos.y - this.spacing*0.5;
        minStore.z = pos.z - this.spacing*0.5;
        maxStore.copy(minStore);
        maxStore.x += this.spacing;
        maxStore.y += this.spacing;
        maxStore.z += this.spacing;
    }

    getNormal = function() {
        return this.groundNormal;
    }

    removeTile = function () {
        if (this.visualTile) {
            this.visualTile.recoverVisualTile();
            poolReturn(this.visualTile);
            this.visualTile = null;
        }
        poolReturn(this.pathPoint)
        poolReturn(this);
    }

    processDynamicTileVisibility = function(maxDistance, lodLevels, lodCenter,  tileUpdateCallback, coarseness, margin, centerIsUpdated, preUpdateTime) {

        if (coarseness > 1 && centerIsUpdated === false) {
            this.step++;
            if ((this.index+this.step) % coarseness !== 1) {
                tileUpdateCallback(this, centerIsUpdated)
                return;
            }
        }

        let dynamicGridTile = this;
        tempVec.copy(this.getPos())
        tempVec.y = ThreeAPI.getCamera().position.y;
        let lodDistance = tempVec.distanceTo(ThreeAPI.getCamera().position)
        //       let lodDistance = tempVec.distanceTo(lodCenter)
        let centerFactor = 0.12;
        if (lodDistance > maxDistance*centerFactor) {
            lodDistance = maxDistance*centerFactor + (lodDistance * (1-centerFactor*1));
        } else {
            lodDistance = 0;
        }
        let rgba = this.rgba
        let tileSize = this.spacing * (margin || 1);
        tempVec.copy(this.getPos())
        tempVec.y -= tileSize
        let isVisible = aaBoxTestVisibility(tempVec,  tileSize, tileSize*4, tileSize)
        let borrowedBox = borrowBox();
        let farness = MATH.calcFraction(0, maxDistance, lodDistance * 1.01)  //MATH.clamp( (camDist / maxDistance) * 1.0, 0, 1)
        if (farness > 1) {
        //    console.log("Farness overrun", farness)
            farness = 1;
            isVisible = false;
        }

        let nearness = MATH.decimalify(MATH.clamp(1.2-farness*1.2, 0, 1), 10);
        let lodLevel = Math.floor((MATH.curveQuad(farness)*0.6 + MATH.curveSqrt(farness)*0.4) * (lodLevels+1));


        this.isVisible = false;
        this.lodLevel = lodLevel;
        if (lodLevel === 0) {
        //    this.debug = true;
            isVisible = true;
        }
        if (isVisible) {

            if (nearness > 0) {
                this.isVisible = true;

                if (this.debug) {
                    if (MATH.decimalify(nearness, 10) !== MATH.decimalify(this.nearness, 10)) {
                        this.text.call.setPosVec(this.obj3d.position);
                        this.text.say(nearness)
                    }
                    let color = {x:MATH.sillyRandom(lodLevel), y:Math.sin(lodLevel*1.8), z:Math.cos(lodLevel), w:1}
                    //    this.debugDrawTilePosition(nearness*nearness*tileSize*0.5, color)
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:color})
                }

                if (this.nearness > nearness) {
                    this.nearness *= 0.999;
                } else {
                    this.nearness = MATH.decimalify(nearness, 10);
                }

            } else {
                this.nearness = 0;
                if (this.debug) {
                    this.debugDrawTilePosition(nearness*nearness*tileSize, 'BLACK')
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:'BLACK'})
                }

            }
        } else {
            this.lodLevel = -1;
        }
        tileUpdateCallback(this, centerIsUpdated, preUpdateTime)
    }

    debugDrawTilePosition(size, color) {
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:this.obj3d.position, color:color || 'RED', size: size || 1});
    }
    updateDynamicTile = function() {
        if (this.debug) {

        }
    //
    }

}

export {DynamicTile}