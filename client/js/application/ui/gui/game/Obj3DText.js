import { GuiScreenSpaceText } from "../widgets/GuiScreenSpaceText.js";
import { Vector3 } from "../../../../../libs/three/math/Vector3.js";
import {poolFetch} from "../../../utils/PoolUtils.js";
let tempVec1 = new Vector3();
let tempVec2 = new Vector3();
let tempVec3 = new Vector3()

let index = 0;
class Obj3DText {
    constructor(posVec) {
        this.index = index;
        index++
        let pos = posVec;

        this.posVec = new Vector3();

        let txtOrigin = new Vector3();

        let getTextOrigin = function() {
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:pos, color:'YELLOW', drawFrames:20});

            ThreeAPI.toScreenPosition(pos, txtOrigin)
            if (txtOrigin.z === 0) {
                GuiAPI.applyAspectToScreenPosition(txtOrigin, txtOrigin);
            }
            return txtOrigin;
        }

        let getSayTextPosition = function(progress, offsetVec3) {
            let pos = getTextOrigin();
            //      pos.x += MATH.curveSqrt(progress) *offsetVec3.x - offsetVec3.x*0.5;
            pos.y += progress*(Math.cos(progress*1.5)) * offsetVec3.y;
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
            getDamageTextPosition:getDamageTextPosition,
            getHealTextPosition:getHealTextPosition
        }

        let conf = {
            sprite_font: "sprite_font_debug",
            feedback: "feedback_text_red",
            rgba:  {r:1, g:0.2, b:-0.9, a:1},
            lutColor:ENUMS.ColorCurve.warmFire,
            textLayout: {"x": 0.5, "y": 0.5, "fontsize": 9},
            tPosOffset: new Vector3(0.04, 0.06, 1.7)
        };

        let confSay = {
            sprite_font: "sprite_font_debug",
            feedback: "feedback_text_red",
            rgba:  {r:0.1, g:0.25, b:2.0, a:1},
            lutColor:ENUMS.ColorCurve.randomBlue,
            textLayout: {"x": 0.5, "y": 0.5, "fontsize": 8},
            tPosOffset: new Vector3(0.04, 0.08, 1.7)
        };

        let confYell = {
            sprite_font: "sprite_font_debug",
            feedback: "feedback_text_red",
            rgba:  {r:1.0, g:0.95, b:0.75, a:1},
            lutColor:ENUMS.ColorCurve.warmFire,
            textLayout: {"x": 0.5, "y": 0.5, "fontsize": 8},
            tPosOffset: new Vector3(0.04, 0.05, 1.7)
        };

        let confHeal = {
            sprite_font: "sprite_font_debug",
            feedback: "feedback_text_red",
            rgba:  {r:0.01, g:1.0, b:-0.99, a:1},
            lutColor:ENUMS.ColorCurve.warmFire,
            textLayout: {"x": 0.5, "y": 0.5, "fontsize": 13},
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

        this.pieceTexts = [];

    }

    pieceTextPrint(string, messageType, duration) {
        let messageMap = this.messageMap;

        if (typeof (messageType) === 'undefined') {
            messageType = ENUMS.Message.DAMAGE_NORMAL_TAKEN;
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

        screenSpaceText.initScreenSpaceText(onReady, conf, duration);

        MATH.randomVector(tempVec3);
        tempVec3.multiply(conf.tPosOffset);
        tempVec3.x = Math.sin(GameAPI.getGameTime() * 9+Math.random()*0.6 + this.index)*conf.tPosOffset.x;
        tempVec3.y = conf.tPosOffset.y+Math.abs(Math.cos(GameAPI.getGameTime()*48 + this.index)*conf.tPosOffset.y);
        tempVec3.z = 0 // Math.cos(GameAPI.getGameTime())*conf.tPosOffset.z;
        screenSpaceText.setTransitionTargetPositionOffset(tempVec3);
    }

    say(string) {
        this.pieceTextPrint(string, ENUMS.Message.SAY, 4)
    }

    yell(string) {
        this.pieceTextPrint(string, ENUMS.Message.YELL, 4)
    }

}



export {Obj3DText}