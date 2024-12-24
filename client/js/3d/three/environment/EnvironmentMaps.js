import {
    CubeTextureLoader, EquirectangularReflectionMapping,
    ImageBitmapLoader,
    LinearMipmapLinearFilter,
    Matrix4, Texture, TextureLoader, Vector3
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
    asin, sin, min, vec2
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

            function tx1Loaded(image) {
                console.log("tx loaded", image)
                cube1Texture.source.data = image;
                cube1Texture.flipY = false;
                cube1Texture.needsUpdate = true;
            }

            function tx2Loaded(image) {
                console.log("tx loaded", image)
                cube2Texture.source.data = image;
                cube2Texture.flipY = true;
                cube2Texture.needsUpdate = true;
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

            const getEnvironmentNode = function( reflectNode, positionNode ) {

                const custom1UV = reflectNode.xyz.mul( uniform( rotateY1Matrix ) );
                const custom2UV = reflectNode.xyz.mul( uniform( rotateY2Matrix ) );
                const flippedUV1 = vec3(custom1UV.x, mul(custom1UV.y, -1), custom1UV.z);
                const flippedUV2 = vec3(custom2UV.x, mul(custom2UV.y, -1), custom2UV.z);
                const sky1tx = pmremTexture( cube1Texture, flippedUV1 )
                const sky2tx = pmremTexture( cube2Texture, flippedUV2 )
                const direction = normalize( cameraPosition.sub( positionWorld ) );

                const mixCubeMaps = mix( sky1tx, sky2tx,  mixNode );

                const skyShade = add( ambColor, fogColor);


                const sky1Ambient = mul( mixCubeMaps, skyShade);
                const sky1AmbTinted = mix( sky1Ambient, ambColor, min(0.75, pow(2, mul(flippedUV1.y, 15)) ));
                const sky1FogTinted = mix( sky1AmbTinted, fogColor, mul(0.35, pow( cos(mul(flippedUV1.y, 2)), 30) ));
                const sky1ShadeTinted = mix( sky1FogTinted, spaceColor, max(0.0, min(0.75, pow( mul(flippedUV1.y, 0.99), 3) )));
                const skySunTinted = mix( sky1ShadeTinted, sunColor, max(0.0, min(0.85, pow( mul(flippedUV1.y, -0.99), 23) )));


                    // optical length
                    // cutoff angle at 90 to avoid singularity in next formula.
                    const angleToUp = dot( upUniform, direction )

                    const angleToDown = mul( angleToUp, -1)

                    const zenithAngle = acos( max( 0.0, angleToUp ) );
                    const horizonAngle = cos( max( -1.0, angleToUp ) );

                    const belowHorizonFactor = min(0.7, mul(pow( 1.1, angleToDown), 0.85  ));

                    const cosTheta = dot( direction, vSunDirection );
                    const sunFactor = pow( cosTheta, 4 );
                    const skyColor = mix(ambColor, sunColor, sunFactor)
                    const fogGradientColor = mix(ambColor, fogColor, 0.5)
                    const fogGradientFactor =  min(0.9, pow( horizonAngle, 4 ));
                    const fogGradient =  mix(skyColor, fogGradientColor, fogGradientFactor)
                    const fogHorizonFactor = pow( horizonAngle, 1000 );
                    const foggedColor = mix(fogGradient, fogColor, fogHorizonFactor)

                    const belowHorizonColor = mix(ambColor, spaceColor, belowHorizonFactor)

                    const sealevelColor = mix(foggedColor, belowHorizonColor, belowHorizonFactor)

                    const skyNode = vec4( sealevelColor, 1.0 );


                const proceduralEnv = mix( skySunTinted, skyNode, proceduralNode );

                const intensityFilter = proceduralEnv.mul( intensityNode );
                const hueFilter = hue( intensityFilter, hueNode );
                return saturation( hueFilter, saturationNode );

            };

            const getBackgroundNode = function( reflectNode, positionNode ) {

                const direction = normalize( positionWorld.sub( cameraPosition ) );

                // optical length
                // cutoff angle at 90 to avoid singularity in next formula.
                const angleToUp = dot( upUniform, direction )

                const angleToDown = dot( downUniform, direction )
                const zenithAngle = acos( max( 0.0, angleToUp ) );
                const horizonAngle = cos( max( -1.0, angleToUp ) );

                const belowHorizonFactor = mul(pow( 1.5, angleToDown), 0.85  );

                const cosTheta = dot( direction, vSunDirection );
                const sunFactor = pow( cosTheta, 4 );
                const skyColor = mix(ambColor, sunColor, sunFactor)
                const fogGradientColor = mix(ambColor, fogColor, 0.5)
                const fogGradientFactor =  pow( horizonAngle, 4 );
                const fogGradient =  mix(skyColor, fogGradientColor, fogGradientFactor)
                const fogHorizonFactor = pow( horizonAngle, 200 );
                const foggedColor = mix(fogGradient, fogColor, fogHorizonFactor)

                const sunAngle = dot(normalize(sunPosition), direction)
                const skySunShaded = mix( foggedColor, sunColor, max(0.0, min(0.9, pow( mul(sunAngle, 0.95), 8) )));

                const belowHorizonColor = mix(ambColor, spaceColor, belowHorizonFactor)

                const sealevelColor = mix(skySunShaded, belowHorizonColor, belowHorizonFactor)

                const skyNode = vec4( sealevelColor, 1.0 );

                const intensityFilter = skyNode.mul( intensityNode );
                const hueFilter = hue( intensityFilter, hueNode );
                return saturation( hueFilter, saturationNode );

            };


            scene.environmentNode = getEnvironmentNode( reflectVector, positionWorld );
            scene.backgroundNode = getBackgroundNode( positionWorldDirection, positionLocal );

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
    EnvironmentMaps
}