import {DoubleSide, Mesh, PlaneGeometry, Raycaster, Vector2, Vector3} from "../../../../../libs/three/Three.Core.js";
import {SimplexNoise} from "../../../../../libs/jsm/math/SimplexNoise.js";
import {
    clamp,
    length,
    int,
    uint,
    time,
    color, cos, float,
    Fn, instancedArray, instanceIndex, max, min, negate, positionLocal,
    transformNormalToView,
    uniform,
    varyingProperty, vec2, vec3,
    vertexIndex, mul, add, sin, texture, uvec2, textureStore, vec4, normalLocal, blendColor, mix, floor, uv, sign
} from "../../../../../libs/three/Three.TSL.js";
import {MeshPhongNodeMaterial} from "../../../../../libs/three/materials/nodes/NodeMaterials.js";
import {getFrame} from "../../../application/utils/DataUtils.js";
import MeshStandardNodeMaterial from "../../../../../libs/three/materials/nodes/MeshStandardNodeMaterial.js";
import {StorageTexture} from "../../../../../libs/three/Three.WebGPU.js";

class Ocean {
    constructor(store) {

        let scene = store.scene;
        let renderer = store.renderer;
        let camera = scene.camera;
        let envUnifs = store.env.uniforms;

        function generateOcean() {

            // Dimensions of simulation grid.
            const TILE_SIZE = 10;
            const WIDTH = 100;

            // Water size in system units.
            const BOUNDS = WIDTH*TILE_SIZE;
            const BOUNDS_HALF = BOUNDS * 0.5;

            const waterMaxHeight = 1;

            let mouseMoved = false;
            const mouseCoords = new Vector2();
            let effectController;

            let waterMesh, meshRay;

            let waveInfluence = new Vector3();

            let camPos = new Vector3();

                effectController = {
                    mousePos: uniform( waveInfluence ).label( 'mousePos' ),
                    mouseSize: uniform( 30.0 ).label( 'mouseSize' ),
                    viscosity: uniform( 0.98 ).label( 'viscosity' ),
                    camPos: uniform(camPos).label( 'camPos' ),
                    spheresEnabled: true,
                    wireframe: false
                };

                // Water Geometry corresponds with buffered compute grid.
                const waterGeometry = new PlaneGeometry( BOUNDS, BOUNDS, WIDTH - 1, WIDTH - 1 );
                // material: make a THREE.ShaderMaterial clone of THREE.MeshPhongMaterial, with customized position shader.
                const waterMaterial = new MeshStandardNodeMaterial();

            waterMaterial.side = DoubleSide;
            const width = 512, height = 512;


            waterMaterial.normalNode = Fn( () => {
                const { mousePos } = effectController;

                const posx = positionLocal.x
                const posy = positionLocal.y
                const waveA = cos(add(add(mul(time, 6.5), add(posx, posy)), posx).mul(0.002));
                const waveB = sin(add(add(mul(time, 6.2), mul(add(posx, posy), 0.9)), posy).mul(0.002));

                const waveAp = waveA.add(cos(posy.mul(0.000001)));
                const waveBp = waveB.add(sin(posx.mul(0.000001)));

                const bigWaveNm = vec3(waveAp, 12, waveBp).normalize();

                const timeSin = time.sin();
                const timeCos = time.cos();

                const waveA1 = timeSin.mul(0.1).add(cos(add(posy.mul(0.008), posx.mul(0.013)).add(time.mul(0.2))))
                const waveB1 = timeCos.mul(0.1).add(sin(add(posx.mul(0.007), posy.mul(0.011)).add(time.mul(0.2))));

                const waveA2 = timeCos.mul(0.24).add(cos(add(posy.mul(0.02), posx.mul(0.033)).add(time.mul(0.4))))
                const waveB2 = timeSin.mul(0.22).add(cos(add(posx.mul(0.025), posy.mul(0.023)).add(time.mul(0.4))))

                const waveA3 = timeCos.mul(0.34).add(cos(add(posy.mul(0.04), posx.mul(0.13)).add(time.mul(0.45))))
                const waveB3 = timeSin.mul(0.42).add(sin(add(posx.mul(0.044), posy.mul(0.11)).add(time.mul(0.85))))

                const waveA4 = timeCos.mul(0.44).add(cos(add(posy.mul(0.082), posx.mul(0.193)).add(time.mul(0.95))))
                const waveB4 = timeSin.mul(0.52).add(sin(add(posx.mul(0.097), posy.mul(0.14)).add(time.mul(0.35))))

                const waveA5 = time.mul(0.44).sin().add(cos(add(posy.mul(0.32), posx.mul(0.293)).add(time.mul(0.75))))
                const waveB5 = time.mul(0.42).cos().add(sin(add(posx.mul(0.49), posy.mul(0.223)).add(time.mul(0.55))))

                const waveA6 = time.mul(0.24).sin().add(cos(add(posy.mul(0.52), posx.mul(0.593)).add(time.mul(0.55))))
                const waveB6 = time.mul(0.22).cos().add(sin(add(posx.mul(0.59), posy.mul(0.423)).add(time.mul(0.85))))

                const wave6Nm = vec3(waveA6, 18, waveB6).normalize();
                const wave5Nm = vec3(waveA5, 18, waveB5).normalize();
                const wave4Nm = vec3(waveA4, 18, waveB4).normalize();
                const wave3Nm = vec3(waveA3, 17, waveB3).normalize();
                const wave2Nm = vec3(waveA2, 15, waveB2).normalize();
                const wave1Nm = vec3(waveA1, 14, waveB1).normalize();

                return bigWaveNm.add(wave1Nm.add(wave2Nm.add(wave3Nm.add(wave4Nm.add(wave5Nm.add(wave6Nm)))))).normalize()

            } )();

        //    const computeTx = computeTexture( { storageTexture } ).compute( width * height );
        //    renderer.computeAsync( computeTx );

                waterMaterial.lights = true;
                waterMaterial.colorNode = Fn( () => {

                    const posx = positionLocal.x
                    const posy = positionLocal.y
                    const waveA = cos(add(add(1, add(posx, posy)), posx).mul(0.0009));
                    const waveB = sin(add(add(1, mul(add(posx, posy), 0.9)), posy).mul(0.0006));

                    const waveAp = waveA.add(cos(posy.mul(0.0004)));
                    const waveBp = waveB.add(sin(posx.mul(0.001)));
                    const bigWaveNm = vec3(waveAp, 2, waveBp).normalize();

                    const sunColor = uniform( envUnifs.sun );
                    const fogColor = uniform( envUnifs.fog );
                    const ambColor = uniform( envUnifs.ambient );


                    const waterColor = vec3(0, 0.3, 0.7);
                    const blendColor = mix(waterColor, fogColor, waveAp);
                    const blend2Color = mix(blendColor, ambColor, waveBp);

                    return mix(blend2Color, sunColor, ambColor.b);
                } )();


       //     waterMaterial.colorNode = texture( storageTexture );
            waterMaterial.metalness = 0.97;
            waterMaterial.envMapIntensity = 0.99;
            waterMaterial.roughness = 0.17;

            waterMaterial.positionNode = Fn( () => {
                const { camPos } = effectController;

                const uvX = uv().x.sub(0.5)
                const uvY = uv().y.sub(0.5)
                const pX = uvX.mul(BOUNDS)
                const pZ = uvY.mul(BOUNDS)

                const bnd = vec3(BOUNDS, 1, TILE_SIZE);

                const cX = bnd.y.sub(uvX.mul(2.2).abs()); // ;
                const cZ = bnd.y.sub(uvY.mul(2.2).abs());

                const edgeX = uvX.mul(uvX.abs().mul(2.2).pow(100).mul(100));
                const edgeZ = uvY.mul(uvY.abs().mul(2.2).pow(100).mul(100));

                const centerNess = max(0, cX.mul(cZ));

                const camOffsetPos = vec3(floor(camPos.x.div(TILE_SIZE)).mul(TILE_SIZE), 0 , floor(camPos.z.div(TILE_SIZE)).mul(TILE_SIZE));
                const globalPos = vec3(pX, 0, pZ).add(camOffsetPos);

                const height = time.add(pX.sub(camOffsetPos.x).mul(bnd.z.mul(3))).sin().add(pZ.sub(camOffsetPos.z).mul(bnd.z.mul(2))).cos().mul(2);
                varyingProperty( 'vec3', 'v_normalView' ).assign( transformNormalToView(vec3(1, 1, height.mul(centerNess)).normalize() ) );

                return vec3( globalPos.x.add(edgeX), globalPos.z.add(edgeZ), height.mul(centerNess));

                } )();

                waterMesh = new Mesh( waterGeometry, waterMaterial );
                waterMesh.rotation.x = - Math.PI / 2;
                waterMesh.matrixAutoUpdate = false;
                waterMesh.frustumCulled = false;
                waterMesh.updateMatrix();

                scene.add( waterMesh );


            function update(){

             //   waveInfluence.x = Math.sin(time * 1.8)*50;
             //   waveInfluence.y = Math.cos(time * 1.3)*600;

            //    renderer.computeAsync( computeHeight );
            //    console.log(store.scene);
                let camera = ThreeAPI.getCamera();
                if (camera) {
                    let x= Math.floor(camera.position.x / TILE_SIZE);
                    let z = Math.floor(camera.position.z / TILE_SIZE);
                //   console.log(camera);
                    camPos.x = x*TILE_SIZE;
                    camPos.z = -z*TILE_SIZE;
                }
            }

                ThreeAPI.addPostrenderCallback(update);

        }

        generateOcean();

    }

}

export {Ocean}