import { WidgetBuilder } from "./widgets/WidgetBuilder.js";
import { GuiSettings } from "./GuiSettings.js";
import { Instantiator } from "../../../3d/three/instancer/Instantiator.js";
import { GuiDebug } from "./systems/GuiDebug.js";
import { GuiPageSystem } from "./systems/GuiPageSystem.js";
import { DebugView } from "../../debug/DebugView.js";
import { OnScreenText } from "./game/OnScreenText.js";
import {WorldInteractUiSystem} from "./systems/WorldInteractUiSystem.js";
import {WorldEncounterUISystem} from "./systems/WorldEncounterUISystem.js";
import {NavigationStatePageSystem} from "./systems/NavigationStatePageSystem.js";
import {DomTransition} from "../dom/DomTransition.js";
import {DomCharacter} from "../dom/DomCharacter.js";
import {poolFetch} from "../../utils/PoolUtils.js";
import {isDev} from "../../utils/DebugUtils.js";

import {DomMinimap} from "../dom/DomMinimap.js";
import {DomWorldHud} from "../dom/DomWorldHud.js";
import {getSetting} from "../../utils/StatusUtils.js";
import {DomChat} from "../dom/DomChat.js";


let guiTime = 0;
let worldInteractUiSystem = new WorldInteractUiSystem()
let worldEncounterUISystem = new WorldEncounterUISystem()

/*
let characterUiSystem = new NavigationStatePageSystem(ENUMS.NavigationState.CHARACTER, 'page_paperdoll_hero');
let partyNavUiSystem = new NavigationStatePageSystem(ENUMS.NavigationState.PARTY, 'page_scene_home');
let homeNavUiSystem = new NavigationStatePageSystem(ENUMS.NavigationState.HOME, 'page_scene_home');
let invNavUiSystem = new NavigationStatePageSystem(ENUMS.NavigationState.INVENTORY, 'page_scene_home');
let mapNavUiSystem = new NavigationStatePageSystem(ENUMS.NavigationState.MAP, 'page_scene_home');
*/
let domTransition;
let domCharacter;
let minimap = null;
let domWorldHud = null;

let rootElements = {};

class GuiAPI {
    constructor() {
        let inMenueFlag = false;
        domTransition = new DomTransition();
        this.aspect = 1;
        this.elementPools = {};
        this.inputSystem;
        this.textSystem;
        this.buttonSystem;
        this.instantiator = new Instantiator('guiInstantiator', this.elementPools);
        this.worldSpacePointers = [];

        this.basicText;
        this.onScreenText = new OnScreenText();
        this.txtSysKey = 'UI_TEXT_MAIN';
        this.guiUpdateCallbacks = [];
        this.inputUpdateCallbacks = [];
        this.aspectUpdateCallbacks = [];
        this.guiBuffers = {};
        this.anchorWidgets = {};
        this.registeredTextElements = {};

        this.debugViewActive = false;

        let _this = this;

        let callInputUpdateCallbacks = function(inputIndex, pointerState) {
            MATH.callAll(_this.inputUpdateCallbacks, inputIndex, pointerState);
        };

        let callAspectUpdateCallbacks = function(aspect) {
            //        console.log("Aspect:", aspect);
            MATH.callAll(_this.aspectUpdateCallbacks, aspect);
        };


        let updateInput = function(pointerState) {
            callInputUpdateCallbacks(pointerState.index, pointerState)
        };

        let setInMenu = function(bool) {
            inMenueFlag = bool;
        }

        let getInMenu = function() {
            return inMenueFlag;
        }


        this.calls = {
            callInputUpdateCallbacks:callInputUpdateCallbacks,
            callAspectUpdateCallbacks:callAspectUpdateCallbacks,
            updateInput:updateInput,
            setInMenu:setInMenu,
            getInMenu:getInMenu
        }
    };

    initGuiApi = function(onReadyCB) {


        if (isDev() === true) {
        //    this.debugViewActive = true
        //    this.debugView = new DebugView();
        //    this.guiDebug = new GuiDebug();
        }



        this.guiSettings = new GuiSettings();
        this.widgetBuilder = new WidgetBuilder();
        this.guiPageSystem = new GuiPageSystem();

        this.navigationState = null;

        let reqs = 0;
        let loads = 0;

        let loadCb = function(msg) {
            loads++
            evt.dispatch(ENUMS.Event.NOTIFY_LOAD_PROGRESS, {msg:msg, channel:'pipeline_message'})
            if (loads === reqs) {
                onReadyCB('loaded: '+loads);
            }
        };

        let loadUiConfig = function(key, dataId) {
            reqs++;
            this.guiSettings.loadUiConfig(key, dataId, loadCb);
        }.bind(this);

        this.guiSettings.initGuiSprite("SPRITES", "FONT_16x16");
        this.guiSettings.initGuiSprite("SPRITES", "GUI_16x16");
        this.guiSettings.initGuiSprite("SPRITES", "box_tiles_8x8");

        loadUiConfig("SURFACE_NINESLICE", "GUI_16x16");
        loadUiConfig("ICON_ELEMENTS", "GUI_16x16");
        loadUiConfig("SURFACE_LAYOUT", "SURFACES");
        loadUiConfig("WIDGET", "STANDARD_WIDGETS");
        loadUiConfig("FEEDBACK", "ICON");
        loadUiConfig("FEEDBACK", "SURFACE");
    //    loadUiConfig("FEEDBACK", "SURFACE_NINESLICE");
        loadUiConfig("FEEDBACK", "TEXT");
        loadUiConfig("SPRITE_FONT", "FONT_16x16");

        this.guiPageSystem.initGuiPageSystem();
        worldEncounterUISystem.initEncounterUiSystem();


    //    characterUiSystem.initNavigationPageSystem();
    //    partyNavUiSystem.initNavigationPageSystem();
    //    homeNavUiSystem.initNavigationPageSystem();
    //    invNavUiSystem.initNavigationPageSystem();
    //    mapNavUiSystem.initNavigationPageSystem();

        domCharacter = new DomCharacter();
    };

    notifyItemLooted(actor, item) {
        let notice = poolFetch('DomLootNotice')
        console.log(notice)
        notice.call.notify(actor, item);
    };



    activateMinimap() {
        if (minimap === null) {
            minimap = new DomMinimap()
        }

        if (domWorldHud === null) {
            domWorldHud = true // new DomWorldHud()
            new DomChat();
        }

    }

    inspectActor(actor) {
        domCharacter.call.activate(actor);
    }

    getWorldInteractionUi() {
        return worldInteractUiSystem
    }

    activatePage(pageId, callback) {
        return this.guiPageSystem.activateGuiPage(pageId, callback)
    }

    activateDomTransition(transitionName, data, callback, adsr, transitionOptions) {
        domTransition.call.activate(transitionName, data, callback, adsr);
        if (transitionOptions) {
            domTransition.call.setOptions(transitionOptions);
        }
        return domTransition;
    }

    screenText(string, msgType, duration) {
        this.onScreenText.screenTextPrint(string, msgType, duration)
    }

    addUiSystem = function(sysKey, uiSysKey, assetId, poolSize, renderOrder) {
    //    console.log("addInstanceSystem", sysKey, uiSysKey, assetId, poolSize, renderOrder)
        this.instantiator.addInstanceSystem(sysKey, uiSysKey, assetId, poolSize, renderOrder)
    };


    setUiStatusHtmlElement(uiStateKey, htmlElement) {
        rootElements[uiStateKey] = htmlElement;
    }

    getUiStatusHtmlElement(uiStateKey) {
        return rootElements[uiStateKey];
    }

    getBufferElementByUiSysKey = function(uiSysKey) {
        return this.instantiator.getElementBufferByKey(uiSysKey);
    }

    worldPosToScreen(posVec, store, max, distanceScale) {
        let distance = MATH.distanceBetween(posVec, ThreeAPI.getCamera().position)
        ThreeAPI.toScreenPosition(posVec, store);
        store.z = -distance*distanceScale;
        let distanceFactor = MATH.curveQuad(1-store.z);
        store.multiplyScalar(distanceFactor)
        MATH.clampVectorXY(store, -max*distanceFactor, max*distanceFactor, -max*distanceFactor, max*distanceFactor)
        this.applyAspectToScreenPosition(store, store);
        return store;
    }


    buildBufferElement = function(uiSysKey, cb) {
        //    console.log("buildBufferElement", uiSysKey)
        this.instantiator.buildBufferElement(uiSysKey, cb)
    };

    recoverBufferElement = function(uiSysKey, bufferElement) {
    //    console.log("buildBufferElement", uiSysKey)
        this.instantiator.recoverBufferElement(uiSysKey, bufferElement)
    };

    closePage(page) {
        this.guiPageSystem.closeGuiPage(page)
    }

    setNavigationState(navState) {
        this.navigationState = navState;
    }

    getNavigationState() {
        return this.navigationState;
    }


    registerTextSurfaceElement = function(elemKey, txtElem) {
        this.registeredTextElements[elemKey] = txtElem;
        this.textSystem.addTextElement(txtElem);
    };

    buildGuiWidget = function(widgetClassName, options, onReady) {
        this.widgetBuilder.buildWidget(widgetClassName, options, onReady);
    };

    buildWidgetOptions = function(options) {

        let opts = {};
        opts.widgetClass    = options.widgetClass || 'GuiSimpleButton';
        opts.configId       = options.configId || 'button_big_blue';
        opts.widgetCallback = options.widgetCallback || null;
        opts.onActivate     = options.onActivate || null;
        opts.testActive     = options.testActive || null;
        opts.interactive    = options.interactive || false;
        opts.text           = options.text || false;
        opts.offset_x       = options.offset_x || null;
        opts.offset_y       = options.offset_y || null;
        opts.anchor         = options.anchor || false;
        opts.container      = options.container || false;
        opts.set_parent     = options.set_parent || null;
        opts.icon           = options.icon || null
        opts.fbConfigId     = options.fbConfigId || null

        return opts
    };

    setInputSystem = function(inputSys) {
        this.inputSystem = inputSys;
    };

    getInputSystem = function() {
        return this.inputSystem;
    };

    setTextSystem = function(txtSys) {
        this.textSystem = txtSys;
    };

    getTextSystem = function() {
        return this.textSystem;
    };

    setButtonSystem(buttonSys) {
        this.buttonSystem = buttonSys
    }

    getGuiDebug = function() {
        return this.guiDebug;
    };

    getUiSprites = function(spriteKey) {
        return this.guiSettings.getUiSprites(spriteKey);
    };

    getGuiSettings = function() {
        return this.guiSettings;
    };

    getGuiSettingConfig = function(uiKey, dataKey, dataId) {
        return this.guiSettings.getSettingDataConfig(uiKey, dataKey, dataId);
    };


    debugDrawGuiPosition = function(x, y) {
        this.guiDebug.debugDrawPoint(x, y)
    };

    debugDrawRectExtents = function(minVec, maxVec) {
        this.guiDebug.drawRectExtents(minVec, maxVec)
    };

    printDebugText = function(string) {
        evt.dispatch(ENUMS.Event.DEBUG_TEXT, {value: string})
    //    this.guiDebug.addDebugTextString(string)
    };

    attachGuiToActor = function(actor) {
        actor.setActorGui(new ActorGui(actor))
    };

    detachActorGui = function(actor) {
        actor.getActorGui().removeAllGuiWidgets();
    };

    registerInteractiveGuiElement = function(surfaceElement) {
        this.inputSystem.registerInteractiveSurfaceElement(surfaceElement)
    };

    unregisterInteractiveGuiElement = function(surfaceElement) {
        this.inputSystem.unregisterInteractiveSurfaceElement(surfaceElement)
    };


    setAnchorWidget = function(key, widget) {
        this.anchorWidgets[key] = widget;
    };

    getAnchorWidget = function(key) {
        return this.anchorWidgets[key];
    };

    addInputUpdateCallback = function(cb) {
        this.inputUpdateCallbacks.push(cb);
    };

    removeInputUpdateCallback = function(cb) {
        MATH.splice(this.inputUpdateCallbacks, cb);
    };

    addGuiUpdateCallback = function(cb) {
        if (this.guiUpdateCallbacks.indexOf(cb) !== -1) {
            console.log("Gui updateCB already added... fix!")
            return;
        }
        this.guiUpdateCallbacks.push(cb);
    };

    removeGuiUpdateCallback = function(cb) {
        MATH.splice(this.guiUpdateCallbacks, cb);
    };

    addAspectUpdateCallback = function(cb) {
        this.aspectUpdateCallbacks.push(cb);
    };

    removeAspectUpdateCallback = function(cb) {
        MATH.splice(this.aspectUpdateCallbacks, cb);
    };


    applyAspectToScreenPosition = function(sourcePos, store) {
        store.copy(sourcePos);
        store.x = sourcePos.x * this.aspect;
    };

    setInputBufferValue = function(inputIndex, buffer, enumKey, value) {
        let idx = inputIndex*ENUMS.InputState.BUFFER_SIZE + enumKey;
        buffer[idx] = value;
    };

    readInputBufferValue = function(inputIndex, buffer, enumKey) {
        let idx = inputIndex*ENUMS.InputState.BUFFER_SIZE + enumKey;
        return buffer[idx]
    };

    setCameraAspect = function(camAspect) {
        if (this.aspect !== camAspect) {
            this.aspect = camAspect;
            this.calls.callAspectUpdateCallbacks(this.aspect);
        }
    };

    registerWorldSpacePointer = function(pointer) {
        GameAPI.handleWorldSpacePointerUpdate(pointer, true, false)
        this.worldSpacePointers.push(pointer);
    };

    releaseWorldSpacePointer = function(pointer) {
        if (MATH.arrayContains(this.worldSpacePointers, pointer)) {
            GameAPI.handleWorldSpacePointerUpdate(pointer, false, true)
            MATH.splice(this.worldSpacePointers, pointer)
        }
    };

    unregisterWorldSpacePointer = function(pointer) {
        GameAPI.deactivateWorldSpacePointer(pointer)
        MATH.splice(this.worldSpacePointers, pointer)
    };

    getWorldSpacePointers = function() {
        return this.worldSpacePointers
    };

    getTextSysKey = function() {
        return this.txtSysKey;
    };

    getUiSystemTime = function() {
        return guiTime;
    }

    updateGui = function(tpf, time) {

        if (getSetting(ENUMS.Settings.DEBUG_VIEW_ACTIVE) === 1) {
            if (this.debugViewActive === false) {
                this.debugViewActive = true;
                this.debugView = new DebugView();
                this.guiDebug = new GuiDebug();
            }
        } else {
            if (this.debugViewActive === true) {
                console.log("Deactivate Debug view here...");
                this.debugViewActive = false;
                this.debugView.closeDebugView();
            }
        }


        guiTime = time;

        for (let i = 0; i < this.worldSpacePointers.length; i++) {
            GameAPI.handleWorldSpacePointerUpdate(this.worldSpacePointers[i])
        };


        this.instantiator.updateInstantiatorBuffers();

        MATH.callAll(this.guiUpdateCallbacks, tpf, time);

    };

}

export { GuiAPI }