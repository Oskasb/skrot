import { InteractiveElement } from "../states/InteractiveElement.js";
import {Vector3} from "../../../../../../libs/three/math/Vector3.js";

class GuiSurface {
    constructor() {
            this.sprite = {x:7, y:0, z:1, w:1};
            this.scale  = {x:1.0, y:1.0, z:1.0};
            this.centerXY = new Vector3();
            this.minXY = new Vector3();
            this.maxXY = new Vector3();
            this.anchor = new Vector3();
            this.active = false;
            this.inputIndex = -1;
            this.guiPointer = null;
            this.onUpdateCallbacks = [];
            this.onActivateCallbacks = [];
            this.onPressStartCallbacks = [];
            this.interactiveElement = new InteractiveElement(this);
        };

        setupSurfaceElement = function(configId, callback) {

            this.configId = configId;

            this.config =  GuiAPI.getGuiSettingConfig( "SURFACE_NINESLICE", "GUI_16x16", this.configId);

            this.testActiveCallback = function() {
                return this.active;
            };

            let addSurfaceCb = function(bufferElem) {
                this.setBufferElement(bufferElem);
                this.applySurfaceConfig();
                callback(this)
            }.bind(this);

            this.sysKey = this.config.image.layer

            GuiAPI.buildBufferElement(this.sysKey, addSurfaceCb);
        };



        updateInterativeState = function() {
            this.interactiveElement.applyActiveState();
            // this.applyStateFeedback()
        };

        setFeedbackConfigId = function(feedbackConfigId) {
            this.feedbackConfigId = feedbackConfigId;
        };

        getFeedbackConfigId = function() {
            return this.feedbackConfigId;
        };


        triggerActiveate = function(inputIndex) {
        //    GuiAPI.printDebugText("TRIGGER ACTIVATE");
            for (let i = 0; i < this.onActivateCallbacks.length; i++) {

                this.onActivateCallbacks[i](inputIndex);
            }

        };

        addOnActivateCallback = function(cb) {
            this.onActivateCallbacks.push(cb);
        };

        triggerPressStart = function(inputIndex, guiPointer) {
            this.inputIndex = inputIndex;
            this.guiPointer = guiPointer;
            for (let i = 0; i < this.onPressStartCallbacks.length; i++) {
          //      console.log("Press activated")
                this.onPressStartCallbacks[i](inputIndex, guiPointer);
            }

        };

        addOnPressStartCallback = function(cb) {
            this.onPressStartCallbacks.push(cb);
        };

        getActive = function() {
            return this.testActiveCallback();
        };

        setTestActiveCallback = function(callback) {
            this.testActiveCallback = callback
        };


        getInteractiveElement = function() {
            return this.interactiveElement;
        };


        setBufferElement = function(bufferElement) {
            this.bufferElement = bufferElement
        };

        testIntersection = function(x, y) {

            if (x > this.minXY.x && x < this.maxXY.x && y > this.minXY.y && y < this.maxXY.y) {
                return true;
            }

        };

        recoverGuiSurface = function() {

            this.config = null;
            //   this.bufferElement.releaseElement();
                 this.bufferElement.endLifecycleNow()

        //    GuiAPI.recoverBufferElement(this.sysKey, this.bufferElement);

            while (this.onUpdateCallbacks.length) {
                this.onUpdateCallbacks.pop();
            }

            while (this.onActivateCallbacks.length) {
                this.onActivateCallbacks.pop();
            }

            while (this.onPressStartCallbacks.length) {
                this.onPressStartCallbacks.pop();
            }

        };

        getBufferElement = function() {
            return this.bufferElement;
        };

        setSurfaceCenterAndSize = function(centerPos, sizeVec3) {
         //   console.log('setSurfaceCenterAndSize', centerPos, sizeVec3)
            this.centerXY.copy(centerPos);
            this.maxXY.copy(sizeVec3).multiplyScalar(0.5);
            this.maxXY.add(this.centerXY);
            this.minXY.subVectors(this.maxXY, sizeVec3);

        };

        setSurfaceInteractiveState = function(state) {

            if (this.interactiveElement.state !== state) {
                this.interactiveElement.setInteractiveState(state);
            }
        };

        getSurfaceInteractiveState = function() {
            return this.interactiveElement.state
        };

        setSurfaceMinXY = function(vec3) {
            this.minXY.copy(vec3);;
        };

        applySurfaceSize = function(vec3) {
            this.maxXY.addVectors(this.minXY, vec3);
        };

        setSurfaceMaxXY = function(vec3) {
            this.maxXY.copy(vec3);;
        };

        getSurfaceExtents = function(storeVec) {
            storeVec.subVectors(this.maxXY, this.minXY)
        };


        positionOnCenter = function() {
            this.centerXY.addVectors(this.minXY, this.maxXY);
            this.centerXY.multiplyScalar(0.5);
            this.centerXY.z -=0.00001;
            this.setElementPosition(this.centerXY)
        };

        applyPadding = function(deduct, add) {

            if (this.config.padding) {
                deduct.x += this.config.padding.x;
                deduct.y += this.config.padding.y;
                add.x -= this.config.padding.x;
                add.y -= this.config.padding.y;
            }

        };


        configureNineslice = function() {

            if (isNaN(this.scale.x)) {
                console.log("NaN maxXY x", this)
            }

            let calcNincesliceAxis = function(min, max, scale) {
                let extent  = max - min;
                let stretch = 0.5 * extent / scale; // stretch width of center quad
                let border  = stretch * scale * 0.1/extent;  // The 0.1 appears in the mesh geometry used.. ??
                return stretch  - border; // + 0.025*this.scale.x) - (0.05*this.scale.x);
            };

            this.sprite.w = calcNincesliceAxis(this.minXY.x, this.maxXY.x, this.scale.x);
            this.sprite.z = calcNincesliceAxis(this.minXY.y, this.maxXY.y, this.scale.y);

        //    console.log("scale x y", this.scale.x, this.scale.y)
        //    console.log("sprite w z", this.sprite.w, this.sprite.z)
            if (typeof (this.sprite.z) === 'number') {
                this.bufferElement.setSprite(this.sprite);
                this.bufferElement.setScaleVec3(this.scale);
            }

        };

        fitToExtents = function() {

            if (this.config) {
                this.applyPadding(this.maxXY, this.minXY);
            }

            this.configureNineslice();

        //    GuiAPI.debugDrawRectExtents(this.minXY, this.maxXY);

        };


        setSurfaceColor = function(rgba) {
            this.bufferElement.setColorRGBA(rgba);
        }

        setElementPosition = function(vec3) {
            this.bufferElement.setPositionVec3(vec3);
        };

        getInteractiveState = function() {
            return this.getInteractiveElement().getInteractiveElementState();
        };

        registerStateUpdateCallback = function(cb) {
        //    console.log("registerStateUpdateCallback", this);
            this.onUpdateCallbacks.push(cb);
        };

        notifyStateUpdated = function() {
            for (let i = 0; i < this.onUpdateCallbacks.length; i++) {
                this.onUpdateCallbacks[i](this.inputIndex, this.guiPointer);
            }
        };

        applyStateFeedback = function() {

            this.applySurfaceConfig();
            this.notifyStateUpdated();

        };

        applySurfaceConfig = function() {

            this.config =  GuiAPI.getGuiSettingConfig( "SURFACE_NINESLICE", "GUI_16x16", this.configId);

            this.bufferElement.setAttackTime(0);
            this.bufferElement.setReleaseTime(0);

            this.scale.x = this.config.image["border_thickness"].x;
            this.scale.y = this.config.image["border_thickness"].y;
        };

    }

export { GuiSurface }

