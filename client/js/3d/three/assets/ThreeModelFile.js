import {ExpandingPool} from '../../../application/utils/ExpandingPool.js';
import {InstanceSpatial} from './InstanceSpatial.js';
import { GLTFLoader } from "../../../../libs/three/GLTFLoader.js";
import * as SkeletonUtils from "../../../../libs/three/SkeletonUtils.js";

        class ThreeModelFile {
            constructor(id, config, callback) {

        //    console.log("ThreeModelFile", id, config);

            this.id = id;


            let instantiateAsset = function(assetId, callback) {
                this.cloneSkinnedModelOriginal(callback)
            }.bind(this);

            this.expandingPool = new ExpandingPool(this.id, instantiateAsset);

                let modelLoaded = function(glb) {
            //    console.log("glb loaded", glb);
                this.scene = glb;
                callback(this);
            }.bind(this);



                let loader = new GLTFLoader();
                let loadGLB = function(url, cacheMesh) {

                    // Makes a Scene

                    let obj;
                    let animations = [];

                    let err = function(e, x) {
                        console.log("glb ERROR:", e, x);
                    };

                    let prog = function(p, x) {
                        //    console.log("glb PROGRESS:", p, x);
                    };

                    let loaded = function ( model ) {

                        obj = model.scene;
                        obj.animations = model.animations;

                        cacheMesh(obj);
                    };

                    let loadModel = function(src) {

                        loader.load(src, loaded, prog, err);
                    };

                    loadModel(url+'.glb')

                };

            loadGLB(config.url, modelLoaded)
        };

        returnCloneToPool = function(spatial) {
            ThreeAPI.hideModel(spatial.obj3d);

            if (this.expandingPool.pool.indexOf(spatial) !== -1) {
                console.log("Bad Model recovery", this.id, spatial, this);
                return;
            }

            this.expandingPool.returnToExpandingPool(spatial);
        };

        getCloneFromPool = function(callback) {
            this.expandingPool.getFromExpandingPool(callback)
        };


        cloneMeshModelOriginal = function() {
            return this.scene.clone();
        };

        cloneSkinnedModelOriginal = function(callback) {
            let clone = SkeletonUtils.clone(this.scene);  // cloneGltf(this.scene, this.cloneMeshModelOriginal());
            clone.frustumCulled = false;
            let spatial = new InstanceSpatial(clone);
            callback(spatial)
        };

    }

export { ThreeModelFile };