3
"use strict";

define(['worker/physics/AmmoHovercraftProcessor'
    ],
    function(
        AmmoHovercraftProcessor
    ) {

        var wheelsMat = [
            [-1,  0.9,    1],[1, 0.9,     1],
            [-1, -0.9,    1],[1,-0.9,     1]
        ];

        var steerMat = [
            1, 1,
            0, 0
        ];

        var brakeMat = [
            0.2,0.2,
            1  ,1
        ];

        var transmissionMat = [
            1,1,
            0,0
        ];

        var transmissionYawMat = [
            0,0,
            0,0
        ];

        var AmmoHovercraft = function(physicsWorld, bodyParams, pos, quat) {

            var width       = bodyParams.width      || 1.5;
            var length      = bodyParams.length     || 3.1;
            var height      = bodyParams.height     || 1.1;
            var clearance   = bodyParams.clearance  || 0.2;
            var mass        = bodyParams.mass       || 1000;

            var restitution = bodyParams.restitution || 0.5;
            var damping     = bodyParams.damping || 0.5;
            var friction    = bodyParams.friction || 2.9;

            var wOpts = bodyParams.wheelOptions || {};

            var DISABLE_DEACTIVATION = 4;

            var chassisWidth = width;
            var chassisHeight = height;
            var chassisLength = length;
            var massVehicle = mass;

            var wheelMatrix = bodyParams.wheelMatrix || wheelsMat;

            var steerMatrix = bodyParams.steerMatrix || steerMat;
            var brakeMatrix = bodyParams.brakeMatrix || brakeMat;
            var transmissionMatrix = bodyParams.transmissionMatrix || transmissionMat;
            var transmissionYawMatrix = bodyParams.transmissionYawMatrix || transmissionYawMat;

            var maxSusForce = (mass*10 / wheelMatrix.length) * 50;
            var susStiffness = 10; // wheelMatrix.length;



            // Chassis
            var geometry = new Ammo.btBoxShape(new Ammo.btVector3(chassisWidth * .5, chassisHeight * .5, chassisLength * .5));
            var transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Ammo.btVector3(pos.x, pos.y + height + clearance, pos.z));
            transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
            var motionState = new Ammo.btDefaultMotionState(transform);
            var localInertia = new Ammo.btVector3(0, 1, 0);
            geometry.calculateLocalInertia(massVehicle, localInertia);

            var rbInfo = new Ammo.btRigidBodyConstructionInfo(massVehicle, motionState, geometry, localInertia)
            rbInfo.set_m_linearSleepingThreshold(0.0);
            rbInfo.set_m_angularSleepingThreshold(0.0);

            var body = new Ammo.btRigidBody(rbInfo);

            body.setActivationState(DISABLE_DEACTIVATION);

            body.setRestitution(restitution);
            body.setFriction(friction);
            body.setDamping(damping, damping);


            var dynamic = {
                vector_yaw:  {state:0},
                power:       {state:0},
                thrust_0:    {state:0},
                thrust_1:    {state:0},
                thrust_2:    {state:0},
                thrust_3:    {state:0}
            };

            this.body = body;

            this.processor = new AmmoHovercraftProcessor(body, bodyParams, dynamic);
        };


    return AmmoHovercraft;

});



