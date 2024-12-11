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

        var dyn = {
            gearIndex:  {state:0},
            clutch:     {state:0},
            rpm:        {state:0},
            brake:      {state:0},
            brakeCommand:{state:0}
        };

        var ammoQuat;
        var threeObj = new THREE.Object3D();
        var threeObj2 = new THREE.Object3D();
        var quat = new THREE.Quaternion();
        var vehicleQuat = new THREE.Quaternion();
        var vec3 = new THREE.Vector3();
        var calcVec = new THREE.Vector3();
        var calcEuler = new THREE.Euler();

        var TRANSFORM_AUX;

        var VECTOR_AUX;

        var propertyMap = {
            deltaRotation:{key:'transform', funcName:'getRotation', delta:true },
            rotation:     {key:'transform', funcName:'getRotation', delta:false}
        };


        var count = 0;

        var InfoParser = function(info, transform) {
            this.nr = count;
            count++;
            this.euler = new THREE.Euler();
            this.calcQuat = new THREE.Quaternion();
            this.lastQuat = new THREE.Quaternion();
            this.axisVec = new THREE.Vector3();
            this.info = info;
            this.transform = transform;
            this.lastAngle = 0;
            this.value = 0;
            this.total = 0;
        };

        InfoParser.prototype.setTransform = function(transform) {
            this.transform = transform;
        };

        InfoParser.prototype.updateValue = function(property, vQuat) {

            var prop = propertyMap[property];

            ammoQuat = this[prop.key][prop.funcName]();

            quat.x = ammoQuat.x();
            quat.y = ammoQuat.y();
            quat.z = ammoQuat.z();
            quat.w = ammoQuat.w();

            quat.conjugate();

            quat.multiply(vQuat);

            this.euler.setFromQuaternion(quat);

            var angle = -MATH.subAngles(MATH.nearestAngle(this.euler.x), MATH.nearestAngle(this.lastAngle)); // (MATH.TWO_PI);

            this.lastAngle = this.euler.x;

            this.value = angle;
            this.total += angle;

            if (prop.delta) {
                return this.value;
            } else {
                return this.total;
            }

        };

        InfoParser.prototype.getValue = function(property) {

            var prop = propertyMap[property];

            if (prop.delta) {
                return this.value;
            } else {
                return this.total;
            }

        };


        var AmmoVehicleProcessor = function(vehicle, bodyParams, dynamic) {


            var numWheels = vehicle.getNumWheels();

            if (!TRANSFORM_AUX) {
                TRANSFORM_AUX = new Ammo.btTransform();
                VECTOR_AUX = new Ammo.btVector3()
            }



            this.wheelInfos = [];

            for (var i = 0; i < numWheels; i++) {
                var info = vehicle.getWheelInfo(i);
                var transform = vehicle.getWheelTransformWS(i);
                this.wheelInfos.push(new InfoParser(info, transform));
            }


            this.driveTrain = bodyParams.drive_train || drive_train;
            this.wheelMatrix = bodyParams.wheelMatrix || wheelsMat;
            this.steerMatrix = bodyParams.steerMatrix || steerMat;
            this.brakeMatrix = bodyParams.brakeMatrix || brakeMat;
            this.transmissionMatrix = bodyParams.transmissionMatrix || transmissionMat;
            this.transmissionYawMatrix = bodyParams.transmissionYawMatrix || transmissionYawMat;

            this.dynamic = dynamic || dyn;



            this.controls = {};

            this.lastInputState = 0;
            this.gearIndex = 0;

            this.lastbrakeState = 0;
            this.framelWheelRotation = 0;
            this.brakeCommand = 0;
        };






        AmmoVehicleProcessor.prototype.sampleControlState = function(piece, controlMap) {

            for (var i = 0; i < controlMap.length; i++) {
                var state = piece.getPieceStateByStateId(controlMap[i].stateid).getValue();
                this.controls[controlMap[i].control] = state * controlMap[i].factor;
            }
        };

        AmmoVehicleProcessor.prototype.determineRpm = function(dynamic, driveTrain, accelerateIntent) {

            var gears = driveTrain.gears;

            var transmissionScale = 0.001;

            var gearFactor = Math.abs(gears[this.gearIndex] * this.framelWheelRotation) * transmissionScale;


            var minRpm = driveTrain.rpm_min+1;
            var rpmSpan = driveTrain.rpm_max - minRpm;


            var revUpFrameLimit = 0.04 * rpmSpan;

            var maxRpm = minRpm + rpmSpan * 0.45 + rpmSpan* 0.55 * accelerateIntent;

            var targetRpm = gearFactor * maxRpm ;

            var clutch = 1-dynamic.clutch.state;

            if (accelerateIntent > 0) {
                //    targetRpm = Math.clamp(targetRpm, minRpm, dynamic.rpm.state * driveTrain.rpm_max + revUpFrameLimit);

                targetRpm = Math.clamp(dynamic.rpm.state / driveTrain.rpm_max + clutch * revUpFrameLimit, minRpm, driveTrain.rpm_max) ;
            } else {
                targetRpm = Math.clamp((targetRpm - clutch * revUpFrameLimit*0.5), minRpm * 0.5, maxRpm*0.2) ;
            }

            if (targetRpm > dynamic.rpm.state * driveTrain.rpm_max) {

            } else {

            }

            dynamic.rpm.state = targetRpm / driveTrain.rpm_max;

        };

        AmmoVehicleProcessor.prototype.determineGearIndex = function(dynamic, driveTrain, brake) {
            var gears = driveTrain.gears;
            dynamic.clutch.state = 0;

            var rpm = dynamic.rpm.state * driveTrain.rpm_max;


            var gearModulation = 1 // 0.8 - 0.2 * (driveTrain.rpm_max - driveTrain.rpm_min) * (gears.length - this.gearIndex) / gears.length * driveTrain.rpm_max;

            if (rpm * gearModulation < driveTrain.rpm_min + Math.random() * driveTrain.rpm_min * 0.1 + brake * driveTrain.rpm_max) {

                dynamic.clutch.state = 1;

                if (this.gearIndex === 0) {

                } else {
                    this.gearIndex--;
                }

            } else if (rpm * gearModulation > driveTrain.rpm_max - Math.random() * driveTrain.rpm_max*0.1) {
                if (this.gearIndex === gears.length - 1) {

                } else {
                    dynamic.clutch.state = 1;
                    this.gearIndex++
                }
            }
            dynamic.gearIndex.state = this.gearIndex;

        };

        AmmoVehicleProcessor.prototype.determineBrakeState = function(dynamic, speedInputState, driveTrain) {
        //    if ()

            var wheelFactor = speedInputState*this.framelWheelRotation * 1;

            var brakeState = MATH.clamp(-wheelFactor, 0, 1);
            var dirSwitch = speedInputState * this.lastInputState;


            if (this.lastbrakeState) {
                this.brakeCommand += 0.02;
            }

            if (speedInputState === this.lastInputState && Math.abs(this.lastbrakeState)) {
                this.brakeCommand += 0.02;
            }

            if (wheelFactor > 0) {
                if (Math.abs(speedInputState) > Math.abs(this.lastInputState)) {
                    this.brakeCommand = 0;
                }
            } else {
                this.brakeCommand += 0.05;
            }

            if (dirSwitch < 0) {
            //    this.brakeCommand = 0;
            }

            if (Math.abs(speedInputState) > 0.1 && Math.abs(speedInputState) > Math.abs(this.lastInputState)) {
                this.brakeCommand = 0;
            }

            this.brakeCommand = MATH.clamp(this.brakeCommand, 0, 1);

            dynamic.brake.state = brakeState;
            dynamic.brakeCommand.state = this.brakeCommand;
            this.lastbrakeState = MATH.clamp(brakeState*this.brakeCommand + this.brakeCommand * 0.4, 0, 1);
            this.lastInputState = speedInputState;
        };

        AmmoVehicleProcessor.prototype.determineForwardState = function(speedInputState) {
            if (speedInputState === 0) {
                return this.lastInputState;
            }

            return speedInputState;
        };

        var getWheelInfo = function(vehicle) {
            return vehicle.getWheelInfo();
        };


        var superDrag = 0;

        AmmoVehicleProcessor.prototype.applyControlState = function(target, controls) {

            var driveTrain = this.driveTrain;

            var dynamic = this.dynamic;

            var speedInputState = controls.forward_state + controls.reverse_state;

            var accelerateIntent = this.determineForwardState(speedInputState);


            this.determineBrakeState(dynamic, accelerateIntent, driveTrain);

            this.determineRpm(dynamic, driveTrain, accelerateIntent);

            this.determineGearIndex(dynamic, driveTrain, dynamic.brake.state);

            var yaw_state = controls.yaw_state + controls.steer_reverse;


            yaw_state *= driveTrain.gears.length / (driveTrain.gears.length + dynamic.gearIndex.state * 2);

            var powerState = accelerateIntent * driveTrain.enginePower * driveTrain.gears[dynamic.gearIndex.state] * dynamic.rpm.state;

            powerState *= (1-Math.abs(yaw_state*0.7));

            this.framelWheelRotation = 0;

            var numWheels = target.getNumWheels();

            var body = target.getRigidBody();

            body.getMotionState().getWorldTransform(TRANSFORM_AUX);


            if (!this.lastbrakeState) {
                superDrag = 0;
                VECTOR_AUX.setX(1);
                VECTOR_AUX.setY(1);
                VECTOR_AUX.setZ(1);
                body.setLinearFactor(VECTOR_AUX);
            } else {

                superDrag = Math.clamp(superDrag + this.brakeCommand, 0, 1);

                VECTOR_AUX.setX(1 - superDrag);
                VECTOR_AUX.setY(1);
                VECTOR_AUX.setZ(1 - superDrag);
                body.setLinearFactor(VECTOR_AUX);

            }



            var q = TRANSFORM_AUX.getRotation();

            vehicleQuat.set(q.x(), q.y(), q.z(), q.w());

            var steerYaw;

            var brake;

            for (var i = 0; i < numWheels; i++) {

                var yawFactor = this.transmissionYawMatrix[i] * yaw_state;

                steerYaw = yaw_state* this.steerMatrix[i];

                brake = 0;

                if (Math.abs(this.lastbrakeState)) {
                    brake = this.lastbrakeState * this.brakeMatrix[i] * driveTrain.brake;
                    steerYaw += MATH.clamp(this.transmissionYawMatrix[i] * this.lastbrakeState * 2, -1.0, 1.0);
                    target.setBrake(brake, i);
                    target.applyEngineForce(0, i);
                } else {
                    target.setBrake(0, i);
                    target.applyEngineForce(powerState * this.transmissionMatrix[i] + powerState * this.transmissionMatrix[i] * yawFactor , i);
                }

                target.setSteeringValue(steerYaw, i);

                target.updateWheelTransform(i, false);

                this.framelWheelRotation = this.wheelInfos[i].updateValue('deltaRotation', vehicleQuat) * (1 - superDrag);


            }

            this.lastbrakeState = 0;

        };

        AmmoVehicleProcessor.prototype.interpretVehicleState = function(param, key, property) {

            if (param === "wheelInfos") {
                return this.wheelInfos[key].getValue(property);
            }

            return this[param][key][property];
        };


        AmmoVehicleProcessor.prototype.clearFeedbackMap = function(piece, feedback) {
            var targetStateId = feedback.stateid;
            var state =         piece.getPieceStateByStateId(targetStateId);
            state.value =       0;
        };

        AmmoVehicleProcessor.prototype.applyFeedbackMap = function(target, piece, feedback) {
                var param =         feedback.param;
                var key =           feedback.key;
                var property =      feedback.property;
                var targetStateId = feedback.stateid;
                var factor =        feedback.factor;
                var state =         piece.getPieceStateByStateId(targetStateId) ;
                state.value +=      this.interpretVehicleState(param, key, property) * factor;
        };

        //  var speed = vehicle.getCurrentSpeedKmHour();

        AmmoVehicleProcessor.prototype.sampleVehicle = function(target, piece, feedbackMap) {

            for (var i = 0; i < feedbackMap.length; i++) {
                this.clearFeedbackMap(piece, feedbackMap[i]);
            }

            for (var i = 0; i < feedbackMap.length; i++) {
                this.applyFeedbackMap(target, piece, feedbackMap[i]);
            }

        };


        AmmoVehicleProcessor.prototype.constrainRotation = function(body, threeObj) {
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


        AmmoVehicleProcessor.prototype.sampleState = function (body, piece, config) {

            var controlMap = config.control_map;
            var feedbackMap = config.feedback_map;

            var target = piece[config.shape];

            this.sampleControlState(piece, controlMap);
            this.applyControlState(target, this.controls);

            if (feedbackMap) {
                this.sampleVehicle(target, piece, feedbackMap);
                this.constrainRotation(body, piece.rootObj3D);
            }

        };

        return AmmoVehicleProcessor
    });