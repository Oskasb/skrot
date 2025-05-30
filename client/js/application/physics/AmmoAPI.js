import {AmmoFunctions} from "./AmmoFunctions.js";
import {evt} from "../event/evt.js";
import {ENUMS} from "../ENUMS.js";
import {loadModelAsset} from "../utils/DataUtils.js";
import {getGroupMesh} from "../utils/ModelUtils.js";
import {getBodyPointer, unregisterBodyActivator} from "../utils/PhysicsUtils.js";
import {MATH} from "../MATH.js";

"use strict";

let ammoFunctions;
let world;

let bodyIndex = [];



let STATE = {
    ACTIVE : 1,
    ISLAND_SLEEPING : 2,
    WANTS_DEACTIVATION : 3,
    DISABLE_DEACTIVATION : 4,
    DISABLE_SIMULATION : 5
}

let status = {
    bodyCount:0,
    updateTime:0
};

let Ammo;

let initApi = function(onReady) {
        window.AMMO.then(function(ammo) {
            Ammo = ammo
        //    AMMO = Ammo
        //    console.log("Ammo Ready", ammo);
            ammoFunctions = new AmmoFunctions(ammo);
            onReady()
        });
};

class AmmoAPI {

    constructor(onReady) {
        initApi(onReady);
    }

    getAmmo() {
        return Ammo;
    }

    initPhysics = function() {
        world = ammoFunctions.createPhysicalWorld();
        return world;
    };


    registerPhysicsStepCallback(cb) {
        ammoFunctions.addPhysStepCb(cb);
    }

    getStepTime() {
        return ammoFunctions.getSimModel().PhysicsStepTime;
    }

    unregisterPhysicsStepCallback(cb) {
        ammoFunctions.removePhysStepC(cb);
    }

    getYGravity = function() {
        return ammoFunctions.getYGravity();
    };


    buildPhysicalTerrain = function(data, size, posx, posz, min_height, max_height, maxProp) {
        let body = ammoFunctions.createPhysicalTerrain(world, data, size, posx, posz, min_height, max_height, maxProp);
        return body;
    };

    registerGeoBuffer = function(id, buffer) {
        ammoFunctions.setGeometryBuffer(id, buffer);
    };

    getGeoBuffer = function(assetId, cb) {

        let buffer = ammoFunctions.getGeometryBuffer(assetId);

        if (buffer) {
            cb(buffer)
        } else {
            function onModel(model) {
        //        console.log("physics buffer model", model.scene);
                let mesh = model.scene.children[0];
                window.AmmoAPI.registerGeoBuffer(assetId, mesh.geometry.attributes.position.array)
                cb(ammoFunctions.getGeometryBuffer(assetId))
            }
            loadModelAsset(assetId, onModel)
        }

    }

    setupRigidBody = function(obj3d, shapeName, mass, friction, pos, rot, scale, assetId, convex, children, bodyReadyCB) {

        let onReady = function(body, bdCfg) {
/*
            if (bdCfg.joints) {
                ammoFunctions.attachBodyBySliderJoints(world, body, bdCfg)
            }
*/
            window.AmmoAPI.includeBody(body)



            bodyReadyCB(body);
        };

        if (typeof (assetId) === "string") {

            let loadedBuffer = ammoFunctions.getGeometryBuffer(assetId)

            if (loadedBuffer) {
                ammoFunctions.createRigidBody(obj3d, shapeName, mass, friction, pos, rot, scale, assetId, convex, children, onReady);
            } else {

                function onModel(model) {
                    console.log("physics buffer model", model.scene);
                    let mesh = model.scene.children[0];
                    window.AmmoAPI.registerGeoBuffer(assetId, mesh.geometry.attributes.position.array)
                    ammoFunctions.createRigidBody(obj3d, shapeName, mass, 50, pos, rot, scale, assetId, convex, children, onReady);
                }
                loadModelAsset(assetId, onModel)
            }


        } else {
            ammoFunctions.createRigidBody(obj3d, shapeName, mass, friction, pos, rot, scale, assetId, convex, children, onReady);
        }

    };


    requestBodyDeactivation = function(body) {
        ammoFunctions.relaxBodySimulation(body);
    };

    requestBodyActivation = function(body) {
        ammoFunctions.enableBodySimulation(body);
    };

    getBodyAABB(body, box3) {
        ammoFunctions.fitBodyAABB(body, box3.min, box3.max)
    }

    testBodyRelaxing(body) {
        return ammoFunctions.testDeactivation(body)
    }

    includeBody = function(body) {

        if (!world) return;

        if (!body) {
            console.log("Cant add !body", body);
            return;
        }

        if (bodyIndex.indexOf(body) !== -1) {
            console.warn("Body already included")
        } else {
            world.addRigidBody(body);
            body.activate(true);
            bodyIndex.push(body);
            ammoFunctions.enableBodySimulation(body);
        }

    };

    excludeBody = function(body) {

        if (!body) {
            console.log("No body", bi, body);
            return;
        }

    //    ammoFunctions.disableBodySimulation(body);
        body.activate(false);
        unregisterBodyActivator(getBodyPointer(body))
        MATH.splice(bodyIndex, body);
        ammoFunctions.returnBodyToPool(body);
        world.removeRigidBody(body);
    };


    getBodyByPointer(ptr) {
        for (let i = 0; i < bodyIndex.length; i++) {
            const body = bodyIndex[i];
            const bPtr = getBodyPointer(body);
            if (bPtr === ptr) {
                return body;
            }
        }
        return null;
    }

    updatePhysicsSimulation = function(dt) {
        status.updateTime = ammoFunctions.updatePhysicalWorld(world, dt)
    };

    applyForceAndTorqueToBody = function(forceVec3, torqueVec, body) {
        ammoFunctions.forceAndTorqueToBody(forceVec3, torqueVec, body)
    };

    applyForceAtPointToBody = function(forceVec3, pointVec, body) {
        ammoFunctions.forceAtPointToBody(forceVec3, pointVec, body)
    };


    applyForceToActor = function(forceVec3, actor, randomize) {
        ammoFunctions.applyForceToBodyWithMass(forceVec3, actor.getPhysicsBody(), actor.physicalPiece.getPhysicsPieceMass(), randomize)
    };

    relaxSimulatingBody = function(body) {
        ammoFunctions.relaxBodySimulation(body);
    };

    changeBodyDamping = function(body, dampingV, dampingA) {
        ammoFunctions.applyBodyDamping(body, dampingV, dampingA);
    };

    setBodyPosition = function(body, posVec) {
        ammoFunctions.setBodyPosition(body, posVec);
    };

    setBodyDamping(body, velFactor, angFactor) {

        ammoFunctions.applyBodyDamping(body, velFactor, angFactor);
    }

    setBodyTransform = function(body, posVec, quat) {
        ammoFunctions.applyBodyTransform(body, posVec, quat);
    };

    setBodyVelocity = function(body, velVec) {

        ammoFunctions.setBodyVel(body, velVec);

    };

    triggerPhysicallyActive = function(body) {
        return ammoFunctions.enableBodySimulation(body);
        //  actor.getPhysicsBody().activate();
    };

    isPhysicallyActive = function(body) {
        return ammoFunctions.getBodyActiveState(body);
    };

    raycastPhysicsWorld = function(position, direction, hitPositionStore, hitNormalStore, debugDraw, staticOnly) {

        let hit = ammoFunctions.physicsRayRange(world, position, direction, hitPositionStore, hitNormalStore, staticOnly);
        if (hit) {
            if (debugDraw) {
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:position, to:hit.position, color:'RED'});
            }
            return hit;
        }
        if (debugDraw) {
            ThreeAPI.tempVec3.copy(position).add(direction);
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:position, to:ThreeAPI.tempVec3, color:'GREEN'});
        }
    };


    raycastAllIntersectingBodies = function(position, direction, hitPositionStore, hitNormalStore) {
        return ammoFunctions.physicsRayGetIntersections(world, position, direction);
    };

    getAuxTransform() {
        return ammoFunctions.getAuxTransform();
    }

    getAuxVector3() {
        return ammoFunctions.getAuxVector();
    }

    getAmmoStatus() {
        return status;
    }

    applyAmmoTransformToObj3d(trx, obj3d) {

    }


}

export {AmmoAPI}