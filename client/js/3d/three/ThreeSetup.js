// import { SsrFx } from "./fx/SsrFx.js";


import {getSetting} from "../../application/utils/StatusUtils.js";

class ThreeSetup {

    constructor() {

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.reflectionScene = null;

        this.addedObjects = 0;

        this.initTime = 0;

        this.prerenderCallbacks = [];
        this.postrenderCallbacks = [];
        this.onClearCallbacks = [];
        this.tpf = 0;
        this.lastTime = 0;
        this.idle = 0;
        this.renderStart = 0;
        this.renderEnd = 0;
        this.lookAt = new THREE.Vector3();
        this.vector = new THREE.Vector3();
        this.tempObj = new THREE.Object3D();

        this.avgTpf = 0.1;

        this.sphere = new THREE.Sphere();
        this.frustum = new THREE.Frustum();
        this.frustumMatrix = new THREE.Matrix4();

    }

    callClear = function() {
        for (let i = 0; i < this.onClearCallbacks.length; i++) {
            this.onClearCallbacks[i](this.tpf);
        }
    }

    callPrerender = function(frame) {
        //    requestAnimationFrame( ThreeSetup.callPrerender );

        let time = frame.systemTime;
        this.tpf = time - this.lastTime;

        //    if (tpf < 0.03) return;

        this.idle = (performance.now()) - this.renderEnd;
        this.prenderStart = performance.now();
    //    PipelineAPI.setCategoryKeyValue('STATUS', 'TIME_ANIM_IDLE', this.idle);

        this.lastTime = time;

        this.avgTpf = this.tpf*0.2 + this.avgTpf*0.8;

        for (let i = 0; i < this.prerenderCallbacks.length; i++) {
            this.prerenderCallbacks[i](this.avgTpf);
        }


        if (this.camera) {
            this.callRender(this.scene, this.camera);
        }


    };


    callRender = function(scn, cam) {

        this.renderStart = performance.now();
        this.renderer.render(scn, cam);
        this.renderEnd = performance.now();
        this.callClear();
        this.callPostrender();
        this.postRenderTime = performance.now() - this.renderEnd;
    };

    callPostrender = function() {


    //    PipelineAPI.setCategoryKeyValue('STATUS', 'TIME_ANIM_RENDER', this.renderEnd - this.renderStart);
        for (let i = 0; i < this.postrenderCallbacks.length; i++) {
            this.postrenderCallbacks[i](this.avgTpf);
        }

    };


    getTotalRenderTime = function() {
        return this.renderEnd;
    };

    initThreeRenderer = function(pxRatio, antialias, containerElement, store) {

            let scene = new THREE.Scene();
        //    let reflectionScene = new THREE.Scene();
        //    let camera = new THREE.PerspectiveCamera( 75, containerElement.innerWidth / containerElement.innerHeight, 0.1, 1000 );
        //    camera.matrixWorldAutoUpdate = false;
            scene.matrixWorldAutoUpdate = false;
            //     console.log("Three Camera:", camera);
        // Hack the context attributes to prevent canvas alpha
        let pxScale = getSetting(ENUMS.Settings.RENDER_SCALE);

           let renderer = new THREE.WebGLRenderer( { antialias:antialias, alpha:false, devicePixelRatio: pxRatio, logarithmicDepthBuffer: false, reverseDepthBuffer: true, sortObjects: false });
        //    let renderer = new THREE.WebGLRenderer();
            let gl = renderer.getContext();
            gl.getContextAttributes().alpha = false;
        //    console.log(gl.getContextAttributes());
            // gl.setContextAttribute()
        //    renderer.setPixelRatio( pxRatio );
            renderer.setSize( window.innerWidth / pxScale, window.innerHeight / pxScale);
        //    renderer.toneMapping = THREE.LinearToneMapping;
            store.scene = scene;
        //    store.reflectionScene = reflectionScene;
        //    store.camera = camera;
            store.renderer = renderer;

            this.scene = scene;
        //    this.camera = camera;
            this.renderer = renderer;

        // document.body.appendChild( renderer.domElement );
        PipelineAPI.setCategoryKeyValue('SYSTEM', 'SCENE', scene);
        PipelineAPI.setCategoryKeyValue('SYSTEM', 'RENDERER', renderer);
            containerElement.appendChild(renderer.domElement);
       //         console.log("initThreeRenderer", store);

     //

        return store;
    };

    activateScreenspaceReflections(renderer, scene, camera) {
        new SsrFx(renderer, scene, camera)
    }

    addPrerenderCallback = function(callback) {
        if (this.prerenderCallbacks.indexOf(callback) === -1) {
            this.prerenderCallbacks.push(callback);
        }
    };

    removePrerenderCallback = function(callback) {
        if (this.prerenderCallbacks.indexOf(callback) !== -1) {
            this.prerenderCallbacks.splice(this.prerenderCallbacks.indexOf(callback, 1));
        }

    };

    addPostrenderCallback = function(callback) {
        if (this.postrenderCallbacks.indexOf(callback) === -1) {
            this.postrenderCallbacks.push(callback);
        }
    };

    removePostrenderCallback = function(callback) {
        if (this.postrenderCallbacks.indexOf(callback) !== -1) {
            this.postrenderCallbacks.splice(this.postrenderCallbacks.indexOf(callback, 1));
        }
    };

    addOnClearCallback = function(callback) {

        if (this.onClearCallbacks.indexOf(callback) === -1) {
            this.onClearCallbacks.push(callback);
        }

    }

    removeOnClearCallback = function(callback) {
        if (this.onClearCallbacks.indexOf(callback) !== -1) {
            this.onClearCallbacks.splice(this.onClearCallbacks.indexOf(callback, 1));
        }
    };

    pointIsVisible = function(vec3) {
        return this.frustum.containsPoint(vec3)
    }

    sphereIsVisible = function(sphere) {
        return this.frustum.intersectsSphere(sphere)
    }

    boxIsVisible = function(box) {
        return this.frustum.intersectsBox(box)
    }

    toScreenPosition = function(vec3, store) {

        ThreeAPI.tempVec3.set(0, 0, 1);
        ThreeAPI.tempVec3.applyQuaternion(this.camera.quaternion);
        ThreeAPI.tempVec3b.copy(vec3);
        ThreeAPI.tempVec3b.sub(this.camera.position);
        ThreeAPI.tempVec3b.normalize();


        let angle = ThreeAPI.tempVec3.dot(ThreeAPI.tempVec3b);


        if (!store) {
            store = ThreeAPI.tempVec3;
        }

        this.tempObj.position.copy(vec3);



        //    tempObj.updateMatrixWorld();
        this.tempObj.getWorldPosition(this.vector)
        this.vector.project(this.camera);


        store.x = this.vector.x * 0.83 *0.5;
        store.y = this.vector.y * 0.5 * 0.83;
        store.z = this.vector.z * 0;

        if (angle > 0.0) {
            store.x *= -angle;
            store.y *= -1;
        }

        if (!this.pointIsVisible(this.tempObj.position)) {
            store.z = -100000;
        }


     //   GameScreen.fitView(store);

        return store;
    };



    cameraTestXYZRadius = function(vec3, radius) {
        this.sphere.center.copy(vec3);
        this.sphere.radius = radius;
        return this.frustum.intersectsSphere(this.sphere);
    };

    calcDistanceToCamera = function(vec3) {
        this.vector.copy(vec3);
        return this.vector.distanceTo(this.camera.position);
    };


    sampleCameraFrustum = function(store) {

    };

    setCamera = function(camera) {
        this.camera = camera;
    };

    setCameraPosition = function(px, py, pz) {
        this.camera.position.x = px;
        this.camera.position.y = py;
        this.camera.position.z = pz;
    };

    setCameraUp = function(vec3) {
        this.camera.up.copy(vec3);
    }

    setCameraLookAt = function(x, y, z) {
        this.lookAt.set(x, y, z);
        this.camera.lookAt(this.lookAt)
    };

    getCameraLookAt = function() {
        return this.lookAt;
    };

    updateCameraMatrix = function() {

        //    camera.updateProjectionMatrix();

        this.camera.updateMatrixWorld(true);
        this.frustum.setFromProjectionMatrix(this.frustumMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse));
        this.camera.needsUpdate = true;

        for (let i = 0; i < this.camera.children.length; i++) {
            this.camera.children[i].updateMatrixWorld(true);
        }

    };


    addChildToParent = function(child, parent) {
        if (child.parent) {
            child.parent.remove(child);
        }
        parent.add(child);
    };

    addToScene = function(object3d) {
        this.scene.add(object3d);
        return object3d;
    };

    getCamera = function() {
        return this.camera;
    };

    removeModelFromScene = function(model) {
        if (model.parent) {
            model.parent.remove(model);
        }

        this.scene.remove(model);
    };

    setRenderParams = function(width, height, aspect, pxRatio) {
        this.renderer.setSize( width, height);
        this.renderer.setPixelRatio( pxRatio );
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    };

    attachPrerenderCallback = function(callback) {
        if (this.prerenderCallbacks.indexOf(callback) !== -1) {
            console.log("Callback already installed");
            return;
        }
        this.prerenderCallbacks.push(callback);
    };
    removePrerenderCallback = function(callback) {
        MATH.quickSplice(this.prerenderCallbacks, callback);
    };


    getSceneChildrenCount = function() {
        return this.scene.children.length;
    };



    getInfoFromRenderer = function(source, key) {
        if (!key) return this.renderer.info[source];
        return this.renderer.info[source][key];
    };

}

export { ThreeSetup }