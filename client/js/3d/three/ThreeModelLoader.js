import {PipelineObject} from '../../application/load/PipelineObject.js';
import { GLTFLoader } from "../../../../libs/jsm/loaders/GLTFLoader.js";
import {MeshBasicMaterial} from "../../../../libs/three/materials/Materials.js";
import {pipelineAPI} from "../../application/utils/DataUtils.js";

class ThreeModelLoader {
    constructor() {

        this.material1 = new MeshBasicMaterial( { color: 0xff00ff, wireframe: true, fog:false } );
        this.material2 = new MeshBasicMaterial( { color: 0xff0000, wireframe: true, fog:false } );
        this.materials = {
            yellow : new MeshBasicMaterial( { color: 0xffff88, wireframe: true, fog:false } ),
            red    : new MeshBasicMaterial( { color: 0xff5555, wireframe: true, fog:false } ),
            blue    : new MeshBasicMaterial({ color: 0x5555ff, wireframe: true, fog:false } )
        };

        this.defaultTrf = {
            pos:   [0,   0,  0],
            rot:   [0,   0,  0],
            scale: [1,   1,  1]
        };

        this.transformModel = function(trf, model) {
            model.position.x = trf.pos[0];
            model.position.y = trf.pos[1];
            model.position.z = trf.pos[2];
            model.rotation.x = trf.rot[0]*Math.PI;
            model.rotation.y = trf.rot[1]*Math.PI;
            model.rotation.z = trf.rot[2]*Math.PI;
            model.scale.x =    trf.scale[0];
            model.scale.y =    trf.scale[1];
            model.scale.z =    trf.scale[2];
        };



        let isLoading = [];
        let modelFileIndex;
        let modelPool = {};
        let modelList = {};
        let activeModels = {};
        let activeMixers = [];

        this.isLoading = isLoading;
        this.modelFileIndex = modelFileIndex;
        this.modelPool = modelPool;
        this.modelList = modelList;
        this.activeModels = activeModels;
        this.activeMixers = activeMixers;

        this.updateActiveMixers = function(tpf) {

            for (let i = 0; i < activeMixers.length; i++) {
                activeMixers[i].update(tpf);
            }

        };

        let contentUrl = function (url) {
            return 'content' + url.slice(1);
        };

        let saveJsonUrl = function (json, url) {
            let shiftUrl = url.slice(1);
            pipelineAPI.saveJsonFileOnServer(json, shiftUrl)
        };


        let getModelFileById = function (id) {

            for (let i = 0; i < modelFileIndex.length; i++) {
                if (modelFileIndex[i].id === id) {
                    return modelFileIndex[i]
                }
            }
            console.log("No model file by id:", id, modelFileIndex);
            return false;
        };

        let getGroupSkinnedMesh = function (children) {

            for (let j = 0; j < children.length; j++) {
                console.log("Types:", children[j].type);

                if (children[j].type === 'Group') {
                    console.log("Use the SkinnedMesh", children[j]);
                    return getGroupSkinnedMesh(children[j]);
                }

                if (children[j].type === 'SkinnedMesh') {
                    console.log("Use the SkinnedMesh", children[j]);
                    return children[j];
                }

                if (children[j].children.length) {
                    return getGroupSkinnedMesh(children[j].children);
                }
            }
        };


        let cloneGltf = function (mesh, clone) {

            if (mesh.animations.length) {
                clone.animations = mesh.animations;
                clone.frustumCulled = false;
                let skinnedMeshes = {};

                mesh.traverse(function (node) {
                    if (node.isSkinnedMesh) {
                        skinnedMeshes[node.name] = node;
                    }
                });

                let cloneBones = {};
                let cloneSkinnedMeshes = {};

                clone.traverse(function (node) {
                    clone.frustumCulled = false;
                    if (node.isBone) {
                        cloneBones[node.name] = node;
                    }

                    if (node.isSkinnedMesh) {
                        cloneSkinnedMeshes[node.name] = node;
                    }

                });

                for (let name in skinnedMeshes) {
                    let skinnedMesh = skinnedMeshes[name];
                    let skeleton = skinnedMesh.skeleton;
                    let cloneSkinnedMesh = cloneSkinnedMeshes[name];

                    let orderedCloneBones = [];

                    for (let i = 0; i < skeleton.bones.length; ++i) {
                        let cloneBone = cloneBones[skeleton.bones[i].name];
                        orderedCloneBones.push(cloneBone);
                    }

                    cloneSkinnedMesh.bind(
                        new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses),
                        cloneSkinnedMesh.matrixWorld);
                }

                console.log("CloneAnimated SkinMesh..", clone, mesh);
            }

            return clone
        };


        let poolMesh = function (id, mesh, count) {
            let poolCount = count || 1;

            if (!modelPool[id]) {
                modelPool[id] = [];
            }

            for (let i = 0; i < poolCount; i++) {

                if (mesh.type === 'Group') {

                    let clone = mesh;
                    clone.mixer = new THREE.AnimationMixer(clone);
                    clone.animations = mesh.animations;

                } else {

                    if (mesh.animations) {

                        let clone = mesh.clone();

                        clone.userData = {};

                    } else {
                        let clone = mesh.clone();
                    }

                }

                clone.userData.poolId = id;
                clone.frustumCulled = false;
                modelPool[id].push(clone);

                if (pipelineAPI.readCachedConfigKey("MESH_LIST", id) !== mesh) {
                    pipelineAPI.setCategoryKeyValue("MESH_LIST", id, mesh);
                }

                MATH.quickSplice(isLoading, id);

            }

            //    console.log("CACHE MESH", [id, modelPool, clone, mesh]);
        };

        let cacheMesh = function (id, mesh, pool) {

            pipelineAPI.setCategoryKeyValue('THREE_MODEL', id, mesh);
            poolMesh(id, mesh, pool)
        };


        let loadFBX = function (modelId, pool) {


            // Makes a Group

            console.log("load fbx:", modelId, modelList[modelId].url + '.FBX')

            var err = function (e, x) {
                console.log("FBX ERROR:", e, x);
            };

            var prog = function (p, x) {
                console.log("FBX PROGRESS:", p, x);
            };


            /*

                      fbxWorker.onmessage = function(msg) {

                          var jsonLoader = new THREE.ObjectLoader();

                          var parsed = jsonLoader.parse(msg.data[1])

                          console.log("FBX WORKER RESPONSE: ", msg.data[0], parsed, msg.data[1]);

                          cacheMesh(modelId, parsed, pool);

                      }.bind(this);

                      fbxWorker.postMessage([modelId, modelList[modelId].url+'.FBX']);
             /*
           */
            let loader = new THREE.FBXLoader();
            //   loader.options.convertUpAxis = true;
            loader.load(modelList[modelId].url + '.FBX', function (model) {
                console.log("FBX LOADED: ", model);

                cacheMesh(modelId, model, pool);
                console.log("Model List & Pool:", modelList[modelId], modelPool);
            }, prog, err);

        };

        let loadGLB = function (modelFileData) {

            // Makes a Scene
            let modelId = modelFileData.id;
            let obj;
            let animations = [];
            let animationMap = {};

            let loadCalls = 0;

            console.log("load glb:", modelFileData.id, modelFileData.url + '.glb')

            let err = function (e, x) {
                console.log("glb ERROR:", e, x);
            };

            let prog = function (p, x) {
                console.log("glb PROGRESS:", p, x);
            };


            let notifyFileLoad = function () {
                loadCalls--;

                if (!loadCalls) {

                    let clone1 = obj.clone(true);

                    obj.clone = function () {
                        let clone = clone1.clone(true);
                        return cloneGltf(obj, clone);
                    };

                    cacheMesh(modelId, obj, 3);
                }
            };

            let loaded = function (model) {
                console.log("glb LOADED: ", model);
                model.animations = animations;

                obj = model.scene;

                obj.animations = animations;

                console.log("cache glb obj: ", obj);

                modelFileData.originalModel = obj;

                console.log("Model List & Pool:", modelFileData, modelPool);

                notifyFileLoad();

            };


            let loadModel = function (src) {
                loadCalls++;
                let loader = new GLTFLoader();
                loader.load(src, loaded, prog, err);
            };


            let loadAnimation = function (animMap, key) {

                loadCalls++;

                let animLoaded = function (animScene) {
                    for (let i = 0; i < animScene.animations.length; i++) {
                        animScene.animations[i].name = key;
                        animations.push(animScene.animations[i]);
                        animMap[key].indices.push(animations.length - 1);
                    }

                    animMap[key].animation = scene.animations;
                    notifyFileLoad()

                };

                let loader = new THREE.GLTFLoader();
                loader.load(animMap[key].url, animLoaded, prog, err);

            };

            if (modelFileData.animations) {
                let animMap = modelFileData.animations;
                for (let key in animMap) {
                    animationMap[key] = {
                        name: key,
                        url: animMap[key] + '.glb',
                        indices: []
                    };
                    loadAnimation(animationMap, key)
                }
            }

            loadModel(modelFileData.url + '.glb')

        };

        this.loadGLB = loadGLB;

        let loadCollada = function (modelId, pool) {

            let loader = new THREE.ColladaLoader();
            //    loader.options.convertUpAxis = true;
            loader.load(modelList[modelId].url + '.DAE', function (collada) {
                let model = collada.scene;

                console.log("DAE LOADED: ", model);

                cacheMesh(modelId, model, pool);
                console.log("Model Pool:", modelPool);
            });
        };


        let getMesh = function (object, id, cb) {

            if (object instanceof THREE.Mesh) {
                cb(object, id);
            }

            if (typeof(object.traverse) != 'function') {
                console.log("No Traverse function", object);
                return;
            }

            object.traverse(function (child) {
                //    object.remove(child);

                if (child instanceof THREE.Mesh) {
                    //    var geom = child.geometry;
                    //    child.geometry = geom;
                    //    geom.uvsNeedUpdate = true;
                    //    console.log("Obj Mesh: ", child);
                    cb(child, id);
                }
            });
        };

        let LoadObj = function (modelId, pool) {

            let loader = new THREE.OBJLoader();

            let loadUrl = function (url, id, meshFound) {

                if (typeof(baseUrl) !== 'undefined') {

                    pool = 1;

                    url = url.substr(2);

                    url = baseUrl + url;
                    //            console.log(url);
                }

                loader.load(url, function (object) {

                    getMesh(object, id, meshFound)
                });
            };

            let uv2Found = function (uv2mesh, mid) {
                let meshObj = pipelineAPI.readCachedConfigKey('THREE_MODEL', mid);

                //        console.log(meshObj, uv2mesh, uv2mesh.geometry.attributes.uv);
                meshObj.geometry.setAttribute('uv2', uv2mesh.geometry.attributes.uv);
                uv2mesh.geometry.dispose();
                uv2mesh.material.dispose();
                cacheMesh(mid, meshObj, pool);
            };

            let modelFound = function (child, mid) {
                pipelineAPI.setCategoryKeyValue('THREE_MODEL', mid, child);

                if (modelList[modelId].urluv2) {
                    loadUrl(modelList[modelId].urluv2 + '.obj', modelId, uv2Found)
                } else {
                    cacheMesh(mid, child, pool);
                }
            };

            loadUrl(modelList[modelId].url + '.obj', modelId, modelFound)

        };

        }

        getModelFileById = function(id) {
            for (let i = 0; i < this.modelFileIndex.length; i++) {
                if (this.modelFileIndex[i].id === id) {
                    return this.modelFileIndex[i]
                }
            }
            console.log("No model file by id:", id, this.modelFileIndex);
            return false;
        };

        createObject3D = function() {
            return new THREE.Object3D();
        };

        getModelList = function() {
            return this.modelList;
        };

        getModelPool = function() {
            return this.modelPool;
        };


        extractFirstMeshGeometry = function(child, store) {

            child.traverse(function(node) {
                if (node.type === 'Mesh') {
                    store.push(node.geometry);
                }
            })

        };



        loadModelId = function(id) {
            let brute = false;
            var modelId = modelList[id].model;

            var modelFileData = this.getModelFileById(modelId);

            if (!modelFileData) {
                console.log("Bad model file request!", modelId);
                if (!brute) {
                    this.loadData();
                    brute = true;
                }

                return;
            }


            if (this.isLoading.indexOf(modelId) !== -1) {
                console.log("Model already loading:", modelId, isLoading);
                return;
            };

            this.isLoading.push(id);

            switch ( modelFileData.format )	{

                case 'dae':
                    this.loadCollada(id, this.modelList[id].pool);
                    break;

                case 'fbx':
                    this.loadFBX(id, this.modelList[id].pool);
                    break;

                case 'glb':
                    this.loadGLB(modelFileData);
                    break;

                default:
                    this.LoadObj(id, this.modelList[id].pool);
                    break;
            }

        };



        loadData = function() {

        let modelList = this.modelList;
        let _this = this;
            let modelListLoaded = function(scr, data) {

                for (let i = 0; i < data.length; i++){
                    modelList[data[i].id] = data[i];
               //     _this.loadGLB(data[i].config);
                }
            };

            let modelFileIndexLoaded = function(src, data) {

                _this.modelFileIndex = data;
                new PipelineObject("MODELS", "THREE", modelListLoaded);
                new PipelineObject("MODELS", "THREE_BUILDINGS", modelListLoaded);
                new PipelineObject("MODELS", "THREE_PHYSICS", modelListLoaded)
            };

            new PipelineObject("ASSETS", "FILES_GLB", modelListLoaded);

        };


        loadTerrainData = function(TAPI) {
            ThreeTerrain.loadData(TAPI);
        };

        createObject3D = function() {
            return new THREE.Object3D();
        };



        loadThreeMeshModel = function(applies, rootObject, ThreeSetup) {

            let defaultTrf = this.defaultTrf;
            let transformModel = this.transformModel;

            let setup = ThreeSetup;
            let _this = this;
            let attachAsynchModel = function(modelId, rootObject) {

                let attachModel = function(model) {

                    let childMaterial = function(child, matId, modelConf) {

                        let applyMaterial = function(src, mat) {
                            if (child.type === 'SkinnedMesh') {

                                //    model.children[i] = child.clone();
                                //    child = model.children[i];
                                //    mat = child.material
                                child.material = mat.clone();
                                child.material.skinning = true;
                                child.material.needsUpdate = true;
                            } else {
                                child.material = mat;
                            }


                            if (modelConf.canvas_textures) {

                                model.userData.dynamicTexture = modelConf.dynamic_texture;

                                if (modelConf.canvas_textures[child.name]) {

                                    if (!model.userData.canvasTextures) {
                                        model.userData.canvasTextures = {}
                                    }

                                    if (!model.userData.canvasTextures[child.name]) {
                                        model.userData.canvasTextures[child.name] = []
                                    }

                                    let cnvMaps = modelConf.canvas_textures[child.name];

                                    for (let i = 0; i < cnvMaps.length; i++) {
                                        let txName = modelConf.canvas_textures[child.name][i];
                                        let tx = child.material[txName];

                                        let canvas = document.createElement("canvas");

                                        canvas.width = tx.image.width;
                                        canvas.height = tx.image.height;

                                        let ctx = canvas.getContext('2d');

                                        let cnvTx = new THREE.Texture(canvas);

                                        //    cnvTx.wrapS = THREE.RepeatWrapping;
                                        //    cnvTx.wrapT = THREE.RepeatWrapping;
                                        //    cnvTx.generateMipmaps = false;

                                        cnvTx.sourceImage = tx.image;

                                        cnvTx.bufferImgId = tx.bufferImgId;
                                        cnvTx.imgUrl = tx.bufferImgId;
                                        model.userData.canvasTextures[child.name].push(cnvTx);
                                        cnvTx.ctx = ctx;

                                        cnvTx.canvas = canvas;
                                        child.material[txName] = cnvTx;
                                        console.log("Apply Canvas TX to model child: ", model);
                                    }
                                }
                            }

                            model.userData.loadCount--;

                            if (model.userData.loadCount === 0) {
                                rootObject.add(model);
                            }

                        };

                        new PipelineObject('THREE_MATERIAL', matId, applyMaterial, matId);
                    };

                    let applyGroupMaterials = function(model, modelId) {


                        model.userData.loadCount = 0;
                        let modelConf = modelList[modelId];

                        let groupMaterials = modelConf.group_materials;

                        for (let i = 0; i < model.children.length; i++) {
                            //    model.children[i] = model.children[i].clone();

                            let child = model.children[i];

                            if (typeof(groupMaterials[child.name]) === 'string') {
                                model.userData.loadCount++;
                                childMaterial(child, groupMaterials[child.name], modelConf)
                            }
                        }

                        //
                    };


                    if (modelList[modelId].transform) {
                        transformModel(modelList[modelId].transform, model);
                    } else {

                        transformModel(defaultTrf, model);
                    }


                    if (model.mixer) {

                        if (model.animations) {

                            if (model.animations.length) {

                                let action = model.mixer.clipAction( model.animations[ 0 ] );
                                //    action.play();

                                if (this.activeMixers.indexOf(model.mixer) === -1) {
                                    this.activeMixers.push(model.mixer);
                                } else {
                                    console.log("Mixer already active... clean up needed!", model);
                                }

                                console.log("Play Action", action);

                            }
                        }
                    }

                    let attachMaterial = function(src, data) {
                        model.material = data;
                        rootObject.add(model);
                    };

                    let skinMaterial = function(src, data) {
                        model.material = data;
                        model.material.skinning = true;
                        model.material.needsUpdate = true;
                        rootObject.add(model);
                    };

                    if (model.type === 'SkinnedMesh') {
                        console.log("Attach Skin Material", model);
                        new PipelineObject('THREE_MATERIAL', modelList[modelId].material, skinMaterial, modelList[modelId].material);
                        return;
                    }

                    if (model.type === 'Group' || model.type === 'Object3D' || model.type === 'Scene') {

                        console.log("Attach Group or Scene model", model, modelList, modelId);

                        let groupMaterial = function(src, mat) {

                            for (let i = 0; i < model.children.length; i++) {
                                let child = model.children[i];

                                child.traverse(function(node) {

                                    if (node.type === 'SkinnedMesh') {
                                        node.material = mat.clone();
                                        node.material.skinning = true;
                                        node.material.needsUpdate = true;
                                    }

                                });

                                if (child.type === 'SkinnedMesh') {

                                    /*
                                //    model.children[i] = child.clone();

                                    //    mat = child.material

                                    child = model.children[i];

                                    child.material = mat.clone();
                                    child.material.skinning = true;
                                    child.material.needsUpdate = true;
                                    */
                                } else {
                                    child.material = mat;
                                }
                            }
                            console.log("Attach to rootObject", rootObject);
                            rootObject.add(model);
                        };

                        if (modelList[modelId].group_materials) {
                            applyGroupMaterials(model, modelId)
                        } else {
                            new PipelineObject('THREE_MATERIAL', modelList[modelId].material, groupMaterial, modelList[modelId].material);
                        }

                        return;
                    }

                    if (model.material) {

                        if (model.material.userData.animMat) {
                            rootObject.add(model);
                            return;
                        }
                        //      attachMaterial(null, PipelineAPI.readCachedConfigKey('THREE_MATERIAL', modelList[modelId].material))
                        rootObject.add(model);
                        new PipelineObject('THREE_MATERIAL', modelList[modelId].material, attachMaterial, modelList[modelId].material);

                    } else {

                        //    var root = new THREE.Object3D();
                        //    root.add(model)
                        //    setup.addToScene(root);
                        for (let i = 0; i < model.children.length; i++) {
                            setup.addToScene(model.children[i])
                        }
                        rootObject.add(model);
                    }


                };

                //    ThreeModelLoader.loadModelId(modelId);

                _this.fetchPooledMeshModel(modelId, attachModel);
            };

            attachAsynchModel(applies, rootObject);
            return rootObject;
        };


        fetchPooledMeshModel = function(model, cb) {
        let _this = this;
            let queueFetch = function(id, cb) {
                let mId = id;
                let fCb = cb;

                _this.loadModelId(mId);

                setTimeout(function() {
                    _this.fetchPooledMeshModel(mId, fCb)
                }, 500)
            };
            let id = modelList[model].model;


            if (!modelPool[id]) {
                console.log("Queue Fetch", id, modelPool);
                queueFetch(model, cb);
                return;
            }

            let applyModel = function(src, data) {
                let mesh;

                if (!modelPool[src].length) {
                    console.log("Increase Model Pool", id);

                    if (data.scene) {
                        mesh = data // .scene // .clone() // .children[0] // .scene.clone();

                    } else {
                        mesh = data.clone();
                    }

                    mesh.userData.poolId = src;
                } else {
                    mesh = modelPool[src].pop()
                }


                if (data.animations) {
                    mesh.mixer = new THREE.AnimationMixer( mesh );
                    mesh.animations = data.animations;
                    let action = mesh.mixer.clipAction( mesh.animations[0] );
                    action.play()
                    console.log("Load Animated Model:", mesh);
                }

                if (mesh.pipeObj) {
                    mesh.pipeObj.removePipelineObject();
                }

                mesh.pipeObj = pipeObj;
                cb(mesh)

            };

            let pipeObj = new PipelineObject('THREE_MODEL', id, applyModel, id, true);

        };





        returnModelToPool = function(model) {

            let getPoolEntry = function(object, id, cb) {

                if (!object) {
                    console.log("Bad object", id);
                }

                if (object.userData.poolId) {
                    cb(object, id);
                    return;
                }

                if (typeof(object) === 'undefined') {
                    console.log("Bad object", id);
                    return;
                }

                if (typeof(object.traverse) !== 'function') {
                    console.log("No Traverse function", object);
                    return;
                }


                object.traverse( function ( child ) {
                    //    object.remove(child);

                    if ( child.userData.poolId ) {
                        //    var geom = child.geometry;
                        //    child.geometry = geom;
                        //    geom.uvsNeedUpdate = true;
                        //    console.log("Obj Mesh: ", child);
                        cb(child, id);
                    }
                });
            };

            let meshFound = function(mesh) {

                if (!mesh) console.log("Try return nothing to the pool", model);

                if (mesh.parent) {
                    mesh.parent.remove(mesh);
                }
                if (!mesh.userData.poolId) {
                    console.log("Missing Pool ID on Mesh", mesh);
                    mesh.geometry.dispose();
                    return;
                }

                if (!mesh.pipeObj) {
                    //    console.log("No pipe on mesh", mesh)
                } else {
                    mesh.pipeObj.removePipelineObject();
                }

                modelPool[mesh.userData.poolId].push(mesh);
            };

            if (!model.userData.poolId) {
                //        console.log("Shave scrap objects from mesh before returning it...");
                getPoolEntry(model, null, meshFound)
            } else {
                meshFound(model);
            }
        };

        disposeHierarchy = function(model) {

            var meshFound = function(mesh) {
                mesh.geometry.dispose();
            };

            if (!model.geometry) {
                getMesh(model, null, meshFound)
            } else {
                meshFound(model);
            }
        };



        loadThreeDebugBox = function(sx, sy, sz, colorName) {
            let geometry = new THREE.BoxBufferGeometry( sx || 1, sy || 1, sz || 1);
            return new THREE.Mesh( geometry, this.materials[colorName] || this.material1 );
        };

        loadThreeModel = function(sx, sy, sz) {
            let geometry = new THREE.SphereGeometry( sx, 10, 10);
            return new THREE.Mesh( geometry, this.material2 );
        };

        loadThreeQuad = function(sx, sy) {

            let geometry =  new THREE.PlaneBufferGeometry( sx || 1, sy || 1, 1 ,1);
            let material2 = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );

            return new THREE.Mesh( geometry, material2 );
        };


        getHeightFromTerrainAt = function(pos, normalStore) {
            return ThreeTerrain.getThreeHeightAt(pos, normalStore);
        };

        attachInstancedModelTo3DObject = function(modelId, rootObject, ThreeSetup) {

        };

        applyMaterialToMesh = function(material, model) {
            model.material = material;
        };

        getPooledModelCount = function() {
            var pool = 0;
            for (var key in modelPool) {
                pool += modelPool[key].length;
            }
            return pool;
        };



    }

export { ThreeModelLoader }