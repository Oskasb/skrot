
"use strict";


define([
        'application/PipelineObject'
    ],
    function(
        PipelineObject
    ) {

        var threeObj = new THREE.Object3D();
        var DISABLE_DEACTIVATION = 4;
        var TRANSFORM_AUX;
        var VECTOR_AUX;

        var PhysicalPiece = function(hostId, dataKey, ready) {
            this.id = hostId+'_physical';
            this.dataKey = dataKey;

            this.getHeightAtPos = function(pos, normalStore) {
                console.log("No query in place for physicalPiece", this);
            };

            this.applyForce = function(forceVec, body, offsetVec) {
                console.log("No query in place for physicalPiece", this);
            };

            var applyData = function() {
                this.applyData(this.pipeObj.buildConfig()[dataKey], ready);
            }.bind(this);

            this.pipeObj = new PipelineObject('PHYSICS_DATA', 'PHYSICAL', applyData, dataKey);

        };

        PhysicalPiece.prototype.getPhysicsPieceMass = function () {
            return this.config.rigid_body.mass
        };

        PhysicalPiece.prototype.applyData = function (config, ready) {
            this.config = config;
            this.stateMap = config.state_map;
            this.controlMap = config.control_map;
            this.feedbackMap = config.feedback_map;

            if (this.config.shape === 'vehicle') {
            //    this.processor = new VehicleProcessor();
            }

            ready();
        };


        PhysicalPiece.prototype.sampleBody = function(body) {

            if (!body.getMotionState) {
                console.log("Bad physics body", body);
                return;
            }

                var ms = body.getMotionState();
                if (ms) {
                    ms.getWorldTransform(TRANSFORM_AUX);
                    var p = TRANSFORM_AUX.getOrigin();
                    var q = TRANSFORM_AUX.getRotation();
                    if (isNaN(p.x())) {

                        if (Math.random() < 0.02) {
                            console.log("Bad body transform", body)
                        }
                        return;
                    }
                    threeObj.position.set(p.x(), p.y(), p.z());
                    threeObj.quaternion.set(q.x(), q.y(), q.z(), q.w());
                }

        };

        PhysicalPiece.prototype.setBodyPosition = function(body, posVec3) {

            if (!body.getMotionState) {
                console.log("Bad physics body", body);
                return;
            }

            var ms = body.getMotionState();

            ms.getWorldTransform(TRANSFORM_AUX);

            TRANSFORM_AUX.setIdentity();

            TRANSFORM_AUX.getOrigin().setX(posVec3.x);
            TRANSFORM_AUX.getOrigin().setY(posVec3.y);
            TRANSFORM_AUX.getOrigin().setZ(posVec3.z);

            TRANSFORM_AUX.getRotation().setX(0);
            TRANSFORM_AUX.getRotation().setY(0);
            TRANSFORM_AUX.getRotation().setZ(0);
            TRANSFORM_AUX.getRotation().setW(1);

            body.setWorldTransform(TRANSFORM_AUX);

            body.getLinearVelocity(VECTOR_AUX);
            VECTOR_AUX.setX(0);
            VECTOR_AUX.setY(0);
            VECTOR_AUX.setZ(0);
            body.setLinearVelocity(VECTOR_AUX);
            body.getAngularVelocity().setX(0);
            body.getAngularVelocity().setY(0);
            body.getAngularVelocity().setZ(0);

        };

        PhysicalPiece.prototype.applyBody = function(piece) {

            for (var i = 0; i < this.stateMap.length; i++) {
                var state = piece.getPieceStateByStateId(this.stateMap[i].stateid);
                var param = this.stateMap[i].param;
                var axis = this.stateMap[i].axis;
                var value = threeObj[param][axis];
                state.value = value;
            }

            piece.rootObj3D.position.copy(threeObj.position);
            piece.rootObj3D.quaternion.copy(threeObj.quaternion);
        };

        PhysicalPiece.prototype.setPhysicalPosition = function (body, piece, posVec3) {
            this.setBodyPosition(body, posVec3);
        };

        PhysicalPiece.prototype.setApplyForceFunction = function (forceFunction) {
            this.applyForce = forceFunction;
        };

        PhysicalPiece.prototype.applyForceToPhysicalBody = function (forceVec, body, torqueVec) {
            this.applyForce(forceVec, body, torqueVec);
        };

        PhysicalPiece.prototype.setHeightQueryFunction = function (getHeightAtPos) {
            this.getHeightAtPos = getHeightAtPos;
        };

        PhysicalPiece.prototype.getHeightAboveGround = function (piece) {
            var terrainY =  this.getHeightAtPos(piece.getPos());

            return piece.getPos().y - terrainY;
        };

        PhysicalPiece.prototype.sampleState = function (body, piece) {

            if (!TRANSFORM_AUX) {
                TRANSFORM_AUX = new Ammo.btTransform();
                VECTOR_AUX = new Ammo.btVector3()
            };

            this.sampleBody(body);

            this.applyBody(piece);

            if (piece.processor) {
                piece.processor.sampleState(body, piece, this.config, this);
            }

        };

        return PhysicalPiece
    });