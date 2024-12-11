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

        var AirPhysics = function(physicsApi) {
        //    ShapePhysics.initData();
        };

        var sqrtSpd;

        var liftVec = new THREE.Vector3();
        var dragVec = new THREE.Vector3();

        AirPhysics.prototype.processAirPhysics = function(dynSpat, altitude) {
            dynSpat.getSpatialQuaternion(tempQuat);
            speed = dynSpat.spatialBuffer[ENUMS.BufferSpatial.SPEED_MPS];
            sqrtSpd = Math.sqrt(speed);
            dynSpat.getVectorByFirstIndex(ENUMS.BufferSpatial.VELOCITY_X, tempVelVec);
            dynSpat.getVectorByFirstIndex(ENUMS.BufferSpatial.ANGULAR_VEL_X, tempAngVelVec);
            dynSpat.getVectorByFirstIndex(ENUMS.BufferSpatial.ANGLE_OF_ATTACK_X, AoAVec);

        //    liftVec.set(0, AoAVec.x * speed * speed, 0);

        //    liftVec.applyQuaternion(tempQuat);

        //    dynSpat.applySpatialImpulseVector(liftVec);
        //    dragVec.copy(tempVelVec);
        //    dragVec.multiplyScalar(-speed);
        //    dynSpat.applySpatialImpulseVector(dragVec);

            totalSubmergedVolume = 0;
            unsubmergedVolume = 0;
            totalVolForce = 0;
            density = MATH.airDensityAtAlt(altitude);

            for (var i = 0; i < dynSpat.dynamicShapes.length; i++) {

                shape = dynSpat.dynamicShapes[i];

                shape.calculateVelocityFromAngularVelocity(tempAngVelVec, tempVolumeVelVec);

                tempVolumeVelVec.add(tempVelVec);
                compoundAoAVec.copy(AoAVec);

            //    compoundAoAVec.x += -tempAngVelVec.y  * shape.offset.z // speed;
                compoundAoAVec.x += tempAngVelVec.x  * shape.offset.z / (1 + sqrtSpd*0.3+speed*0.15);
                compoundAoAVec.y -= tempAngVelVec.y  * shape.offset.z / (1 + sqrtSpd*0.3+speed*0.15);

                compoundAoAVec.x -= tempAngVelVec.z * shape.offset.x / (1 + sqrtSpd*0.2+speed*0.15);

            //    compoundAoAVec.y -= tempAngVelVec.x * shape.offset.z / sqrtSpd;

            //    compoundAoAVec.y += tempAngVelVec.y * shape.offset.x / sqrtSpd; // yaw rotation...

            //    compoundAoAVec.x -= tempAngVelVec.y * shape.offset.z / sqrtSpd;
            //    compoundAoAVec.x += tempAngVelVec.x * shape.offset.z / sqrtSpd;
            //    compoundAoAVec.x += tempAngVelVec.z * shape.offset.x / sqrtSpd;

            //    compoundAoAVec.y -= tempAngVelVec.y * shape.offset.z / sqrtSpd;
            //    compoundAoAVec.y += tempAngVelVec.y * shape.offset.x / sqrtSpd;
            //    compoundAoAVec.y -= tempAngVelVec.x * shape.offset.z / sqrtSpd;
            //    compoundAoAVec.y += tempAngVelVec.y * shape.offset.x / sqrtSpd; // yaw rotation...

                ShapePhysics.calculateShapeDynamicForce(dynSpat, shape, tempVolumeVelVec, tempQuat, tempVec2, compoundAoAVec, speed, density);

            }

            if (tempAngVelVec.lengthSq() > 0.5 || speed > 300) {
                if (altitude > 10) {
                    PhysicsWorldAPI.setBodyDamping(dynSpat.body, dynSpat.baseDamping, dynSpat.baseDamping+ (0.1 * (tempAngVelVec.lengthSq()-0.01)) + MATH.clamp(0.02*(speed-300), 0, 0.5))
                }
            } else {

            }

        };

        AirPhysics.prototype.simulateDynamicSpatialInAir = function(dynSpat, physTpf) {

            if (dynSpat.isStatic()) {
                return;
            }

            dynSpat.getSpatialPosition(tempVec);

            if (tempVec.y > 1) {
                this.processAirPhysics(dynSpat, tempVec.y);
            }

        };


        return AirPhysics;

    });

