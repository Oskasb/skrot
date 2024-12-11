import { GuiScreenSpaceText } from "../widgets/GuiScreenSpaceText.js";
import { Vector3 } from "../../../../../libs/three/math/Vector3.js";
import {poolFetch} from "../../../utils/PoolUtils.js";
let tempVec1 = new Vector3();
let tempVec2 = new Vector3();
let tempVec3 = new Vector3()

let index = 0;
class OnScreenText {
    constructor() {
        this.index = index;
        index++
        let pos = new Vector3();

        let txtOrigin = new Vector3();

        let getTextOrigin = function() {
            txtOrigin.set(0, 0, 0)
            return txtOrigin;
        }

        let getHintOrigin = function() {
            txtOrigin.set(0, -0.1, 0)
            return txtOrigin;
        }

        let getSystemOrigin = function() {
            txtOrigin.set(0.1, -0.4, 0)
            return txtOrigin;
        }

        let getPingOrigin = function() {
            txtOrigin.set(0.1, -0.39, 0)
            return txtOrigin;
        }

        let getServerStatusOrigin = function() {
            txtOrigin.set(0.0, 0.4, 0)
            return txtOrigin;
        }

        let getEditStatusOrigin = function() {
            txtOrigin.set(0.2, 0.2, 0)
            return txtOrigin;
        }

        let getSayTextPosition = function(progress, offsetVec3) {
            let pos = getTextOrigin();
            //      pos.x += MATH.curveSqrt(progress) *offsetVec3.x - offsetVec3.x*0.5;
            pos.y += progress*(MATH.curveCube(progress*0.2)) * 0.3;
            return pos;
        }

        let getHintTextPosition = function(progress, offsetVec3) {
            let pos = getHintOrigin();
            //      pos.x += MATH.curveSqrt(progress) *offsetVec3.x - offsetVec3.x*0.5;
            pos.y += progress*(Math.sin(MATH.curveQuad(progress)*1.9)) * -0.1;
            return pos;
        }

        let getSystemTextPosition = function(progress, offsetVec3) {
            let pos = getSystemOrigin();
            //      pos.x += MATH.curveSqrt(progress) *offsetVec3.x - offsetVec3.x*0.5;
            pos.y += progress*(Math.sin(progress*0.5)) * -0.05;
            return pos;
        }

        let getServerStatusPosition = function(progress, offsetVec3) {
            let pos = getServerStatusOrigin();
            //      pos.x += MATH.curveSqrt(progress) *offsetVec3.x - offsetVec3.x*0.5;
            pos.y += progress*(Math.sin(progress*0.6)) * 0.03;
            return pos;
        }

        let getEditStatusPosition = function(progress, offsetVec3) {
            let pos = getEditStatusOrigin();
            //      pos.x += MATH.curveSqrt(progress) *offsetVec3.x - offsetVec3.x*0.5;
            pos.y += progress*(Math.sin(progress*0.6)) * 0.01;
            return pos;
        }

        let getSaveStatusPosition = function(progress, offsetVec3) {
            let pos = getEditStatusOrigin();
            //      pos.x += MATH.curveSqrt(progress) *offsetVec3.x - offsetVec3.x*0.5;
            pos.y -= 0.1;
            pos.y -= progress*(Math.cos(progress*1.6)) * 0.02;
            return pos;
        }

        let getLoadStatusPosition = function(progress, offsetVec3) {
            let pos = getEditStatusOrigin();
            pos.y -= 0.13;
            //      pos.x += MATH.curveSqrt(progress) *offsetVec3.x - offsetVec3.x*0.5;
            pos.y += progress*(Math.sin(progress*0.6)) * 0.02;
            return pos;
        }

        let getPingTextPosition = function(progress, offsetVec3) {
            let pos = getPingOrigin();
            //      pos.x += MATH.curveSqrt(progress) *offsetVec3.x - offsetVec3.x*0.5;
            pos.y += progress*(Math.cos(progress*1.4)) * 0.03;
            return pos;
        }

        let getDamageTextPosition = function(progress, offsetVec3) {
            let pos = getTextOrigin();
            pos.x += MATH.curveSqrt(progress) *offsetVec3.x - offsetVec3.x*0.3;
            pos.y += progress*(Math.cos(progress*2)) * offsetVec3.y + offsetVec3.y*0.05;
            return pos;
        }

        let getHealTextPosition = function(progress, offsetVec3) {
            let pos = getTextOrigin();
            pos.x += MATH.curveSqrt(progress) *offsetVec3.x - offsetVec3.x*0.3;
            pos.y += progress*(Math.cos(progress*2.5)) * offsetVec3.y - 0.07;
            return pos;
        }

        let setPosVec = function(posVec) {
            pos = posVec;
        }

        this.call = {
            setPosVec:setPosVec,
            getTextOrigin:getTextOrigin,
            getSayTextPosition:getSayTextPosition,
            getHintTextPosition:getHintTextPosition,
            getSystemTextPosition:getSystemTextPosition,
            getDamageTextPosition:getDamageTextPosition,
            getHealTextPosition:getHealTextPosition,
            getPingTextPosition:getPingTextPosition,
            getServerStatusPosition:getServerStatusPosition,
            getEditStatusPosition:getEditStatusPosition,
            getSaveStatusPosition:getSaveStatusPosition,
            getLoadStatusPosition:getLoadStatusPosition
        }

        let conf = {
            sprite_font: "sprite_font_debug",
            feedback: "feedback_text_red",
            rgba:  {r:1, g:0.2, b:-0.9, a:1},
            lutColor:ENUMS.ColorCurve.warmFire,
            textLayout: {"x": 0.5, "y": 0.5, "fontsize": 14},
            tPosOffset: new Vector3(0.04, 0.06, 1.7)
        };

        let confSay = {
            sprite_font: "sprite_font_debug",
            feedback: "feedback_text_red",
            rgba:  {r:0.1, g:0.25, b:2.0, a:1},
            lutColor:ENUMS.ColorCurve.randomBlue,
            textLayout: {"x": 0.5, "y": 0.5, "fontsize": 14},
            tPosOffset: new Vector3(0.0, 1.2, 0)
        };

        let confHint = {
            sprite_font: "sprite_font_debug",
            feedback: "feedback_text_red",
            rgba:  {r:2, g:1, b:-1, a:1},
            lutColor:ENUMS.ColorCurve.warmToCold,
            textLayout: {"x": 0.5, "y": 0.5, "fontsize": 11},
            tPosOffset: new Vector3(0.04, 0.06, 1.7)
        };

        let confSystem = {
            sprite_font: "sprite_font_debug",
            feedback: "feedback_text_red",
            rgba:  {r:0.3, g:0.65, b:2.0, a:1},
            lutColor:ENUMS.ColorCurve.randomBlue,
            textLayout: {"x": 0.5, "y": 0.5, "fontsize": 7},
            tPosOffset: new Vector3(0.0, 1.2, 0)
        };

        let confYell = {
            sprite_font: "sprite_font_debug",
            feedback: "feedback_text_red",
            rgba:  {r:1.0, g:0.95, b:0.75, a:1},
            lutColor:ENUMS.ColorCurve.warmFire,
            textLayout: {"x": 0.5, "y": 0.5, "fontsize": 14},
            tPosOffset: new Vector3(0.04, 0.05, 1.7)
        };

        let confHeal = {
            sprite_font: "sprite_font_debug",
            feedback: "feedback_text_red",
            rgba:  {r:0.01, g:1.0, b:-0.99, a:1},
            lutColor:ENUMS.ColorCurve.warmFire,
            textLayout: {"x": 0.5, "y": 0.5, "fontsize": 14},
            tPosOffset: new Vector3(0.02, 0.08, 1.7)
        };

        this.messageMap = {};

        this.messageMap[ENUMS.Message.SAY]                      = {getPos:this.call.getSayTextPosition, config:confSay};
        this.messageMap[ENUMS.Message.YELL]                     = {getPos:this.call.getSayTextPosition, config:confYell};
        this.messageMap[ENUMS.Message.WHISPER]                  = {getPos:this.call.getTextOrigin, config:conf};
        this.messageMap[ENUMS.Message.DAMAGE_NORMAL_TAKEN]      = {getPos:this.call.getDamageTextPosition, config:conf};
        this.messageMap[ENUMS.Message.DAMAGE_NORMAL_DONE]       = {getPos:this.call.getDamageTextPosition, config:conf};
        this.messageMap[ENUMS.Message.DAMAGE_CRITICAL_TAKEN]    = {getPos:this.call.getDamageTextPosition, config:conf};
        this.messageMap[ENUMS.Message.DAMAGE_CRITICAL_DONE]     = {getPos:this.call.getDamageTextPosition, config:conf};
        this.messageMap[ENUMS.Message.HEALING_GAINED]           = {getPos:this.call.getHealTextPosition, config:confHeal};
        this.messageMap[ENUMS.Message.HINT]                     = {getPos:this.call.getHintTextPosition, config:confHint};
        this.messageMap[ENUMS.Message.SYSTEM]                   = {getPos:this.call.getSystemTextPosition, config:confSystem};
        this.messageMap[ENUMS.Message.PING]                     = {getPos:this.call.getPingTextPosition, config:confSystem};
        this.messageMap[ENUMS.Message.SERVER_STATUS]            = {getPos:this.call.getServerStatusPosition, config:confSystem};
        this.messageMap[ENUMS.Message.EDIT_STATUS]              = {getPos:this.call.getEditStatusPosition, config:confSystem};
        this.messageMap[ENUMS.Message.SAVE_STATUS]              = {getPos:this.call.getSaveStatusPosition, config:confSystem};
        this.messageMap[ENUMS.Message.LOAD_STATUS]              = {getPos:this.call.getLoadStatusPosition, config:confSystem};

        this.pieceTexts = [];

    }

    screenTextPrint(string, messageType, duration) {
        let messageMap = this.messageMap;

        if (typeof (messageType) === 'undefined') {
            messageType = ENUMS.Message.SAY;
        }

        let conf = messageMap[messageType].config;
        let rgba = conf.rgba || {r:1, g:0.3, b:0.1, a:1}
        let lutColor = conf.lutColor || ENUMS.ColorCurve.yellow_5;
        let call = this.call;


        let positionText = function(txtElem, textProgress) {
            let txtPosVec3 = messageMap[messageType].getPos(textProgress, txtElem.tPosOffset)
            tempVec2.set(1.0, 0.5, 0);
            tempVec2.add(txtPosVec3)
            txtElem.surface.maxXY.addVectors(txtPosVec3, tempVec2);
            txtElem.surface.minXY.subVectors(txtPosVec3, tempVec2);
            txtElem.callbacks.getTextElement().updateTextMinMaxPositions(txtElem.surface);
            rgba.a = 1 - MATH.curveSigmoid(textProgress);
            txtElem.callbacks.getTextElement().setTextColor(rgba, ENUMS.ColorCurve.red_3);
        };

        let onReady = function(ssTxt) {
            positionText(ssTxt);
            ssTxt.callbacks.setPositionFunction(positionText);
            ssTxt.activateScreenSpaceText();
            ssTxt.updateTextContent(string)
        }.bind(this);

        let initPos = this.call.getTextOrigin()
        if (initPos.y < 0) {
            return;
        }

        let screenSpaceText = poolFetch('GuiScreenSpaceText')

        screenSpaceText.initScreenSpaceText(onReady, conf, duration || 4);

        tempVec3.x = conf.tPosOffset.x;
        tempVec3.y = 0;
        tempVec3.z = 0 // Math.cos(GameAPI.getGameTime())*conf.tPosOffset.z;
        screenSpaceText.setTransitionTargetPositionOffset(tempVec3);
    }

}



export {OnScreenText}