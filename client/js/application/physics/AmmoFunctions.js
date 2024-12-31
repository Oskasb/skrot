import {BodyPool} from "./BodyPool.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Euler} from "../../../../libs/three/math/Euler.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {Quaternion} from "../../../../libs/three/math/Quaternion.js";
import {getObj3dScaleKey} from "../utils/ModelUtils.js";
import {isDev} from "../utils/DebugUtils.js";
import {MATH} from "../MATH.js";

let threeVec = new Vector3();
let threeVec2 = new Vector3();
let threeEuler = new Euler();
let threeEuler2 = new Euler();
let threeObj = new Object3D();
let threeObj2 = new Object3D();

let tempObj = new Object3D();
let tempObj2 = new Object3D();
let tempVec = new Vector3();

let threeQuat = new Quaternion()
let TRANSFORM_AUX;
let QUAT_AUX;
let VECTOR_AUX;
let VECTOR_AUX2;
let rayCallback;
let rayFromVec;
let rayToVec;
let rayHits = [];

let Ammo;
let ammoHeightData;

let STATE = {
    ACTIVE : 1,
    ISLAND_SLEEPING : 2,
    WANTS_DEACTIVATION : 3,
    DISABLE_DEACTIVATION : 4,
    DISABLE_SIMULATION : 5
};

let COLLISION_FLAGS = {
    CF_STATIC_OBJECT:1,
    CF_KINEMATIC_OBJECT:2,
    CF_NO_CONTACT_RESPONSE:4,
    CF_CUSTOM_MATERIAL_CALLBACK:8,
    CF_CHARACTER_OBJECT:16,
    CF_DISABLE_VISUALIZE_OBJECT:32,
    CF_DISABLE_SPU_COLLISION_PROCESSING:64};

let shapes = [];
let bodyPools = {};

let createPrimitiveBody = function(shape, mass, scale) {
    mass = mass*scale.x*scale.y*scale.z || 0;
    let body = createBody(shape, mass);

    return body;

};



function createBody(geometry, mass) {

    if(!mass) mass = 0;

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    let motionState = new Ammo.btDefaultMotionState(transform);
    let localInertia = new Ammo.btVector3(0, 0, 0);
    geometry.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, geometry, localInertia);

    if (mass) {
        rbInfo.set_m_linearSleepingThreshold(1.0);
        rbInfo.set_m_angularSleepingThreshold(0.40);
    }

    let body = new Ammo.btRigidBody(rbInfo);

    if (mass) {
    //    console.log("Setup Dynamic rigid body", body, rbInfo);
    }


    return body;
}

function ammoBoxShape(w, h, l) {
    return new Ammo.btBoxShape(new Ammo.btVector3(w * 0.5, h * 0.5, l * 0.5));
}

function ammoCylinderShape(w, h, l) {
    return new Ammo.btCylinderShape(new Ammo.btVector3(w * 0.5, l * 0.5, h * 1));
}

function ammoSphereShape(r) {
    return new Ammo.btSphereShape(r);
}



function ammoCompoundShape(args) {

    let compoundShape = new Ammo.btCompoundShape();

    for (let i = 0; i < args.length; i++) {
        let subShape = createPrimitiveShape(args[i]);

        let offset = args[i].offset;
        let rot = args[i].rotation;

        let rotation = new Ammo.btQuaternion(rot[0], rot[1], rot[2], 1);
        let position = new Ammo.btVector3(offset[0], offset[1], offset[2]);
        compoundShape.addChildShape(new Ammo.btTransform(rotation, position), subShape);

    }

    return compoundShape
}

function createConvexHullFromBuffer(buffer) {
//    console.log("Create Convex Hull...", [buffer]);
    let btConvexHullShape = new Ammo.btConvexHullShape();
    let _vec3_1 = new Ammo.btVector3(0,0,0);
    let _vec3_2 = new Ammo.btVector3(0,0,0);
    let _vec3_3 = new Ammo.btVector3(0,0,0);
    for (let i = 0; i < buffer.length; i+=9 ) {
        _vec3_1.setX(buffer[i+0]);
        _vec3_1.setY(buffer[i+1]);
        _vec3_1.setZ(buffer[i+2]);
        _vec3_2.setX(buffer[i+3]);
        _vec3_2.setY(buffer[i+4]);
        _vec3_2.setZ(buffer[i+5]);
        _vec3_3.setX(buffer[i+6]);
        _vec3_3.setY(buffer[i+7]);
        _vec3_3.setZ(buffer[i+8]);

        btConvexHullShape.addPoint(_vec3_1,true);
        btConvexHullShape.addPoint(_vec3_2,true);
        btConvexHullShape.addPoint(_vec3_3,true);
    }

    return btConvexHullShape;
}

function createTriMeshFromBuffer(buffer) {
    let triangle_mesh = new Ammo.btTriangleMesh;
    let _vec3_1 = new Ammo.btVector3(0,0,0);
    let _vec3_2 = new Ammo.btVector3(0,0,0);
    let _vec3_3 = new Ammo.btVector3(0,0,0);
    for (let i = 0; i < buffer.length; i+=9 ) {
        _vec3_1.setX(buffer[i+0]);
        _vec3_1.setY(buffer[i+1]);
        _vec3_1.setZ(buffer[i+2]);
        _vec3_2.setX(buffer[i+3]);
        _vec3_2.setY(buffer[i+4]);
        _vec3_2.setZ(buffer[i+5]);
        _vec3_3.setX(buffer[i+6]);
        _vec3_3.setY(buffer[i+7]);
        _vec3_3.setZ(buffer[i+8]);
        triangle_mesh.addTriangle(
            _vec3_1,
            _vec3_2,
            _vec3_3,
            true
        );
    }
    let shape = new Ammo.btBvhTriangleMeshShape( triangle_mesh, true, true );
  //  console.log(scale)
   // shape.setLocalScaling(new Ammo.btVector3(scale.x, scale.y, scale.z));
    return shape
}


let configureMeshShape = function(shape, mass, friction, position, quaternion) {


    shape.setMargin(0.05);

    if(!mass) mass = 0;

    let transform = new Ammo.btTransform();
    transform.setIdentity();

    transform.getOrigin().setX(position.x);
    transform.getOrigin().setY(position.y);
    transform.getOrigin().setZ(position.z);

    let motionState = new Ammo.btDefaultMotionState(transform);
    let localInertia = new Ammo.btVector3(0, 0, 0);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);

    body.shape = shape;
    body.getWorldTransform(transform);

    QUAT_AUX.setX(quaternion.x);
    QUAT_AUX.setY(quaternion.y);
    QUAT_AUX.setZ(quaternion.z);
    QUAT_AUX.setW(quaternion.w);

    transform.setRotation(QUAT_AUX);

    body.setWorldTransform(transform);
    body.getMotionState().setWorldTransform(transform);

    //    let body = createBody(shape, mass);
    //    body.setActivationState(DISABLE_DEACTIVATION);
//    console.log("Mesh shape body:", body);

    applyBodyParams(body);

    return body;
}


let createPrimitiveShape = function(bodyParams) {
    let args = bodyParams.args;

    let shape;

    if (bodyParams.shape === 'Sphere') {
        shape = ammoSphereShape(args[0]);
    }

    if (bodyParams.shape === 'Cylinder') {
        shape = ammoCylinderShape(args[0], args[1], args[2]);
    }

    if (bodyParams.shape === 'Box') {
        shape = ammoBoxShape(args[0], args[1], args[2]);
        //    shape = new CANNON[bodyParams.shape](new CANNON.Vec3(args[2],args[0],args[1]));
    }

    if (bodyParams.shape === 'Compound') {
        shape = ammoCompoundShape(args);
    }

    shapes.push(shape);
    return shape;

};

let bodyParamsDefault = {
    restitution:0.5,
    damping:0.5,
    dampingA:0.5,
    friction:2.9,
    angular_factor:[1, 1, 1,],
    linear_factor:[1, 1, 1,]
}

let applyBodyParams = function(body) {

    let bodyParams = bodyParamsDefault;

    let restitution = bodyParams.restitution || 0.5;
    let damping = bodyParams.damping || 0.5;
    let dampingA = bodyParams.dampingA || damping;
    let friction = bodyParams.friction || 2.9;
    body.setRestitution(restitution);
    body.setFriction(friction);
    body.setDamping(damping, dampingA);

    if (bodyParams.angular_factor) {
        let af = bodyParams.angular_factor;

        let angFac = new Ammo.btVector3();

        angFac.setX(af[0]);
        angFac.setY(af[1]);
        angFac.setZ(af[2]);

        body.setAngularFactor(angFac);
    }

    if (bodyParams.linear_factor) {
        let lf = bodyParams.linear_factor;

        let linFac = new Ammo.btVector3();

        linFac.setX(lf[0]);
        linFac.setY(lf[1]);
        linFac.setZ(lf[2]);

        body.setLinearFactor(linFac);
    }



    //    body.forceActivationState(STATE.WANTS_DEACTIVATION);
};


let lastTime;

let DISABLE_DEACTIVATION = 4;
let ZERO_QUATERNION = new Quaternion(0, 0, 0, 1);

let materialDynamic, materialStatic, materialInteractive;

let currentTime;

let groundMaterial;
let propMaterial;
let chassisMaterial;
let propGroundContactMaterial;
let groundPropContactMaterial;
let chassisGroundContactMaterial;


// Physics letiables
let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
let physicsWorld;


let fixedTimeStep = 1.0 / 60.0; // seconds
let maxSubSteps = 5;
// Global settings
let settings = {
    stepFrequency: 60,
    quatNormalizeSkip: 2,
    quatNormalizeFast: true,
    gx: 0,
    gy: 0,
    gz: 0,
    iterations: 3,
    tolerance: 0.0001,
    k: 1e6,
    d: 3,
    scene: 0,
    paused: false,
    rendermode: "solid",
    constraints: false,
    contacts: false,  // Contact points
    cm2contact: false, // center of mass to contact points
    normals: false, // contact normals
    axes: false, // "local" frame axes
    particleSize: 0.1,
    shadows: false,
    aabbs: false,
    profiling: false,
    maxSubSteps:3
};

let remaining = 0;
let MODEL = {};

MODEL.PhysicsStepTime = 0.01;
MODEL.PhysicsMaxSubSteps = 2;
MODEL.SpatialTolerance = 1;
MODEL.AngularVelocityTolerance = 1;
MODEL.TemporalTolerance = 1;



let buildConf = function(jnt, bodyCfg) {

    return {
        body_key:"box_"+jnt.args[0]+'_'+jnt.args[1]+'_'+jnt.args[2]+'_joint',
        category:"primitive",
        state:"DISABLE_DEACTIVATION",
        shape:"Box",
        args:jnt.args,
        friction:bodyCfg.friction || 1,
        restitution:bodyCfg.restitution || 1,
        damping:bodyCfg.damping || 0.1,
        mass:jnt.mass || 1000
    }

};



let obj3DtobtTransform = function(objd, btTrx) {
    btTrx.setIdentity();
    btTrx.setOrigin(new Ammo.btVector3(objd.position.x, objd.position.y, objd.position.z));
    btTrx.setRotation(new Ammo.btQuaternion(objd.quaternion.x, objd.quaternion.y, objd.quaternion.z, objd.quaternion.w));
};


let attachJoint = function(world, parentBody, jointConf, bodyConf) {

    let rigid_body = buildConf(jointConf, bodyConf);
    let trxP   = new Ammo.btTransform();

    tempObj.rotation.set(jointConf.slide.rot[0], jointConf.slide.rot[1], jointConf.slide.rot[2]);
    tempObj.position.set(jointConf.slide.pos[0], jointConf.slide.pos[1], jointConf.slide.pos[2]);

    obj3DtobtTransform(tempObj, trxP);

    let trxJnt = new Ammo.btTransform();

    tempObj2.rotation.set(jointConf.rotation[0], jointConf.rotation[1], jointConf.rotation[2]);
    tempObj2.position.set(jointConf.offset[0], jointConf.offset[1], jointConf.offset[2]);
    obj3DtobtTransform(tempObj2, trxJnt);


    let dataKey = rigid_body.body_key;

    tempVec.set(1, 1, 1);
    let rigidBody = fetchPoolBody(dataKey);

    if (!rigidBody) {

        let createFunc = function(physicsShape) {
            return createPrimitiveBody(physicsShape, rigid_body, tempVec);
        };

        let shape = createPrimitiveShape(rigid_body);

        bodyPools[dataKey] = new BodyPool(shape, createFunc);
        rigidBody = fetchPoolBody(dataKey);
    }


    rigidBody.forceActivationState(STATE.DISABLE_DEACTIVATION);

    let sliderJoint = new Ammo.btGeneric6DofConstraint(rigidBody, parentBody, trxJnt,  trxP, true);

    TRANSFORM_AUX.setIdentity();

    TRANSFORM_AUX.getOrigin().setX(tempObj.position.x);
    TRANSFORM_AUX.getOrigin().setY(tempObj.position.y);
    TRANSFORM_AUX.getOrigin().setZ(tempObj.position.z);


    //    body.getWorldTransform(TRANSFORM_AUX);


    QUAT_AUX.setX(tempObj.quaternion.x);
    QUAT_AUX.setY(tempObj.quaternion.y);
    QUAT_AUX.setZ(tempObj.quaternion.z);
    QUAT_AUX.setW(tempObj.quaternion.w);

    /*
               TRANSFORM_AUX.getRotation().setX(quaternion.x);
               TRANSFORM_AUX.getRotation().setY(quaternion.y);
               TRANSFORM_AUX.getRotation().setZ(quaternion.z);
               TRANSFORM_AUX.getRotation().setW(quaternion.w);
           */


    TRANSFORM_AUX.setRotation(QUAT_AUX);

    //    body.setWorldTransform(TRANSFORM_AUX);

    //    ms.setWorldTransform(TRANSFORM_AUX);

    rigidBody.setWorldTransform(TRANSFORM_AUX);

    rigidBody.getMotionState().setWorldTransform(TRANSFORM_AUX);


    sliderJoint.setAngularUpperLimit(new Ammo.btVector3(0.0,  0.0, 0.0));
    sliderJoint.setAngularLowerLimit(new Ammo.btVector3(0.0,  0.0, 0.0));

    sliderJoint.setLinearUpperLimit(new Ammo.btVector3(0.0,   0.0,  0.0));
    sliderJoint.setLinearLowerLimit(new Ammo.btVector3(0.0,  -12.1, 0.0));



    //setTimeout(function() {

    world.addConstraint(sliderJoint, true);
    world.addRigidBody(rigidBody);

    //      }, 10);

};

let reset = function(body) {
    applyBodyParams(body)
};


let resetMass = function(body, conf) {
    setTimeout(function() {
        reset(body, conf);
    }, 500)
};

function fetchPoolBody(dataKey) {
    if (!bodyPools[dataKey]) {
        return;
    } else {
        return bodyPools[dataKey].getFromPool();
    }
}

let geometryBuffers = {};
let geoShapes = {};
let geoCallbacks = {};


let fetchGeometryBuffer = function(id, cb) {
    if(!geoCallbacks[id]) {
        geoCallbacks[id] = [];
        PhysicsWorldAPI.sendWorldMessage(ENUMS.Protocol.FETCH_GEOMETRY_BUFFER, id);
    }
    geoCallbacks[id].push(cb);
};



function setBodyTransform(body, position, quaternion) {



    let ms = body.getMotionState();

    //    ms.getWorldTransform(TRANSFORM_AUX);

    //    body.clearForces();

    TRANSFORM_AUX.setIdentity();

    TRANSFORM_AUX.getOrigin().setX(position.x);
    TRANSFORM_AUX.getOrigin().setY(position.y);
    TRANSFORM_AUX.getOrigin().setZ(position.z);


    //    body.getWorldTransform(TRANSFORM_AUX);


    QUAT_AUX.setX(quaternion.x);
    QUAT_AUX.setY(quaternion.y);
    QUAT_AUX.setZ(quaternion.z);
    QUAT_AUX.setW(quaternion.w);

    /*
               TRANSFORM_AUX.getRotation().setX(quaternion.x);
               TRANSFORM_AUX.getRotation().setY(quaternion.y);
               TRANSFORM_AUX.getRotation().setZ(quaternion.z);
               TRANSFORM_AUX.getRotation().setW(quaternion.w);
           */


    TRANSFORM_AUX.setRotation(QUAT_AUX);

    //    body.setWorldTransform(TRANSFORM_AUX);

    //    ms.setWorldTransform(TRANSFORM_AUX);

    body.setWorldTransform(TRANSFORM_AUX);

    body.getMotionState().setWorldTransform(TRANSFORM_AUX);


    VECTOR_AUX.setX(0);
    VECTOR_AUX.setY(0);
    VECTOR_AUX.setZ(0);

    body.getLinearVelocity().setX(0);
    body.getLinearVelocity().setY(0);
    body.getLinearVelocity().setZ(0);

    body.getAngularVelocity().setX(0);
    body.getAngularVelocity().setY(0);
    body.getAngularVelocity().setZ(0);

    applyBodyParams(body);

};


function clearBodyState(body) {
    tempVec.set(1000, 0, 1000);
    TRANSFORM_AUX.setIdentity();
    TRANSFORM_AUX.getOrigin().setX(tempVec.x);
    TRANSFORM_AUX.getOrigin().setY(tempVec.y);
    TRANSFORM_AUX.getOrigin().setZ(tempVec.z);
    body.setWorldTransform(TRANSFORM_AUX);
    body.getMotionState().setWorldTransform(TRANSFORM_AUX);
    body.clearForces();
}


let hit = {
    fraction:0,
    position:new Vector3(),
    normal:new Vector3(),
    ptr:null
};
let disable = function(body) {
    setTimeout(function() {
        body.forceActivationState(STATE.DISABLE_SIMULATION);
    }, 500)
}

let heightFieldShape

function createTerrainShape(data, sideSize, terrainMaxHeight, terrainMinHeight, margin) {

    let terrainWidthExtents = sideSize;
    let terrainDepthExtents = sideSize;
    let terrainWidth = Math.sqrt(data.length);
    let terrainDepth = terrainWidth;
    let terrainHeightDiff = terrainMaxHeight - terrainMinHeight;
    let heightScale = terrainHeightDiff / 100
    let terrainHalfWidth = terrainWidth / 2;
    let terrainHalfDepth = terrainDepth / 2;

    if (!ammoHeightData) {
        ammoHeightData = Ammo._malloc(4 * terrainWidth * terrainDepth);
     //   let heightScale = 1;
        // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
        let upAxis = 1;
        // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
        let hdt = "PHY_FLOAT";
        // Set this to your needs (inverts the triangles)
        let flipQuadEdges = false;
        // Creates height data buffer in Ammo heap
        //    }
        // Creates the heightfield physics shape

        let scaleX = terrainWidthExtents / ( terrainWidth - 1 );
        let scaleZ = terrainDepthExtents / ( terrainDepth - 1 );

        heightFieldShape = new Ammo.btHeightfieldTerrainShape(
            terrainWidth,
            terrainDepth,
            ammoHeightData,
            1,
            terrainMinHeight,
            terrainMaxHeight,
            upAxis,
            hdt,
            flipQuadEdges
        );

//    console.log(heightFieldShape)
        // Set horizontal scale

        heightFieldShape.setLocalScaling(new Ammo.btVector3(scaleX,  1, scaleZ));
        heightFieldShape.setMargin(margin);

    }

    // Copy the javascript height data array to the Ammo one.
    let p = 0;
    let p2 = 0;
    //    for (let j = 0; j < terrainWidth; j++) {
    for (let i = 0; i < data.length; i++) {
        // write 32-bit float data to memory
        Ammo.HEAPF32[ammoHeightData + p2 >> 2] = data[i] * heightScale * (256/255);
        p++;
        // 4 bytes/float
        p2 += 4;
    }

    return heightFieldShape;

}

let gravity = -9.81;
let allHitsRayResultCallback;
class AmmoFunctions {
    constructor(ammo) {
        Ammo = ammo;

        rayFromVec = new Ammo.btVector3();
        rayToVec = new Ammo.btVector3();
        rayCallback = new Ammo.ClosestRayResultCallback(rayFromVec, rayToVec);
        allHitsRayResultCallback = new Ammo.AllHitsRayResultCallback(rayFromVec, rayToVec)
        TRANSFORM_AUX = new Ammo.btTransform();
        VECTOR_AUX = new Ammo.btVector3();
        VECTOR_AUX2 = new Ammo.btVector3();
        QUAT_AUX = new Ammo.btQuaternion();

    };


    getYGravity() {
        return gravity;
    }

    createPhysicalWorld() {
        //   Ammo = ammo;
        collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
        broadphase = new Ammo.btDbvtBroadphase();
        solver = new Ammo.btSequentialImpulseConstraintSolver();
        physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
        physicsWorld.setGravity( new Ammo.btVector3( 0, gravity, 0 ) );


        return physicsWorld;
    };



    forceAtPointToBody(forceVec3, pointVec, body) {

        let dead = body.isStaticObject();

        if (!dead) {

            body.activate();

            VECTOR_AUX.setX(forceVec3.x);
            VECTOR_AUX.setY(forceVec3.y);
            VECTOR_AUX.setZ(forceVec3.z);

            VECTOR_AUX2.setX(pointVec.x );
            VECTOR_AUX2.setY(pointVec.y );
            VECTOR_AUX2.setZ(pointVec.z );

            body.applyForce(VECTOR_AUX, VECTOR_AUX2) // , VECTOR_AUX2);
        }


    };

    forceAndTorqueToBody(forceVec3, body, torqueVec) {

        body.activate();
        body.forceActivationState(STATE.ACTIVE);

        if (forceVec3) {
            VECTOR_AUX.setX(forceVec3.x);
            VECTOR_AUX.setY(forceVec3.y);
            VECTOR_AUX.setZ(forceVec3.z);

            body.applyCentralForce(VECTOR_AUX);
        }

        if (torqueVec) {
            VECTOR_AUX.setX(torqueVec.x );
            VECTOR_AUX.setY(torqueVec.y );
            VECTOR_AUX.setZ(torqueVec.z );

            body.applyLocalTorque(VECTOR_AUX);
        }

    };

    applyForceToBodyWithMass(forceVec3, body, mass, randomize) {
        body.activate();
        body.forceActivationState(STATE.ACTIVE);

        let randomFactor = randomize || 0.01;

        let massFactor = 5000 * Math.sqrt(mass/3) + mass*150;

        forceVec3.multiplyScalar(massFactor);

        body.forceActivationState(STATE.ACTIVE);

        VECTOR_AUX.setX(forceVec3.x + forceVec3.x * (Math.random() - 0.5) * randomFactor);
        VECTOR_AUX.setY(forceVec3.y + forceVec3.y * (Math.random() - 0.5) * randomFactor);
        VECTOR_AUX.setZ(forceVec3.z + forceVec3.z * (Math.random() - 0.5) * randomFactor);

        body.applyCentralForce(VECTOR_AUX);

        VECTOR_AUX.setX(forceVec3.x * randomFactor + (Math.random() - 0.5) * massFactor*0.1 * randomFactor);
        VECTOR_AUX.setY(forceVec3.y * randomFactor * 0.1 + (Math.random() - 0.5) * massFactor*0.01 * randomFactor);
        VECTOR_AUX.setZ(forceVec3.z * randomFactor + (Math.random() - 0.5) * massFactor*0.1 * randomFactor);

        body.applyTorque(VECTOR_AUX);

    };

    getBodyActiveState(body) {
        return body.isActive()
    };

    applyBodyDamping(body, dampingV, dampingA) {
        return body.setDamping(dampingV, dampingA);
    };

    enableBodySimulation(body) {

        body.forceActivationState(STATE.ACTIVE);
    };


    relaxBodySimulation(body) {
        //    body.deactivate();

        if (!this.getBodyActiveState(body)) {
            //    this.disableBodySimulation(body);
            return;
        }

        body.forceActivationState(STATE.WANTS_DEACTIVATION);

        //    return;
        body.getLinearVelocity(VECTOR_AUX);

        let speed = Math.abs(VECTOR_AUX.x()) + Math.abs(VECTOR_AUX.y()) + Math.abs(VECTOR_AUX.z());

        if (speed > 2) return;

        body.getAngularVelocity(VECTOR_AUX);

        let spin = Math.abs(VECTOR_AUX.x()) + Math.abs(VECTOR_AUX.y()) + Math.abs(VECTOR_AUX.z());

        if (spin+speed < 0.5) {
            this.disableBodySimulation(body);
        }

    };

    disableBodySimulation(body) {
        body.forceActivationState(STATE.DISABLE_SIMULATION);
    };



    returnBodyToPool(body) {
    //    console.log("Pool Body", bodyPools, body);
        clearBodyState(body);
        if (bodyPools[body.dataKey]) {
            bodyPools[body.dataKey].returnToPool(body)
        } else {
            if (isDev()) {
                console.log("No Body Pool for ", body);
            }
        }
    }

    physicsRayGetIntersections(world, pos, dir) {
        rayFromVec.setX(pos.x);
        rayFromVec.setY(pos.y);
        rayFromVec.setZ(pos.z);

        rayToVec.setX(dir.x + pos.x);
        rayToVec.setY(dir.y + pos.y);
        rayToVec.setZ(dir.z + pos.z);

        allHitsRayResultCallback = new Ammo.AllHitsRayResultCallback(rayFromVec, rayToVec)

        allHitsRayResultCallback.get_m_rayFromWorld().setValue(pos.x, pos.y, pos.z);
        allHitsRayResultCallback.get_m_rayToWorld().setValue(dir.x + pos.x, dir.y +pos.y, dir.z+pos.z);
        //    rayCallback.set_m_collisionObject(null);

        allHitsRayResultCallback.set_m_closestHitFraction(1);

        world.rayTest(rayFromVec, rayToVec, allHitsRayResultCallback);

    //    let fraction = allHitsRayResultCallback.get_m_closestHitFraction();
        let objs = allHitsRayResultCallback.get_m_collisionObjects()
        MATH.emptyArray(rayHits);

        let obj = allHitsRayResultCallback.get_m_collisionObject()

        if (objs.size() !== 0) {
            let size = objs.size();
            for (let i = 0; i < size; i++) {
                console.log()
                rayHits.push(objs.at(i));
            }
            objs.__destroy__();
        //    console.log(allHitsRayResultCallback, obj, objs, objs.size());
        //    console.log(rayHits);
        //
        }
    //    obj.__destroy__();
        allHitsRayResultCallback.__destroy__();
        return rayHits;
    //    hit.fraction = fraction;
    }
    physicsRayRange(world, pos, dir, posRes, normalRes, staticOnly) {

        rayFromVec.setX(pos.x);
        rayFromVec.setY(pos.y);
        rayFromVec.setZ(pos.z);

        rayToVec.setX(dir.x + pos.x);
        rayToVec.setY(dir.y + pos.y);
        rayToVec.setZ(dir.z + pos.z);

        //    new Ammo.ClosestRayResultCallback(rayFromVec, rayToVec);

        rayCallback.get_m_rayFromWorld().setValue(pos.x, pos.y, pos.z);
        rayCallback.get_m_rayToWorld().setValue(dir.x + pos.x, dir.y +pos.y, dir.z+pos.z);
        //    rayCallback.set_m_collisionObject(null);

        rayCallback.set_m_closestHitFraction(1);


        world.rayTest(rayFromVec, rayToVec, rayCallback);

        let fraction = rayCallback.get_m_closestHitFraction();


        if(fraction < 1){

            let body = rayCallback.get_m_collisionObject();
            let hitPoint = rayCallback.get_m_hitPointWorld();
            hit.position.set(hitPoint.x(), hitPoint.y(), hitPoint.z());

            if (staticOnly === true) {
                if (!body.isStaticObject()) {
                    tempVec.copy(dir);
                    tempVec.multiplyScalar((1-fraction)*0.1);
                    hit.position.add(tempVec);
                    tempVec.multiplyScalar(10)
                    return this.physicsRayRange(world, hit.position, tempVec, posRes, normalRes, staticOnly)
                }
            }

            hit.fraction = fraction;

            let hitNormal = rayCallback.get_m_hitNormalWorld();
            hit.normal.set(hitNormal.x(), hitNormal.y(), hitNormal.z());

        //    console.log(rayCallback, rayCallback.get_m_collisionObject());

            hit.body = body
            hit.ptr = body.kB;
            posRes.copy(hit.position);
            normalRes.copy(hit.normal);
            //    console.log(hitPoint, hit.ptr);
            return hit;
        }

    };


    cleanupPhysicalWorld(cb) {

        let shapeCount = shapes.length;

        while (shapes.length) {
            Ammo.destroy(shapes.pop())
        }

        Ammo.destroy(physicsWorld);
        Ammo.destroy(solver);
        Ammo.destroy(broadphase);
        Ammo.destroy(dispatcher);
        Ammo.destroy(collisionConfiguration);

        for (let key in bodyPools) {
            bodyPools[key].wipePool();
        }

        bodyPools = {};

        cb(shapeCount)
    };


    updatePhysicalWorld(world, dt) {
        let timePre = performance.now();
        world.stepSimulation(dt, MODEL.PhysicsMaxSubSteps, dt);
        let physTime = performance.now() - timePre;
        return physTime;
    };




    createPhysicalTerrain(world, data, totalSize, posx, posz, minHeight, maxHeight) {

   //     console.log("createPhysicalTerrain", totalSize, posx, posz, minHeight, maxHeight);



        let heightDiff = maxHeight-minHeight;
        let heightScale = heightDiff/100
        let margin = 0.01 // 2 / heightScale;

        let restitution =  0.4;
        let damping     =  0.7;
        let friction    =  45.0;

            console.log("Ground minY maxY: ", minHeight, maxHeight)

        let groundShape = createTerrainShape( data, totalSize, maxHeight, minHeight, margin );
        shapes.push(groundShape);
        let groundTransform = new Ammo.btTransform();
        groundTransform.setIdentity();
        // Shifts the terrain, since bullet re-centers it on its bounding box.
        let posY = minHeight*2 + ((heightDiff-(heightScale*0.8))* 0.5);
        groundTransform.setOrigin( new Ammo.btVector3(posx, posY,posz) );
        console.log("groundTransform",groundTransform)

        let groundMass = 0;
        let groundLocalInertia = new Ammo.btVector3( 0, 0, 0 );
        let groundMotionState = new Ammo.btDefaultMotionState( groundTransform );

        let rbInfo = new Ammo.btRigidBodyConstructionInfo( groundMass, groundMotionState, groundShape, groundLocalInertia )
        rbInfo.set_m_linearSleepingThreshold(0);
        rbInfo.set_m_angularSleepingThreshold(0);

        let groundBody = new Ammo.btRigidBody(rbInfo);

        groundBody.setWorldTransform(groundTransform);

        groundBody.setRestitution(restitution);
        groundBody.setFriction(friction);
        groundBody.setDamping(damping, damping);

        world.addRigidBody( groundBody );

        return groundBody;
    };


    setBodyPosition(body, posVec) {

        let ms = body.getMotionState();

        ms.getWorldTransform(TRANSFORM_AUX);

        //    body.clearForces();

        TRANSFORM_AUX.setIdentity();

        TRANSFORM_AUX.getOrigin().setX(posVec.x);
        TRANSFORM_AUX.getOrigin().setY(posVec.y);
        TRANSFORM_AUX.getOrigin().setZ(posVec.z);

        body.setWorldTransform(TRANSFORM_AUX);

        body.getMotionState().setWorldTransform(TRANSFORM_AUX);

    };

    setBodyTransform(body, posVec, quat) {
        let ms = body.getMotionState();

        ms.getWorldTransform(TRANSFORM_AUX);

        //    body.clearForces();

        TRANSFORM_AUX.setIdentity();

        TRANSFORM_AUX.getOrigin().setX(posVec.x);
        TRANSFORM_AUX.getOrigin().setY(posVec.y);
        TRANSFORM_AUX.getOrigin().setZ(posVec.z);
     //   console.log(TRANSFORM_AUX.getRotation())

        TRANSFORM_AUX.getRotation().setX(quat.x);
        TRANSFORM_AUX.getRotation().setY(quat.y);
        TRANSFORM_AUX.getRotation().setZ(quat.z);
        TRANSFORM_AUX.getRotation().setW(quat.w);

        body.setWorldTransform(TRANSFORM_AUX);

        body.getMotionState().setWorldTransform(TRANSFORM_AUX);
    }

    setGeometryBuffer(id, buffer) {
        geometryBuffers[id] = buffer;
    //    console.log("Set Buffer", id, [buffer])
        function onReady(body) {
            body.forceActivationState(STATE.DISABLE_SIMULATION);
            body.activate(false);
        }

        this.createRigidBody(tempObj, id+"_temp", id, 0, 1, tempVec, tempObj.quaternion, tempVec, false, onReady)

    };

    attachBodyBySliderJoints(world, parentBody, bodyConf) {

        for (let i = 0; i < bodyConf.joints.length; i++) {
            attachJoint(world, parentBody, bodyConf.joints[i], bodyConf);
        }

    };


    createRigidBody(obj3d, shapeKey, mass, friction, pos, rot, scale, assetId, convex, onReady) {


        let dataKey = assetId+getObj3dScaleKey(obj3d, scale);


        MATH.vec3FromArray(threeVec, pos);
        threeVec.applyQuaternion(obj3d.quaternion);
        threeVec.add(obj3d.position)
        threeObj.position.set(0, 0, 0);
        let position = threeVec
            threeObj.quaternion.copy(obj3d.quaternion);
        MATH.rotXYZFromArray(threeObj, rot);
        let quaternion = threeObj.quaternion
        quaternion.multiply(obj3d.quaternion);
        let scaleVec = MATH.vec3FromArray(threeObj.scale, scale);
        threeObj.scale.multiply(obj3d.scale);

        if (mass) {
        //    dynamicSpatial.setSpatialDynamicFlag(1);
        } else {
        //    dynamicSpatial.setSpatialDynamicFlag(0);
        }

        mass = mass*scaleVec.x*scaleVec.y*scaleVec.z || 0;

        let rigidBody;

        if (shapeKey === "terrain") {
            return;
        }

        if (shapeKey === "simple") {
            return;
        }

        if (shapeKey === "box") {

            rigidBody = fetchPoolBody(dataKey);

            if (!rigidBody) {

                let createFunc = function(physicsShape) {
                    return shape = createBody(physicsShape, mass);
                };

                let shape = ammoBoxShape(scaleVec.x, scaleVec.y, scaleVec.z);

                bodyPools[dataKey] = new BodyPool(shape, createFunc);
                rigidBody = fetchPoolBody(dataKey);
            } else {
                clearBodyState(rigidBody);
            }
            rigidBody.forceActivationState(STATE.ACTIVE);
            rigidBody.dataKey = dataKey;
            //    position.y += args[2] / 2;
        //    console.log("Box", scaleVec, rigidBody)
            setBodyTransform(rigidBody, position, quaternion);
            onReady(rigidBody)
            return;
        }

        if (shapeKey === "primitive") {

            rigidBody = fetchPoolBody(dataKey);

            if (!rigidBody) {

                let createFunc = function(physicsShape) {
                    return createBody(physicsShape, mass);
                };

                let shape = createPrimitiveShape(rigid_body);


                bodyPools[dataKey] = new BodyPool(shape, createFunc);
                rigidBody = fetchPoolBody(dataKey);
                rigidBody.dataKey = dataKey;
            } else {
                rigidBody.forceActivationState(STATE.ACTIVE);
            }
            rigidBody.dataKey = dataKey;
            //    position.y += args[2] / 2;
            setBodyTransform(rigidBody, position, quaternion);
            onReady(rigidBody)
            return;
        }

        if (shapeKey === "vehicle") {
            let ammoVehicle = new AmmoVehicle(world, rigid_body, position, quaternion);

            actor.piece.processor = ammoVehicle.processor;
            rigidBody = ammoVehicle.body;
            actor.piece.vehicle = ammoVehicle.vehicle;
        }

        if (shapeKey === "hovercraft") {
            let ammoVehicle = new AmmoHovercraft(world, rigid_body, position, quaternion);

            actor.piece.processor = ammoVehicle.processor;
            rigidBody = ammoVehicle.body;
            actor.piece.hovercraft = ammoVehicle;
        }



        if (shapeKey === "mesh") {

            let body = fetchPoolBody(dataKey);

            if (!body) {
                let createFunc = function(bodyShape) {
                    return configureMeshShape(bodyShape, mass, friction, position, quaternion)
                };

                let shape;

                try {
                    if (convex) {
                        shape = createConvexHullFromBuffer(geometryBuffers[assetId]);
                    } else {
                        shape = createTriMeshFromBuffer(geometryBuffers[assetId]);
                    }
                }

                catch (err) {
                    console.log("Physical Mesh error ", assetId, dataKey, err)
                }


                shape.setLocalScaling(new Ammo.btVector3(scaleVec.x, scaleVec.y, scaleVec.z));

                bodyPools[dataKey] = new BodyPool(shape, createFunc);
                body = fetchPoolBody(dataKey);
                body.dataKey = dataKey;
            } else {
                body.forceActivationState(STATE.ACTIVE);
            }
            body.forceActivationState(STATE.ACTIVE);
            body.dataKey = dataKey;
            setBodyTransform(body, position, quaternion);
            onReady(body)

        } else {
        //    onReady(rigidBody, rigid_body);
        }

    };


    getAuxTransform() {
        return TRANSFORM_AUX
    }

    getAuxVector() {
        return VECTOR_AUX
    }

    fitBodyAABB(body, min, max) {
        body.getAabb(VECTOR_AUX, VECTOR_AUX2)
        min.x = VECTOR_AUX.x();
        min.y = VECTOR_AUX.y();
        min.z = VECTOR_AUX.z();
        max.x = VECTOR_AUX2.x();
        max.y = VECTOR_AUX2.y();
        max.z = VECTOR_AUX2.z();
    }

    getGeometryBuffer(id) {
        return geometryBuffers[id];
    }


}

export {AmmoFunctions}



