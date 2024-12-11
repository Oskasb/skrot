3
"use strict";


define([

    ],
    function(

    ) {

        var drive_train = {
            "rpm_min":200,
            "rpm_max":2500,
            "gears":[120, 40, 20, 12, 3, 2, 1],
            "enginePower": 1000,
            "brake"      : 800
        };

        var dynamicKeys = {

            vector_yaw  : 'vector_yaw',
            power       : 'power',
            thrust_0    : 'thrust_0',
            thrust_1    : 'thrust_1',
            thrust_2    : 'thrust_2',
            thrust_3    : 'thrust_3'
        };

        var dyn = {
            vector_yaw:  {state:0},
            power:       {state:0},
            thrust_0:    {state:0},
            thrust_1:    {state:0},
            thrust_2:    {state:0},
            thrust_3:    {state:0}
        };

        var ammoQuat;
        var threeObj = new THREE.Object3D();
        var threeObj2 = new THREE.Object3D();
        var quat = new THREE.Quaternion();
        var vehicleQuat = new THREE.Quaternion();
        var vec3 = new THREE.Vector3();
        var calcVec = new THREE.Vector3();
        var calcVec2 = new THREE.Vector3();
        var calcEuler = new THREE.Euler();

        var TRANSFORM_AUX;

        var VECTOR_AUX;

        var propertyMap = {
            deltaRotation:{key:'transform', funcName:'getRotation', delta:true },
            rotation:     {key:'transform', funcName:'getRotation', delta:false}
        };


        var count = 0;


        var AmmoHovercraftProcessor = function(vehicle, bodyParams, dynamic) {


            if (!TRANSFORM_AUX) {
                TRANSFORM_AUX = new Ammo.btTransform();
                VECTOR_AUX = new Ammo.btVector3()
            }

            this.torqueVec = new THREE.Vector3();
            this.forceVec = new THREE.Vector3();

            this.settings = bodyParams.settings;

            this.thrusterMatrix = bodyParams.thrusterMatrix;
            this.steerMatrix = bodyParams.steerMatrix ;
            this.brakeMatrix = bodyParams.brakeMatrix;
            this.transmissionMatrix = bodyParams.transmissionMatrix;
            this.transmissionYawMatrix = bodyParams.transmissionYawMatrix;

            this.dynamic = dynamic || dyn;

            this.controls = {};

            this.lastInputState = 0;
            this.gearIndex = 0;

            this.lastbrakeState = 0;
            this.framelWheelRotation = 0;
            this.brakeCommand = 0;
        };


        AmmoHovercraftProcessor.prototype.sampleControlState = function(piece, controlMap) {

            for (var i = 0; i < controlMap.length; i++) {
                var state = piece.getPieceStateByStateId(controlMap[i].stateid).getValue();
                this.controls[controlMap[i].control] = state * controlMap[i].factor;
            }
        };

        AmmoHovercraftProcessor.prototype.setDynamic = function(key, value) {
            this.dynamic[key].state = value;
        };

        AmmoHovercraftProcessor.prototype.getDynamic = function(key) {
            return this.dynamic[key].state;
        };

        AmmoHovercraftProcessor.prototype.determineDynamicPower = function(heightAboveGround, maxElevation) {

            this.setDynamic(dynamicKeys.power, (maxElevation - heightAboveGround) / maxElevation);

        };

        AmmoHovercraftProcessor.prototype.determineDynamicThrust = function(dynamicPower) {

            for (var key in this.settings.thrusters) {
                this.setDynamic(key,
                    this.settings.thrusters[key].factor * dynamicPower +
                    this.torqueVec.x * this.settings.thrusters[key].torque_influence.x +
                    this.torqueVec.y * this.settings.thrusters[key].torque_influence.y +
                    this.torqueVec.z * this.settings.thrusters[key].torque_influence.z
                );
            }

        };

        AmmoHovercraftProcessor.prototype.determineStabilizingTorque = function(obj3d, maxTorque) {
            calcVec.set(0, 1, 0);

            // calcEuler.set()

            calcVec.applyQuaternion(obj3d.quaternion);

            this.torqueVec.z = -calcVec.z * Math.abs(calcVec.z);
            this.torqueVec.x = -calcVec.x * Math.abs(calcVec.x);

        //    this.torqueVec.z = -obj3d.rotation.z * maxTorque;
        //    this.torqueVec.x = -obj3d.rotation.x * maxTorque;


            this.torqueVec.y = 0 ;

        };

        AmmoHovercraftProcessor.prototype.determineForwardState = function(speedInputState) {
            if (speedInputState === 0) {
                return this.lastInputState;
            }
          return speedInputState;
        };

        AmmoHovercraftProcessor.prototype.applyControlState = function(target, controls, piece, physicalPiece) {

            var heightAboveGround = physicalPiece.getHeightAboveGround(piece);

            var body = target.body;

            body.getMotionState().getWorldTransform(TRANSFORM_AUX);


            var q = TRANSFORM_AUX.getRotation();
            // var q = TRANSFORM_AUX.getRotation();

            threeObj.quaternion.copy(piece.getQuat());
            threeObj.position.copy(piece.getPos());

            var maxPower = this.settings.max_power;
            var maxTorque = this.settings.mac_torque;
            var maxElevation = this.settings.max_elevation;



            this.determineDynamicPower(heightAboveGround, maxElevation);

            this.determineStabilizingTorque(threeObj, maxTorque);

            var dynamicPower = this.getDynamic(dynamicKeys.power);

            this.determineDynamicThrust(dynamicPower);

        //    body.getMotionState().getWorldTransform(TRANSFORM_AUX);

            if (isNaN(heightAboveGround)) {
                console.log("Height isNaN");
                heightAboveGround = 10;
            }



            var totalPower = dynamicPower * maxPower;

            this.torqueVec.multiplyScalar(maxTorque);

            var groundEffectComponent = totalPower  / Math.clamp(heightAboveGround, 1, maxPower);

            this.forceVec.set(0, totalPower + groundEffectComponent, 0);

            this.forceVec.applyQuaternion(threeObj.quaternion);

            physicalPiece.applyForceToPhysicalBody(this.forceVec, body, this.torqueVec);

        };

        AmmoHovercraftProcessor.prototype.interpretVehicleState = function(param, key, property) {

            if (param === "wheelInfos") {
                return this.wheelInfos[key].getValue(property);
            }

            return this[param][key][property];
        };


        AmmoHovercraftProcessor.prototype.clearFeedbackMap = function(piece, feedback) {
            var targetStateId = feedback.stateid;
            var state =         piece.getPieceStateByStateId(targetStateId);
            state.value =       0;
        };

        AmmoHovercraftProcessor.prototype.applyFeedbackMap = function(target, piece, feedback) {
                var param =         feedback.param;
                var key =           feedback.key;
                var property =      feedback.property;
                var targetStateId = feedback.stateid;
                var factor =        feedback.factor;
                var state =         piece.getPieceStateByStateId(targetStateId) ;
                state.value +=      this.interpretVehicleState(param, key, property) * factor;
        };

        //  var speed = vehicle.getCurrentSpeedKmHour();

        AmmoHovercraftProcessor.prototype.sampleVehicle = function(target, piece, feedbackMap) {

            for (var i = 0; i < feedbackMap.length; i++) {
                this.clearFeedbackMap(piece, feedbackMap[i]);
            }

            for (var i = 0; i < feedbackMap.length; i++) {
                this.applyFeedbackMap(target, piece, feedbackMap[i]);
            }

        };


        AmmoHovercraftProcessor.prototype.constrainRotation = function(body, threeObj) {
            var safeAngle = 0.6;
            var criticalAngle = 0.6;
            var slugX = 1;
            var slugZ = 1;

            var critical = false;

            vec3.set(0,1,0);

            vec3.applyQuaternion(threeObj.quaternion);



            if (Math.abs(vec3.x) > safeAngle) {
                slugX = 0.5;

                if (Math.abs(vec3.x) > criticalAngle) {
                    critical = true;
                }
            }

            if (Math.abs(vec3.z) > safeAngle) {
                slugZ = 0.5;
                if (Math.abs(vec3.z) > criticalAngle) {
                    critical = true;
                }
            }

            if (critical) {
                var y= threeObj.rotation.y;
                threeObj.rotation.x = 0;
                threeObj.rotation.z = 0;
                calcVec.set(0,0,1);
                calcVec.applyQuaternion(threeObj.quaternion);
                threeObj.quaternion.x = 0;
                threeObj.quaternion.y = y;
                threeObj.quaternion.z = 0;
                threeObj.quaternion.w = 1;
            //    threeObj.rotation.y = calcVec.y*Math.PI;
                threeObj.quaternion.normalize();
            //    calcVec.applyQuaternion(threeObj.quaternion);
            //    threeObj.quaternion.setFromVectors(vec3, calcVec);


            //    threeObj.lookAt(calcVec);
            //    threeObj.updateMatrixWorld(true);

                var ms = body.getMotionState();
                ms.getWorldTransform(TRANSFORM_AUX);

                TRANSFORM_AUX.setIdentity();

                TRANSFORM_AUX.getOrigin().setX(threeObj.position.x);
                TRANSFORM_AUX.getOrigin().setY(threeObj.position.y);
                TRANSFORM_AUX.getOrigin().setZ(threeObj.position.z);

                 TRANSFORM_AUX.getRotation().setX(0);
                 TRANSFORM_AUX.getRotation().setY(y);
                 TRANSFORM_AUX.getRotation().setZ(0);
                 TRANSFORM_AUX.getRotation().setW(1);
                 TRANSFORM_AUX.getRotation().normalize();
                 ms.setWorldTransform(TRANSFORM_AUX);
            //    body.setWorldTransform(TRANSFORM_AUX);
                body.getAngularVelocity().setX(0);
                body.getAngularVelocity().setY(0);
                body.getAngularVelocity().setZ(0);
            }

            VECTOR_AUX.setX(slugX);
            VECTOR_AUX.setY(1);
            VECTOR_AUX.setZ(slugZ);


            body.setAngularFactor(VECTOR_AUX);

        };


        AmmoHovercraftProcessor.prototype.sampleState = function (body, piece, config, physicalPiece) {

            var controlMap = config.control_map;
            var feedbackMap = config.feedback_map;

            var target = piece[config.shape];



            this.sampleControlState(piece, controlMap);
            this.applyControlState(target, this.controls, piece, physicalPiece);

            if (feedbackMap) {
                this.sampleVehicle(target, piece, feedbackMap);
                this.constrainRotation(body, piece.rootObj3D);
            }

        };

        return AmmoHovercraftProcessor
    });