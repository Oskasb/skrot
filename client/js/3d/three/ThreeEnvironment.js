import { PipelineObject } from "../../application/load/PipelineObject.js";
import {
    AmbientLight,
    BackSide,
    Color, DirectionalLight, FogExp2,
    Mesh,
    MeshBasicMaterial,
    NoBlending,
    SphereGeometry,
    Vector3
} from "../../../../libs/three/Three.Core.js";
import {evt} from "../../application/event/evt.js";
import {ENUMS} from "../../application/ENUMS.js";
import {MATH} from "../../application/MATH.js";

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
        this.world = {fog:statusMap['fog']};
        this.currentEnvId = null;
        this.maxElevation = 10000;
        this.currentElevation = 0;
        this.elevationFactor = 0;
        this.transitionTime = 23;
        this.currentEnvConfig;
        this.currentSkyConfig;
        this.worldCenter = new Vector3(0, 0, 0);
        this.calcVec = new Vector3();
        this.calcVec2 = new Vector3();
        this.theta;
        this.phi;

        this.sky = null;

        this.ctx = null;
        this.ctxHeight = 64;
        this.ctxWidth= 1;

        this.scene;
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

        let worldListLoaded = function(src, data) {

        //    console.log("Load Env World Data:", src, data);

            for (let i = 0; i < data.params.length; i++){
                _this.worldSetup[data.params[i].id] = data.params[i]
            }
            _this.currentEnvId = data.defaultEnvId;
            _this.currentEnvIndex = undefined;

            onLoaded();
        };

    //    waterFx = new WaterFX();

        new PipelineObject("ASSETS", "WORLD", worldListLoaded);


    };


    setCanvasColor = function(ctx, tx) {
        let _this = this;
        let config = this.currentEnvConfig;
/*
        let fogColor = config.fog.color;
        let ambColor = config.ambient.color;
        let sunColor = config.sun.color;
        statusMap['fogColor'] = fogColor;
        statusMap['ambColor'] = ambColor;
        statusMap['sunColor'] = sunColor;
  *

 */
        let fogColor = statusMap['fogColor'];
        let  ambColor = statusMap['ambColor'];
        let   sunColor = statusMap['sunColor'];
     //   statusMap['fogColor'] = fogColor;
     //   statusMap['ambColor'] = ambColor;
     //   statusMap['sunColor'] = sunColor;

    //    console.log("setCanvasColor", statusMap)
        let evFact = Math.min(this.camera.position.y*0.00005, 0.099);

        let grd = ctx.createLinearGradient(0,0,0, _this.ctxHeight);

     //   GuiAPI.printDebugText("Fog: "+fogColor[0]+" "+fogColor[1]+" "+fogColor[2])
    //    grd.addColorStop(0, ThreeAPI.toRgb(fogColor[0], fogColor[1], fogColor[2]));
    //    grd.addColorStop(0, ThreeAPI.toGradRgb(0,0, 0));
    //    grd.addColorStop(0.45, ThreeAPI.toGradRgb(0,0, 0));
        grd.addColorStop(0, ThreeAPI.toGradRgb( ambColor[0]*0.2, ambColor[1]*0.3,  ambColor[2]*0.5));


        grd.addColorStop(0.24, ThreeAPI.toGradRgb((fogColor[0]*0.01 + ambColor[0]*0.6 +sunColor[0]*0.01) *0.3 ,(fogColor[1]*0.1 + ambColor[1]*0.5 +sunColor[1]*0.01) * 0.7  , (fogColor[2]*0.01 + ambColor[2]*0.8 +sunColor[2]*0.3)*0.99));
        grd.addColorStop(0.40, ThreeAPI.toGradRgb((fogColor[0]*0.01 + ambColor[0]*0.7 +sunColor[0]*0.01) *0.6  ,(fogColor[1]*0.2 + ambColor[1]*0.4 +sunColor[1]*0.1) * 0.8  , (fogColor[2]*0.01 + ambColor[2]*0.4 +sunColor[2]*0.6)*0.96));
        grd.addColorStop(0.44, ThreeAPI.toGradRgb((fogColor[0]*0.1 + ambColor[0]*0.7 +sunColor[0]*0.01) *0.8 ,(fogColor[1]*0.3 + ambColor[1]*0.3 +sunColor[1]*0.2) * 0.9  , (fogColor[2]*0.1 + ambColor[2]*0.5 +sunColor[2]*0.7)*0.9 ));
        grd.addColorStop(0.49, ThreeAPI.toGradRgb((fogColor[0]*0.4   + ambColor[0]*0.9 +sunColor[0]*0.3) *1.0  ,(fogColor[1]*0.5 + ambColor[1]*0.2 +sunColor[1]*0.4) * 1.0  , (fogColor[2]*0.2 + ambColor[2]*0.6 +sunColor[2]*0.9)*1.0 ));
        if (evFact > 999999 || isNaN(evFact) || !isFinite(evFact)) {
            console.log("Camera went flying off... investigate")
            return;
        }

        // horizon and down;
        let rgb = ThreeAPI.toGradRgb(fogColor[0], fogColor[1], fogColor[2])
    //    GuiAPI.printDebugText("rgb: "+rgb)
        grd.addColorStop(0.5, rgb);
        grd.addColorStop(1, rgb);
    //    grd.addColorStop(-1, rgb);
        //       grd.addColorStop(1, ThreeAPI.toRgb(0, 0, 0));
    //    ctx.globalCompositeOperation = "source-over"
        ctx.fillStyle=grd;
        ctx.fillRect(0, 0, _this.ctxWidth, _this.ctxHeight);
        evt.dispatch(ENUMS.Event.SKY_GRADIENT_UPDATE, ctx);
        tx.needsUpdate = true;
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

    };

    applyFog = function(Obj3d, density) {
        Obj3d.density = density * 0.3;
        Obj3d.near = 1;
        Obj3d.far = 1/density;
    };

    applyFromBuffer = function(buffer) {

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
                    /*
                    this.fogColor.setRGB(config[key].color[0],config[key].color[1],config[key].color[2]);
                    this.world[key].fog.color.r = this.fogColor.r*0.5;
                    this.world[key].fog.color.g = this.fogColor.g*0.5;
                    this.world[key].fog.color.b = this.fogColor.b*0.5;

                     */
                    this.world[key].fog.density = this.world[key].density*1.5;
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
        if (statusMap.write === true) {
            return;
        }
        for (let key in current) {

            if (fraction >= 1) {
                if (current[key].color) {
                    current[key].color[0] = target[key].color[0];
                    current[key].color[1] = target[key].color[1];
                    current[key].color[2] = target[key].color[2];
                }

                if (current[key].density) {
                    current[key].density = target[key].density;
                }
            } else  {

                    if (current[key].color) {
                        current[key].color[0] = MATH.interpolateFromTo(current[key].color[0], target[key].color[0],  fraction);
                        current[key].color[1] = MATH.interpolateFromTo(current[key].color[1], target[key].color[1],  fraction);
                        current[key].color[2] = MATH.interpolateFromTo(current[key].color[2], target[key].color[2],  fraction);
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

        theta = Math.PI * ( 0.94 - 0.5 );
        phi = 2 * Math.PI * ( 0.35 - 0.5 );

        sunSphere.position.x = 10000 * Math.cos( phi );
        sunSphere.position.y = 10000 * Math.sin( phi ) * Math.sin( theta );
        sunSphere.position.z = 10000 * Math.sin( phi ) * Math.cos( theta );

        sunSphere.quaternion.set(0, 1, 0, 0);

        sky.uniforms.sunPosition.value.copy( sunSphere.position );


        world.fog.color.set(0.1, 0.2, 0.4);

        //    applyColor(world.fog, uwFogColor);
        applyColor(world.sun, uwSunColor);
        applyColor(world.ambient, uwAmbColor);
        world.fog.density = 0.009;

        //    updateDynamigAmbient(uWambientColor);

        if (sky.ctx) {

            let grd = ctx.createLinearGradient(0,0,0, ctxHeight);

            grd.addColorStop(1, ThreeAPI.toRgb(0.0, 0.0, 0));
            //	grd.addColorStop(0.8+evFact,toRgb([color[0]*(0.5)*(1-evFact)+fog[0]*(0.5)*evFact*evFact, color[1]*0.5*(1-evFact)+fog[1]*(0.5)*evFact*evFact, color[2]*0.5*(1-evFact)+fog[2]*0.5*evFact*evFact]));
            grd.addColorStop(0.61, ThreeAPI.toRgb(0.01, 0.16, 0.22));

            //    grd.addColorStop(0.45,toRgb(ambient));

            grd.addColorStop(0.5, ThreeAPI.toRgb(0.01, 0.25, 0.5));
            grd.addColorStop(0.495, ThreeAPI.toRgb(0.1, 0.3, 0.7));
            grd.addColorStop(0.05, ThreeAPI.toRgb(0.5, 0.7, 1.0));
            sky.ctx.fillStyle=grd;
            sky.ctx.fillRect(0, 0, _this.ctxWidth, _this.ctxHeight);
            sky.tx.needsUpdate = true;
        }


    };

    calcTransitionProgress = function(tpf) {
        statusMap.transitionProgress += tpf;
        if (statusMap.transitionProgress > 1) {
        //    statusMap.transitionProgress = 0.99;
            if (MATH.stupidChecksumArray(lastStatus['fogColor']) === statusMap['fogColor']) {
                if (MATH.stupidChecksumArray(lastStatus['ambColor']) === statusMap['ambColor']) {
                    if (MATH.stupidChecksumArray(lastStatus['sunColor']) === statusMap['sunColor']) {

                     } else {
                        statusMap.transitionProgress = 0.99;
                        statusMap.write = true;
                    }
                } else {
                    statusMap.transitionProgress = 0.99;
                    statusMap.write = true;
                }
            } else {
                statusMap.transitionProgress = 0.99;
                statusMap.write = true;
            }
        }

        return MATH.calcFraction(0, this.transitionTime, statusMap.transitionProgress);
    };

    tick = function(tpf) {

        let camPos = ThreeAPI.getCamera().position

        if (!this.sky) return;
        //    console.log("Tick Env")

        // waterFx.tickWaterEffect(tpf);
    //    this.sky.mesh.position.copy(camPos);
        let fraction = this.calcTransitionProgress(tpf * 1.0);

        //    t+=evt.args(e).tpf
        //    fraction = fraction;
        this.currentElevation = camPos.y;

        if (this.currentElevation > 0) {
            let params = ThreeAPI.getTerrainSystem().getTerrain().call.getTerrainParameters();
            let fogScale = 1  + 0.1*MATH.curveSqrt(params.unitScale);

            this.elevationFactor = MATH.curveCube( MATH.airDensityAtAlt(this.currentElevation*fogScale) );
        } else {
        //    this.updateUnderwater();
        //    return;
            this.elevationFactor = 20;
        }

        //      elevationFactor =  MATH.airDensityAtAlt(currentElevation) ;

    //    this.comEnvIdx = 4 // WorkerAPI.getCom(ENUMS.BufferChannels.ENV_INDEX);
        /*
        if (this.currentEnvIndex !== comEnvIdx) {
            this.currentEnvIndex = comEnvIdx;
            this.setEnvConfigId(this.envs[comEnvIdx], 45);
            return;
        }
*/

        let useSky = this.currentSkyConfig;
        if (fraction > 1.01) {

        } else {
            useSky = this.interpolateSky(this.currentSkyConfig, this.skyList[this.currentEnvId], fraction);
            this.interpolateEnv(this.currentEnvConfig, this.envList[this.currentEnvId], fraction);
            this.applySkyConfig();
            if (this.sky.ctx) {
                this.setCanvasColor(this.sky.ctx, this.sky.tx);
            }
            //   }
        }
        this.theta = Math.PI * ( useSky.inclination - 0.5 );
        this.phi = 2 * Math.PI * ( useSky.azimuth - 0.5 );

        this.worldCenter.copy(this.camera.position);
    //    this.sky.mesh.position.copy(this.worldCenter);
        this.worldCenter.y = 0;

        this.sunSphere.position.x = 0.00001 * useSky.distance * Math.cos( this.phi );
        this.sunSphere.position.y = 0.00001 * useSky.distance * Math.sin( this.phi ) * Math.sin( this.theta );
        this.sunSphere.position.z = 0.00001 * useSky.distance * Math.sin( this.phi ) * Math.cos( this.theta );

        this.calcVec.set(0, 0, 0);

        //   calcVec.sub(camera.position);
        this.sunSphere.lookAt(this.calcVec);


        this.world.sun.position.copy(this.sunSphere.position);

    //    this.sky.uniforms.sunPosition.value.copy( this.sunSphere.position );

        this.sunSphere.position.add(this.worldCenter);

        //   world.sun.position.add(worldCenter);
        this.world.sun.quaternion.copy(this.sunSphere.quaternion);

        this.calcVec.x = 0;
        this.calcVec.y = 0;
        this.calcVec.z = 1;

        this.calcVec2.x = 0;
        this.calcVec2.y = 0;
        this.calcVec2.z = 1;

        this.calcVec.applyQuaternion(this.sunSphere.quaternion);
        this.calcVec2.applyQuaternion(this.camera.quaternion);

        //   calcVec.normalize();
        //   calcVec2.normalize();

        let sunInTheBack = this.calcVec.dot(this.calcVec2);

        this.updateDynamigFog(sunInTheBack);
        this.updateDynamigAmbient(sunInTheBack);


        this.applyEnvironment();
        //   if (fraction <= 1) {


        //   applyFromBuffer(envBuffer);
    };

    readDynamicValue = function(worldProperty, key) {
        return this.world[worldProperty][key];
    };

    getEnvironmentDynamicWorld = function() {
        return this.world;
    };

    enableEnvironment = function(threeEnv) {
        if (threeEnv.enabled) return;
        threeEnv.enabled = true;
    //    threeEnv.scene.add( threeEnv.sky.mesh );
    //    ThreeAPI.getReflectionScene().add(threeEnv.sky.meshClone);
    };

    getEnvConfigs = function() {
        return this.envList;
    };

    getCurrentEnvId = function() {
        return this.currentEnvId;
    };

    disableEnvironment = function() {
        if (!this.enabled) return;
        this.enabled = false;
    //    this.scene.remove( sky.mesh );
        // ThreeAPI.getReflectionScene().remove(sky.meshClone);
    //    ThreeAPI.getSetup().removePostrenderCallback(tickEnvironment);
    };



    initEnvironment = function(store, ready) {

        let _this = this;

        let setEnvConfigId = function(envConfId, time) {
            this.transitionTime = time || 225;
            statusMap.transitionProgress = 0;
            this.currentEnvId = envConfId;
        }.bind(this);

        let advanceEnv = function(envArgs) {
            statusMap.write = false;
                setEnvConfigId(envArgs.envId, envArgs.time);
        //    console.log("Advance ENV ", envArgs, _this.currentEnvId, _this.envList);
        };

        let scene = store.scene;
        this.scene = scene;
        this.renderer = store.renderer;
        this.camera = store.camera;

        evt.on(ENUMS.Event.ADVANCE_ENVIRONMENT, advanceEnv);

        let canvas = document.createElement("canvas");

        let setupCanvas = function(canvas) {
            canvas.id = 'sky_canvas';
            canvas.width  = _this.ctxWidth;
            canvas.height = _this.ctxHeight;
            canvas.dataReady = true;
            return canvas.getContext('2d');
        };

        let tx = ThreeAPI.newCanvasTexture(canvas);
        let mat = ThreeAPI.buildCanvasMaterial(tx);
        mat.fog = false;
        mat.side = BackSide;
        mat.blending = NoBlending;

        //    mat.depthWrite = false;

    //    let skyGeo = new SphereGeometry(900, 36, 9 );
    //    let skyMesh = new Mesh( skyGeo, mat);

        let uniforms = {
            luminance: { value: 1 },
            turbidity: { value: 2 },
            rayleigh: { value: 1 },
            mieCoefficient: { value: 0.005 },
            mieDirectionalG: { value: 0.8 },
            sunPosition: { value: new Vector3() }
        };

        let sky = {
        //    mesh:skyMesh,
            ctx:setupCanvas(canvas),
            tx:tx
        //    uniforms:uniforms
        }

        _this.sky = sky;
        _this.ctx = sky.ctx;
        _this.ctx.globalCompositeOperation = "source-over"
    //    this.setCanvasColor(sky.ctx, sky.tx);

    //    this.sky.meshClone = this.sky.mesh.clone();
        // Add Sun Helper

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
            ready()
        };


        let environmentListLoaded = function(scr, data) {


            for (let i = 0; i < data.length; i++){

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

        };

        createEnvWorld(this.worldSetup);

        new PipelineObject("ASSETS", "ENVIRONMENT", environmentListLoaded);

    };

    getStatusMap() {
        return statusMap;
    }

}


export { ThreeEnvironment }