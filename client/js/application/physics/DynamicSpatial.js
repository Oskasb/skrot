"use strict";

define([

    ],
    function(

    ) {


        var tempVec1 = new THREE.Vector3();
        var tempVec2 = new THREE.Vector3();
        var tempVec3 = new THREE.Vector3();
        var tempQuat = new THREE.Quaternion();
        var tempObj = new THREE.Object3D();
        var tempObj2 = new THREE.Object3D();

        tempObj2.rotation.reorder('YXZ');
        tempObj.rotation.reorder('YXZ');

        var tempEuler = new THREE.Euler();
        var tempEuler2 = new THREE.Euler();
        var TRANSFORM_AUX;
        var VECTOR_AUX;

        var DynamicSpatial = function(config) {

            this.config = config;

            this.pieceConfKey = "";
            this.pieceConfId = "";

            this.isDynamic = 1;

            this.velocity = new THREE.Vector3();
            this.angularVelocity = new THREE.Vector3();
            this.up = new THREE.Vector3();
            this.axis = new THREE.Vector3();
            this.quat = new THREE.Quaternion();

            this.shapesMap = {};
            this.dynamicShapes = [];
            this.stillFrames = 0;
            this.simulateFlag = 1;
            this.disabledFlag = 0;
            this.stillLimit = 5;
            this.inheritRotation = true;
            this.visiblePingFrames = 2000;
        };

        //Used inside the physics worker
        DynamicSpatial.prototype.setPhysicsBody = function(body) {

            if (!TRANSFORM_AUX) {
                TRANSFORM_AUX = new Ammo.btTransform();
                VECTOR_AUX = new Ammo.btVector3()
            }

            this.applyBodyTransform(body);
            this.body = body;
            return body

        };

        DynamicSpatial.prototype.getConfigKey = function(key) {
            return this.config[key];

        };

        DynamicSpatial.prototype.setWorldEntity = function(worldEntity) {
            this.worldEntity = worldEntity;

        };

        DynamicSpatial.prototype.getSpatialPosition = function(storeVec) {
            this.worldEntity.getWorldEntityPosition(storeVec);
            return storeVec;
        };

        DynamicSpatial.prototype.getSpatialQuaternion = function(storeQuat) {
            this.worldEntity.getWorldEntityQuat(storeQuat);
            return storeQuat;
        };

        DynamicSpatial.prototype.getSpatialScale = function(storeVec) {
            this.worldEntity.getWorldEntityScale(storeVec);
            return storeVec;
        };


        DynamicSpatial.prototype.applySpatialPositionXYZ = function(x, y, z) {
            tempVec1.set(x, y, z);
            this.worldEntity.setWorldEntityPosition(tempVec1);
        };

        DynamicSpatial.prototype.applySpatialQuaternionXYZW = function(x, y, z, w) {
            this.quat.set(x, y, z, w);
            this.axis.set(this.config.args[0], 0, 0);
            this.axis.applyQuaternion(this.quat);
            this.up.set(0, 1, 0);
            this.up.applyQuaternion(this.quat);
            if (this.inheritRotation) {
                this.worldEntity.setWorldEntityQuaternion(tempQuat);
            }

        };

        DynamicSpatial.prototype.applySpatialScaleXYZ = function(x, y, z) {
            tempVec1.set(x, y, z);
            this.worldEntity.setWorldEntityScale(tempVec1);
        };


        DynamicSpatial.prototype.isStatic = function() {
            return 1 - this.isDynamic;
        };

        DynamicSpatial.prototype.setSpatialDynamicFlag = function(flag) {
            this.isDynamic = flag;
        };


        DynamicSpatial.prototype.setSpatialBodyMass = function(mass) {
            this.bodyMass = mass;
        };

        DynamicSpatial.prototype.applyDynamicSpatialTorque = function(ammoApi, torqueVec) {
            torqueVec.multiplyScalar(this.bodyMass*50);
            ammoApi.applyForceAndTorqueToBody(null, this.body, torqueVec)
        };

        DynamicSpatial.prototype.applyDynamicSpatialForce = function(ammoApi, forceVec) {
            forceVec.multiplyScalar(this.bodyMass*50);
            ammoApi.applyForceAndTorqueToBody(forceVec, this.body)
        };

        DynamicSpatial.prototype.getVisualSize = function() {
            return this.bodyMass;
        };
        DynamicSpatial.prototype.setSpatialFromPosAndQuat = function(pos, quat) {
            this.applySpatialPositionXYZ(pos.x, pos.y,pos.z);
            this.applySpatialQuaternionXYZW(quat.x, quat.y,quat.z, quat.w)
        };

        DynamicSpatial.prototype.getScaleKey = function() {
            this.getSpatialScale(tempVec1);
            return '_scale_'+tempVec1.x+tempVec1.y+tempVec1.z
        };

        var i;

        DynamicSpatial.prototype.tickPhysicsForces = function(ammoApi) {

            this.getSpatialQuaternion(tempQuat);
            tempVec1.set(0, 0, 0);


            if (this.bufferContainsTorque() || this.bufferContainsForce()) {
                this.getSpatialForce(tempVec1);
                this.getSpatialTorque(tempVec2);
                ammoApi.applyForceAndTorqueToBody(tempVec1, this.body, tempVec2)
            }
        };

        DynamicSpatial.prototype.testVectorByFirstIndex = function(indx) {
            return (Math.abs(this.spatialBuffer[indx]) + Math.abs(this.spatialBuffer[indx+1]) + Math.abs(this.spatialBuffer[indx+2]))
        };

        DynamicSpatial.prototype.setSpatialSimulateFlag = function(value) {
            this.simulateFlag = value;
        };

        DynamicSpatial.prototype.getSpatialSimulateFlag = function() {
            return this.simulateFlag;
        };

        DynamicSpatial.prototype.setSpatialDisabledFlag = function(value) {
            this.disabledFlag = value;
        };

        DynamicSpatial.prototype.getSpatialDisabledFlag = function() {
            return this.disabledFlag;
        };

        DynamicSpatial.prototype.setSpatialStillFrames = function(value) {
            this.stillFrames = value;
        };

        DynamicSpatial.prototype.getSpatialStillFrames = function() {
            return this.stillFrames;
        };

        var motion;

        DynamicSpatial.prototype.testSpatialMotion = function() {

            motion = this.velocity.lengthSq()+ this.angularVelocity.lengthSq();

            if (motion < 0.01) {
                this.setSpatialStillFrames(this.getSpatialStillFrames()+1);
            } else {
                this.setSpatialStillFrames(0);
            }

        };


        DynamicSpatial.prototype.tickPhysicsUpdate = function(ammoApi) {

            this.testSpatialMotion();
            if (this.getSpatialStillFrames() < this.stillLimit) {

                this.setSpatialSimulateFlag(1)

            } else {
                this.setSpatialSimulateFlag(0)
            }

            if (this.getSpatialSimulateFlag()) {

                if (this.getSpatialDisabledFlag()) {

                    //    ammoApi.includeBody(this.body);
                    ammoApi.requestBodyActivation(this.body);

                    this.setSpatialDisabledFlag(0);

                }


            } else {

                if (!this.getSpatialDisabledFlag()) {

                    //    ammoApi.excludeBody(this.body);
                    ammoApi.requestBodyDeactivation(this.body);

                    this.setSpatialDisabledFlag(1);

                }
            }
        };

        var vel;
        var angVel;

        DynamicSpatial.prototype.applyBodyTransform = function(body) {
            var ms = body.getMotionState();

                ms.getWorldTransform(TRANSFORM_AUX);
                var p = TRANSFORM_AUX.getOrigin();
                var q = TRANSFORM_AUX.getRotation();
                if (isNaN(p.x())) {

                    PhysicsWorldAPI.registerPhysError();

                    var tf = new Ammo.btTransform();

                    this.getSpatialPosition(tempVec1);
                    this.getSpatialQuaternion(tempQuat);

                    tf.getOrigin().setX(tempVec1.x);
                    tf.getOrigin().setY(tempVec1.y);
                    tf.getOrigin().setZ(tempVec1.z);

                    tf.getRotation().setX(tempQuat.x);
                    tf.getRotation().setY(tempQuat.y);
                    tf.getRotation().setZ(tempQuat.z);
                    tf.getRotation().setW(tempQuat.w);

                    ms.setWorldTransform(tf);

                    console.log("Bad body transform", this.body)

                    return;
                }

                let y = p.y()

                if (!this.inheritRotation) {
                    y -= this.config.args[0];
                }
                this.applySpatialPositionXYZ(p.x(), y, p.z());

            this.applySpatialQuaternionXYZW(q.x(), q.y(), q.z(), q.w());


        };

        DynamicSpatial.prototype.sampleBodyState = function() {

            if (this.isStatic()) {
                return;
            }

            if (!this.body.getMotionState) {
                PhysicsWorldAPI.registerPhysError();
                console.log("Bad physics body", this.body);
                return;
            }

            this.applyBodyTransform(this.body);

            vel = this.body.getLinearVelocity();

            this.velocity.set(vel.x(), vel.y(), vel.z());

            this.worldEntity.setWorldEntityVelocity(this.velocity);

            angVel = this.body.getAngularVelocity();

            this.angularVelocity.set(angVel.x(), angVel.y(), angVel.z());

            if (this.isStatic()) {
                this.setSpatialDisabledFlag(1);
            }

        };


        return DynamicSpatial;

    });

