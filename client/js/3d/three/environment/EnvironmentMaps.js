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
    asin, sin, min
} from "../../../../../libs/three/Three.TSL.js";
import {AssetTexture} from "../assets/AssetTexture.js";
import {loadImageAsset} from "../../../application/utils/DataUtils.js";
import {SpatialTransition} from "../../../application/utils/SpatialTransition.js";
import {ScalarTransition} from "../../../application/utils/ScalarTransition.js";




class EnvironmentMaps {
    constructor(scene) {

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
                cube1Texture.needsUpdate = true;
            }

            function tx2Loaded(image) {
                console.log("tx loaded", image)
                cube2Texture.source.data = image;
                cube2Texture.needsUpdate = true;
            }

            loadImageAsset('sky_clouds', tx1Loaded)
            loadImageAsset('sky_stars', tx2Loaded)

            // nodes and environment

            const adjustments = {
                mix: 0,
                procedural: 0.5,
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
                sTransit.initScalarTransition(adjustments.mix, 1-adjustments.mix, 10, transitEnded, 'curveSigmoid', transit);
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
            const sunPosition = uniform( new Vector3(0, 10000, 0) );

            const upUniform = uniform( new Vector3( 0, 1, 0 ) );
            const downUniform = uniform( new Vector3( 0, -1, 0 ) );
            const sunColor = uniform( new Vector3( 1, 0.9, 0.6 ) );
            const fogColor = uniform( new Vector3( 0.4, 0.7, 0.9 ) );
            const ambColor = uniform( new Vector3( 0.0, 0.1, 0.4 ) );
            const spaceColor = uniform( new Vector3( 0.0, 0.0, 0.1 ) );


            const vSunDirection = varying( vec3(), 'vSunDirection' );
            const vSunE = varying( float(), 'vSunE' );
            const vSunfade = varying( float(), 'vSunfade' );
            const vBetaR = varying( vec3(), 'vBetaR' );
            const vBetaM = varying( vec3(), 'vBetaM' );

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
                const mixCubeMaps = mix( pmremTexture( cube1Texture, custom1UV ), pmremTexture( cube2Texture, custom2UV ),  mixNode );


                    const direction = normalize( cameraPosition.sub( positionWorld ) );

                    // optical length
                    // cutoff angle at 90 to avoid singularity in next formula.
                    const angleToUp = dot( upUniform, direction )

                    const angleToDown = dot( downUniform, direction )

                    const zenithAngle = acos( max( 0.0, angleToUp ) );
                    const horizonAngle = cos( max( -1.0, angleToUp ) );

                    const belowHorizonFactor = pow( 4, angleToDown );

                    const cosTheta = dot( direction, vSunDirection );
                    const sunFactor = pow( cosTheta, 4 );
                    const skyColor = mix(ambColor, sunColor, sunFactor)
                    const fogGradientColor = mix(ambColor, fogColor, 0.5)
                    const fogGradientFactor =  pow( horizonAngle, 4 );
                    const fogGradient =  mix(skyColor, fogGradientColor, fogGradientFactor)
                    const fogHorizonFactor = pow( horizonAngle, 1000 );
                    const foggedColor = mix(fogGradient, fogColor, fogHorizonFactor)

                    const belowHorizonColor = mix(ambColor, spaceColor, belowHorizonFactor)

                    const sealevelColor = mix(foggedColor, belowHorizonColor, belowHorizonFactor)

                    const skyNode = vec4( sealevelColor, 1.0 );


                const proceduralEnv = mix( mixCubeMaps, skyNode, proceduralNode );

                const intensityFilter = proceduralEnv.mul( intensityNode );
                const hueFilter = hue( intensityFilter, hueNode );
                return saturation( hueFilter, saturationNode );

            };

            const getBackgroundNode = function( reflectNode, positionNode ) {

                const custom1UV = reflectNode.xyz.mul( uniform( rotateY1Matrix ) );
                const custom2UV = reflectNode.xyz.mul( uniform( rotateY2Matrix ) );
                const mixCubeMaps = mix( pmremTexture( cube1Texture, custom1UV ), pmremTexture( cube2Texture, custom2UV ),  mixNode );


                const direction = normalize( positionWorld.sub( cameraPosition ) );

                // optical length
                // cutoff angle at 90 to avoid singularity in next formula.
                const angleToUp = dot( upUniform, direction )

                const angleToDown = dot( downUniform, direction )

                const zenithAngle = acos( max( 0.0, angleToUp ) );
                const horizonAngle = cos( max( -1.0, angleToUp ) );

                const belowHorizonFactor = pow( 4, angleToDown );

                const cosTheta = dot( direction, vSunDirection );
                const sunFactor = pow( cosTheta, 4 );
                const skyColor = mix(ambColor, sunColor, sunFactor)
                const fogGradientColor = mix(ambColor, fogColor, 0.5)
                const fogGradientFactor =  pow( horizonAngle, 4 );
                const fogGradient =  mix(skyColor, fogGradientColor, fogGradientFactor)
                const fogHorizonFactor = pow( horizonAngle, 1000 );
                const foggedColor = mix(fogGradient, fogColor, fogHorizonFactor)

                const belowHorizonColor = mix(ambColor, spaceColor, belowHorizonFactor)

                const sealevelColor = mix(foggedColor, belowHorizonColor, belowHorizonFactor)

                const skyNode = vec4( sealevelColor, 1.0 );


                const proceduralEnv = mix( mixCubeMaps, skyNode, proceduralNode );

                const intensityFilter = proceduralEnv.mul( intensityNode );
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