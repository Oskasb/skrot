import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {ENUMS} from "../ENUMS.js";
import {pipelineAPI} from "./DataUtils.js";
import {evt} from "../event/evt.js";

let cache = {};
let callbacks = {};
let paramsMap = {};

let tempObj = new Object3D();
let tempObj2 = new Object3D();
let tempVec = new Vector3();
let tempVec2 = new Vector3();

if (typeof (window) !== 'undefined') {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const entries = urlParams.entries();


    for (const entry of entries) {
        if (entry[1] === 'true') {
            paramsMap[entry[0]] = true;
        } else {
            paramsMap[entry[0]] = entry[1];
        }
    }
    console.log("urlParams:", paramsMap);
}



function trackDebugConfig(folder, key, value) {
    if (!cache['DEBUG']) {
        cache = pipelineAPI.getCachedConfigs();
        if (!cache['DEBUG']) {
            cache.DEBUG = {};
        }
    }
    if (!cache.DEBUG[folder]) {
        cache.DEBUG[folder] = {}
    }

    cache.DEBUG[folder][key] = value;
}

function registerTrackUpdateCallback(folder, key, callback) {
    if (!callbacks[folder]) {
        callbacks[folder] = {};
        if (!callbacks[folder][key]) {
            callbacks[folder][key] = [];
        }
    }

    //if (callbacks[folder][key].indexOf(callback) === -1) {
        callbacks[folder][key][0] = callback;
    //}
}

function debugTrackStatusMap(folder, statusMap) {
    for (let key in statusMap) {
        trackDebugConfig(folder, key, statusMap[key])
    }
}

let e = {};

function indicateActiveInstances() {
    let dynMain = client.dynamicMain;
    let instances = dynMain.instances;
    let cpos = ThreeAPI.getCameraCursor().getPos();
    for (let i = 0; i < instances.length; i++) {
        let pos = instances[i].getSpatial().getPos();
        e.from = cpos;
        e.to = pos;
        e.color = 'GREEN';
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, e);
    }
}



function getAllSceneNodes() {
    let scene = ThreeAPI.getScene();
    return scene.children;
}

function createDebugButton(text, onActivate, testActive, parent, x, y) {
    //   console.log("Debug Button: ", text, onActivate, testActive, parent, x, y);
    let buttonReady = function(button) {
        //      console.log("DEbug Button Ready: ", button);
    }

    let opts = {
        widgetClass:'GuiSimpleButton',
        widgetCallback:buttonReady,
        configId: 'button_big_blue',
        onActivate: onActivate,
        testActive: testActive,
        interactive: true,
        text: text,
        offset_x: x,
        offset_y: y
    };

    if (typeof(parent) === 'string') {
        opts.anchor = parent;
    }
    if (typeof(parent) === 'object') {
        opts.container = parent;
    }

    evt.dispatch(ENUMS.Event.BUILD_GUI_ELEMENT, opts)

}

function isDev() { // set from URL Param ? dev=true
    if (paramsMap['dev'] === true) {
        return true
    } else {
        return false
    }
}

function applyVariation(id) {
    return getUrlParam(id)
}

function getUrlParam(param) {
    if (paramsMap[param] === true) {
        return true
    } else {
        return false
    }
}

function getActorSkeleton(actor) {
    let skeleton = null;
    let boneCount = 0;
    if (actor.visualActor !== null) {
        let instance = actor.visualActor.call.getInstance()

        if (instance !== null) {
            instance.obj3d.traverse(function(node) {
                if (node.type === 'SkinnedMesh') {
                    if (node.skeleton.bones.length > boneCount) {
                        boneCount = node.skeleton.bones.length;
                        skeleton = node.skeleton;
                    }

                }
            });
        }

    }
    return skeleton;
}

function debugDrawActorSkeleton(actor) {
    let skeleton = getActorSkeleton(actor);
    if (skeleton !== null) {
        let bones = skeleton.bones;
        let childCount = 0;
        tempObj2.copy(actor.actorObj3d);
        for (let i = 0; i < bones.length; i++) {

            let bone = bones[i];

            bone.matrixWorld.decompose(tempObj.position, tempObj.quaternion, tempObj.scale);

            if (childCount !== 0) {
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj2.position, to:tempObj.position, color:'YELLOW'});
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempObj.position, color:'RED', size:0.025})
            } else {
                if (i===0) {
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempObj.position, color:'GREEN', size:0.07})
                } else {
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:tempObj.position, color:'GREEN', size:0.03})
                    tempVec2.set(0, 0, 0.12)
                    tempVec2.applyQuaternion(tempObj.quaternion);
                    tempVec2.add(tempObj.position);
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempObj.position, to:tempVec2, color:'BLUE'});
                }
            }
            tempObj2.copy(tempObj);
            childCount = bone.children.length;
            if (childCount === 1) {
                if (bone.children[0].isBone === true) {

                } else {
                    childCount = 0;
                }
            }
        }
    }
}

let lineEvt = {color:"RED"};
let xEvt = {color:"RED", size:0.2};

function debugDrawDynamicPoints(dynamicPoints) {

    for (let i = 0; i < dynamicPoints.length; i++) {
        dynamicPoints[i].updateDynamicPoint();
        let obj3d = dynamicPoints[i].getObj3d();
        ThreeAPI.tempVec3.set(0, 0, 1);
        ThreeAPI.tempVec3.applyQuaternion(obj3d.quaternion);
        ThreeAPI.tempVec3.add(obj3d.position);
        lineEvt.from = obj3d.position;
        lineEvt.to = ThreeAPI.tempVec3;
        xEvt.pos = obj3d.position;

        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, lineEvt)
        evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS,xEvt)
    }

}

export {
    createDebugButton,
    getAllSceneNodes,
    isDev,
    applyVariation,
    trackDebugConfig,
    debugTrackStatusMap,
    indicateActiveInstances,
    getUrlParam,
    debugDrawActorSkeleton,
    debugDrawDynamicPoints
}