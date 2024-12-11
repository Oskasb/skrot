"use strict";

var PhysicsWorldAPI;

define([
        'worker/physics/AmmoAPI',
        'worker/physics/WaterPhysics',
        'worker/physics/AirPhysics',
        'worker/physics/ShapePhysics',
        'worker/physics/DynamicSpatial'
    ],
    function(
        AmmoAPI,
        WaterPhysics,
        AirPhysics,
        ShapePhysics,
        DynamicSpatial
    ) {

    var comBuffer;
        var ammoApi;
        var waterPhysics;
        var airPhysics;
        var protocolRequests;
        var worldMessages;
        var fetches = {};

        var tpf;
        var skipFrames = 0;
        var skipFrame = false;
        var frameIdle;
        var frameStart;
        var frameEnd;
        var lastFrameTime;

        var stepStart;
        var stepEnd;
        var activeBodies;
        var passiveBodies;
        var staticBodies;

        var dynamicSpatials = [];
        var terrainBodies = {};
        var linFac
        var tempVec1 = new THREE.Vector3()

        PhysicsWorldAPI = function() {};

        PhysicsWorldAPI.initPhysicsWorld = function(onWorkerReady) {

        //    console.log(performance);

            var ammoReady = function() {
                linFac = new Ammo.btVector3();
                waterPhysics = new WaterPhysics();
                airPhysics = new AirPhysics();
                ammoApi.initPhysics();
                onWorkerReady();
                ShapePhysics.initData();
            };

            ammoApi = new AmmoAPI(ammoReady);
        };

        PhysicsWorldAPI.setWorldComBuffer = function(buffer) {
            comBuffer = buffer;
        };

        PhysicsWorldAPI.getWorldComBuffer = function() {
            return comBuffer;
        };

        PhysicsWorldAPI.fetchCategoryKeyData = function(category, key) {

            if (!fetches[category]) {
                fetches[category] = []
            }

            if (fetches[category].indexOf(key) === -1) {
                PhysicsWorldAPI.sendWorldMessage(ENUMS.Protocol.FETCH_PIPELINE_DATA, [category, key]);
                fetches[category].push(key);
            }
        };

        var start;

        var applyDynamicSpatials = function() {
            for (var i = 0; i < dynamicSpatials.length; i++) {
                dynamicSpatials[i].tickPhysicsUpdate(ammoApi);
            }
        };

        var isStatic;

        var updateDynamicSpatials = function(physTpf) {

            activeBodies = 0;
            passiveBodies = 0;
            staticBodies = 0;

            for (var i = 0; i < dynamicSpatials.length; i++) {
                isStatic = dynamicSpatials[i].isStatic();
                if (!isStatic) {
                //    waterPhysics.simulateDynamicSpatialInWater(dynamicSpatials[i], physTpf);
                //    airPhysics.simulateDynamicSpatialInAir(dynamicSpatials[i], physTpf);
                    dynamicSpatials[i].sampleBodyState();
                //    activeBodies += dynamicSpatials[i].getSpatialSimulateFlag();
                }

            //    passiveBodies += dynamicSpatials[i].getSpatialDisabledFlag();
                staticBodies += isStatic;
            }
        };

        var getNow = function() {
            return (performance.now() - start) / 1000
        };

        var physTpf;
        var now = MATH.getNowMS();
        var dt = 0;

        PhysicsWorldAPI.callPhysicsSimulationUpdate = function(tpF) {
            now = MATH.getNowMS();


            tpf = tpF;

            skipFrame = false;
            frameStart = getNow();
            frameIdle = frameStart - frameEnd;

            applyDynamicSpatials();

                physTpf = Math.min(tpf, 0.03);

                stepStart = getNow();
                ammoApi.updatePhysicsSimulation(physTpf);
                stepEnd = getNow();
                updateDynamicSpatials(physTpf);

            frameEnd = getNow();

            DebugAPI.generateTrackEvent('PHYS_DT', MATH.getNowMS() - now, 'ms', 2)
        };


        PhysicsWorldAPI.startPhysicsSimulationLoop = function() {
            start = performance.now();
            frameEnd = getNow();
        };


        PhysicsWorldAPI.getDynamicSpatials = function() {
            return dynamicSpatials;
        };

        var getTerrainKey = function(msg) {
            return ''+msg.x+'_'+msg.z;
        };

        var terrainPointers = [];

        PhysicsWorldAPI.addTerrainToPhysics = function(terrainArea) {
            console.log("Physics Worker Add Terrain:", terrainArea);

            var addTerrainToPhysics = function(terrainOpts, buffer, posX, posZ) {

                var opts = terrainOpts;
                var body = ammoApi.buildPhysicalTerrain(
                    buffer,
                    opts.terrain_size,
                    posX + opts.terrain_size / 2,
                    posZ + opts.terrain_size / 2,
                    opts.min_height,
                    opts.max_height);

                return body;
            };

            var terrainBody = addTerrainToPhysics(terrainArea.terrainOptions, terrainArea.buffers[4], terrainArea.origin.x,terrainArea.origin.z);
            terrainBodies[getTerrainKey(terrainArea.origin)] = terrainBody;
            ammoApi.includeBody(terrainBody);
            terrainArea.setAmmoBody(terrainBody);
            terrainPointers.push(terrainBody.tw);
            console.log("terrainBody:", terrainPointers, terrainBody);
            /*
            var dynamicSpatial = new DynamicSpatial();
            dynamicSpatial.setSpatialBuffer(msg[2]);
            dynamicSpatial.setPhysicsBody(terrainBody);
            dynamicSpatials.push(dynamicSpatial);
            console.log("dynamicSpatials:", dynamicSpatials);
            */
        };


        PhysicsWorldAPI.testPointerIsTerrain = function(ptr) {
            return terrainPointers.indexOf(ptr) !== -1;
        };

        var bodyReady = function(dynamicSpatial, rigidBody) {

            if (dynamicSpatials.indexOf(dynamicSpatial) !== -1) {
                console.log("Already registered...!")
                return;

            }

            dynamicSpatial.setPhysicsBody(rigidBody);
            dynamicSpatials.push(dynamicSpatial);
            ammoApi.includeBody(rigidBody);
        };


        var boxConfig = {
            "body_key":"box_1x1x1_crate",
             "category":"primitive",
             "state":"WANTS_DEACTIVATION",
             "shape":"Box",
             "args":[0.2, 0.2, 0.2],
             "friction":1.7,
             "restitution":0.1,
             "damping":0.35,
             "mass":20
        };



        PhysicsWorldAPI.addPhysicsToWorldEntity = function(worldEntity) {

            var dynamicSpatial = new DynamicSpatial(boxConfig);
            dynamicSpatial.setWorldEntity(worldEntity);

            ammoApi.setupRigidBody(boxConfig, dynamicSpatial, bodyReady);

        };

        PhysicsWorldAPI.buildMovementSphere = function(worldEntity, radius, mass) {

            var sphereConfig = {
                "body_key":"sphere",
                "category":"primitive",
                "state":"WANTS_DEACTIVATION",
                "shape":"Sphere",
                "args":[radius || 0.5 , 0.5, 0.5],
                "friction":15.7,
                "restitution":0.13,
                "damping":0.25,
                "dampingA":1.5,
                "mass":mass || 100
            };

            var dynamicSpatial = new DynamicSpatial(sphereConfig);
            dynamicSpatial.inheritRotation = false;
            dynamicSpatial.setWorldEntity(worldEntity);

            ammoApi.setupRigidBody(sphereConfig, dynamicSpatial, bodyReady);

        };

        PhysicsWorldAPI.positionWorldEntity = function(worldEntity, posVec) {

            var dynSpat = MATH.getFromArrayByKeyValue(dynamicSpatials, 'worldEntity', worldEntity);
            ammoApi.setBodyPosition(dynSpat.body, posVec);

        };

        PhysicsWorldAPI.moveWorldEntity = function(worldEntity, distanceVec) {

            var dynSpat = MATH.getFromArrayByKeyValue(dynamicSpatials, 'worldEntity', worldEntity);

            worldEntity.getWorldEntityPosition(tempVec1);
            tempVec1.add(distanceVec);

            ammoApi.setBodyPosition(dynSpat.body, tempVec1);

        };

        PhysicsWorldAPI.applyForceToWorldEntity = function(worldEntity, forceVec) {

            var dynSpat = MATH.getFromArrayByKeyValue(dynamicSpatials, 'worldEntity', worldEntity);
            dynSpat.applyDynamicSpatialForce(ammoApi, forceVec);
        };

        PhysicsWorldAPI.applyTorqueToWorldEntity = function(worldEntity, torqueVec) {

            var dynSpat = MATH.getFromArrayByKeyValue(dynamicSpatials, 'worldEntity', worldEntity);
            dynSpat.applyDynamicSpatialTorque(ammoApi, torqueVec);
        };

        PhysicsWorldAPI.applyTorqueToWorldEntity = function(worldEntity, torqueVec) {

            var dynSpat = MATH.getFromArrayByKeyValue(dynamicSpatials, 'worldEntity', worldEntity);
            dynSpat.applyDynamicSpatialTorque(ammoApi, torqueVec);
        };

        PhysicsWorldAPI.applyWorldEntityDamping = function(worldEntity, dampingV, dampingA) {
            var dynSpat = MATH.getFromArrayByKeyValue(dynamicSpatials, 'worldEntity', worldEntity);
            dynSpat.body.setDamping(dampingV, dampingA)
        };


        PhysicsWorldAPI.setWorldEntityLinearFactors = function(worldEntity, x, y, z) {
            var dynSpat = MATH.getFromArrayByKeyValue(dynamicSpatials, 'worldEntity', worldEntity);
            linFac.setX(x);
            linFac.setY(y);
            linFac.setZ(z);

            dynSpat.body.setLinearFactor(linFac);
        };


        PhysicsWorldAPI.raycastFromTo = function(fromVec, dirVec, hitPosStore, hitNormStore) {
            var hit = ammoApi.raycastPhysicsWorld(fromVec, dirVec, hitPosStore, hitNormStore)

            if (DebugAPI.getDebugDrawPhysics()) {
                if (hit) {
                    DebugAPI.debugDrawRaycast(fromVec, dirVec, hitPosStore, hitNormStore)
                } else {
                    DebugAPI.debugDrawRaycast(fromVec, dirVec)
                }
            }

            return hit;

        };

        PhysicsWorldAPI.processRequest = function(msg) {
            protocolRequests.handleMessage(msg)
        };

        PhysicsWorldAPI.sendWorldMessage = function(protocolKey, data) {
            protocolRequests.sendMessage(protocolKey, data)
        };

        var fetchCallbacks = {};

        PhysicsWorldAPI.fetchConfigData = function(category, key, dataId, callback) {
            MainWorldAPI.fetchConfigData(category, key, dataId, callback)
        };



        PhysicsWorldAPI.applyLocalForceToBodyPoint = function(force, body, point) {
            ammoApi.applyForceAtPointToBody(force, point, body)
        };

        PhysicsWorldAPI.setBodyDamping = function(body, dampingV, dampingA) {
            ammoApi.changeBodyDamping(body, dampingV, dampingA)
        };


        PhysicsWorldAPI.waveHeightAtPos = function(pos) {
            var currentTime = PhysicsWorldAPI.getCom(ENUMS.BufferChannels.FRAME_RENDER_TIME);
            return 0.5 * (Math.sin(currentTime*0.35 + pos.x * 0.09) + Math.cos(currentTime * 0.17 + pos.z * 0.16));
        };

        var getTerrainsCount = function() {
            var count = 0;
            for (var key in terrainBodies) {
                count ++;
            }
            return count;
        };

        PhysicsWorldAPI.registerPhysError = function() {
            comBuffer[ENUMS.BufferChannels.PHYS_ERRORS]++;
        };

        PhysicsWorldAPI.getCom = function(index) {
            return comBuffer[index];
        };

        PhysicsWorldAPI.updatePhysicsStats = function() {

            comBuffer[ENUMS.BufferChannels.FRAME_IDLE] = frameIdle;

            comBuffer[ENUMS.BufferChannels.FRAME_TIME] = frameEnd - frameStart;

            if (!skipFrame) {

                comBuffer[ENUMS.BufferChannels.STEP_TIME] = stepEnd - stepStart;
            }

            comBuffer[ENUMS.BufferChannels.DYNAMIC_COUNT] = dynamicSpatials.length;
            comBuffer[ENUMS.BufferChannels.BODIES_ACTIVE] = activeBodies;
            comBuffer[ENUMS.BufferChannels.BODIES_PASSIVE] = passiveBodies;
            comBuffer[ENUMS.BufferChannels.BODIES_STATIC] = staticBodies;
            comBuffer[ENUMS.BufferChannels.BODIES_TERRAIN] = getTerrainsCount();

            comBuffer[ENUMS.BufferChannels.SKIP_FRAMES] = skipFrames;
            comBuffer[ENUMS.BufferChannels.PHYSICS_LOAD] = comBuffer[ENUMS.BufferChannels.FRAME_TIME]*1000 / comBuffer[ENUMS.BufferChannels.TPF];


        };

        return PhysicsWorldAPI;
    });

