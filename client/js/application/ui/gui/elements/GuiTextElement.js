
class GuiTextElement {
    constructor(guiStringPool) {
        this.tempVec1 = new THREE.Vector3();
        this.parentPos = new THREE.Vector3();
        this.parentSize= new THREE.Vector3();
        this.guiStrings = [];

        this.minXY = new THREE.Vector3();
        this.maxXY = new THREE.Vector3();

        this.textLayout = {"x": 0.5, "y": 0.5, "fontsize": 12};
        this.maxRows = 1;

        this.guiStringPool = guiStringPool;


    };

    removeGuiString = function(guiString) {

        guiString.recoverGuiString();
        this.guiStringPool.returnToExpandingPool(guiString);

    };

    drawTextString = function(uiSysKey, string, cb) {

        this.uiSysKey = uiSysKey;

        let initString = function(guiString) {

            guiString.setString(string, uiSysKey);
            this.guiStrings.unshift(guiString);
            cb();
        }.bind(this);

        while (this.guiStrings.length > this.getTextMaxRows()-1) {
            this.removeGuiString(this.guiStrings.pop())
        }


        let getElement = function(elem) {
            initString(elem)
        }.bind(this);

        this.guiStringPool.getFromExpandingPool(getElement)

    };

    setFeedbackConfigId = function(feedbackConfigId) {
        this.feedbackConfigId = feedbackConfigId;
    };

    getFeedbackConfigId = function() {
        return this.feedbackConfigId;
    };


    setElementDataKeys = function(uiKey, dataKey, dataId) {
        this.uiKey = uiKey;
        this.dataKey = dataKey;
        this.dataId = dataId;
        let config = GuiAPI.getGuiSettingConfig(this.uiKey, this.dataKey, this.dataId);
        this.setElementConfig(config);
    };

    setElementConfig = function(config) {
        this.config = config;
    };


    setTextColor = function(rgba, lutColor) {
        for (let i = 0; i < this.guiStrings.length; i++) {
            this.guiStrings[i].setStringColorRGBA(rgba, lutColor)
        }
    }

    setTextLayout = function(textLayout) {
        this.textLayout = textLayout;
    };

    getTextLayout = function() {
        return this.textLayout;
    };

    getTextMaxRows = function() {
        return this.maxRows;
    };

    getMaxCharCount = function() {
        let txtLayout = this.getTextLayout();
        let letterW = this.config['letter_width']  * txtLayout.fontsize;
        return Math.floor((this.maxXY.x - this.minXY.x) / letterW)
    };



    updateTextMinMaxPositions = function(guiSurface) {


        this.config = GuiAPI.getGuiSettingConfig(this.uiKey, this.dataKey, this.dataId);

        this.minXY.copy(guiSurface.minXY);
        this.maxXY.copy(guiSurface.maxXY);

        if (guiSurface.config) {
            guiSurface.applyPadding(this.minXY, this.maxXY);
        }

        this.parentPos.copy(this.minXY);
        this.parentSize.subVectors(this.maxXY, this.minXY);

        let txtLayout = this.getTextLayout();

        let letterW = this.config['letter_width']  * txtLayout.fontsize;
        let letterH = this.config['letter_height'] * txtLayout.fontsize;

        let maxW = -1;
        let maxH = -1;

        let rowSpacing = this.config['row_spacing'];

        let maxRows = Math.max(Math.floor((this.parentSize.y + rowSpacing) / (letterH + rowSpacing)), 1);

        let useRows = Math.min(maxRows, this.guiStrings.length);

        let stringHeight = useRows * (letterH + rowSpacing) - rowSpacing;
        let marginH = this.parentSize.y - stringHeight;
        let offsetY = marginH * txtLayout.y;

        this.maxRows = maxRows;

        for (let i = 0; i < useRows; i++) {

            if (maxH + letterH > this.parentPos.y + this.parentSize.y) {
                continue;
            }

            this.tempVec1.copy(this.parentPos);

            let stringLength = Math.min(Math.floor(this.parentSize.x / letterW), this.guiStrings[i].getLetterCount());
            let stringWidth = stringLength*letterW;
            let margin = this.parentSize.x - stringWidth;
            let offsetX = margin * txtLayout.x;
            this.tempVec1.x += offsetX;
            this.tempVec1.y += offsetY;

            this.guiStrings[i].setStringPosition(this.tempVec1, letterW, letterH, rowSpacing, i,  this.parentPos.x + this.parentSize.x);

            if (this.guiStrings[i].maxXY.x > maxW) {
                maxW = this.guiStrings[i].maxXY.x;
            }

            maxH = this.guiStrings[i].maxXY.y

        }

        this.maxXY.x = maxW;
        this.maxXY.y = maxH ;

    };

    clearTextContent = function() {

        while (this.guiStrings.length) {
            let guiString = this.guiStrings.shift();
            guiString.recoverGuiString();
            this.guiStringPool.returnToExpandingPool(guiString);
        }
    };

    recoverTextElement = function() {
        this.clearTextContent();
    };


}
export { GuiTextElement }
