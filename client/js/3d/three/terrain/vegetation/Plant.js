import {Object3D} from "../../../../../../libs/three/core/Object3D.js";
import {Vector3} from "../../../../../../libs/three/math/Vector3.js";


let endTime = 0;
let attackTime = 2;
let decayTime = 1
let index =0;

let applyPlantConfig = function(plant, config) {

    plant.size = MATH.randomBetween(config.size_min, config.size_max) || 5;

    //    this.colorRgba.r = MATH.randomBetween(this.config.color_min[0], this.config.color_max[0]) || 1;
    //    this.colorRgba.g = MATH.randomBetween(this.config.color_min[1], this.config.color_max[1]) || 1;
    //    this.colorRgba.b = MATH.randomBetween(this.config.color_min[2], this.config.color_max[2]) || 1;
    //    this.colorRgba.a = MATH.randomBetween(this.config.color_min[3], this.config.color_max[3]) || 1;
    plant.sprite.x = config.sprite[0] || 0;
    plant.sprite.y = config.sprite[1] || 7;
    plant.sprite.z = config.sprite[2] || 1;
    plant.sprite.w = config.sprite[3] || 1;

    if (config.asset_ids) {
        plant.poolKey = MATH.getRandomArrayEntry(config.asset_ids)
    }

};

let tempObj = new Object3D();
let tempVec = new Vector3();
class Plant {
    constructor() {
    //    console.log(index)
        index++;
        this.startTime =0;
        this.obj3d = new Object3D();
        this.pos = this.obj3d.position;
        this.normal = new Vector3();
        this.sprite = {x:1, y:1, z:1, w:1};
        this.vertexColor = {x:1, y:1, z:1, w:1};
            this.rotZ = 0;
        this.size = 1;

        let instance = null;

        this.poolKey = "asset_vegQuad";



        this.isActive = false;

        this.bufferElement;

        let elementReady = function(bufferElement) {
            this.setBufferElement(bufferElement);
        }.bind(this);

        let setInstance = function(modelInstance) {
            instance = modelInstance;
        }

        let getInstance = function() {
            return instance;
        }

        this.callbacks = {
            elementReady:elementReady,
            setInstance:setInstance,
            getInstance:getInstance
        }

    };

    getIsActive = function() {
        return this.isActive;
    };


    plantActivate = function(poolKey, config, posVec, rotZ, size, nearness) {

        if (this.isActive) {
            console.log("Plant Already Active...")
            return;
        }
        this.poolKey = poolKey;
        this.rotZ = rotZ;
        this.obj3d.position.set(0, 0, 0);

        if (config.surface && posVec.y < 0) {
            posVec.y = 0;
            this.normal.set(0, 1, 0)
        }

        this.obj3d.lookAt(this.normal);
        this.obj3d.rotateZ(rotZ);
        this.obj3d.position.copy(posVec);

        this.obj3d.scale.set(1, 1, 1);
        this.obj3d.scale.multiplyScalar(size);

        applyPlantConfig(this, config);

        this.isActive = true;

        let instances = client.dynamicMain.instances;

        let addPlant = function(instance) {
            instance.stationary = true;

            if (instances.indexOf(instance) !== -1) {
                MATH.splice(instances , instance);
            }

            ThreeAPI.getScene().remove(instance.spatial.obj3d)
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:this.obj3d.position, color:'GREEN'});
            this.callbacks.setInstance(instance)
            this.applyInstanceAttributes(instance, nearness);
            this.obj3d.scale.set(100, 100, 100)
            instance.spatial.stickToObj3D(this.obj3d);

        }.bind(this)

        client.dynamicMain.requestAssetInstance(this.poolKey, addPlant)

    };

    plantDeactivate = function() {
        if (this.isActive === false) return;
        this.isActive = false;

        this.callbacks.getInstance().originalAsset.disableAssetInstance(this.callbacks.getInstance());
        endTime = client.getFrame().systemTime-1;

        this.geoInstance.setAttribXYZW('lifecycle', this.startTime, attackTime, endTime+decayTime, decayTime)
        this.callbacks.setInstance(null);
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:this.obj3d.position, color:'RED'});
        //    this.bufferElement.endLifecycleNow();
        //    MATH.callAll(this.callbacks.deactivatePlant, this);
    };

    getElementCallback = function() {
        return this.callbacks.elementReady;
    };

    setPlantPosition = function(pos) {
        this.pos.copy(pos);
    };

    getPlantElement = function() {
        return this.bufferElement;
    };

    applyInstanceAttributes = function(instance, nearness) {
    //    this.bufferElement = bufferElement;
    /*
        this.bufferElement.setPositionVec3(this.pos);

        tempObj.lookAt(this.normal);
        tempObj.rotateZ(Math.random() * 10);

        this.bufferElement.setQuat(tempObj.quaternion);

        this.bufferElement.scaleUniform(this.size);
      */
    //    instance.setSprite(this.sprite)
        instance.setAttributev4('sprite', this.sprite)
        instance.setAttributev4('vertexColor', this.vertexColor)

        this.geoInstance = instance.getGeometryInstance();
/*
        this.bufferElement.setSprite(this.bufferElement.sprite);
        this.bufferElement.setColorRGBA(this.colorRgba);
*/

        this.startTime = client.getFrame().systemTime -0.02;
        endTime = this.startTime + 9999999;

        this.geoInstance.setAttribXYZW('lifecycle', this.startTime, attackTime - MATH.curveSqrt(nearness)*attackTime, endTime, decayTime)

    };

}

export {Plant}