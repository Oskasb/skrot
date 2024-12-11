class GuiLetter {
    constructor() {
            this.pos = new THREE.Vector3();
            this.scale = {x:0, y:0, z:0};
            this.sprite = {x:0, y:0, z:0, w:0};
        };

        initLetterBuffers = function(bufferElement) {
            bufferElement.setBufferDefaults()
            this.bufferElement = bufferElement;
            this.scale.x = 0;
            this.scale.y = 0;
            this.scale.z = 0;
            this.bufferElement.pos.x = 0;
            this.bufferElement.pos.y = 0;
            this.bufferElement.pos.z = 1;

            this.bufferElement.lifecycle.x = 0;
            this.bufferElement.lifecycle.y = 0;
            this.bufferElement.lifecycle.z = 0;
            this.bufferElement.lifecycle.w = 0;

        };

    setGuiSysId = function(guiSysId) {
        this.guiSysId = guiSysId;
    };

    getGuiSysId = function() {
        return this.guiSysId;
    };

        setLetter = function(letter) {
            this.letter = letter;
        };

        getLetter = function() {
            return this.letter;
        };

        setSpriteXY = function(x, y) {
            this.sprite.x = x;
            this.sprite.y = y;
            this.bufferElement.setSprite(this.sprite)
        };

        setLetterPositionXYZ = function(x, y, z) {
            this.pos.x = x;
            this.pos.y = y;
            this.pos.z = z;
        };

        applyLetterPosition = function() {
            this.bufferElement.setPositionVec3(this.pos)
        };

        setLetterColorRGBA = function(rgba) {
            this.bufferElement.setColorRGBA(rgba)
        };

        setLetterSprite = function(xyzw) {
            this.bufferElement.setSprite(xyzw)
        };

        setLetterLutColor = function(value) {
            this.bufferElement.setLutColor(value);
            this.bufferElement.applyDataTexture()
        };

        applyLetterHeight = function(letterHeight) {
            this.setLetterScaleXY(letterHeight * 10, letterHeight * 10)
        };

        setLetterScaleXY = function(x, y) {
            this.scale.x = x;
            this.scale.y = y;
            this.bufferElement.setScaleVec3(this.scale)
        };

        setLetterReleaseTime = function(time) {
            this.bufferElement.setReleaseTime(time)
        };

        releaseGuiLetter = function() {
            this.bufferElement.releaseElement()
        };

    }
    export { GuiLetter }