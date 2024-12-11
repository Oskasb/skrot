class TileIndicator {
    constructor(gridTile) {

        this.gridTile = gridTile;
        this.spin = 0;
        this.scale = 1;
        this.pulsate = 0;
        this.rate = 2;

        this.isActive = false;

        this.indicators = [];

        this.colorMap = {};
        this.colorMap['FREE']       = {r:-0.6,g:-0.3,   b:0.99,   a:0.2};
        this.colorMap['MOVE_TO']    = {r:0.1, g:-0.4,   b:0.1,    a:0.2};
        this.colorMap['IS_PATH']    = {r:0.9, g: 0.95,   b:-0.9,   a:0.9};
        this.colorMap['OCCUPIED']   = {r:0.1, g: 0.1,   b:-0.2,   a:0.2};
        this.colorMap['HAS_ITEM']   = {r:-0.6,g: -0.3,  b:0.9,    a:0.4};
        this.colorMap['BLOCKED']    = {r:0.6, g:-0.3,   b:-0.3,   a:0.2};


        this.spriteMap = {}
        this.spriteMap['FREE']       = {x:5, y:0};
        this.spriteMap['MOVE_TO']    = {x:1, y:5};
        this.spriteMap['IS_PATH']    = {x:0, y:3};
        this.spriteMap['OCCUPIED']   = {x:1, y:1};
        this.spriteMap['HAS_ITEM']   = {x:0, y:2};
        this.spriteMap['BLOCKED']    = {x:1, y:2};

        let updateIndicator = function(tpf, time) {
            this.indicateTileStatus(tpf, time, this.spin, this.scale, this.pulsate, this.rate)
        }.bind(this)

        this.call = {
            updateIndicator:updateIndicator
        }

    }

    activateTileIndicator() {
        let indicatorFx = 'effect_character_indicator';

        let spriteX = this.spriteMap[this.gridTile.getTileStatus()].x;
        let spriteY = this.spriteMap[this.gridTile.getTileStatus()].y;
        let spin = 0;
        let scale = 1.7;
        let pulsate = 0.03;
        let rate = 3;

        if (spin) this.spin = spin;
        if (scale) this.scale = scale;
        if (pulsate) this.pulsate = pulsate;
        if (rate) this.rate = rate;

        let effectCb = function(efct) {
            this.indicators.push(efct);
            efct.activateEffectFromConfigId(true)
            ThreeAPI.tempObj.quaternion.copy(this.gridTile.obj3d.quaternion);
       //     ThreeAPI.tempObj.lookAt(0, 1, 0);
       //     efct.setEffectQuaternion(this.gridTile.obj3d.quaternion);
            ThreeAPI.tempVec3.copy(this.gridTile.obj3d.position)
            efct.setEffectPosition(ThreeAPI.tempVec3)
            ThreeAPI.tempObj.rotateX(-MATH.HALF_PI);
            efct.setEffectQuaternion(ThreeAPI.tempObj.quaternion);

            if (typeof (spriteX) === 'number' && typeof(spriteY) === 'number') {
                efct.setEffectSpriteXY(spriteX, spriteY);
            }
            this.call.updateIndicator(0, GameAPI.getGameTime());
            if (this.isActive === false) {
                GameAPI.registerGameUpdateCallback(this.call.updateIndicator)
            }
            this.isActive = true;
        }.bind(this);

        EffectAPI.buildEffectClassByConfigId('additive_stamps_8x8', indicatorFx,  effectCb)
    }

    indicateTileStatus(tpf, time, spinSpeed, scale, pulsate, rate) {

        for (let i = 0; i < this.indicators.length; i++) {
            let efct = this.indicators[i];
            let status = this.gridTile.getTileStatus();
            efct.setEffectColorRGBA(this.colorMap[status]);
            let size = this.gridTile.size;
            if (scale) size*=scale;
            efct.scaleEffectSize(  size + pulsate*(Math.sin(time*rate)));
            ThreeAPI.tempVec3.copy(this.gridTile.obj3d.position);
            ThreeAPI.tempVec3.y+=0.001 // + this.gridTile.thickness;
            efct.setEffectPosition(ThreeAPI.tempVec3)

            if (spinSpeed) {
                ThreeAPI.tempObj.lookAt(0, 1, 0);
                ThreeAPI.tempObj.rotateZ(time*spinSpeed);
                efct.setEffectQuaternion(ThreeAPI.tempObj.quaternion);
            }
        }
    }

    removeTileIndicator() {
        this.isActive = false;
        GameAPI.unregisterGameUpdateCallback(this.call.updateIndicator)
        this.removeIndicatorFx()
    }

    hideIndicatorFx() {
        for (let i = 0; i < this.indicators.length; i++) {
            let efct = this.indicators[i];
            efct.scaleEffectSize(0);
        }
    }

    removeIndicatorFx() {
        this.hideIndicatorFx();
        while (this.indicators.length) {
            let efct = this.indicators.pop();
            efct.recoverEffectOfClass();
        }
    }

}

export {TileIndicator}