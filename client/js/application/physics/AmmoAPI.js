import {AmmoFunctions} from "./AmmoFunctions.js";
import {evt} from "../event/evt.js";
import {ENUMS} from "../ENUMS.js";

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

let initApi = function(onReady) {
        window.AMMO.then(function(ammo) {
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

    initPhysics = function() {
        world = ammoFunctions.createPhysicalWorld();
        return world;
    };

    getYGravity = function() {
        return ammoFunctions.getYGravity();
    };


    buildPhysicalTerrain = function(data, size, posx, posz, min_height, max_height) {
        let body = ammoFunctions.createPhysicalTerrain(world, data, size, posx, posz, min_height, max_height);
        return body;
    };

    registerGeoBuffer = function(id, buffer) {
        ammoFunctions.setGeometryBuffer(id, buffer);
    };

    setupRigidBody = function(obj3d, shapeName, mass, friction, pos, rot, scale, assetId, convex, bodyReadyCB) {

        let onReady = function(body, bdCfg) {
/*
            if (bdCfg.joints) {
                ammoFunctions.attachBodyBySliderJoints(world, body, bdCfg)
            }
*/
            if (bodyIndex.indexOf(body) === -1) {
                world.addRigidBody(body);
                bodyIndex.push(body);
            }

            bodyReadyCB(body);
        };

        ammoFunctions.createRigidBody(obj3d, shapeName, mass, friction, pos, rot, scale, assetId, convex, onReady);

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

    includeBody = function(body) {

        if (!world) return;

        if (!body) {
            console.log("Cant add !body", body);
            return;
        }

    //    if (bodies.indexOf(body) === -1) {

    //    }
        body.activate(true);
        ammoFunctions.enableBodySimulation(body);
    };

    excludeBody = function(body) {

        if (!body) {
            console.log("No body", bi, body);
            return;
        }

        ammoFunctions.disableBodySimulation(body);
        body.activate(false);
        ammoFunctions.returnBodyToPool(body);
    //    world.removeRigidBody(body);
    };


    updatePhysicsSimulation = function(dt) {
        status.updateTime = ammoFunctions.updatePhysicalWorld(world, dt)
    };

    applyForceAndTorqueToBody = function(forceVec3, body, torqueVec) {
        ammoFunctions.forceAndTorqueToBody(forceVec3, body, torqueVec)
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

    setBodyTransform = function(body, posVec, quat) {

        ammoFunctions.setBodyTransform(body, posVec, quat);

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
        return ammoFunctions.getAuxVector3();
    }

    getAmmoStatus() {
        return status;
    }



}

export {AmmoAPI}