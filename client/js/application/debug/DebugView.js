import {CameraUiSystem} from "../ui/gui/systems/CameraUiSystem.js";
import {debugDrawPhysicalAABBs, debugDrawPhysicalWorld} from "../utils/PhysicsUtils.js";
import {poolFetch, poolReturn} from "../utils/PoolUtils.js";
import {createDebugButton, debugDrawActorSkeleton, getAllSceneNodes} from "../utils/DebugUtils.js";
import {DebugLines} from "./lines/DebugLines.js";
import {getSetting} from "../utils/StatusUtils.js";
import {pipelineAPI} from "../utils/DataUtils.js";

let cache = {};
let mem = null;
let bytesPerMb = 1048576;
let system = {
    tpf:0
}

let canvas;
let gl;
let debugInfo;
let vendor;
let glRenderer;
let renderer;
let scene;
let debugStatsEvent = {};

let domEnvEdit = null;

let setupDebug = function() {

    renderer = cache['SYSTEM']['RENDERER'];
    canvas = renderer.domElement;
    scene = cache['SYSTEM']['SCENE'];

    gl = renderer.getContext();

    if (gl) {
        debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        glRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        setTimeout(function() {
            evt.dispatch(ENUMS.Event.DEBUG_TEXT, {value: vendor})
            evt.dispatch(ENUMS.Event.DEBUG_TEXT, {value: glRenderer})
        }, 100)
        window.SYSTEM_SETUP.debugInfo = debugInfo;
        window.SYSTEM_SETUP.vendor = vendor;
        window.SYSTEM_SETUP.glRenderer = glRenderer;
    }
    console.log(vendor, glRenderer);
}

let updateSystemDebug = function() {

    let setup = ThreeAPI.getSetup();

    evt.dispatch(ENUMS.Event.COLLECT_DEBUG_STATS, debugStatsEvent)
    system.tpf = GameAPI.getFrame().tpf * 1000;
    system.avgTpf = setup.avgTpf * 1000;
    system.fps = 1/GameAPI.getFrame().tpf


    system.idle = setup.idle * 1000;

    system.preRdr = (setup.renderStart - setup.prenderStart)*1000;
    system.render = (setup.renderEnd - setup.renderStart)*1000;
    system.postRdr = (setup.postRenderTime)*1000;
    system.active = system.preRdr+system.render+system.postRdr
    system.cpuLoad = MATH.calcFraction(0, system.active+system.idle, system.active) * 100;

    system.geoCount = renderer.info.memory.geometries;
    system.txCount = renderer.info.memory.textures;
    system.shaders = renderer.info.programs.length;
    system.calls = renderer.info.render.calls;
    system.tris = Math.round(renderer.info.render.triangles / 1000);
    system.lines = renderer.info.render.lines;
    system.frame = renderer.info.render.frame;
    system.points = renderer.info.render.points;

    system.physicsTpf = AmmoAPI.getAmmoStatus().updateTime

    system.scnObjs = scene.children.length;
    system.camY = ThreeAPI.getCamera().position.y;
    if (performance) {
        let mem = performance.memory;
        system.heapTot = mem.totalJSHeapSize / bytesPerMb;
        system.heapUsed = mem.usedJSHeapSize / bytesPerMb;
        system.memSpent = MATH.calcFraction(0, mem.jsHeapSizeLimit, mem.totalJSHeapSize) * 100;

    }

}

let debugPages = {};

function pageSettingChangeTest(pageId, settingKey) {
    if (getSetting(settingKey)) {
        if (!debugPages[pageId]) {
            debugPages[pageId] = GuiAPI.activatePage(pageId)
        }
    } else {
        if (debugPages[pageId]) {
            GuiAPI.closePage(debugPages[pageId])
            debugPages[pageId] = null;
        }
    }
}

function updateDebugView() {
    updateSystemDebug();

   // if (getSetting(ENUMS.Settings.DEBUG_VIEW_PHYSICS_SENSORS)) {
        debugDrawPhysicalWorld()
  //  }

    if (getSetting(ENUMS.Settings.DEBUG_VIEW_PHYSICS_AABBS)) {
        debugDrawPhysicalAABBs()
    }

    if (getSetting(ENUMS.Settings.DEBUG_VIEW_SKELETONS)) {
        let actors = GameAPI.getActorList();

        for (let i = 0; i < actors.length; i++) {
            let actor = actors[i];
            debugDrawActorSkeleton(actor)

        }

    }

    pageSettingChangeTest('page_debug_view_system', ENUMS.Settings.DEBUG_VIEW_STATUS)
    pageSettingChangeTest('page_perf_mon', ENUMS.Settings.DEBUG_VIEW_PERFORMANCE)



}


class DebugView {
    constructor() {

        if (!cache['DEBUG']) {
            cache = pipelineAPI.getCachedConfigs();
            if (!cache['DEBUG']) {
                cache.DEBUG = {};
            }
        }

        if (!cache['DEBUG']['SYSTEM']) {
            cache.DEBUG.SYSTEM = system;
        }

        this.debugLines = new DebugLines()
        this.inspecting = {};
        this.isActive = false;
        let onActivate = function() {


            this.activateDebugView();
        }.bind(this);

        let inspectFrameUpdate = function() {
        //    this.debugLines.updateDebugLines();
            this.renderInspectionFrame();
        }.bind(this);

        this.callbacks = {
            onActivate:onActivate,
            inspectFrameUpdate:inspectFrameUpdate
        }

        let status = {}
        let onToggleStatus = function(e) {
            if (!status[e.status]) {
                status[e.status] = {on:true};
            } else {
                status[e.status].on = !status[e.status].on
            }

            if (e.status === 'physics') {
                console.log(status, status[e.status]);
                if (status[e.status].on === true) {
                    ThreeAPI.addPostrenderCallback(debugDrawPhysicalWorld)
                } else {
                    ThreeAPI.unregisterPostrenderCallback(debugDrawPhysicalWorld)
                }
            }

        }

        evt.on(ENUMS.Event.DEBUG_STATUS_TOGGLE, onToggleStatus);
        setupDebug();
        ThreeAPI.addPostrenderCallback(updateDebugView)
    }

    closeDebugView() {
        ThreeAPI.unregisterPostrenderCallback(updateDebugView)
    }

    renderInspectionFrame() {
        if (this.inspecting['nodes']) {
            let nodes = getAllSceneNodes();
            for (let i = 0; i < nodes.length;i++) {
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:nodes[i].position, color:'GREEN', size:1})
            }
        }
    }

    debugModelInspection = function(event) {

        let insKey = event['inspect']
        let inspecting = false;
        if (!this.inspecting[insKey]) this.inspecting[insKey] = false;
        this.inspecting[insKey] = !this.inspecting[insKey];

        for (let key in this.inspecting) {
            if (this.inspecting[key]) inspecting = true;
            console.log(key, inspecting);
        }
        console.log("Debug View Models ", event, this.inspecting[insKey], inspecting);

            if (inspecting) {
                ThreeAPI.addPostrenderCallback(this.callbacks.inspectFrameUpdate);
            } else {
                this.debugLines.clearDebugLines();
                ThreeAPI.unregisterPostrenderCallback(this.callbacks.inspectFrameUpdate);
            }
            
    }

    initDebugView = function() {
        let onDebugModels = function(event) {
            this.debugModelInspection(event);
        }.bind(this);

        evt.on(ENUMS.Event.DEBUG_VIEW_MODELS, onDebugModels)

        let testActive = function() {
            return this.isActive;
        }.bind(this)

        createDebugButton('DEBUG', this.callbacks.onActivate, testActive, 'bottom_left', 0.037, 0.03)

    }

    activateDebugView = function() {
        this.isActive = !this.isActive;
        if (!this.isActive) {
            // ThreeAPI.getCameraCursor().getCameraUiSystem().closeCameraUi();
            if (this.camButtons) {
                this.camButtons.closeCameraUi();
                this.camButtons = null;
            }

            this.deactivateDebugView()

        //    ThreeAPI.unregisterPostrenderCallback(updateSystemDebug)
            return;
        }

        this.camButtons = new CameraUiSystem();
        this.camButtons.initCameraUi();
    //    ThreeAPI.addPostrenderCallback(updateSystemDebug)
        if (client.page !== null) {
            GuiAPI.closePage(client.page)
            client.page = null;
        }

        this.page = GuiAPI.activatePage('page_debug_view');
        this.containers = this.page.containers;

        evt.dispatch(ENUMS.Event.DEBUG_VIEW_TOGGLE, {activate:this.isActive, container:this.containers['page_debug_top_right']})
        console.log("Activate Debug View", this.page)


        //    GuiAPI.getGuiDebug().setupDebugText(this.containers['page_home_bottom_left']);

    }

    deactivateDebugView() {
        this.page.closeGuiPage();
    }

}

export { DebugView }