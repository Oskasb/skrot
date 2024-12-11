import { Object3D } from "../../../../../libs/three/core/Object3D.js";
let tempObj = new Object3D()

class CharacterIndicator {
    constructor() {
        this.tempVec3 = new THREE.Vector3();
        this.indicatedCharState = ENUMS.CharacterState.IDLE_HANDS;
        this.indicators = [];

        this.colorMap = {};
        this.colorMap['GOOD']       = {r:-0.5,   g:1,   b:0.4, a:0.5};
        this.colorMap['NEUTRAL']    = {r:1,   g:0.6, b:-0.4, a:0.5};
        this.colorMap['EVIL']       = {r:1,   g:-0.6,   b:-0.6,   a:0.8};
        this.colorMap['ITEM']       = {r:-0.3,   g:0.4, b:1,   a:0.8};

        let updateIndicator = function(tpf, time, gamePeice) {
            this.indicateCharacterPiece(tpf, time, gamePeice)
        }.bind(this)

        this.call = {
            updateIndicator:updateIndicator
        }
    }

    initCharacterIndicator(gamePiece, tileX, tileY) {

        let effectCb = function(efct) {
            this.indicators.push(efct);
            efct.activateEffectFromConfigId(true)
            tempObj.quaternion.set(0, 0, 0, 1);
            tempObj.lookAt(0, 1, 0);
            efct.setEffectQuaternion(tempObj.quaternion);
            gamePiece.getSpatial().getSpatialPosition(this.tempVec3);
            this.tempVec3.y+=0.03;
            efct.setEffectPosition(this.tempVec3)
            tempObj.lookAt(0, 1, 0);
            efct.setEffectQuaternion(tempObj.quaternion);

            if (typeof (tileX) === 'number' && typeof(tileY) === 'number') {
                efct.setEffectSpriteXY(tileX, tileY);
            }

            gamePiece.addPieceUpdateCallback(this.call.updateIndicator)
        }.bind(this);

        EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', 'effect_character_indicator',  effectCb)
    }

    indicateCharacterPiece(tpf, time, gamePiece) {

        for (let i = 0; i < this.indicators.length; i++) {
            let efct = this.indicators[i];
            efct.setEffectColorRGBA(this.colorMap[gamePiece.getStatusByKey('faction')]);
            efct.scaleEffectSize( gamePiece.getStatusByKey('size'));
            gamePiece.getSpatial().getSpatialPosition(this.tempVec3);
            this.tempVec3.y+=0.03;
            efct.setEffectPosition(this.tempVec3)

            let charState = gamePiece.getStatusByKey('charState')
            if (this.indicatedCharState !== charState) {
                if (charState === ENUMS.CharacterState.COMBAT) {
                    efct.setEffectSpriteXY(0, 6);
                } else if (charState === ENUMS.CharacterState.ENGAGING) {
                    efct.setEffectSpriteXY(0, 7);
                } else if (charState === ENUMS.CharacterState.DISENGAGING) {
                    efct.setEffectSpriteXY(0, 5);
                } else {
                    efct.setEffectSpriteXY(0, 4);
                }
                this.indicatedCharState = charState
            }

        }

    }

    removeIndicatorFromPiece(gamePiece) {
        gamePiece.removePieceUpdateCallback(this.call.updateIndicator)
        while (this.indicators.length) {
            let efct = this.indicators.pop();
            efct.recoverEffectOfClass();
        }
    }


}

export {CharacterIndicator}