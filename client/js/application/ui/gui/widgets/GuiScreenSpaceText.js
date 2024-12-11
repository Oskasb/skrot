import {poolReturn} from "../../../utils/PoolUtils.js";

class GuiScreenSpaceText {
    constructor(options) {
        let textElement;
        let duration;
        let positionFunction;
        let textProgress;

        this.options = {};
        for (let key in options) {
            this.options[key] = options[key];
        }

        this.surface = {
            minXY:new THREE.Vector3(-0.25,-0.5,0),
            maxXY:new THREE.Vector3(0.25, 0.5, 0)
        };

        let stringReady = function() {
            textElement.updateTextMinMaxPositions(this.surface);
        }.bind(this);

        let removeText =function() {
            this.deactivateScreenSpaceText();
            textElement.recoverTextElement();
        }.bind(this)

        let updateProgress = function(tpf) {
            this.time += tpf;
            textProgress = MATH.calcFraction(0, duration, this.time);
            positionFunction(this, textProgress);

            if (duration < this.time) {
                removeText();
            }

        }.bind(this);

        let setTextElement = function(elem) {
            textElement = elem;
        }

        let getTextElement = function() {
            return textElement;
        }

        let setDuration = function(seconds) {
            duration = seconds;
        }

        let getDuration = function() {
            return duration;
        }

        let setPositionFunction = function(posFunc) {
            positionFunction = posFunc;
        }


        this.callbacks = {
            setPositionFunction:setPositionFunction,
            updateProgress:updateProgress,
            removeText:removeText,
            stringReady:stringReady,
            setDuration:setDuration,
            getDuration:getDuration,
            setTextElement:setTextElement,
            getTextElement:getTextElement
        };

        this.tPosOffset = new THREE.Vector3();
        this.pos = new THREE.Vector3();
        this.size= new THREE.Vector3()
    };

    setTransitionTargetPositionOffset(vec3) {
        this.tPosOffset.copy(vec3);
    }

    initScreenSpaceText = function(onReady, conf, duration) {
        this.time = 0;
        this.callbacks.setDuration(duration || 1);

        conf = conf || {
            "sprite_font": "sprite_font_debug",
            "feedback": "feedback_text_blue",
            "textLayout": {"x": 0.5, "y": 0.5, "fontsize": 8}
        };

        let textCB = function (txtElem) {
            txtElem.setFeedbackConfigId(conf.feedback);
            txtElem.setTextLayout(conf.textLayout)
        //    txtElem.updateWidgetStateFeedback()
            this.callbacks.setTextElement(txtElem);
            onReady(this)
        }.bind(this);

        GuiAPI.getTextSystem().buildTextElement(textCB, conf.sprite_font);

    };

    setTextDimensions = function(pos, size) {
        this.pos.copy(pos);
        this.size.copy(size);
        this.callbacks.getTextElement().updateTextMinMaxPositions(this.surface);
    };

    updateTextContent = function(string) {
        this.callbacks.getTextElement().drawTextString(GuiAPI.getTextSysKey(), string, this.callbacks.stringReady)
    };

    activateScreenSpaceText = function() {
        ThreeAPI.getSetup().addPrerenderCallback(this.callbacks.updateProgress);
    };

    deactivateScreenSpaceText = function() {

        if (this.poolFetched === true) {
            poolReturn(this);
            this.poolFetched = false
        }

        ThreeAPI.getSetup().removePrerenderCallback(this.callbacks.updateProgress);
    };


}

export { GuiScreenSpaceText }