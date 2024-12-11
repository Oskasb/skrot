import { GuiTextElement } from "../elements/GuiTextElement.js";
import {GuiString} from "../elements/GuiString.js";
import {ExpandingPool} from "../../../utils/ExpandingPool.js";

class TextSystem {
    constructor(spriteKey) {

            this.elements = [];
            this.spriteKey = spriteKey;
            let letterPools = {};

            let addElement = function(sysKey, callback) {
                callback(new GuiTextElement(guiStringPool))
            };

        let addStringElement = function(sysKey, callback) {
            let element = new GuiString(letterPools);
            callback(element)
        };

        let guiStringPool = new ExpandingPool('strings', addStringElement);
            this.expandingPool = new ExpandingPool('text_elements', addElement);
        };

        initTextSystem = function(callback) {

            let textSystem = this;

            let onTextSetting = function(src, data) {
                textSystem.spriteKey = data.config["sprite_atlas"];
                GuiAPI.addUiSystem(src, data.config["sprite_atlas"],  data.config["mesh_asset"],   data.config["pool_size"], data.config["render_order"]);
                callback();

            };

            GuiAPI.getGuiSettings().initGuiSettings(["UI_TEXT_MAIN"], onTextSetting)

        };

        getSpriteKey = function() {
            return this.spriteKey;
        };

        addTextElement = function(element) {
            this.elements.unshift(element);
        };

        removeTextElement = function(element) {

            element.recoverTextElement();
            this.expandingPool.returnToExpandingPool(element);

        };

        buildTextElement = function(cb, dataId) {

            let getElement = function(elem) {

                elem.setElementDataKeys('SPRITE_FONT', this.spriteKey, dataId);

                cb(elem);
            }.bind(this);

            this.expandingPool.getFromExpandingPool(getElement)

        };

    }

export { TextSystem }