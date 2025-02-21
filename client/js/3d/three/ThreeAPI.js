import {ThreeAsset} from './assets/ThreeAsset.js';
import {ThreeSetup} from './ThreeSetup.js';
import {ThreeEnvironment} from './ThreeEnvironment.js';
import {ThreeShaderBuilder} from './ThreeShaderBuilder.js';
import {ThreeModelLoader} from './ThreeModelLoader.js';
import {ThreeTextureMaker} from './ThreeTextureMaker.js';
import {ThreeSpatialFunctions} from './ThreeSpatialFunctions.js';
import {CameraSpatialCursor } from "../camera/CameraSpatialCursor.js";
import {TerrainSystem} from "./terrain/TerrainSystem.js";
import {getSetting} from "../../application/utils/StatusUtils.js";
import {MeshBasicMaterial, Object3D, Vector3, Vector4} from "../../../../libs/three/Three.Core.js";
import {pipelineAPI} from "../../application/utils/DataUtils.js";
import {MATH} from "../../application/MATH.js";
import {ENUMS} from "../../application/ENUMS.js";
import {DynamicMain} from "../DynamicMain.js";
import {AssetLoader} from "../../application/load/AssetLoader.js";
import {InstanceAPI} from "./instancer/InstanceAPI.js";
import {EnvironmentMaps} from "./environment/EnvironmentMaps.js";
import {Ocean} from "./water/Ocean.js";
import {EnvironmentClouds} from "./environment/EnvironmentClouds.js";
import {ComputeTerrain} from "./terrain/ComputeTerrain.js";
import {VegetationGrid} from "../../game/world/plants/VegetationGrid.js";


let cameraSpatialCursor;
let terrainSystem = new TerrainSystem();
let tempVec = null;
let groundHeightData = [0, 0, 0, 0];

window.InstanceAPI = new InstanceAPI()
class ThreeAPI {

    constructor() {

        this.dynamicMain = new DynamicMain();
        this.threeEnvironment = new ThreeEnvironment();
        this.threeSetup = new ThreeSetup();
        this.threeTextureMaker = new ThreeTextureMaker();
        this.threeModelLoader = new ThreeModelLoader();
        this.shaderBuilder = new ThreeShaderBuilder();
        this.glContext;
        this.renderer;
        this.camera;
        this.scene;
        this.reflectionScene;
        this.spatialFunctions;
        this.effectCallbacks;
        this.renderFilter;
        this.assetLoader = new AssetLoader();
        this.globalUniforms = {};
        this.animationMixers = [];
        this.frameRegs = 0;

        this.dynamicGlobalUnifs = {};
        this.tempVec3 = new Vector3();
        this.tempVec3b = new Vector3();
        this.tempVec3c = new Vector3();
        this.tempVec4 = new Vector4();
        this.tempObj = new Object3D();
        tempVec = new Vector3();
    }

    initThreeLoaders = function(assetLoader) {
        this.spatialFunctions = new ThreeSpatialFunctions();
        this.assetLoader = assetLoader;
    };

    initEnvironment(store, onReady) {


        let _this = this;

        let envReady = function() {
            _this.threeEnvironment.enableEnvironment(_this.threeEnvironment);
            _this.addPostrenderCallback(_this.threeEnvironment.tickEnvironment);
        };

        function trnLoaded() {
            new Ocean(store)
            setTimeout(onReady, 100)
        }

        let onLoaded = function() {
            _this.threeEnvironment.initEnvironment(store, envReady);
            let env = new EnvironmentMaps(store);
            new EnvironmentClouds(store);
            env.call.activateEnvMaps()

            new ComputeTerrain(store, trnLoaded);
        };

        this.threeEnvironment.loadEnvironmentData(onLoaded);


    };

    initThreeScene(containerElement, pxRatio, antialias) {
        //
        let store = {};
        store = this.threeSetup.initThreeRenderer(pxRatio, antialias, containerElement, store);
        this.scene = store.scene;
        this.renderer = store.renderer;
        this.reflectionScene = store.reflectionScene;
        this.setCamera(store.camera);
        pipelineAPI.setCategoryKeyValue('SYSTEM', 'CAMERA', store.camera);
    //    store.camera.matrixWorldAutoUpdate = false;

        this.glContext = store.renderer.getContext();

        this.threeSetup.addPrerenderCallback(this.threeModelLoader.updateActiveMixers);

        this.threeSetup.addToScene(this.threeSetup.getCamera());

    //    this.shaderBuilder.loadShaderData(this.glContext);
        cameraSpatialCursor = new CameraSpatialCursor();
    //    this.threeSetup.activateScreenspaceReflections(this.renderer, this.scene, this.threeSetup.getCamera())
        return store;
    };

    initThreeTerrain() {
        let terrainSysCB = function() {
        //    console.log("Terrain System Ready")
            terrainSystem.getTerrain().call.populateTerrainGeometries();
            terrainSystem.sysReady = true;
            terrainSystem.testReady();

        };
        terrainSystem.initTerrainSystem(terrainSysCB);
    };

    getTerrainSystem() {
        return terrainSystem;
    }

    getCameraCursor() {
        return cameraSpatialCursor;
    }

    updateSceneMatrixWorld() {
        this.scene.updateMatrixWorld();
    };

    addPrerenderCallback(callback) {
        this.threeSetup.addPrerenderCallback(callback);
    };

    addPostrenderCallback(callback) {
        this.threeSetup.addPostrenderCallback(callback);
    };

    addPostProcess(postProcess) {
        this.threeSetup.addPostProcess(postProcess);
    }
    unregisterPostrenderCallback(callback) {
        this.threeSetup.removePostrenderCallback(callback);
    };
    loadThreeModels(TAPI) {
        this.threeModelLoader.loadData();
    };

    loadThreeData(TAPI) {
    //    this.threeModelLoader.loadData();
    //    this.threeModelLoader.loadTerrainData(TAPI);
    //    this.threeTextureMaker.loadTextures();
    //    this.threeMaterialMaker.loadMaterialist();
    };


    buildAsset(assetId, callback) {
    //    console.log('Three API build asset:', assetId);
        new ThreeAsset(assetId, callback);
    };

    loadThreeAsset(assetType, assetId, callback) {
        this.assetLoader.loadAsset(assetType, assetId, callback);
    };

    getTimeElapsed() {
        return this.threeSetup.getTotalRenderTime();
    };

    getSetup() {
        return this.threeSetup;
    };

    getContext() {
        return glContext;
    };

    /*
    setEffectCallbacks = function(callbacks) {
        effectCallbacks = callbacks;
    };
*/
    getEffectCallbacks = function() {
        return effectCallbacks;
    };

    getSpatialFunctions = function() {
        return spatialFunctions;
    };

    readEnvironmentUniform = function(worldProperty, key) {
        return this.threeEnvironment.readDynamicValue(worldProperty, key);
    };

    getEnvironment = function() {
        return this.threeEnvironment;
    };

    getModelLoader = function() {
        return this.threeModelLoader;
    };

    getCamera = function() {
        return this.camera;
    };

    getScene = function() {
        return this.scene;
    };

    getReflectionScene = function() {
        return this.reflectionScene;
    };

    getRenderer = function() {
        return this.renderer;
    };


    clearTerrainLodUpdateCallback(callback) {
        terrainSystem.clearLodUpdates(callback)
    }

    registerTerrainLodUpdateCallback(pos, callback) {
        terrainSystem.registerLodUpdateCB(pos, callback)
    }

    terrainAt = function(pos, normalStore, groundData) {

        if (groundData) {
            groundData[0] = 0;
            groundData[1] = 0;
            groundData[2] = 0;
            groundData[3] = 0;
        }

        let terrainHeight = terrainSystem.getTerrainHeightAndNormal(pos, normalStore, groundData);

        if (getSetting(ENUMS.Settings.DEBUG_VIEW_TERRAIN_QUERIES)) {
            if (GameAPI.getFrame().frame > 200) {
                tempVec.copy(pos);
                tempVec.y = terrainHeight;
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:cameraSpatialCursor.getPos(), to:tempVec, color:'WHITE', drawFrames:3});
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:tempVec, color:'WHITE', drawFrames:3});
            }

        }

        return terrainHeight;



    };

    groundAt = function(pos, dataStore) {
        return terrainSystem.getTerrainGroundDataAtPos(pos, dataStore);
    }

    shadeGroundAt = function(pos, size) {
        terrainSystem.shadeTerrainGround(pos, size, 2, "lighter", 0.8)
    }

    checkShadeCompleted() {
        return terrainSystem.getTerrain().shadeIsCompleted();
    }

    digIntoGroundAt = function(pos, size, elevationChange) {
        let groundHeight = this.terrainAt(this.getCameraCursor().getPos(), null, groundHeightData)
        let heightFraction = elevationChange / terrainSystem.getTerrainHeight();
        let targetIntensity = groundHeightData[0] + heightFraction;
        console.log(targetIntensity, groundHeightData[0] , heightFraction, elevationChange , terrainSystem.getTerrainHeight())
        terrainSystem.shadeTerrainGround(pos, size, 0, "source-over", targetIntensity)
        terrainSystem.rebuildGround()
    }

    alignGroundToAABB = function(aabb) {
        console.log("Align Ground to AABB", aabb);
        terrainSystem.adjustGroundToAABB(aabb)
        terrainSystem.rebuildGround()
    }

    imprintModelAABBToGround(aabb, imprintCallback) {
        console.log("Imprint Ground AABB", aabb);

        let continueTO;

        let imprintDoneCB = function(res) {
            clearTimeout(continueTO);
            console.log("imprint step done ", res);
            continueTO = setTimeout(function() {
                terrainSystem.rebuildGround()
                console.log("Imprint Ground AABB completed", res);
                if (typeof (imprintCallback) === 'function') {
                    imprintCallback(res)
                }
            }, 100)

        }

        terrainSystem.imprintGroundModelAABB(aabb, imprintDoneCB);

    }

    getTerrainMaxHeight = function() {
        return terrainSystem.getTerrainHeight();
    }

    updateWindowParameters = function(width, height, aspect, pxRatio) {
    //    console.log(width, height, aspect, pxRatio)
        this.threeSetup.setRenderParams(width, height, aspect, pxRatio);

    };

    registerPrerenderCallback = function(callback) {
        this.threeSetup.attachPrerenderCallback(callback);
    };

    unregisterPrerenderCallback = function(callback) {
        this.threeSetup.removePrerenderCallback(callback);
    };

    sampleFrustum = function(store) {
        this.threeSetup.sampleCameraFrustum(store);
    };

    addAmbientLight = function() {

    };

    setCamera = function(camera) {
        this.camera = camera;
        this.threeSetup.setCamera(camera);
    };

    setCameraPos = function(x, y, z) {
        this.threeSetup.setCameraPosition(x, y, z);
    };

    cameraLookAt = function(x, y, z) {
        this.threeSetup.setCameraLookAt(x, y, z);
    };

    copyCameraLookAt = function(store) {
        store.copy(this.threeSetup.lookAt);
    };

    updateCamera = function() {
        this.threeSetup.updateCameraMatrix();
    };

    toScreenPosition = function(vec3, store) {
        return this.threeSetup.toScreenPosition(vec3, store);
    };

    testPosIsVisible = function(vec3) {
        return this.threeSetup.pointIsVisible(vec3);
    }

    testSphereIsVisible = function(sphere) {
        return this.threeSetup.sphereIsVisible(sphere);
    }

    testBoxIsVisible = function(boundingBox) {
        return this.threeSetup.boxIsVisible(boundingBox);
    }

    checkVolumeObjectVisible = function(vec3, radius) {
        return this.threeSetup.cameraTestXYZRadius(vec3, radius);
    };

    distanceToCamera = function(vec3) {
        return this.threeSetup.calcDistanceToCamera(vec3);
    };

    newCanvasTexture = function(canvas) {
        return this.threeTextureMaker.createCanvasTexture(canvas);
    };


    buildCanvasMaterial = function(texture) {
        return  new MeshBasicMaterial({ map: texture, depthWrite:false});
    };

    attachObjectToCamera = function(object) {
        //   ThreeSetup.addToScene(ThreeSetup.getCamera());
        this.threeSetup.addChildToParent(object, this.threeSetup.getCamera());
    };

    applySpatialToModel = function(spatial, model) {
        if (!model) return;
        this.transformModel(model, spatial.posX(), spatial.posY(), spatial.posZ(), spatial.pitch(), spatial.yaw(), spatial.roll())
    };

    transformModel = function(model, px, py, pz, rx, ry, rz) {
        model.position.set(px, py, pz);
        model.rotation.set(rx, ry, rz, 'ZYX');
    };

    addToScene = function(threeObject) {
        if (threeObject.type === 'Object3D') {
            console.log("Add To Scene", threeObject);
        }

        this.threeSetup.addToScene(threeObject);
    };

    removeFromScene = function(threeObject) {
        this.scene.remove(threeObject);
    };

    createRootObject = function() {
        return this.threeModelLoader.createObject3D();
    };

    removeChildrenFrom = function(object) {
        while (object.children.length) {
            this.removeModel(object.children.pop());
        }
    };

    loadMeshModel = function(modelId, rootObject, partsReady) {
        return this.threeModelLoader.loadThreeMeshModel(modelId, rootObject, this.threeSetup, partsReady);
    };

    attachInstancedModel = function(modelId, rootObject) {
        return this.threeModelLoader.attachInstancedModelTo3DObject(modelId, rootObject, this.threeSetup);
    };

    loadModel = function(sx, sy, sz, partsReady) {
        return this.threeModelLoader.loadThreeModel(sx, sy, sz, partsReady);
    };

    loadDebugBox = function(sx, sy, sz, colorName) {
        return this.threeModelLoader.loadThreeDebugBox(sx, sy, sz, colorName);
    };

    loadQuad = function(sx, sy) {
        var model = this.threeModelLoader.loadThreeQuad(sx, sy);
        return this.threeSetup.addToScene(model);
    };


    addChildToObject3D = function(child, parent) {
        this.threeSetup.addChildToParent(child, parent);
    };

    animateModelTexture = function(model, z, y, cumulative) {
        ThreeFeedbackFunctions.applyModelTextureTranslation(model, z, y, cumulative)
    };

    setObjectVisibility = function(object3d, bool) {
        object3d.visible = bool;
    };

    showModel = function(obj3d) {
        this.threeSetup.addToScene(obj3d);
    };

    bindDynamicStandardGeometry = function(modelId, dynamicBuffer) {

        console.log("bindDynamicStandardGeometry", modelId, dynamicBuffer);

    };


    hideModel = function(obj3d) {
        this.threeSetup.removeModelFromScene(obj3d);
    };

    removeModel = function(model) {

//            ThreeSetup.removeModelFromScene(model);
        this.threeModelLoader.returnModelToPool(model);
    };

    disposeModel = function(model) {

        this.threeSetup.removeModelFromScene(model);
        this.threeModelLoader.disposeHierarchy(model);
    };

    countAddedSceneModels = function() {
        return this.threeSetup.getSceneChildrenCount();
    };

    sampleRenderInfo = function(source, key) {
        return this.threeSetup.getInfoFromRenderer(source, key);
    };

    countPooledModels = function() {
        return this.threeModelLoader.getPooledModelCount();
    };

    activateMixer = function(mixer) {
        if (this.animationMixers.indexOf(mixer) === -1) {
            this.animationMixers.push(mixer);
        } else {
            console.log("Mixer already added", mixer)
        }
    };

    deActivateMixer = function(mixer) {
        mixer.update(0.01);
        MATH.quickSplice(this.animationMixers, mixer);
    };


    updateAnimationMixers = function(tpf) {
        for (let mx = 0; mx < this.animationMixers.length; mx ++) {
            this.animationMixers[mx].update(tpf);
        }
    };

    getGlobalUniforms = function() {
        return this.globalUniforms;
    };

    getGlobalUniform = function(key) {
        if (!this.globalUniforms[key]) {
            this.globalUniforms[key] = {value:{}}
        }
        return this.globalUniforms[key];
    };


    setGlobalUniform = function(uniformKey, values) {

        if (!this.globalUniforms[uniformKey]) {
            this.globalUniforms[uniformKey] = {value:{}};
        }

        if (typeof (values) === 'number') {
            this.globalUniforms[uniformKey].value = values;
        } else {
            for (let val in values) {
                this.globalUniforms[uniformKey].value[val] = values[val];
            }
        }
    };

    updateCanvasTextureSubImage(texture,  x, y, w, h, imageData) {
        //   console.log("updateCanvasTextureSubImage", texture, imageData)
        let renderer = this.getRenderer();
        let gl = renderer.getContext();
        let textureProperties = renderer.properties.get( texture );
        gl.bindTexture( gl.TEXTURE_2D, textureProperties.__webglTexture, gl.TEXTURE0);
        gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, texture.flipY );
        //   console.log(gl, texture, textureProperties, imageData, gl.RGBA, gl.UNSIGNED_BYTE);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, imageData)
    }

    canvasTextureSubUpdate(texture, sourceCtx, updateRect) {
        let x = updateRect.minX;
        let y = updateRect.minY;
        let w= updateRect.maxX - x;
        let h = updateRect.maxY - y;
        let subImage = sourceCtx.getImageData(x, y, w, h).data;
    //    console.log(updateRect, w, h, subImage);
        this.updateCanvasTextureSubImage(texture, x, y, w, h, subImage)
    }

    registerDynamicGlobalUniform = function(uniformKey, values) {

        if (this.frameRegs < 5) {
            let key = uniformKey+this.frameRegs;

            if (!this.dynamicGlobalUnifs[key]) {
                this.dynamicGlobalUnifs[key] = {value:{}}
            }

            for (let val in values) {
                this.dynamicGlobalUnifs[key].value[val] = values[val];
            }

            this.frameRegs++
        }

    };

    applyDynamicGlobalUniforms = function() {

        for (let val in ThreeAPI.dynamicGlobalUnifs) {
            ThreeAPI.setGlobalUniform(val, ThreeAPI.dynamicGlobalUnifs[val].value)
        }

        this.frameRegs = 0;
    };


    toRgb = function(r, g, b) {
        return 'rgb('+Math.floor(r*255)+','+Math.floor(g*255)+','+Math.floor(b*255)+')';
    };

    toGradRgb = function(r, g, b) {
        return 'rgb('+Math.min(Math.floor(MATH.curveQuad(r)*255), 255)+','+Math.min(Math.floor(MATH.curveQuad(g)*255), 255)+','+Math.min(Math.floor(MATH.curveQuad(b)*255), 255)+')';
    };

    requestFrameRender = function(frame) {
    //
        cameraSpatialCursor.updateSpatialCursor();
    //    this.threeSetup.callClear();
        this.threeSetup.callPrerender(frame);

    };

    applyPostrenderUpdates() {
        this.dynamicMain.tickDynamicMain();
    }

}

export { ThreeAPI }
