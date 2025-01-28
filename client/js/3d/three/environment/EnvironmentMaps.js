import {
    CubeTextureLoader, EquirectangularReflectionMapping,
    ImageBitmapLoader,
    LinearMipmapLinearFilter,
    Matrix4, Scene, Texture, TextureLoader, Vector3
} from "../../../../../libs/three/Three.Core.js";
import {RGBMLoader} from "../../../../../libs/jsm/loaders/RGBMLoader.js";
import {
    Fn,
    float,
    vec3,
    acos,
    add,
    mul,
    clamp,
    cos,
    dot,
    exp,
    max,
    modelViewProjection,
    normalize,
    pow,
    smoothstep,
    sub,
    varying,
    varyingProperty,
    vec4,
    cameraPosition,
    hue,
    mix,
    normalWorld,
    pmremTexture,
    positionLocal,
    positionWorld,
    positionWorldDirection,
    reference,
    reflectVector,
    saturation,
    uniform,
    asin, sin, min, vec2, texture
} from "../../../../../libs/three/Three.TSL.js";
import {AssetTexture} from "../assets/AssetTexture.js";
import {loadImageAsset} from "../../../application/utils/DataUtils.js";
import {SpatialTransition} from "../../../application/utils/SpatialTransition.js";
import {ScalarTransition} from "../../../application/utils/ScalarTransition.js";




class EnvironmentMaps {
    constructor(store) {
        console.log('EnvironmentMaps', store);
        let scene = store.scene;
        let envUnifs = store.env.uniforms;
        function init() {

            const cube1Texture = new Texture()
            cube1Texture.generateMipmaps = false;
            cube1Texture.mapping = EquirectangularReflectionMapping;

            const cube2Texture = new Texture()
            cube2Texture.generateMipmaps = false;
            cube2Texture.mapping = EquirectangularReflectionMapping;

            scene.userData.reflectionScene = new Scene();
            function tx1Loaded(image) {
                cube1Texture.source.data = image;
                cube1Texture.flipY = false;
                cube1Texture.needsUpdate = true;
                scene.environment = cube1Texture;
            }

            function tx2Loaded(image) {
                cube2Texture.source.data = image;
                cube2Texture.flipY = true;
                cube2Texture.needsUpdate = true;
                scene.background = cube2Texture;
            }

            loadImageAsset('ref_sphere_5', tx1Loaded)
            loadImageAsset('ref_sphere_3', tx2Loaded)

            // nodes and environment

            const adjustments = {
                mix: 0,
                procedural: 0.0,
                intensity: 1.0,
                hue: 0.0,
                saturation: 1.0
            };

            function transitEnded() {
                setTimeout(function() {
                    initTransition()
                }, 100)

            }

            function transit(value) {
                adjustments.mix = value;
            }

            function initTransition() {
                sTransit.initScalarTransition(adjustments.mix, 1-adjustments.mix, 2, transitEnded, 'curveSigmoid', transit);
            }

            let sTransit = new ScalarTransition();
            initTransition()

            const mixNode = reference( 'mix', 'float', adjustments );
            const proceduralNode = reference( 'procedural', 'float', adjustments );
            const intensityNode = reference( 'intensity', 'float', adjustments );
            const hueNode = reference( 'hue', 'float', adjustments );
            const saturationNode = reference( 'saturation', 'float', adjustments );

            const rotateY1Matrix = new Matrix4();
            const rotateY2Matrix = new Matrix4();

            const mieCoefficient = uniform( 0.005 );
            const mieDirectionalG = uniform( 0.8 );
            const sunPosition = uniform(store.env.sun.position);

            const upUniform = uniform( new Vector3( 0, 1, 0 ) );
            const downUniform = uniform( new Vector3( 0, -1, 0 ) );

            const sunColor = uniform( envUnifs.sun );
            const fogColor = uniform( envUnifs.fog );
            const ambColor = uniform( envUnifs.ambient );
            const spaceColor = uniform( new Vector3( 0.0, 0.0, 0.01 ) );


            const vSunDirection = varying( vec3(), 'vSunDirection' );
            const vSunE = varying( float(), 'vSunE' );
            const vSunfade = varying( float(), 'vSunfade' );
            const vBetaR = varying( vec3(), 'vBetaR' );
            const vBetaM = varying( vec3(), 'vBetaM' );


            const hzOffset = uniform(float(0.91));

            // constants for atmospheric scattering
            const pi = float( 3.141592653 );

            // optical length at zenith for molecules
            const rayleighZenithLength = float( 8.4E3 );
            const mieZenithLength = float( 1.25E3 );
            // 66 arc seconds -> degrees, and the cosine of that
            const sunAngularDiameterCos = float( 0.9999566769464);

            const one = float(1.0)

            // 3.0 / ( 16.0 * pi )
            const THREE_OVER_SIXTEENPI = float( 0.05968310365 );
            // 1.0 / ( 4.0 * pi )
            const ONE_OVER_FOURPI = float( 0.07957747154 );


            const skyColorFunction = function( dirNode, positionNode ) {

                const direction = normalize( dirNode.sub( positionNode ) );

                // optical length
                // cutoff angle at 90 to avoid singularity in next formula.
                const angleToUp = dot( upUniform, direction )

                const angleToDown = mul( angleToUp, -1)
                const zenithAngle = acos( max( 0.0, angleToUp ) );
                const horizonAngle = cos( max( -1.0, angleToUp ) );

                const daylightFactor = sunColor.r.pow(0.65)

                const belowHorizonFactor = max(0.0, min(1.0, mul(pow( 9999, mul(angleToDown, 10.11)), 0.9  )));
                const sunAngle = dot(normalize(sunPosition), direction)
                const sunFactor = mul(0.55, max(0.0, pow( sunAngle, 0.8 )));
                const skyShade = add( ambColor, fogColor);
                const skyColor = mix(ambColor.add(vec3(0.01, 0.4, 1.2)).mul(daylightFactor), skyShade, pow(sunFactor, 4));
                const skySpace = mix(skyColor, spaceColor, mul(pow(angleToUp, 0.25), 0.8)).mul(daylightFactor);
                const fogGradientColor = add(fogColor, sunColor.mul(daylightFactor))
                const fogGradientFactor =  pow( horizonAngle, 200 );
                const fogGradient =  mix(skySpace, fogGradientColor, mul(0.125, pow(fogGradientFactor, 0.5)))
                const fogHorizonFactor = pow( horizonAngle, 50 );
                const foggedColor = mix(fogGradient, fogColor, fogHorizonFactor)

                const skySunShaded = mix( foggedColor, sunColor, max(0.0, mul(0.05, pow( mul(sunAngle, 0.99), 118) )));
                const haloFactor = max(0.0,pow( mul(sunAngle, 0.99), 2));
                const skySunBrightened = mix( skySunShaded, add(sunColor, ambColor),  mul(0.06, pow(haloFactor, 1.2) ));

                const skySunHalo = mix( skySunBrightened, add(sunColor, fogColor),  mul(0.53, pow(haloFactor, 15) ));
                const sunDisc = mix( skySunHalo, add(sunColor.add(sunColor.normalize().mul(70)), fogColor), mul(1.0, max(0.0, min( 1.0, pow( mul(sunAngle, 1.0003), 21000.0) ))));

                const sealevelColor = mix(sunDisc, fogColor,  max(0.0, min(1, belowHorizonFactor)))
                const underwaterlevelColor = mix(sealevelColor, ambColor.mul(0.05),  max(0.0, min(1, angleToDown.sub(0.2).mul(2))))
                return vec4( underwaterlevelColor, 1.0 );

            };


            const getEnvironmentNode_ = function( reflectNode, positionNode ) {

                const custom1UV = reflectNode.xyz.mul( uniform( rotateY1Matrix ) );
                const flippedUV1 = vec3(custom1UV.x, mul(custom1UV.y, -1), custom1UV.z);
                const sky1tx = pmremTexture( cube1Texture, flippedUV1 )
                const skyShade = add( ambColor, fogColor);

                const sky1Ambient = mul( sky1tx, skyShade);
                const sky1AmbTinted = mix( sky1Ambient, ambColor, max(0.0, min(0.75, pow(2, mul(flippedUV1.y, 15)) )));
                const sky1FogTinted = mix( sky1AmbTinted, fogColor, mul(0.55, pow( cos(mul(flippedUV1.y, 2)), 30) ));
                const sky1ShadeTinted = mix( sky1FogTinted, spaceColor, max(0.0, min(0.7, pow( 15, sub(flippedUV1.y, 0.15)) )));
                return vec4( sky1ShadeTinted, 1.0 );

            };

            const getEnvironmentNode = function( refNode, posNode ) {
                const custom1UV = refNode.xyz //.mul( uniform( rotateY1Matrix ) );
                const flippedUV1 = vec3(custom1UV.x, mul(custom1UV.y, -1), custom1UV.z);
                const sky1tx = pmremTexture( cube1Texture, flippedUV1 )
                return sky1tx.mul(skyColorFunction(refNode, posNode).mul(1.2));
            };


            const getBackgroundNode = function( dirNode, positionNode ) {
                const skyColor = skyColorFunction(dirNode, positionNode);
                return skyColor
            };


            scene.environmentNode = getEnvironmentNode( reflectVector, vec3(0, 0, 0) );
        //    scene.environmentNode_ = getBackgroundNode( reflectVector, positionWorld );
        //    scene.backgroundNode = getBackgroundNode( positionWorldDirection, positionLocal );


            scene.backgroundNode = getBackgroundNode( positionWorldDirection, positionLocal );

            scene.getEnvNode = function() {
            //    return texture(scene.environmentNode);
            }

        //    scene.backgroundNode = getEnvironmentNode( positionWorldDirection, positionLocal );
        }

        function initSky() {

        }

        function activateEnvMaps() {
            init();
        };


        this.call = {
            activateEnvMaps:activateEnvMaps
        }
    }
}

export {
    EnvironmentMaps,

}