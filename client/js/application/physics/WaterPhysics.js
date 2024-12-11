"use strict";

define([
        'worker/physics/ShapePhysics'
    ],
    function(
        ShapePhysics
    ) {

    var mecSubmergedDepth;

        var tempVec = new THREE.Vector3();
        var tempVec2 = new THREE.Vector3();
        var tempVec3 = new THREE.Vector3();
        var tempQuat = new THREE.Quaternion();

        var tempVelVec = new THREE.Vector3();
        var tempAngVelVec = new THREE.Vector3();
        var AoAVec = new THREE.Vector3();
        var compoundAoAVec = new THREE.Vector3();



        var tempVolumeVelVec = new THREE.Vector3();
        var tempVecGlobalPos = new THREE.Vector3();

        var speed;

        var velDot;
        var submergedFraction;

        var totalSubmergedVolume;

        var unsubmergedVolume;

        var currentTime;

        var radius;

        var sphereVolume;

        var totalVolForce;
        var shapeVolForce;

        var submergedVolume;
        var shape;

        var density;

        var WaterPhysics = function(physicsApi) {
        //    ShapePhysics.initData();
        };


        WaterPhysics.prototype.processWaterProximity = function(dynSpat, physTpf) {
            dynSpat.getSpatialQuaternion(tempQuat);
            speed = dynSpat.spatialBuffer[ENUMS.BufferSpatial.SPEED_MPS];
            dynSpat.getVectorByFirstIndex(ENUMS.BufferSpatial.VELOCITY_X, tempVelVec);
            dynSpat.getVectorByFirstIndex(ENUMS.BufferSpatial.ANGULAR_VEL_X, tempAngVelVec);
            dynSpat.getVectorByFirstIndex(ENUMS.BufferSpatial.ANGLE_OF_ATTACK_X, AoAVec);


            totalSubmergedVolume = 0;
            unsubmergedVolume = 0;
            totalVolForce = 0;
            density = 1000;
            for (var i = 0; i < dynSpat.dynamicShapes.length; i++) {

                shape = dynSpat.dynamicShapes[i]

                shape.calculateWorldPosition(tempVec, tempQuat, tempVecGlobalPos);
                shape.calculateVelocityFromAngularVelocity(tempAngVelVec, tempVolumeVelVec);

                submergedVolume = ShapePhysics.volumeBeneathSurface(shape, tempVec, tempQuat, PhysicsWorldAPI.waveHeightAtPos(tempVecGlobalPos));

                sphereVolume = shape.size.x * shape.size.y * shape.size.z ;

                unsubmergedVolume += sphereVolume;

                if (submergedVolume > 0) {

                    unsubmergedVolume-=submergedVolume;
                    totalSubmergedVolume += submergedVolume;

                    tempVolumeVelVec.addVectors(tempVelVec , tempVolumeVelVec );

                    compoundAoAVec.copy(AoAVec);

                    compoundAoAVec.x += tempAngVelVec.x  * shape.offset.z / (speed * 10);
                    compoundAoAVec.y -= tempAngVelVec.y  * shape.offset.z / (speed * 10);
                    compoundAoAVec.x -= tempAngVelVec.z  * shape.offset.x / (speed * 10);

                    ShapePhysics.calculateShapeDynamicForce(dynSpat, shape, tempVolumeVelVec, tempQuat, tempVec2, compoundAoAVec, speed, density);

                    tempVec3.set(0, submergedVolume*density/0.026, 0);

                    shape.addForceToDynamicShape(tempVec3);

                }
            }

            submergedFraction = MATH.calcFraction(0, unsubmergedVolume+totalSubmergedVolume,  totalSubmergedVolume);

            var baseDamp = Math.min(dynSpat.baseDamping + Math.sqrt(submergedFraction*2) * 0.2, 0.49);
            var rotDamp =  Math.min(dynSpat.baseDamping + Math.sqrt(submergedFraction*2) * 0.2, 0.85);

            if (tempVelVec.y < -5) {
                baseDamp *= (1 - tempVelVec.y*0.1);
                rotDamp *= (1 - tempVelVec.y*0.1)
            }

            PhysicsWorldAPI.setBodyDamping(dynSpat.body, baseDamp, rotDamp)

        };


        WaterPhysics.prototype.simulateDynamicSpatialInWater = function(dynSpat, physTpf) {

            if (dynSpat.isStatic()) {
                return;
            }

            dynSpat.getSpatialPosition(tempVec);

            if (tempVec.y < dynSpat.getVisualSize()) {
                this.processWaterProximity(dynSpat, physTpf);
            }

        };


        return WaterPhysics;

    });

