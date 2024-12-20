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
import {ThreeWater} from "./terrain/ThreeWater.js";
import {JsonAsset} from "../../application/load/JsonAsset.js";

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
        this.transitionTime = 0.5;
        this.currentEnvConfig;
        this.currentSkyConfig;
        this.worldCenter = new Vector3(0, 0, 0);
        this.calcVec = new Vector3();
        this.calcVec2 = new Vector3();
        this.theta;
        this.phi;

        this.sky = null;

        this.ctx = null;
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


    blendCanvasCtxToTexture(ctx, texture) {

        // let addImage = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        let originalBitmap = texture.originalBitmap;

        texture.ctx.globalCompositeOperation = 'copy';
        texture.ctx.drawImage(ctx.canvas, 0, 0, originalBitmap.width , originalBitmap.height)
        texture.ctx.globalCompositeOperation = 'darken';
        texture.ctx.drawImage(originalBitmap, 0, 0, originalBitmap.width, originalBitmap.height)

        texture.needsUpdate = true;
    }

    setCanvasColor() {
        let _this = this;
        let config = this.currentEnvConfig;

        let fogColor = statusMap['fogColor'];
        let ambColor = statusMap['ambColor'];
        let sunColor = statusMap['sunColor'];

        let evFact = Math.min(this.camera.position.y*0.00005, 0.099);

        let envTx = this.sky.envtx;
        let bkTx = this.sky.tx;
        let ctx = bkTx.ctx;
/*
        if (MATH.isOddNumber(getFrame().frame)) {
            envTx = this.sky.envtx2;
            bkTx = this.sky.tx2;
        }
*/
        let grd = ctx.createLinearGradient(0,0,0, _this.ctxHeight);
        grd.addColorStop(0.99  , ThreeAPI.toGradRgb( ambColor[0]*0.7, ambColor[1]*0.7,  ambColor[2]*0.7));
        grd.addColorStop(0.8, ThreeAPI.toGradRgb( ambColor[0]*0.5+fogColor[0]*0.5, ambColor[1]*0.5+fogColor[1]*0.5,  ambColor[2]*0.5+fogColor[2]*0.5));
        grd.addColorStop(0.5, ThreeAPI.toGradRgb( ambColor[0]*0.6+fogColor[0]*0.98+sunColor[0]*0.3, ambColor[1]*0.6+fogColor[1]*0.98+sunColor[1]*0.3,  ambColor[2]*0.6+fogColor[2]*0.98+sunColor[2]*0.3));
        grd.addColorStop(0.35, ThreeAPI.toGradRgb( ambColor[0]*0.1+fogColor[0]*0.7+sunColor[0]*0.4, ambColor[1]*0.1+fogColor[1]*0.7+sunColor[1]*0.4,  ambColor[2]*0.1+fogColor[2]*0.7+sunColor[2]*0.4));
        grd.addColorStop(0.16, ThreeAPI.toGradRgb( fogColor[0]*0.8+sunColor[0]*0.4, fogColor[1]*0.8+sunColor[1]*0.4,  fogColor[2]*0.8+sunColor[2]*0.4));
        grd.addColorStop(0.01, ThreeAPI.toGradRgb( fogColor[0]*0.9+sunColor[0]*0.6, fogColor[1]*0.9+sunColor[1]*0.6,  fogColor[2]*0.9+sunColor[2]*0.6));

        ctx.fillStyle=grd;
        ctx.fillRect(0, 0, _this.ctxWidth, _this.ctxHeight);

        this.blendCanvasCtxToTexture(ctx, this.sky.envtx2)
    //    this.blendCanvasCtxToTexture(ctx, this.sky.envtx2)

        grd = ctx.createLinearGradient(0,0,0, _this.ctxHeight);

      //  grd.addColorStop(0,    ThreeAPI.toGradRgb( ambColor[0]*0.4, ambColor[1]*0.45,  ambColor[2]*0.5));
        grd.addColorStop(0.01,  ThreeAPI.toGradRgb((fogColor[0]*0.1 + ambColor[0]*0.6 +sunColor[0]*0.1) *0.4 ,(fogColor[1]*0.1 + ambColor[1]*0.5 +sunColor[1]*0.1) * 0.6  , (fogColor[2]*0.1 + ambColor[2]*0.8 +sunColor[2]*0.3)*0.7));
     //   grd.addColorStop(0.3,  ThreeAPI.toGradRgb((fogColor[0]*0.04 + ambColor[0]*0.6 +sunColor[0]*0.01) *0.7  ,(fogColor[1]*0.2 + ambColor[1]*0.4 +sunColor[1]*0.15) * 0.85  , (fogColor[2]*0.05 + ambColor[2]*0.3 +sunColor[2]*0.5)*0.96));
       // grd.addColorStop(0.45, ThreeAPI.toGradRgb((fogColor[0]*0.4  + ambColor[0]*0.5 +sunColor[0]*0.1) *0.8  ,(fogColor[1]*0.4 + ambColor[1]*0.4 +sunColor[1]*0.3) * 0.8  , (fogColor[2]*0.3 + ambColor[2]*0.4 +sunColor[2]*0.6)*0.8 ));
        grd.addColorStop(0.3,   ThreeAPI.toGradRgb((fogColor[0]*0.3  + ambColor[0]*0.5 +sunColor[0]*0.5) *0.3  ,(fogColor[1]*0.4 + ambColor[1]*0.4 +sunColor[1]*0.5) * 0.4  , (fogColor[2]*0.5 + ambColor[2]*0.6 +sunColor[2]*0.7)*0.6 ));

        grd.addColorStop(0.498, ThreeAPI.toGradRgb((fogColor[0]*0.4  + ambColor[0]*0.6 +sunColor[0]*0.5) *0.5  ,(fogColor[1]*0.5 + ambColor[1]*0.5 +sunColor[1]*0.5) * 0.6  , (fogColor[2]*0.5 + ambColor[2]*0.6 +sunColor[2]*0.7)*0.7 ));
        if (evFact > 999999 || isNaN(evFact) || !isFinite(evFact)) {
            console.log("Camera went flying off... investigate")
            return;
        }

        // horizon and down;
        let rgb = ThreeAPI.toGradRgb(fogColor[0], fogColor[1], fogColor[2])
    //    GuiAPI.printDebugText("rgb: "+rgb)
        grd.addColorStop(0.4999, rgb);
        grd.addColorStop(1, rgb);
    //    grd.addColorStop(-1, rgb);
        //       grd.addColorStop(1, ThreeAPI.toRgb(0, 0, 0));
    //    ctx.globalCompositeOperation = "source-over"
        ctx.fillStyle=grd;
        ctx.fillRect(0, 0, _this.ctxWidth, _this.ctxHeight);

    //    evt.dispatch(ENUMS.Event.SKY_GRADIENT_UPDATE, ctx);

        this.sky.envtx.needsUpdate = true;
        this.sky.envtx2.needsUpdate = true;
        this.sky.tx.needsUpdate = true;
        this.sky.tx2.needsUpdate = true;

        envTx.needsUpdate = true;
        bkTx.needsUpdate = true;

    //    if (Math.random() < 0.5) {

            this.scene.environment = ThreeAPI.newCanvasTexture(this.sky.envtx.canvas) // this.sky.tx;
            this.scene.environment.mapping = EquirectangularReflectionMapping;
            this.scene.environment.needsUpdate = true;
            this.scene.background = ThreeAPI.newCanvasTexture(this.sky.tx.canvas) // this.sky.tx;
            this.scene.background.mapping = EquirectangularReflectionMapping;
            this.scene.background.needsUpdate = true;
    /*
        } else {
            this.scene.environment = this.sky.envtx2;
            this.scene.background = this.sky.tx2;
        }

     */
    //    this.scene.needsUpdate = true;

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

    setEnvConfigId(envConfId, time) {
        console.log("Set Env ", envConfId)
        this.transitionTime = time || 0;
        statusMap.transitionProgress = 0;
        this.currentEnvId = envConfId;
        statusMap.write = false;
        this.currentEnvConfig = this.envList[envConfId]
        this.applyEnvironment();
    //    this.setCanvasColor();
        statusMap.write = false;
        this.interpolateEnv(this.currentEnvConfig, this.envList[this.currentEnvId], 0.99);

    }

    tick(tpf) {

        let camPos = ThreeAPI.getCamera().position

        this.calcVec.set(0, 0, 0);
        MATH.randomVector(this.calcVec)
    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:this.calcVec, to:this.world.sun.position, color:'YELLOW'})

        if (!this.sky) return;
        //    console.log("Tick Env", tpf)
        let fraction = this.calcTransitionProgress(tpf * 1.0);

        let listIndex = getSetting(ENUMS.Settings.ENVIRONMENT_INDEX);

        let force = false;

        if (statusMap.envIndex !== listIndex) {
            statusMap.envIndex = listIndex;
            this.setEnvConfigId(statusMap.configIds[listIndex], 0.01);
            fraction = 0.5;
            force = true;
        }

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
            if (force === false) {
                this.interpolateEnv(this.currentEnvConfig, this.envList[this.currentEnvId], fraction);
            }

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

    //    let sunInTheBack = this.calcVec.dot(this.calcVec2);

    //    this.updateDynamigFog(sunInTheBack);
    //    this.updateDynamigAmbient(sunInTheBack);

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

        console.log("Init Env")

        let _this = this;

        let setEnvConfigId = function(envConfId, time) {
            this.transitionTime = time || 1;
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



        let canvas = document.createElement("canvas");
    //    let cnv2 = document.createElement("canvas");



        let setupCanvas = function(canvas) {
            canvas.id = 'sky_canvas';
            canvas.width  = _this.ctxWidth;
            canvas.height = _this.ctxHeight;
            canvas.dataReady = true;
            return canvas.getContext('2d');
        };

        let bktx = ThreeAPI.newCanvasTexture(canvas);
        bktx.canvas = canvas;
        let bkTx2 = ThreeAPI.newCanvasTexture(canvas);
        bktx.mapping = EquirectangularReflectionMapping;
        bkTx2.mapping = EquirectangularReflectionMapping;

        let uniforms = {
            luminance: { value: 1 },
            turbidity: { value: 2 },
            rayleigh: { value: 1 },
            mieCoefficient: { value: 0.005 },
            mieDirectionalG: { value: 0.8 },
            sunPosition: { value: new Vector3() }
        };

    //    bkTx2.ctx = setupCanvas(cnv2);
        bktx.ctx = setupCanvas(canvas);
        bktx.canvas = canvas;
        bkTx2.ctx = bktx.ctx
        let sky = {
        //    mesh:skyMesh,
            ctx:bktx.ctx,
            tx:bktx,
            tx2:bkTx2
        //    uniforms:uniforms
        }

        _this.sky = sky;
        _this.ctx = sky.ctx;
        _this.ctx.globalCompositeOperation = "source-over"


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
            return;
            ready();


            let loader = new ImageBitmapLoader().setPath('../../data/assets/images/textures/')
            loader.load('ref_sphere.png', function(txenv) {

            //    console.log("Ref Sphere loaded: ", txenv);
            //    txenv.mapping = EquirectangularReflectionMapping;

                let txSrc = txenv;

                let width = txenv.width;
                let height = txenv.height;




                let canvas2 = document.createElement("canvas");
                let envtx = ThreeAPI.newCanvasTexture(canvas2);
                envtx.canvas = canvas2;
                let envtx2 = ThreeAPI.newCanvasTexture(canvas2);
                envtx.originalBitmap = txSrc;
                envtx.mapping = EquirectangularReflectionMapping;
                envtx2.originalBitmap = txSrc;
                envtx2.mapping = EquirectangularReflectionMapping;
            //    scene.environment = bktx;

                canvas2.id = 'env_canvas';
                canvas2.width  = width;
                canvas2.height = height;
                canvas2.dataReady = true;
                let envctx = canvas2.getContext('2d');
                sky.envtx = envtx;
                sky.envctx = envctx;
                sky.envtx2 = envtx2;
                envtx.ctx = envctx;
                envtx2.ctx = envctx;
                scene.environment = sky.envtx;


            })

        };


        let environmentListLoaded = function(data) {

            statusMap.configIds = [];

            for (let i = 0; i < data.length; i++){

                console.log("Env data", data[i])
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

            console.log("Env Loaded", _this.currentSkyConfig, _this.currentEnvConfig)

            _this.applySkyConfig();
            _this.applyEnvironment();
            ready()
        };

        createEnvWorld(this.worldSetup);


        console.log("Load env json")

        new JsonAsset('environments').subscribe(environmentListLoaded)

    };

    getStatusMap() {
        return statusMap;
    }

}


export { ThreeEnvironment }