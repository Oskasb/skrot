import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {detachConfig} from "../../utils/ConfigUtils.js";
import {getPlayerStatus, getSetting, setPlayerStatus} from "../../utils/StatusUtils.js";
import {isPressed} from "../input/KeyboardState.js";
import {ENUMS} from "../../ENUMS.js";
import {getPlayerActor} from "../../utils/ActorUtils.js";
import {evt} from "../../event/evt.js";

function inputUpdate(value) {
    console.log("Chat input updated ", value)
    return value;
}

class DomChat {
    constructor() {

        let statusMap = {
            enterPressed:false,
            onUpdate:inputUpdate,
            inputActive:1,
            messages:[]
        }
        let rootElem = null;
        let htmlElem;
        let inputElement = poolFetch('HtmlElement')
        let outputElement = poolFetch('HtmlElement')
        let saveContainerDiv = null;
        let chatOutputBox = null;
        let saveButtonDiv = null;

        let inputElem = null;
        let maxMessageCount = 20;


        const conditionRegex = /([a-zA-Z0-9:\.\/\(\)\-\s])/g;

        function applySave() {

            let inValue = statusMap.in;

            let actor = getPlayerActor()

            if (conditionRegex.test(inValue)) {
                gtag('event', 'CHAT_SEND', {
                    "event_category": "CHAT",
                    "event_label": inValue
                });

                if (actor) {
                    actor.sendChatMessage(statusMap.in, ENUMS.Channel.CHANNEL_SAY)
                } else {
                    evt.dispatch(ENUMS.Event.SEND_SOCKET_MESSAGE, {
                        request:ENUMS.ClientRequests.SEND_CHAT_MESSAGE,
                        text:statusMap.in,
                        info:{channel: ENUMS.Channel.CHANNEL_SAY}
                    })
                }

                console.log('Send player message', statusMap.in);
            } else {
                if (actor) {
                    actor.actorText.say("Sorry but I could not say that...");
                }

                console.log('Invalid player message', statusMap.in);
            }

            inputElem.value = "";

        }

        let loadConfig = null;

        let inputRoot;
        let outputRoot;

        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;

            rootElem = htmlEl.call.getRootElement();
            inputRoot = inputElement.call.getIframe();
            outputRoot = outputElement.call.getIframe();
            inputElement.hideHtmlElement()
            chatOutputBox = outputElement.call.getChildElement('chat_output');


            inputElem = inputElement.call.getChildElement('string');
            saveButtonDiv = inputElement.call.getChildElement('save_button');
            DomUtils.addClickFunction(saveButtonDiv, applySave)
            saveContainerDiv = inputElement.call.getChildElement('save_container');
            ThreeAPI.registerPrerenderCallback(update);

            // autoclose the input element
            statusMap.enterPressed = true;
            setTimeout( applyEnterKeyReleased, 300)

        }.bind(this);

        function applyEnterKeyReleased() {
            if (statusMap.inputActive === false) {
                setPlayerStatus(ENUMS.PlayerStatus.CHAT_INPUT_ACTIVE, true);
            } else {
                applySave()

                setPlayerStatus(ENUMS.PlayerStatus.CHAT_INPUT_ACTIVE, false);
            }
        }

        let update = function() {

            let offsetX = getSetting(ENUMS.Settings.OFFSET_CHAT_X)*10;
            let offsetY = getSetting(ENUMS.Settings.OFFSET_CHAT_Y)*10;
            let offsetScale = 1 + getSetting(ENUMS.Settings.CHAT_SCALE) / 100

            let trf = DomUtils.buildCssTransform(offsetX, offsetY, 0, 0, offsetScale, 'em')

            inputElement.call.setBaseTransform(trf);
            outputElement.call.setBaseTransform(trf);

        //    DomUtils.transformElement3DPercent(inputRoot.body, , offsetX, offsetY);
        //    DomUtils.transformElement3DPercent(outputRoot.body, offsetX, offsetY, 0, 0, offsetScale, offsetX, offsetY);

            if (statusMap.in !== inputElem.value) {
                inputElem.value = statusMap.onUpdate(inputElem.value);
                statusMap.in = inputElem.value;
            }

            let inputActive = getPlayerStatus(ENUMS.PlayerStatus.CHAT_INPUT_ACTIVE)

            if (statusMap.inputActive !== inputActive) {
                statusMap.inputActive = inputActive;

                if (statusMap.inputActive === true) {
                    inputElement.showHtmlElement(0.2)
                    inputElem.value = "";
                    setTimeout(function() {
                        inputElem.value = "";
                        statusMap.in = "";
                        inputElem.focus();
                    }, 100);
                } else {
                    inputElem.blur();
                    inputElement.hideHtmlElement(0.8)
                }
            }

            let enterPressed = isPressed('Enter');
            if (statusMap.enterPressed !== enterPressed) {
                statusMap.enterPressed = enterPressed;
                if (enterPressed === false) {
                    applyEnterKeyReleased()
                }
            }

            if (Math.random() < 0.01) {
        //        evt.dispatch(ENUMS.Event.CHAT_MESSAGE, {text:"TEST TEXT "+Math.random(), info:{playerId:"", channel:""}})

            }

            for (let i = 0; i < messageDivs.length; i++) {
                let div = messageDivs[i];
                if (inputActive) {
                    if (div.style.opacity !== "1") {
                        div.style.opacity = "1";
                    }
                } else {
                    if (div.style.opacity === "1") {
                        div.style.opacity = "0";
                    }
                }

            }

        };

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(update);
            outputElement.closeHtmlElement();
            poolReturn(outputElement);
            inputElement.closeHtmlElement();
            poolReturn(inputElement);
            outputElement = null;
            inputElement = null;
        }

        let messageIndex = 0;
        let messageDivs = [];

        function onMessageEvent(e) {
            let message = {
                index:messageIndex,
                text:e.text,
                info:{}
            }
            messageIndex++;
            MATH.copyObjectValues(e.info, message.info);


            let clientId = message.info.clientId;



            statusMap.messages.push(message);
            let text = "<h2>"+message.info.name+": </h2>"
            text += "<p>"+message.text+"</p>"
            let mDiv = DomUtils.createDivElement(chatOutputBox, 'message_'+message.index, text, 'chat_message');
            DomUtils.addElementClass(mDiv, 'outlined')
            messageDivs.push(mDiv);
            setTimeout(function() {
                if (mDiv.style) {
                    mDiv.style.opacity = "1";
                }

            }, 500);

            if (statusMap.messages.length > maxMessageCount) {
                statusMap.messages.shift()
                let removeDiv = messageDivs.shift();
                DomUtils.removeDivElement(removeDiv);
            }
        }

        this.call = {
            close:close
        }

        let offsetX = getSetting(ENUMS.Settings.OFFSET_CHAT_X)*10;
        let offsetY = getSetting(ENUMS.Settings.OFFSET_CHAT_Y)*10;
        let offsetScale = 1 + getSetting(ENUMS.Settings.CHAT_SCALE) / 100

        let trf = DomUtils.buildCssTransform(offsetX, offsetY, 0, 0, offsetScale, 'em')
        let outputFrameReady = function() {
            inputElement.initHtmlElement('chat_input', null, statusMap, 'chat_frame_input', htmlReady);
            inputElement.call.setBaseTransform(trf);
        }

        outputElement.initHtmlElement('chat', null, statusMap, 'chat_frame', outputFrameReady);
        outputElement.call.setBaseTransform(trf);

        evt.on(ENUMS.Event.CHAT_MESSAGE, onMessageEvent)

    }


}

export { DomChat }