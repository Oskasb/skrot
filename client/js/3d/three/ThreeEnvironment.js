import { PipelineObject } from "../../application/load/PipelineObject.js";
import {
    AmbientLight,
    BackSide,
    Color, DirectionalLight, EquirectangularReflectionMapping, FogExp2, ImageBitmapLoader,
    Mesh,
    MeshBasicMaterial,
    NoBlending,
    SphereGeometry, TextureLoader,
    Vector3
} from "../../../../libs/three/Three.Core.js";
import {evt} from "../../application/event/evt.js";
import {ENUMS} from "../../application/ENUMS.js";
import {MATH} from "../../application/MATH.js";
import {getFrame} from "../../application/utils/DataUtils.js";
import {getSetting} from "../../application/utils/StatusUtils.js";
import {JsonAsset} from "../../application/load/JsonAsset.js";
import {jsonAsset} from "../../application/utils/AssetUtils.js";

let statusMap = {
    transitionProgress:0,
    fog:{density:0, near:1, far: 100000}
};

let lastStatus = {};
lastStatus['fogColor'] = [];
lastStatus['ambColor'] = [];
lastStatus['sunColor'] = [];

class ThreeEnvironment {
    constructor() {

        let _this = this;

        let tickEnv = function(tpf) {
            _this.tick(tpf)
        };

        this.tickEnvironment = tickEnv;

        this.currentEnvIndex = undefined;
        this.enabled = false;
        this.envList = {};
        this.skyList = {};
        this.worldSetup = {};
        this.world = {
            fog:statusMap['fog'],
            uniforms: {
                fog:new Vector3(),
                sun:new Vector3(),
                ambient:new Vector3()
            }

        };
        this.currentEnvId = null;
        this.maxElevation = 10000;
        this.currentElevation = 0;
        this.elevationFactor = 0;
        this.transitionTime = 25;
        this.currentEnvConfig;
        this.currentSkyConfig;
        this.worldCenter = new Vector3(0, 0, 0);
        this.calcVec = new Vector3();
        this.calcVec2 = new Vector3();
        this.theta;
        this.phi;

        this.sky = null;

        this.ctxHeight = 256;
        this.ctxWidth= 1;

        this.scene = null;
        this.camera;
        this.renderer;
        this.sunSphere;
        this.fogColor = new Color(1, 1, 1);
        this.dynamicFogColor = new Color(1, 1, 1);
        this.ambientColor = new Color(1, 1, 1);
        this.dynamicAmbientColor = new Color(1, 1, 1);

    }


    loadEnvironmentData = function(onLoaded) {

        let _this = this;

        let worldListLoaded = function(data) {

            console.log("Load Env World Data:", data);

            for (let i = 0; i < data.params.length; i++){
                _this.worldSetup[data.params[i].id] = data.params[i]
            }
            _this.currentEnvId = data.defaultEnvId;
            _this.currentEnvIndex = undefined;

            onLoaded();
        };

    //    waterFx = new WaterFX();
        let data = {
            defaultEnvId:"high_noon",
            params:[
                {id:"sun",      THREE:"DirectionalLight"},
                {id:"ambient",  THREE:"AmbientLight"    },
                {id:"fog",      THREE:"Fog"         }
            ]
        }
        worldListLoaded(data)

    };


    applyColor = function(Obj3d, color) {
        if (Obj3d) {
            if (Obj3d.color) {
                Obj3d.color.r=color[0];
                Obj3d.color.g=color[1];
                Obj3d.color.b=color[2];
            } else {
                Obj3d.color = new Color(color[0],color[1], color[2]);
            }
        }
        Obj3d.needsUpdate = true;
    };

    applyFog = function(Obj3d, density) {
        Obj3d.density = density * 0.3;
        Obj3d.near = 1;
        Obj3d.far = 1/density;
    };

    applyEnvironment = function() {

        let config = this.currentEnvConfig;

        let fogColor = config.fog.color;
        let ambColor = config.ambient.color;
        let sunColor = config.sun.color;
        statusMap['fogColor'] = fogColor;
        statusMap['ambColor'] = ambColor;
        statusMap['sunColor'] = sunColor;

        MATH.copyArrayValues(fogColor, lastStatus['fogColor']);
        MATH.copyArrayValues(ambColor, lastStatus['ambColor']);
        MATH.copyArrayValues(sunColor, lastStatus['sunColor']);

        for (let key in config) {

            if (config[key].color) {

                if (key === 'sun') {

                    //    world[key].position.copy(sunSphere.position);
                    //    world[key].lookAt(worldCenter)
                }

                if (key === 'moon') {

                    this.world[key].position.x = 10 -this.sunSphere.position.x * 0.2;
                    this.world[key].position.y = 1000 +this.sunSphere.position.y * 5;
                    this.world[key].position.z = 10 -this.sunSphere.position.z * 0.2;
                    this.world[key].lookAt(this.worldCenter)
                }


                if (key === 'fog') {

                    this.fogColor.setRGB(config[key].color[0],config[key].color[1],config[key].color[2]);
                    this.world[key].fog.color.r = this.fogColor.r // *0.5;
                    this.world[key].fog.color.g = this.fogColor.g // *0.5;
                    this.world[key].fog.color.b = this.fogColor.b // *0.5;

                    this.world[key].fog.density = config[key].density*0.005;
                }

                if (key === 'ambient') {
                    this.ambientColor.setRGB(config[key].color[0],config[key].color[1],config[key].color[2]);
                }

                this.applyColor(this.world[key], config[key].color);
            }

            if (config[key].density) {
                this.applyFog(this.world[key], config[key].density * this.elevationFactor * 0.8);
            //    renderer.setClearColor(fogColor)
            }


        }
    };

    applySkyConfig = function() {

        let config = this.currentSkyConfig;
/*
        let uniforms = this.sky.uniforms;
        uniforms.turbidity.value = config.turbidity;
        uniforms.rayleigh.value = config.rayleigh;
        uniforms.luminance.value = config.luminance;
        uniforms.mieCoefficient.value = config.mieCoefficient;
        uniforms.mieDirectionalG.value = config.mieDirectionalG;
*/
        this.sunSphere.visible = true;
    }

    updateDynamigFog = function(sunInTheBack) {
/*

        this.dynamicFogColor.copy(this.fogColor);

        let sunRedness = this.world.sun.color.r * 0.5;
        let sunFactor = (sunRedness - sunInTheBack * (sunRedness-1)) * 0.15;
        this.dynamicFogColor.lerp(this.world.sun.color,   sunFactor);
        this.dynamicFogColor.lerp(this.ambientColor,      sunFactor);
        this.world.fog.color.copy(this.dynamicFogColor)

 */
    };

    updateDynamigAmbient = function(sunInTheBack) {
        this.dynamicAmbientColor.copy(this.ambientColor);
        this.world.ambient.color.copy(this.dynamicAmbientColor)
    };

    interpolateEnv = function(current, target, fraction) {

        let unifs = this.world.uniforms;

        for (let key in current) {

            if (fraction >= 1) {
                if (current[key].color) {
                    current[key].color[0] = target[key].color[0];
                    current[key].color[1] = target[key].color[1];
                    current[key].color[2] = target[key].color[2];
                    unifs[key].x = current[key].color[0];
                    unifs[key].y = current[key].color[1];
                    unifs[key].z = current[key].color[2];
                }

                if (current[key].density) {
                    current[key].density = target[key].density;
                }
            } else  {

                    if (current[key].color) {
                        current[key].color[0] = MATH.interpolateFromTo(current[key].color[0], target[key].color[0],  fraction);
                        current[key].color[1] = MATH.interpolateFromTo(current[key].color[1], target[key].color[1],  fraction);
                        current[key].color[2] = MATH.interpolateFromTo(current[key].color[2], target[key].color[2],  fraction);

                        unifs[key].x = current[key].color[0];
                        unifs[key].y = current[key].color[1];
                        unifs[key].z = current[key].color[2];

                    }

                if (current[key].density) {
                    current[key].density = MATH.interpolateFromTo(current[key].density, target[key].density,  fraction) ;
                }
            }
        }

        return current;

    };


    interpolateSky = function(current, target, fraction) {

        for (let key in current) {
            if (fraction >= 1) {
                current[key] = target[key]
            } else {
                current[key] = MATH.interpolateFromTo(current[key], target[key],  fraction);
            }

        }


        return current;
    };

    updateUnderwater = function() {

        let uniforms = this.sky.uniforms;
        uniforms.turbidity.value = 13;
        uniforms.rayleigh.value = 2.3;
        uniforms.luminance.value = 1.1;
        uniforms.mieCoefficient.value = 0.1;
        uniforms.mieDirectionalG.value = 0.822;

        sunSphere.position.x = 10000 * Math.cos( phi );
        sunSphere.position.y = 10000 * Math.sin( phi ) * Math.sin( theta );
        sunSphere.position.z = 10000 * Math.sin( phi ) * Math.cos( theta );

        sunSphere.quaternion.set(0, 1, 0, 0);

        world.fog.color.set(0.1, 0.2, 0.4);

        //    applyColor(world.fog, uwFogColor);
        applyColor(world.sun, uwSunColor);
        applyColor(world.ambient, uwAmbColor);
        world.fog.density = 0.009;

    };

    calcTransitionProgress = function(tpf) {
        statusMap.transitionProgress += tpf;
        if (statusMap.transitionProgress > 1) {
        //    statusMap.transitionProgress = 0.99;
            if (MATH.stupidChecksumArray(lastStatus['fogColor']) === statusMap['fogColor']) {
                if (MATH.stupidChecksumArray(lastStatus['ambColor']) === statusMap['ambColor']) {
                    if (MATH.stupidChecksumArray(lastStatus['sunColor']) === statusMap['sunColor']) {
                        return 1;
                     } else {
                     //   statusMap.transitionProgress = 0.99;
                        statusMap.write = true;
                    }
                } else {
                 //   statusMap.transitionProgress = 0.99;
                    statusMap.write = true;
                }
            } else {
            //    statusMap.transitionProgress = 0.99;
                statusMap.write = true;
            }
        }

        return MATH.calcFraction(0, this.transitionTime, statusMap.transitionProgress);
    };

    setEnvConfigId(envConfId) {

        statusMap.transitionProgress = 0;
        this.currentEnvId = envConfId;
        statusMap.write = false;

    }

    tick(tpf) {

        let camPos = ThreeAPI.getCamera().position

        this.calcVec.set(0, 0, 0);
        MATH.randomVector(this.calcVec)
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:this.calcVec, to:this.world.sun.position, color:'YELLOW'})
        let listIndex = getSetting(ENUMS.Settings.ENVIRONMENT_INDEX);

        let force = false;

        if (statusMap.envIndex !== listIndex) {
            console.log("statusMap.envIndex", listIndex)
            statusMap.envIndex = listIndex;
            this.setEnvConfigId(statusMap.configIds[listIndex]);
        }

        //    console.log("Tick Env", tpf)
        let fraction = this.calcTransitionProgress(tpf);

        this.currentElevation = camPos.y;

        if (this.currentElevation > 0) {
            let params = ThreeAPI.getTerrainSystem().getTerrain().call.getTerrainParameters();
            let fogScale = 1  + 0.1*MATH.curveSqrt(params.unitScale);
            this.elevationFactor = MATH.curveCube( MATH.airDensityAtAlt(this.currentElevation*fogScale) );
        } else {
            this.elevationFactor = 20;
        }


        let useSky = this.currentSkyConfig;

        if (fraction < 1) {
            useSky = this.interpolateSky(this.currentSkyConfig, this.skyList[this.currentEnvId], fraction);
        //    if (force === false) {
                this.interpolateEnv(this.currentEnvConfig, this.envList[this.currentEnvId], fraction);
        //    }

        }
        this.theta = Math.PI * ( useSky.inclination - 0.5 );
        this.phi = 2 * Math.PI * ( useSky.azimuth - 0.5 );

        this.worldCenter.copy(this.camera.position);
    //    this.sky.mesh.position.copy(this.worldCenter);
        this.worldCenter.y = 0;

        this.sunSphere.quaternion.set(0, 0, 0, 1);
        this.sunSphere.rotateY(useSky.azimuth)
        this.sunSphere.rotateX(useSky.inclination)
        this.sunSphere.position.x = 0
        this.sunSphere.position.y = 0
        this.sunSphere.position.z = 0.01 * useSky.distance;
        this.sunSphere.position.applyQuaternion(this.sunSphere.quaternion)
        this.calcVec.set(0, 0, 0);

        //   calcVec.sub(camera.position);
        this.sunSphere.lookAt(this.calcVec);


        this.world.sun.position.copy(this.sunSphere.position);

    //    this.sky.uniforms.sunPosition.value.copy( this.sunSphere.position );

        this.sunSphere.position.add(this.worldCenter);

        //   world.sun.position.add(worldCenter);
        this.world.sun.quaternion.copy(this.sunSphere.quaternion);
/*
        this.calcVec.x = 0;
        this.calcVec.y = 0;
        this.calcVec.z = 1;

        this.calcVec2.x = 0;
        this.calcVec2.y = 0;
        this.calcVec2.z = 1;

        this.calcVec.applyQuaternion(this.sunSphere.quaternion);
        this.calcVec2.applyQuaternion(this.camera.quaternion);

           calcVec.normalize();
           calcVec2.normalize();

        let sunInTheBack = this.calcVec.dot(this.calcVec2);

        this.updateDynamigFog(sunInTheBack);
        this.updateDynamigAmbient(sunInTheBack);
*/
        this.applyEnvironment();

    };

    readDynamicValue = function(worldProperty, key) {
        return this.world[worldProperty][key];
    };

    enableEnvironment = function(threeEnv) {
        if (threeEnv.enabled) return;
        threeEnv.enabled = true;
    };


    initEnvironment(store, ready) {
        store.env = this.world;
    //    console.log("Init Env")

        let _this = this;

        let setEnvConfigId = function(envConfId, time) {
            this.transitionTime = time || 8;
            statusMap.transitionProgress = 0;
            this.currentEnvId = envConfId;
            statusMap.write = false;
        }.bind(this);

        let advanceEnv = function(envArgs) {
            setEnvConfigId(envArgs.envId, envArgs.time);
        //    console.log("Advance ENV ", envArgs, _this.currentEnvId, _this.envList);
        };

        let scene = store.scene;
        this.scene = scene;
        this.renderer = store.renderer;
        this.camera = store.camera;

        evt.on(ENUMS.Event.ADVANCE_ENVIRONMENT, advanceEnv);

        this.sunSphere = new Mesh(
            new SphereGeometry( 20, 16, 8 ),
            new MeshBasicMaterial( { color: 0xffffff } )
        );

        this.sunSphere.position.y = 0;

        let createEnvWorld = function(worldSetup) {

            for (let key in _this.world) {
                scene.remove(_this.world[key]);
            }

            for (let key in worldSetup) {

                if (key === "ambient") {

                    _this.world[key] = new AmbientLight(0x000000);
                    scene.add(_this.world[key]);

                } else if (key === "fog") {
                    //    scene.fog = {density:0, near:1, far: 100000}; // new THREE.Fog( 100, 10000000);
                //    scene.fog = new THREE.Fog( 100, 10000000);
                //        world[key] = scene.fog;
                    let fog = new FogExp2(0x000000, 0.1);
                    scene.fog = fog;
                    _this.world[key] = {density:0, near:1, far: 100000, fog:fog}
                    //    ThreeAPI.getReflectionScene().add(world[key]);
                } else {
                    _this.world[key] = new DirectionalLight(0x000000);
                    scene.add(_this.world[key]);
                    //    ThreeAPI.getReflectionScene().add(world[key]);
                }
            }

        };


        let environmentListLoaded = function(data) {

            statusMap.configIds = [];

            for (let i = 0; i < data.length; i++){

                statusMap.configIds.push(data[i].id)
                _this.envList[data[i].id] = {};
                _this.skyList[data[i].id] = {};
                let configs = data[i].configs;

                _this.skyList[data[i].id] = data[i].sky;

                for (let j = 0; j < configs.length; j++) {

                    _this.envList[data[i].id][configs[j].id] = configs[j];
                }
            }

            _this.currentSkyConfig = _this.skyList['current'];
            _this.currentEnvConfig = _this.envList['current'];

        //    console.log("Env Loaded", _this.currentSkyConfig, _this.currentEnvConfig)

            _this.applySkyConfig();
            _this.applyEnvironment();
            ready()
        };

        createEnvWorld(this.worldSetup);


    //    console.log("Load env json")

        jsonAsset('environments', environmentListLoaded)

    };

    getStatusMap() {
        return statusMap;
    }

}


export { ThreeEnvironment }