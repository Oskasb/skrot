import {
    min,
    transformNormalToView,
    uniform,
    texture,
    vec2,
    vec4,
    instance,
    vertexColor,
    storage,
    attribute, uniformArray
} from "three/tsl";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {
    floor,
    Fn,
    instancedArray,
    instanceIndex,
    max,
    positionLocal,
    vec3,
    time, uv, If, modelViewMatrix, varyingProperty, Loop
} from "../../../../../libs/three/Three.TSL.js";
import {Color, StorageBufferAttribute, Vector2, Vector4} from "three/webgpu";
import {getFrame} from "../../../application/utils/DataUtils.js";
import {customSpriteUv8x8} from "./NodeParticleGeometry.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {MATH} from "../../../application/MATH.js";
import {Object3D} from "../../../../../libs/three/core/Object3D.js";
import {InstancedBufferAttribute} from "../../../../../libs/three/core/InstancedBufferAttribute.js";
import {Matrix4} from "../../../../../libs/three/math/Matrix4.js";
import {DynamicDrawUsage, Float32BufferAttribute} from "three";

let tempObj = new Object3D();
let tempColor = new Color();
let tempMatrix = new Matrix4();
let tempVec4 = new Vector4();

class ParticleNodes {
    constructor(material, maxInstanceCount, mesh) {

        const updateRanges = {
            start:0,
            count: maxInstanceCount
        }

        const instanceMatrix = mesh.instanceMatrix;

        const camQuat = uniform(ThreeAPI.getCamera().quaternion);
        const pCurves = uniform(new Vector4() );
        const pPosition = uniform(new Vector4() );
        const pVelocity = uniform(new Vector4() );
        const sizeValueUniforms = uniform(new Vector4() );
        const timeValues = uniform(new Vector4() );
        const pScale = uniform(1 );
        const pIndex = uniform( 0, 'uint');
        const pIntensity = uniform( 0);
        const tpf = uniform(0)
        const now = uniform(0);
        const pLifeTime = uniform(1);

        /*

        const curveData     = new Float32BufferAttribute( new Float32Array( maxInstanceCount * 4 ), 4 );
        const velocityData  = new Float32BufferAttribute( new Float32Array( maxInstanceCount * 4 ), 4 );
        const timeData      = new Float32BufferAttribute( new Float32Array( maxInstanceCount * 4 ), 4 );
        const sizeData      = new Float32BufferAttribute( new Float32Array( maxInstanceCount * 4 ), 4 );

        curveData.setUsage(DynamicDrawUsage)
        velocityData.setUsage(DynamicDrawUsage)
        timeData.setUsage(DynamicDrawUsage)
        sizeData.setUsage(DynamicDrawUsage)

        mesh.geometry.setAttribute('curveData', curveData)
        mesh.geometry.setAttribute('velocityData', velocityData)
        mesh.geometry.setAttribute('timeData', timeData)
        mesh.geometry.setAttribute('sizeData', sizeData)

        */


        const customCurveBuffer = instancedArray( maxInstanceCount, 'vec4' );
        const customVelocityBuffer = instancedArray( maxInstanceCount, 'vec4' );
        const customTimeBuffer = instancedArray( maxInstanceCount, 'vec4' );
        const customSizeBuffer = instancedArray( maxInstanceCount, 'vec4' );
        const colorBuffer = instancedArray( maxInstanceCount, 'vec4' );

        const positionBuffer = instancedArray( maxInstanceCount, 'vec3' );
        const scaleBuffer = instancedArray( maxInstanceCount, 'float' );
        const customMatrixBuffer = instancedArray( maxInstanceCount, 'mat4' );

        const ONE = uniform( 1);
        const ZERO = uniform( 0);
        const duration = uniform( 3)

        const DATA_ROWNS = 128;
        const DATA_PX_OFFSET = 0.5 / DATA_ROWNS;
        const ROW_SELECT_FACTOR = DATA_PX_OFFSET * 2;

        const dataTx = texture(material.dataTexture);
        const colorTx = texture(material.map);

        /*
        const applyParticle = Fn( () => {
            curvesBuffer.element( pIndex ).assign(pCurves);
            positionBuffer.element( pIndex ).assign(pPosition);
            velocityBuffer.element( pIndex ).assign(pVelocity);
            sizeBuffer.element(pIndex).assign(pSizeFromToMod);
            timeBuffer.element(pIndex).assign(vec2(0, pLifeTime));
        } )().compute( 1 );
*/
        material.positionNode_ = Fn( () => {
        //    varyingProperty( 'vec4', 'v_intensityColor' ).assign(vec4(positionLocal.x.mod(1), positionLocal.y.mod(1), positionLocal.z.mod(1), 1));
            return positionLocal;
        } )();

        material.positionNode = positionBuffer.toAttribute();
    //    material.rotationNode = sizeBuffer.toAttribute().mul(99).add(time.sin().mul(0.1));
        material.scaleNode = scaleBuffer.toAttribute();
    //    material.normalNode = transformNormalToView(vec3(0, 1, 0));

        material.colorNode_ = Fn( () => {


            const txColor = colorTx.sample(customSpriteUv8x8());
            // const color = varyingProperty( 'vec4', 'v_intensityColor' ) // colorBuffer.element(instanceIndex)
            return txColor // .mul(color.xyz).mul(color.w);
        } )();

        const computeUpdate_ = Fn( () => {



            const timeValues = customTimeBuffer.element(instanceIndex)
            const curveValues = customCurveBuffer.element(instanceIndex)
            const sizeValues = customSizeBuffer.element(instanceIndex)
            const velocityValues = customVelocityBuffer.element(instanceIndex)

            const colorCurve    = curveValues.x;
            const alphaCurve    = curveValues.y;
            const sizeCurve     = curveValues.z;
            const dragrCurve    = curveValues.w;
            const pVelocityX    = velocityValues.x;
            const pVelocityY    = velocityValues.y;
            const pVelocityZ    = velocityValues.z;
            const spawnTime     = timeValues.x;
            const pLifeTime     = timeValues.y;
            const pSizeFrom     = sizeValues.x;
            const pSizeTo       = sizeValues.y;
            const sizeModulate  = sizeValues.z;
            const pIntensity    = sizeValues.w;


                     const lifeTimeTotal = pLifeTime; // 11 = pLifeTime
                     const age = now.sub(spawnTime); // 12 = pSpawnTime

                     const lifeTimeFraction = age.div(lifeTimeTotal);
                     const activeOne = max(0, ONE.sub(lifeTimeFraction).sign())

                     const colorUvRow = colorCurve.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
                     const colorStrengthCurveRow = alphaCurve.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
                     const sizeCurveRow = sizeCurve.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
                     const frictionCurveRow = dragrCurve.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)

                     const ltCoordX = (lifeTimeFraction.sub(ROW_SELECT_FACTOR)).add(DATA_PX_OFFSET);

                     const curveColor = dataTx.sample(vec2(ltCoordX, ONE.sub(colorUvRow))) //  lifeTimeFraction));
                     const stengthColor = dataTx.sample(vec2(ltCoordX, ONE.sub(colorStrengthCurveRow))) //  lifeTimeFraction));
                     const sizeColor = dataTx.sample(vec2(ltCoordX, ONE.sub(sizeCurveRow))) //  lifeTimeFraction));
                     const frictionColor = dataTx.sample(vec2(ltCoordX, ONE.sub(frictionCurveRow))) //  lifeTimeFraction));

                     const strengthMod = stengthColor.r.mul(activeOne);
                     const sizeMod = sizeModulate.mul(sizeColor.r);
                     const frictionMod = frictionColor.r;

                     const lifecycleSize = sizeMod.add(pSizeFrom.mul(ONE.sub(lifeTimeFraction)).add(pSizeTo.mul(lifeTimeFraction)))

                    const intensityColor = vec4(curveColor.r.mul(strengthMod), curveColor.g.mul(strengthMod), curveColor.b.mul(strengthMod), pIntensity.mul(strengthMod))

            //    const testColor = vec4(age, age, age, age).mul(activeOne)

                  varyingProperty( 'vec4', 'v_intensityColor' ).assign(intensityColor);
            //     colorBuffer.element(instanceIndex).assign(intensityColor);

                const velocityOffset = vec3(pVelocityX, pVelocityY, pVelocityZ).mul(ZERO.sub(age));


        } );

        const computeUpdate = Fn( () => {

            const startIndex = pIndex;

            Loop( emittersLength, ( { i } ) => {

                const emitterPositionV4 = emitterPositions.element( i );
                const emitterVelV4 = emitterVelocities.element( i );
         //  const emitterPos = emitterPositionV4.xyz;

                   const emitterPos = emitterPositionV4.xyz // vec3(1179,    emitterPositionV4.y, startIndex.add(3340))

                const emitterSize = emitterPositionV4.w;
                const emitterVel = emitterVelV4.xyz;
                const velocityGain = emitterVelV4.w;

                const particleIndex = startIndex.add(i);

                positionBuffer.element(particleIndex).assign(emitterPos)
                scaleBuffer.element(particleIndex).assign(2)

            } );

        } );




        const computeParticles = computeUpdate().compute( 1 );

        let lastIndex = 0;

        let activeParticles = 0;
        let isActive = false;
        function update() {

            let applyCount = 0;

            for (let i = 0; i < emitterObjects.length; ++i) {
                let obj = emitterObjects[i];
                let gain = obj.userData.gain;
                emitterPositions.array[i].set(obj.position.x, obj.position.y, obj.position.z, gain +1);
                let emitterCount = Math.floor(gain +1)
                applyCount += emitterCount
                emitterVelocities.array[i].set(obj.up.x, obj.up.y, obj.up.z, emitterCount);

            }

            emittersLength.value = emitterObjects.length;


            pIndex.value = lastIndex;
            lastIndex += applyCount;

            if (lastIndex + applyCount > maxInstanceCount) {
                lastIndex = 0;
            }

            isActive = true;
            tpf.value = getFrame().tpfAvg;
            now.value = getFrame().gameTime;
            ThreeAPI.getRenderer().computeAsync( computeParticles );
        }

        console.log("P Nodes Geo: ", mesh);


        let positions = [];
        let velocities = []

        for (let i = 0; i < 20; i++) {
            positions.push(new Vector4());
            velocities.push(new Vector4());
        }

        const emitterPositions = uniformArray(positions)
        const emitterVelocities = uniformArray(velocities)
        const emitterObjects = []

        const emittersLength = uniform( 0, 'uint' );

        function setParticleEmitterGain(obj3d, gain, config) {
        //    console.log("spawnNodeParticle", pos, vel, config)
            if (typeof (gain) !== 'number') {
                console.log("Gain is NaN", gain)
                gain = 0;

            }
            obj3d.userData.gain = gain;
            if (gain === 0) {
                MATH.splice(emitterObjects, obj3d)
            } else {
                if (emitterObjects.indexOf(obj3d) === -1) {
                    emitterObjects.push(obj3d)
                }
            }



            let curves = config.curves;
            let params = config.params;

            let colorCurve = ENUMS.ColorCurve[curves.color || 'brightMix']
            let alphaCurve = ENUMS.ColorCurve[curves.alpha || 'oneToZero']
            let sizeCurve  = ENUMS.ColorCurve[curves.size  || 'oneToZero']
            let dragrCurve = ENUMS.ColorCurve[curves.drag  || 'zeroToOne']


        //    tempColor.set(colorCurve, alphaCurve, sizeCurve)
        //    mesh.setColorAt(lastIndex, tempColor);

            pCurves.value.set(
                colorCurve,
                alphaCurve,
                sizeCurve,
                dragrCurve
            ); // color - alpha - size - drag

            pVelocity.value.copy( obj3d.up );

            let pVelVariance = params['pVelVariance']
            if (pVelVariance) {
                let variance = MATH.randomBetween(pVelVariance[0], pVelVariance[1])
                pVelocity.value.multiplyScalar(1 + variance)
            }

            let pVelSpread = params['pVelSpread']
            if (pVelSpread) {
                let randomVec = MATH.randomVector();
                let speed = obj3d.up.length();
                randomVec.multiplyScalar(MATH.randomBetween(pVelSpread[0]*speed, pVelSpread[1]*speed))
                MATH.spreadVector(pVelocity.value, randomVec)
            }

            pIntensity.value = MATH.randomBetween(params.pIntensity[0], params.pIntensity[1]);
            sizeValueUniforms.value.set(
                MATH.randomBetween(params.pSizeFrom[0], params.pSizeFrom[1]),
                MATH.randomBetween(params.pSizeTo[0], params.pSizeTo[1]),
                MATH.randomBetween(params.pSizeMod[0], params.pSizeMod[1]),
                pIntensity.value
            );

            pLifeTime.value = MATH.randomBetween(params.pLifeTime[0], params.pLifeTime[1]);

            timeValues.value.set(
                getFrame().gameTime,
                pLifeTime.value,
                0,
                0
            )

            customCurveBuffer.needsUpdate = true;
            customVelocityBuffer.needsUpdate = true;
            customTimeBuffer.needsUpdate = true;
            customSizeBuffer.needsUpdate = true;



        //    ThreeAPI.getRenderer().compute( computeApply );
            activeParticles++;

            if (isActive === false) {
            //    console.log(mesh.geometry.attributes)
                ThreeAPI.registerPrerenderCallback(update)
            } else {
                if (emitterObjects.length === 0) {
                    ThreeAPI.unregisterPrerenderCallback(update)
                    isActive = false;
                }
            }

        }

        this.call = {
            setParticleEmitterGain:setParticleEmitterGain
        }
    }
}

export { ParticleNodes }