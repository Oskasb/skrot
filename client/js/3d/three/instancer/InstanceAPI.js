import {InstanceBuffer} from './InstanceBuffer.js';
import {GeometryInstance} from './GeometryInstance.js';
import {getSetting} from "../../../application/utils/StatusUtils.js";
import {Vector3} from "../../../../../libs/three/Three.Core.js";

let releasedIndices = [];

class InstanceAPI {
    constructor() {
    //    console.log('INIT InstanceAPI');

        this.bufferCount = 0;
        this.modelCount = 0;
        this.tempVec = new Vector3();
        this.instanceBuffers = {};

        this.instances = {};
        this.releasedInstances = {};
        this.addedInstances = {};
        this.registeredInstances = {};
        this.frameChanges = [];
        this.materials = [];
        this.uiSystems = {};
        this.attributes = {
            "startTime"      : { "dimensions":1, "dynamic":true },
            "duration"       : { "dimensions":1, "dynamic":false},
            "offset"         : { "dimensions":3, "dynamic":false},
            "texelRowSelect" : { "dimensions":4, "dynamic":false},
            "lifecycle"      : { "dimensions":4, "dynamic":false},
            "tileindex"      : { "dimensions":2                 },
            "sprite"         : { "dimensions":4, "dynamic":false},
            "diffusors"      : { "dimensions":4, "dynamic":false},
            "vertexColor"    : { "dimensions":4, "dynamic":false},
            "scale3d"        : { "dimensions":3, "dynamic":false},
            "orientation"    : { "dimensions":4, "dynamic":false}
        };
    }

    addToModelCount() {
        this.modelCount++;
    }

    getModelCount() {
        return this.modelCount;
    }



    registerGeometry = function(id, model, settings, material) {
        this.bufferCount++
        let extractFirstMeshGeometry = function(child, buffers) {

            child.traverse(function(node) {
                if (node.type === 'Mesh') {
                    let geometry = node.geometry;
                    buffers.verts   = geometry.attributes.position.array;
                    buffers.normals = geometry.attributes.normal.array;
                    buffers.uvs     = geometry.attributes.uv.array;

                    if (geometry.index) {
                        buffers.indices = geometry.index.array;
                    } else {
                        console.log("No indices for geometry... ", id, model);
                    }

                }
            });

        };

        if (this.materials.indexOf(material) === -1) {
            this.materials.push(material);
        }



        let settingMultiplier = getSetting(ENUMS.Settings.INSTANCE_MULTIPLIER)
        let addCount = 0;
        if (settings['vegetation'] === true) {
            settingMultiplier = getSetting(ENUMS.Settings.VEGETATION_DENSITY)
            let rangeOffset = getSetting(ENUMS.Settings.VEGETATION_RANGE);
            settingMultiplier = Math.floor(settingMultiplier * (10 + rangeOffset * 2) * 0.1);
        } else if (settings['is_terrain'] === true) {
            let rangeOffset = getSetting(ENUMS.Settings.TERRAIN_RANGE);
            addCount = rangeOffset * 4;
        } else {
            let rangeOffset = getSetting(ENUMS.Settings.VIEW_DISTANCE);
            settingMultiplier = Math.floor(settingMultiplier * (10 + MATH.curveQuad(rangeOffset*0.5)) * 0.1);
        }

    //    console.log("Apply setting multiplier", settingMultiplier)

        let count = settings.instances * settingMultiplier + addCount;
        let attribs = settings.attributes;

        let buffers = {};
        extractFirstMeshGeometry(model.scene.children[0], buffers);
        let insBufs = new InstanceBuffer(buffers.verts, buffers.uvs, buffers.indices, buffers.normals);
        insBufs.mesh.name = id+' '+this.bufferCount+' '+material.id;

        for (let i = 0; i < attribs.length; i++) {
            let attrib = this.attributes[attribs[i]];
            insBufs.registerBufferAttribute(attrib,  attribs[i], count)
        }

        insBufs.activateAttributes(1);
        insBufs.setMaterial(material);
        this.instanceBuffers[id] = insBufs;
        this.instanceBuffers[id].setInstancedCount(0);
        if (settings.cameraspace) {
            this.instanceBuffers[id].isCameraSpace = true;
            insBufs.addToScene();
        }
    //
        return insBufs;
    };


    bindGeometryInstance(geoIns) {
        let id = geoIns.id;
        if (this.frameChanges.indexOf(id) === -1) {
            this.frameChanges.push(id);
        }


        if (this.instances[id].indexOf(geoIns) !== -1) { //This happens from veg system
        //    console.log("Already Registered.. ", geoIns)
            return;
        }

        if (this.addedInstances[id].indexOf(geoIns) !== -1) {
            console.log("Already Added.. ", geoIns)
            return;
        }

        if (this.releasedInstances[id].indexOf(geoIns) !== -1) {
            console.log("Currently Releasing.. ", geoIns)
            return;
        }

        geoIns.initBuffers();
        geoIns.index = this.instances[id].length;
        this.instances[id].push(geoIns);

        let iCount = this.instances[id].length
        this.updateInstanceBufferIdCount(id, iCount)

    }

    instantiateGeometry = function(id, callback) {
        if (!this.instances[id]) {
            this.instances[id] = []
            this.addedInstances[id] = [];
            this.releasedInstances[id] = [];
            this.registeredInstances[id] = [];
        }

        let instance = new GeometryInstance(id, this.registeredInstances[id].length, this.instanceBuffers[id]);
        this.registeredInstances[id].push(instance);
        callback(instance);
    };

    releaseGeometryInstance(geomInstance) {
        if (!geomInstance) {
            console.log("Try remove a nothing")
            return;
        }
        let id = geomInstance.id;

        this.releasedInstances[id].push(geomInstance);
        if (this.frameChanges.indexOf(id) === -1) {
            this.frameChanges.push(id);
        }

    }

    getUiSysInstanceBuffers = function(uiSysKey) {
        return this.uiSystems[uiSysKey];
    };

    setupInstancingBuffers = function(msg) {

        let uiSysId     = msg[0];
        let assetId     = msg[1];
        let bufferNames = msg[2];
        let buffers     = msg[3];
        let order       = msg[4];

    //    console.log("setupInstancingBuffers: ", assetId);

        if (!this.uiSystems[uiSysId]) {
            this.uiSystems[uiSysId] = [];
        }

        let assetLoaded = function(threeModel) {
        //    console.log("assetLoaded: ", threeModel.id);
            let instanceBuffers = threeModel.instanceBuffers;
            for (let i = 0; i < bufferNames.length; i++) {
                let attrib = this.attributes[bufferNames[i]];
                //           instanceBuffers.registerBufferAttribute(attrib,  bufferNames[i], 1)
                  instanceBuffers.attachAttribute(buffers[i], bufferNames[i], attrib.dimensions, attrib.dynamic)
            }

        //  instanceBuffers.activateAttributes(1)

            instanceBuffers.setRenderOrder(order)
            instanceBuffers.setInstancedCount(1);

            this.uiSystems[uiSysId].push(instanceBuffers);

        }.bind(this);

       ThreeAPI.loadThreeAsset('MODELS_', assetId, assetLoaded);

    };


    monitorInstances = function(key, value) {
        let cache = PipelineAPI.getCachedConfigs();
        if (!cache['DEBUG']) {
            cache.DEBUG = {};
        }
        if (!cache['DEBUG']['BUFFERS']) {
            cache.DEBUG.BUFFERS = {
                systems:0,
                active:0,
                total:0,
                sysAssets: [],
                sysKeys:[]
            };
            this.track = cache.DEBUG.BUFFERS;
        }
        this.track[key] = value;

    }


    processRemovedInstances(id) {
        let releasedInstances = this.releasedInstances[id];
        let instances = this.instances[id];
        let lowestReleasedIndex = instances.length;
        while (releasedInstances.length) {
            let rem = releasedInstances.pop();
            if (rem.index < lowestReleasedIndex) {
                lowestReleasedIndex = rem.index;
            }
            MATH.splice(instances, rem);
        }

        if (instances.length !== 0) {
            this.recalculateInstanceIndices(id, lowestReleasedIndex)
        }

    }

    recalculateInstanceIndices(id, lowestReleasedIndex) {
        let instances = this.instances[id];
        for (let i = lowestReleasedIndex; i < instances.length; i++) {
            let srcIndex = instances[i].index;
            let srcAttributes = instances[i].instancingBuffers.attributes
            instances[i].index = i;
            instances[i].copyAttributesByIndex(srcIndex, srcAttributes);
        }
    }




    updateInstanceBufferIdCount(id, count) {

        let iBuff = this.instanceBuffers[id]
            iBuff.setInstancedCount(count)

    }

    updateInstances() {

        let iCount = 0;

        while (this.frameChanges.length) {
            let id = this.frameChanges.pop();

            this.processRemovedInstances(id);
            let iCount = this.instances[id].length
            this.updateInstanceBufferIdCount(id, iCount)

        }

        let updateUiSystemBuffers = function(instanceBuffers) {
            let count = instanceBuffers.updateBufferStates()
        //    console.log(count);
        // This is not properly used, can probably cull a lot

       //     if (instanceBuffers.mesh.geometry.instanceCount !== 1) {
       //         instanceBuffers.addToScene();
            //    }

            instanceBuffers.mesh.geometry.instanceCount = count;
            instanceBuffers.mesh.geometry.needsUpdate = true;

            iCount+=count;
        };

        let sysKeys = 0;
        let sysBuffs = 0;
        for (let key in this.uiSystems) {
            sysKeys++
            for (let i = 0; i < this.uiSystems[key].length; i++) {
                sysBuffs++
                updateUiSystemBuffers(this.uiSystems[key][i])
            }
        }

        let fogDensityUniform = ThreeAPI.readEnvironmentUniform('fog', 'density')
        let distanceSettingFactor = 1 - MATH.curveSqrt(getSetting(ENUMS.Settings.VIEW_DISTANCE)/9);

        ThreeAPI.setGlobalUniform( 'fogDensity', fogDensityUniform * distanceSettingFactor);
        ThreeAPI.setGlobalUniform( 'fogColor' ,ThreeAPI.readEnvironmentUniform('fog', 'color'));
        ThreeAPI.setGlobalUniform( 'sunLightColor' ,ThreeAPI.readEnvironmentUniform('sun', 'color'));
        ThreeAPI.setGlobalUniform( 'ambientLightColor' ,ThreeAPI.readEnvironmentUniform('ambient', 'color'));

        let quat = ThreeAPI.readEnvironmentUniform('sun', 'quaternion');
        this.tempVec.set(0, 0, -1);
        this.tempVec.applyQuaternion(quat);
        ThreeAPI.setGlobalUniform( 'sunLightDirection' ,this.tempVec);
        ThreeAPI.setGlobalUniform('clearViewPos1', ThreeAPI.getCameraCursor().getPos());

        let mats = 0;

        for (let i = 0; i < this.materials.length; i++) {
            let mat = this.materials[i];
            if (mat) {
                mats++
                if (mat.uniforms) {
                    if (mat.uniforms.systemTime) {
                        mat.uniforms.systemTime.value = client.getFrame().systemTime;
                    } else {
                        console.log("no uniform yet...")
                    }
                }
            } else {
                console.log("no material yet...")
            }

        }
        this.monitorInstances('mats', mats);
        this.monitorInstances('sysKeys', sysKeys);
        this.monitorInstances('sysBuffs', sysBuffs);
        this.monitorInstances('iCount', iCount);
    };

}

export { InstanceAPI };
