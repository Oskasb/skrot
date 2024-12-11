
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

        var TRANSFORM_AUX;
        var VECTOR_AUX;

        var VehicleProcessor = function(driveTrain, dynamic) {
            TRANSFORM_AUX = new Ammo.btTransform();
            VECTOR_AUX = new Ammo.btVector3()

            this.driveTrain = driveTrain || drive_train;
            this.dynamic = dynamic || dyn;

            this.controls = {};

            this.lastInputState = 0;
            this.gearIndex = 0;

            this.lastbrakeState = 0;
            this.framelWheelRotation = 0;
            this.brakeCommand = 0;
        };



        VehicleProcessor.prototype.sampleControlState = function(target, piece, controlMap) {

            for (var i = 0; i < controlMap.length; i++) {
                var state = piece.getPieceStateByStateId(controlMap[i].stateid).getValue();
                this.controls[controlMap[i].control] = state * controlMap[i].factor;
            }
        };

        VehicleProcessor.prototype.determineRpm = function(dynamic, driveTrain, accelerateIntent) {

            var gears = driveTrain.gears;

            var transmissionScale = 0.001;

            var gearFactor = Math.abs(gears[this.gearIndex] * this.framelWheelRotation) * transmissionScale;


            var minRpm = driveTrain.rpm_min+1;
            var rpmSpan = driveTrain.rpm_max - minRpm;


            var revUpFrameLimit = 0.001 * rpmSpan;

            var maxRpm = minRpm + rpmSpan * 0.55 + rpmSpan* 0.45 * accelerateIntent;

            var targetRpm = gearFactor * maxRpm ;

            var clutch = 1-dynamic.clutch.state;

            if (accelerateIntent > 0) {
            //    targetRpm = Math.clamp(targetRpm, minRpm, dynamic.rpm.state * driveTrain.rpm_max + revUpFrameLimit);

                targetRpm = Math.clamp(targetRpm + clutch * revUpFrameLimit, minRpm, driveTrain.rpm_max) ;
            } else {
                targetRpm = Math.clamp((targetRpm - clutch * revUpFrameLimit*2), minRpm, maxRpm) ;
            }

            if (targetRpm > dynamic.rpm.state * driveTrain.rpm_max) {

            } else {

            }

            dynamic.rpm.state = targetRpm / driveTrain.rpm_max;

        };

        VehicleProcessor.prototype.determineGearIndex = function(dynamic, driveTrain, brake) {
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

        VehicleProcessor.prototype.determineBrakeState = function(dynamic, speedInputState, driveTrain) {
        //    if ()

            var wheelBrake = speedInputState*this.framelWheelRotation;

            var brakeState = MATH.clamp(wheelBrake, 0, 1);

            if (wheelBrake > 0) {
                this.brakeCommand = 1;
            }

            dynamic.brake.state = brakeState;
            dynamic.brakeCommand.state = this.brakeCommand;
            this.lastbrakeState = MATH.clamp(brakeState*this.brakeCommand + this.brakeCommand * 0.5, 0, 1);
        };

        VehicleProcessor.prototype.determineForwardState = function(speedInputState) {
            if (speedInputState === 0) {
                return this.lastInputState;
            }

            var sameDir = speedInputState * this.lastInputState;
            var forward = speedInputState;

            if (sameDir > 0) {
                if (Math.abs(forward) > Math.abs(this.lastInputState)) {
                    this.brakeCommand = 0;
                }
            } else {
                this.brakeCommand = 1;
            }

            this.lastInputState = forward;

            return forward;
        };


        VehicleProcessor.prototype.applyControlState = function(target, controls) {

            var driveTrain = this.driveTrain;

            var dynamic = this.dynamic;

            var speedInputState = controls.forward_state + controls.reverse_state;

            var accelerateIntent = this.determineForwardState(speedInputState);


            this.determineBrakeState(dynamic, accelerateIntent, driveTrain);

            this.determineRpm(dynamic, driveTrain, accelerateIntent);

            this.determineGearIndex(dynamic, driveTrain, dynamic.brake.state);

            var yaw_state = controls.yaw_state + controls.steer_reverse;

            var powerState = accelerateIntent * driveTrain.enginePower * driveTrain.gears[dynamic.gearIndex.state] * dynamic.rpm.state;

            this.framelWheelRotation = 0;

            for (var i = 0; i < target.wheelInfos.length; i++) {
                var info = target.wheelInfos[i];
                var yawFactor = info.transmissionYawMatrix * yaw_state;
                target.applyEngineForce(powerState * info.transmissionFactor + powerState * yawFactor , i);
                target.setBrake(this.lastbrakeState * info.brakeFactor * driveTrain.brake, i);
                target.setSteeringValue(yaw_state* info.steerFactor, i);
                this.framelWheelRotation += info.deltaRotation;
            }

            this.lastbrakeState = 0;

        };

        VehicleProcessor.prototype.applyFeedbackMap = function(target, piece, feedback) {
                var param =         feedback.param;
                var key =           feedback.key;
                var property =      feedback.property;
                var targetStateId = feedback.stateid;
                var factor =        feedback.factor;
                var state =         piece.getPieceStateByStateId(targetStateId);
                state.value =       target[param][key][property]*factor;
        };

        VehicleProcessor.prototype.sampleVehicle = function(target, piece, feedbackMap) {

            for (var i = 0; i < feedbackMap.length; i++) {
                this.applyFeedbackMap(target, piece, feedbackMap[i]);
            }

        };

        VehicleProcessor.prototype.constrainRotation = function(body, threeObj) {
            var safeAngle = 0.1;
            var criticalAngle = 0.2;
            var slugX = 1;
            var slugZ = 1;

            if (Math.abs(threeObj.rotation.x) > safeAngle) {
                slugX = 0.20;

                if (Math.abs(threeObj.rotation.x) > criticalAngle) {
                    slugX = 0.02;
                }

            }


            if (Math.abs(threeObj.rotation.z) > safeAngle) {
                console.log("Dampen Z")
                slugZ = 0.15;
                if (Math.abs(threeObj.rotation.z) > criticalAngle) {
                    slugZ = 0.02;
                }
            }

            if (threeObj.rotation.z < 0) {
                var ms = body.getMotionState();

                ms.getWorldTransform(TRANSFORM_AUX);
                TRANSFORM_AUX.getRotation().setX(0);
                TRANSFORM_AUX.getRotation().setY(0);
                TRANSFORM_AUX.getRotation().setZ(0);
                TRANSFORM_AUX.getRotation().setW(1);
                body.setWorldTransform(TRANSFORM_AUX);

            }


                VECTOR_AUX.setX(slugX);
                VECTOR_AUX.setY(1);
                VECTOR_AUX.setZ(slugZ);


            body.setAngularFactor(VECTOR_AUX);

        };

        VehicleProcessor.prototype.sampleState = function (body, piece, config) {

            var controlMap = config.control_map;
            var feedbackMap = config.feedback_map;

            var target = body[config.shape];

            this.sampleControlState(target, piece, controlMap);
            this.applyControlState(target, this.controls);

            if (feedbackMap) {
                this.sampleVehicle(body[config.shape], piece, feedbackMap);
                this.constrainRotation(body, piece.rootObj3D);
            }

        };

        return VehicleProcessor
    });