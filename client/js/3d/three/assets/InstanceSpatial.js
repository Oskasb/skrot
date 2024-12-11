import {Vector3} from "../../../../libs/three/math/Vector3.js";

let testVec3ForNaN = function(vec3) {
    if (isNaN(vec3.x) || isNaN(vec3.y) || isNaN(vec3.z)) {
        console.log("Spatial Vec3 is NaN.. investigate!")
        vec3.x = 0;
        vec3.y = 0;
        vec3.z = 0
    }
}

let tempVec = new Vector3();

class InstanceSpatial{

        constructor(obj3d) {
            let geometryInstance = null;
            this.obj3d = obj3d;
            this.baseSize = 1;
            let frameMovement = new THREE.Vector3(0.0, 0.0, 0.0);

            let getFrameVelocity = function(tpf, storeVec3) {
                if (!storeVec3) {
                    storeVec3 = tempVec;
                }
                storeVec3.copy(frameMovement);
                storeVec3.multiplyScalar(tpf);
                return storeVec3.lengthSq();
            }.bind(this);

            let setPrePos = function(pos) {
                frameMovement.copy(pos);
            }

            let setPostPos = function(pos) {
                frameMovement.sub(pos);
            }

            let getMovement = function(store) {
                return store.copy(frameMovement);
            }

            let setStopped = function() {
                frameMovement.set(0, 0, 0)
            }

            let setInstance = function(geoInstance) {
                geometryInstance = geoInstance;
                this.geometryInstance = geoInstance;
                applyInstanceBuffers();
            }.bind(this)

            let getInstance = function() {
                return geometryInstance;
            }

            let applyInstanceBuffers = function() {
                geometryInstance.applyObjPos();
                geometryInstance.applyObjQuat();
                geometryInstance.applyObjScale();
            }

            let isInstanced = function() {
                if (geometryInstance !== null) {
                    return true;
                } else {
                    return false;
                }
            }

            let hideSpatial = function(bool) {
                if (bool) {
                //    console.log("HIDE: ")
                    setTimeout(function() {
                        obj3d.position.y = -100000;
                        obj3d.scale.y = 0;
                        //    geometryInstance.applyObjPos();
                        applyInstanceBuffers()
                    }, 0)


                } else {

                }
            }

            this.call = {
                hideSpatial:hideSpatial,
                applyInstanceBuffers:applyInstanceBuffers,
                setInstance:setInstance,
                getInstance:getInstance,
                isInstanced:isInstanced,
                setStopped:setStopped,
                setPrePos:setPrePos,
                setPostPos:setPostPos,
                getMovement:getMovement,
                getFrameVelocity:getFrameVelocity
            }

        };

        getFrameMovement = function(store) {
            this.call.getMovement(store);
        };

        getSpatialPosition = function(store) {
            store.copy(this.obj3d.position);
            return store;
        };

        setPosXYZ = function(x, y, z) {
            this.obj3d.position.x = x;
            this.obj3d.position.y = y;
            this.obj3d.position.z = z;
            if (this.call.isInstanced()) {
                this.call.applyInstanceBuffers();
            }
        };

        setRotXYZ = function(x, y, z) {
            let obj3d = this.obj3d;
            obj3d.quaternion.x = 0;
            obj3d.quaternion.y = 1;
            obj3d.quaternion.z = 0;
            obj3d.quaternion.w = 0;
            obj3d.rotateX(x);
            obj3d.rotateY(y);
            obj3d.rotateZ(z)
            if (this.call.isInstanced()) {
                this.call.applyInstanceBuffers();
            }
        };
        setQuatXYZW = function(x, y, z, w) {
            this.obj3d.quaternion.x = x;
            this.obj3d.quaternion.y = y;
            this.obj3d.quaternion.z = z;
            this.obj3d.quaternion.w = w;
            if (this.call.isInstanced()) {
                this.call.applyInstanceBuffers();
            }
        };

        getQuat() {
            return this.obj3d.quaternion;
        }

        getPos() {
            return this.obj3d.position;
        }

        setBaseSize(size) {
            this.baseSize = size;
            this.setScaleXYZ(1, 1, 1)
        }
        setScaleXYZ = function(x, y, z) {
            this.obj3d.scale.x = x*this.baseSize;
            this.obj3d.scale.y = y*this.baseSize;
            this.obj3d.scale.z = z*this.baseSize;
            if (this.call.isInstanced()) {
                this.call.applyInstanceBuffers();
            }
        };

        setPosVec3 = function(posVec3) {
            this.call.setPrePos(this.obj3d.position);
            this.obj3d.position.copy(posVec3);
            this.call.setPostPos(posVec3)
            if (this.call.isInstanced()) {
                this.call.applyInstanceBuffers();
            }
        };

        rotateXYZ = function(x, y, z) {
            this.obj3d.rotateX(x);
            this.obj3d.rotateY(y);
            this.obj3d.rotateZ(z);
            if (this.call.isInstanced()) {
                this.call.applyInstanceBuffers();
            }
        };

        applySpatialUpdateToBuffers() {
            if (this.call.isInstanced()) {
                this.call.applyInstanceBuffers();
            }
        }

        attachToDynamicJoint = function(dynamicJoint) {
            this.dynamicJoint = dynamicJoint;
        };

        stickToDynamicJoint = function(dynamicJoint) {
            if (dynamicJoint.obj3d.scale.length() > 10) {
                console.log("Bad joint found!", dynamicJoint)
            }
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: dynamicJoint.obj3d.position, color:'GREEN', size:dynamicJoint.obj3d.scale.length()*0.2})
            this.stickToObj3D(dynamicJoint.obj3d);
        };

        stickToObj3D(obj3d) {

            this.setPosVec3(obj3d.position)
        //    this.obj3d.position.copy(obj3d.position);
            this.obj3d.scale.copy(obj3d.scale);
            this.obj3d.quaternion.copy(obj3d.quaternion);
            this.applySpatialUpdateToBuffers()

        }


        turnTowardsPos(posVec3) {
            this.obj3d.lookAt(posVec3);
        }

        updateSpatialMatrix = function() {

            if (!this.call.isInstanced()) {
                this.obj3d.updateMatrixWorld();
            }

        };

        setGeometryInstance = function(geomIns) {
            this.call.setInstance(geomIns);
        };

    }

export {InstanceSpatial}
