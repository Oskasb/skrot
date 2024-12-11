import { ElementStateProcessor } from "../states/ElementStateProcessor.js";
import { GuiSurface } from "./GuiSurface.js";
import { GuiIcon } from "./GuiIcon.js";

import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {Quaternion} from "../../../../../libs/three/math/Quaternion.js";

let tempVec = new Vector3();

class GuiWidget {
    constructor(configId) {
        this.progString = '';
            this.uiKey = 'WIDGET';
            this.settingKey = "STANDARD_WIDGETS";
            this.elementStateProcessor = new ElementStateProcessor();
            this.configId = configId;

            this.tempVec = new Vector3();
            this.pos  = new Vector3();
            this.originalPosition = new Vector3();
            this.offsetPosition = new Vector3();
            this.size = new Vector3();
            this.extents = new Vector3();
            this.quat = new Quaternion();

            this.guiSurface = new GuiSurface();
            this.text       = null;
            this.icon       = null;

            this.parent = null;
            this.children = [];


            let onAspectChange = function() {
                this.notifyAspectChange();
            }.bind(this);

        let onStringReady = function() {
                this.notifyStringReady();
            }.bind(this);

        let onElementActivate = function(inputIndex) {
         //   GuiAPI.printDebugText("GUI WIDGET - ACTIVATE");
                this.notifyElementActivate(inputIndex);
            }.bind(this);

        let onElementPressStart = function(guiPointer) {
        //    GuiAPI.printDebugText("GUI WIDGET - PRESS START");
                this.notifyElementPressStart(guiPointer.inputIndex);
            }.bind(this);

        let testWidgetIsActive = function() {
         //   GuiAPI.printDebugText("GUI WIDGET - TEST ACTIVE");
                return this.testElementIsActive();
            }.bind(this);

        this.eventListeners = [];

            this.callbacks = {
                onAspectChange:onAspectChange,
                onStringReady:onStringReady,
                onElementActivate:onElementActivate,
                onElementPressStart:onElementPressStart,
                testWidgetIsActive:testWidgetIsActive,
                testActive:[],
                onActivate:[],
                onPressStart:[]
            }
        };



        initGuiWidget = function(pos, cb) {

            if (pos) {
                this.originalPosition.copy(pos);
            //    GameScreen.fitView(this.originalPosition)
            } else {
                this.originalPosition.set(0, 0, 0);
            }

            this.offsetPosition.set(0, 0, 0);

            let config = GuiAPI.getGuiSettings().getSettingConfig(this.uiKey, this.settingKey)[this.configId];

            this.setLayoutConfigId(config['layout']);

            let rq = 0;
            let rd = 0;

            let onWidgetStateUpdate = function() {
                this.updateWidgetStateFeedback();
            }.bind(this);

            let checkRd = function() {

                rd++;
                if (rq===rd) {

                    this.guiSurface.registerStateUpdateCallback(onWidgetStateUpdate);
                    GuiAPI.addAspectUpdateCallback(this.callbacks.onAspectChange);
                    this.guiSurface.addOnActivateCallback(this.callbacks.onElementActivate);
                    this.guiSurface.addOnPressStartCallback(this.callbacks.onElementPressStart);
                    this.guiSurface.setTestActiveCallback(this.callbacks.testWidgetIsActive);
                    this.updateWidgetStateFeedback();
                    this.setPosition(this.originalPosition);
                    this.guiSurface.updateInterativeState();
                    if (typeof (cb) === 'function') {
                        cb(this);
                    }
                }

            }.bind(this);

            let surfaceReady = function() {

                rq++;

                if (config['text']) {
                    rq++;
                    this.initWidgetText(config.text, checkRd);
                }

                if (config['icon']) {
                    rq++;
                    this.initWidgetIcon(config.icon, checkRd);
                }

                checkRd();

            }.bind(this);


            if (config['surface']) {
                this.initWidgetSurface(config.surface, surfaceReady);
            } else {
                console.log("GuiWidget config requires a surface", config)
            }

        };

        applyWidgetOptions = function(options) {

            if (typeof(options.dispatch) === 'object') {
                options.onActivate = function() {
                    evt.dispatch(ENUMS.Event[options.dispatch.event], options.dispatch.value)
                }
            }

            if (typeof(options.on_event) === 'object') {

                let onEvent = function(event) {
                    this[options.on_event.call](event.value);
                }.bind(this)
                this.eventListeners.push({event:ENUMS.Event[options.on_event.event_id], callback:onEvent});
                evt.on(ENUMS.Event[options.on_event.event_id], onEvent)
            }

            if (typeof(options.testActive) === 'function') {
                this.addTestActiveCallback(options.testActive);
            }

            if (typeof(options['test_active']) === 'object') {
                let testActive = options['test_active']
                if (testActive['track_config']) {
                    let track = testActive['track_config']
                    let category = track['category'];
                    let key = track['key'];
                    let value = track['value'];
                    let trackValues = PipelineAPI.getCachedConfigs()[category][key];
                    let testActiveFunction = function() {
                        return trackValues[value];
                    }
                    this.addTestActiveCallback(testActiveFunction);
                }
            }

            if (typeof(options['text_dynamic']) === 'object') {
                let dynamicText = options['text_dynamic']
                if (dynamicText['track_config']) {
                    let track = dynamicText['track_config']
                    let category = track['category'];
                    let key = track['key'];
                    let value = track['value'];
                    let trackValues = PipelineAPI.getCachedConfigs()[category][key];

                    let print;
                    if (trackValues.gamePiece) {
                        print = trackValues.gamePiece.getStatusByKey(value);
                    } else {
                        print = trackValues[value]
                    }
                    this.printWidgetText(print);
                }
            }

            if (typeof(options.onActivate) === 'function') {
                this.addOnActiaveCallback(options.onActivate);
            }

            if (options.anchor) {
                this.attachToAnchor(options.anchor);
            }

            if (options.offset_x) {
                this.offsetPosition.x = options.offset_x;
            }

            if (options.offset_y) {
                this.offsetPosition.y = options.offset_y;
            }

            if (options['pos_x']) {
                this.originalPosition.x = options['pos_x'];
                this.pos.x = options['pos_x'];
            }

            if (options['pos_y']) {
                this.originalPosition.y = options['pos_y'];
                this.pos.y = options['pos_y'];
            }

            if (options.text) {
                if (typeof (options.text) === 'string') {
                    this.printWidgetText(options.text);
                } else if (options.text.length) {
                    for (let i=0; i < options.text.length; i++) {
                        this.printWidgetText(options.text[i]);
                    }
                }
            }

            if (options.icon) {
                this.setWidgetIconKey(options.icon);
            }

            if (options.interactive) {
                this.enableWidgetInteraction();
            }

            if (typeof(options.container) === 'object') {
                options.container.addChildWidgetToContainer(this);
            }

            if (options.set_parent) {
        //        console.log("Set Parent")
                options.set_parent.addChild(this);
            }

            if (options.fbConfigId) {
                this.guiSurface.setFeedbackConfigId(options.fbConfigId);
            }


            this.applyWidgetPosition();

        };


        setLayoutConfigId = function(layoutConfigId) {
            this.layoutConfigId = layoutConfigId;
        };

        getLayoutConfigId = function() {
            return this.layoutConfigId;
        };


        initWidgetSurface = function(surfaceConf, surfaceReady) {

            let setupSurface = function() {
                surfaceReady();
            };

            this.guiSurface.setFeedbackConfigId(surfaceConf.feedback);

            this.guiSurface.setupSurfaceElement( surfaceConf['nineslice'] , setupSurface);

        };

        initWidgetText = function(txtConf, cb) {

            let textCB = function (txtElem) {
                txtElem.setFeedbackConfigId(txtConf.feedback);
                this.text = txtElem;
                cb()
            }.bind(this);

            GuiAPI.getTextSystem().buildTextElement(textCB, txtConf.sprite_font);

        };


        initWidgetIcon = function(iconConf, cb) {

            let addLetterCb = function(bufferElem) {
                this.icon.initIconBuffers(bufferElem);
                cb()
            }.bind(this);

            this.icon = new GuiIcon();
            this.icon.setFeedbackConfigId(iconConf.feedback);
            this.icon.setConfigParams(iconConf.icon_config);

            GuiAPI.buildBufferElement(this.icon.sysKey, addLetterCb)

        };

        updateWidgetStateFeedback = function() {

            let state = this.guiSurface.getInteractiveState();
            this.elementStateProcessor.applyElementStateFeedback(this.guiSurface, state);

            if (this.text) {
                if (this.text.guiStrings.length) {
                    this.elementStateProcessor.applyStateToTextElement(this.text, state);
                }
            }

            if (this.icon) {
                this.elementStateProcessor.applyStateToIconElement(this.icon, state);
            }

        };


        setTextRGBA(rgba) {
            this.text.setTextColor(rgba)
        }

        setIconRGBA(rgba) {
            this.icon.setGuiIconColorRGBA(rgba);
        }

        setSurfaceRGBA(rgba) {
            this.guiSurface.setSurfaceColor(rgba);
        }

        updateIconPosition = function() {
            this.guiSurface.getSurfaceExtents(this.extents);
            this.icon.updateGuiIconPosition(this.guiSurface.minXY, this.extents);
        };

        updateTextPositions = function() {
            this.text.updateTextMinMaxPositions(this.guiSurface);
        };

        updateSurfacePositions = function() {
/*
// Not to be done here?
            this.tempVec.copy(this.size);
            tempVec.copy(this.pos);
            if (!GuiAPI.aspect < 1) {
                this.tempVec.multiplyScalar(GuiAPI.aspect);

                tempVec.multiplyScalar(GuiAPI.aspect);
            }
*/
            this.guiSurface.setSurfaceCenterAndSize(this.pos, this.size);
            this.guiSurface.positionOnCenter();
            this.guiSurface.fitToExtents();
        };


        notifyAspectChange = function() {

            this.applyWidgetPosition();
        //    this.applyWidgetPosition();
        //    this.setPosition(this.originalPosition);
        };

        notifyStringReady = function() {
            //    let state = this.guiSurface.getInteractiveState();
            //    ElementStateProcessor.applyStateToTextElement(this.text, state);
            this.updateTextPositions();
            this.updateSurfacePositions();
            this.updateWidgetStateFeedback();
        };

        printWidgetText = function(string) {

            if (!this.text) {
                console.log("No text element present!", this);
                return;
            }

            this.text.drawTextString(GuiAPI.getTextSysKey(), string, this.callbacks.onStringReady);
        };



        notifyElementActivate = function(inputIndex) {

            for (let i = 0; i < this.callbacks.onActivate.length; i++) {
                this.callbacks.onActivate[i](inputIndex, this)
            }

        };


        addOnActiaveCallback = function(cb) {
            this.callbacks.onActivate.push(cb)
        };

        removeOnActiaveCallback = function(cb) {
            MATH.quickSplice(this.callbacks.onActivate, cb);
        };


        notifyElementPressStart = function(inputIndex) {

            for (let i = 0; i < this.callbacks.onPressStart.length; i++) {
                this.callbacks.onPressStart[i](inputIndex, this)
            }

        };


        addOnPressStartCallback = function(cb) {
            this.callbacks.onPressStart.push(cb)
        };

        removePressStartCallback = function(cb) {
            MATH.quickSplice(this.callbacks.onPressStart, cb);
        };


        testElementIsActive = function() {

            let active = false;

            for (let i = 0; i < this.callbacks.testActive.length; i++) {
                if (this.callbacks.testActive[i](this)) {
                    active = true;
                }
            }

            return active;
        };

        addTestActiveCallback = function(cb) {
            this.callbacks.testActive.push(cb)
        };

        removeTestActiveCallback = function(cb) {
            MATH.quickSplice(this.callbacks.testActive, cb);
        };



        getWidgetSurface = function() {
            return this.guiSurface;
        };

        getWidgetOuterSize = function(store) {
            this.guiSurface.getSurfaceExtents(store)
        };

        getWidgetMinMax = function(minXY, maxXY) {
            minXY.copy(this.guiSurface.minXY);
            maxXY.copy(this.guiSurface.maxXY);
        };

        setPosition = function(pos) {
            this.originalPosition.copy(pos);
            this.applyWidgetPosition();
        };


        offsetWidgetPosition = function(offset) {
            this.offsetPosition.copy(offset);
            this.applyWidgetPosition();
        };


        setWidgetRotation = function(angle) {
            let tempObj = ThreeAPI.tempObj;
            tempObj.quaternion.set(0, 0, 0, 1);
            tempObj.rotateZ(angle);
            this.guiSurface.bufferElement.setQuat(tempObj.quaternion)
            if (this.icon) {
                this.icon.bufferElement.setQuat(tempObj.quaternion)
            }
        }

        applyWidgetPosition = function() {
        //    GuiAPI.debugDrawGuiPosition(this.originalPosition.x, this.originalPosition.y);
                this.elementStateProcessor.applyElementLayout(this);
        //    GuiAPI.debugDrawGuiPosition(this.pos.x, this.pos.y);

            this.updateSurfacePositions();

            if (this.text) {
                this.updateTextPositions();
            }

            if (this.icon) {
                this.updateIconPosition();
            }

            for (let i = 0; i < this.children.length; i++) {
                this.children[i].setPosition(this.pos);
            }

        };

        removeChild = function(guiWidget) {
            guiWidget.parent = null;
            MATH.quickSplice(this.children, guiWidget);
        };


        removeChildren = function() {
            while (this.children.length) {
               this.children.pop().recoverGuiWidget();
            }
        };

        addChild = function(guiWidget) {
            if (guiWidget.parent) {
                guiWidget.parent.removeChild(guiWidget)
            }
            guiWidget.parent = this;
            guiWidget.originalPosition.copy(this.pos);
            guiWidget.pos.copy(this.pos);
            this.children.push(guiWidget);
            guiWidget.applyWidgetPosition();
        };


        detatchFromParent = function() {

            if (this.parent) {
                this.parent.removeChild(this)
            }
        };


        attachToAnchor = function(key) {
            let anchor = GuiAPI.getAnchorWidget(key);
            anchor.applyWidgetPosition();
            anchor.addChild(this);
            anchor.applyWidgetPosition();
        };


        setWidgetIconKey = function(iconKey) {

            if (!this.icon) {
                console.log("Widget requires icon configureation", iconKey, this);
                return;
            }

            this.icon.setIconKey(iconKey);

        };



        setFirstSTringText = function(string) {

            if (this.text.guiStrings.length) {
                if (this.text.guiStrings[0].string !== string) {
                    this.text.guiStrings[0].setString(string, this.text.uiSysKey);
                    this.updateTextPositions();
                }
            } else {
                this.printWidgetText(string);
            }
        };


        setWidgetInteractiveState = function(state) {

            this.guiSurface.setSurfaceInteractiveState(state);

            if (this.text) {
                if (this.text.guiStrings.length) {
                    this.elementStateProcessor.applyStateToTextElement(this.text, state);
                }
            }

            if (this.icon) {
                this.elementStateProcessor.applyStateToIconElement(this.icon, state);
            }

        };

        numberToDigits = function(current, digits, min) {
            if (typeof(digits) === 'number') {
                if (digits === 0) {
                    this.progString = ''+Math.round(current);
                } else {
                    this.progString = parseFloat((current).toFixed(digits)).toString().replace(/\.([0-9])$/, ".$"+digits)
                    if (this.progString.length < digits + min) {
                        this.progString += '.';
                        for (let i = 0; i < digits; i++) {
                            this.progString+= '0';
                        }
                    }
                }
            } else {
                this.progString = ''+current;
            }

            return this.progString;
        };

        indicateProgress = function(min, max, current, digits) {

            if (this.text) {
                this.setFirstSTringText(this.numberToDigits(current, digits, 0))
            }

            if (this.icon) {
                this.icon.setIconProgressState(min, max, current);
                this.updateIconPosition();
            }

        };

        enableWidgetInteraction = function() {
            if (!this.interactive) {
                this.interactive = true;
                GuiAPI.registerInteractiveGuiElement(this.guiSurface);
            }
        };

        disableWidgetInteraction = function() {
            if (this.interactive) {
                GuiAPI.unregisterInteractiveGuiElement(this.guiSurface);
                this.interactive = false;
            }
        };

        recoverGuiWidget = function() {
            this.disableWidgetInteraction();
            GuiAPI.removeAspectUpdateCallback(this.callbacks.onAspectChange);

            this.removeChildren();
            this.detatchFromParent();

            this.guiSurface.recoverGuiSurface();

            if (this.guiStatsPanel) {
                this.guiStatsPanel.removeGuiWidget();
            }

            if (this.text) {
                this.text.recoverTextElement();
            }

            if (this.icon) {
                this.icon.releaseGuiIcon();
            }

            while (this.eventListeners.length) {
                let event = this.eventListeners.pop()
                evt.removeListener(event.event, event.callback, evt);
            }

            while (this.callbacks.onActivate.length) {
                this.callbacks.onActivate.pop()
            }

            while (this.callbacks.onPressStart.length) {
                this.callbacks.onPressStart.pop()
            }

            while (this.callbacks.testActive.length) {
                this.callbacks.testActive.pop()
            }

        };
    }

export { GuiWidget }