
import {getSetting} from "../../application/utils/StatusUtils.js";
import {
    ACESFilmicToneMapping,
    Frustum,
    Matrix4,
    Object3D,
    PerspectiveCamera,
    Scene,
    Sphere,
    Vector3
} from "../../../../libs/three/Three.Core.js";
import {MATH} from "../../application/MATH.js";
import {WebGLRenderer} from "../../../../libs/three/Three.js";
import {WebGPURenderer} from "../../../../libs/three/Three.WebGPU.js";
import {ENUMS} from "../../application/ENUMS.js";
import {pipelineAPI} from "../../application/utils/DataUtils.js";

class ThreeSetup {

    constructor() {

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.reflectionScene = null;

        this.addedObjects = 0;

        this.initTime = 0;

        this.postProcesses = [];
        this.prerenderCallbacks = [];
        this.postrenderCallbacks = [];
        this.onClearCallbacks = [];
        this.tpf = 0;
        this.lastTime = 0;
        this.idle = 0;
        this.renderStart = 0;
        this.renderEnd = 0;
        this.lookAt = new Vector3();
        this.vector = new Vector3();
        this.tempObj = new Object3D();

        this.avgTpf = 0.1;

        this.sphere = new Sphere();
        this.frustum = new Frustum();
        this.frustumMatrix = new Matrix4();

    }

    addPostProcess(postProcess) {
        this.postProcesses.push(postProcess);
    }

    callClear() {
        for (let i = 0; i < this.onClearCallbacks.length; i++) {
            this.onClearCallbacks[i](this.tpf);
        }
    }

    callPrerender(frame) {
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


    callRender(scn, cam) {

        this.renderStart = performance.now();

        if (this.postProcesses.length === 0) {
            this.renderer.renderAsync(scn, cam);
        } else {
            for (let i = 0;i<this.postProcesses.length; i++) {
                this.postProcesses[i].renderAsync();
            }
        }

        this.renderEnd = performance.now();
        this.callClear();
        this.callPostrender();
        this.postRenderTime = performance.now() - this.renderEnd;
    };

    callPostrender() {


    //    PipelineAPI.setCategoryKeyValue('STATUS', 'TIME_ANIM_RENDER', this.renderEnd - this.renderStart);
        for (let i = 0; i < this.postrenderCallbacks.length; i++) {
            this.postrenderCallbacks[i](this.avgTpf);
        }

    };


    getTotalRenderTime() {
        return this.renderEnd;
    };

    initThreeRenderer(pxRatio, antialias, containerElement, store) {

            let scene = new Scene();
            scene.matrixWorldAutoUpdate = false;
            //     console.log("Three Camera:", camera);
        // Hack the context attributes to prevent canvas alpha
        let pxScale = getSetting(ENUMS.Settings.RENDER_SCALE);

        const camera = new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.5, 40000 );

           let renderer = new WebGPURenderer( { antialias:antialias, alpha:false, devicePixelRatio: pxRatio, reverseDepthBuffer: true, sortObjects: true, trackTimestamp: true });
            renderer.setSize( window.innerWidth / pxScale, window.innerHeight / pxScale);
            renderer.toneMapping = ACESFilmicToneMapping;
            store.scene = scene;
            store.camera = camera;
            store.renderer = renderer;

            this.camera = camera;
            this.scene = scene;
            this.renderer = renderer;

        pipelineAPI.setCategoryKeyValue('SYSTEM', 'SCENE', scene);
        pipelineAPI.setCategoryKeyValue('SYSTEM', 'RENDERER', renderer);
        containerElement.appendChild(renderer.domElement);
        return store;
    };

    activateScreenspaceReflections(renderer, scene, camera) {
        new SsrFx(renderer, scene, camera)
    }

    addPrerenderCallback(callback) {
        if (this.prerenderCallbacks.indexOf(callback) === -1) {
            this.prerenderCallbacks.push(callback);
        }
    };

    removePrerenderCallback(callback) {
        if (this.prerenderCallbacks.indexOf(callback) !== -1) {
            this.prerenderCallbacks.splice(this.prerenderCallbacks.indexOf(callback, 1));
        }

    };

    addPostrenderCallback(callback) {
        if (this.postrenderCallbacks.indexOf(callback) === -1) {
            this.postrenderCallbacks.push(callback);
        }
    };

    removePostrenderCallback(callback) {
        if (this.postrenderCallbacks.indexOf(callback) !== -1) {
            this.postrenderCallbacks.splice(this.postrenderCallbacks.indexOf(callback, 1));
        }
    };

    addOnClearCallback(callback) {

        if (this.onClearCallbacks.indexOf(callback) === -1) {
            this.onClearCallbacks.push(callback);
        }

    }

    removeOnClearCallback(callback) {
        if (this.onClearCallbacks.indexOf(callback) !== -1) {
            this.onClearCallbacks.splice(this.onClearCallbacks.indexOf(callback, 1));
        }
    };

    pointIsVisible(vec3) {
        return this.frustum.containsPoint(vec3)
    }

    sphereIsVisible(sphere) {
        return this.frustum.intersectsSphere(sphere)
    }

    boxIsVisible(box) {
        return this.frustum.intersectsBox(box)
    }

    toScreenPosition(vec3, store) {

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



    cameraTestXYZRadius(vec3, radius) {
        this.sphere.center.copy(vec3);
        this.sphere.radius = radius;
        return this.frustum.intersectsSphere(this.sphere);
    };

    calcDistanceToCamera(vec3) {
        this.vector.copy(vec3);
        return this.vector.distanceTo(this.camera.position);
    };


    sampleCameraFrustum(store) {

    };

    setCamera(camera) {
        console.log("Set Camera", camera);
        this.camera = camera;
    };

    setCameraPosition(px, py, pz) {
        this.camera.position.x = px;
        this.camera.position.y = py;
        this.camera.position.z = pz;
    };

    setCameraUp(vec3) {
        this.camera.up.copy(vec3);
    }

    setCameraLookAt(x, y, z) {
        this.lookAt.set(x, y, z);
        this.camera.lookAt(this.lookAt)
    };

    getCameraLookAt() {
        return this.lookAt;
    };

    updateCameraMatrix() {

        //    camera.updateProjectionMatrix();

        this.camera.updateMatrixWorld(true);
        this.frustum.setFromProjectionMatrix(this.frustumMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse));
        this.camera.needsUpdate = true;

        for (let i = 0; i < this.camera.children.length; i++) {
            this.camera.children[i].updateMatrixWorld(true);
        }

    };


    addChildToParent(child, parent) {
        if (child.parent) {
            child.parent.remove(child);
        }
        parent.add(child);
    };

    addToScene(object3d) {
        this.scene.add(object3d);
        return object3d;
    };

    getCamera() {
        return this.camera;
    };

    removeModelFromScene(model) {
        if (model.parent) {
            model.parent.remove(model);
        }

        this.scene.remove(model);
    };

    setRenderParams(width, height, aspect, pxRatio) {
        this.renderer.setSize( width, height);
        this.renderer.setPixelRatio( pxRatio );
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    };

    attachPrerenderCallback(callback) {
        if (this.prerenderCallbacks.indexOf(callback) !== -1) {
            console.log("Callback already installed");
            return;
        }
        this.prerenderCallbacks.push(callback);
    };
    removePrerenderCallback(callback) {
        MATH.quickSplice(this.prerenderCallbacks, callback);
    };


    getSceneChildrenCount() {
        return this.scene.children.length;
    };



    getInfoFromRenderer(source, key) {
        if (!key) return this.renderer.info[source];
        return this.renderer.info[source][key];
    };

}

export { ThreeSetup }