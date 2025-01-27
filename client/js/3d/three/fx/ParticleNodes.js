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
    attribute, uniformArray, ceil
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
    time, uv, If, modelViewMatrix, varyingProperty, Loop, int
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
let tempVec = new Vector3();
let tempColor = new Color();
let tempMatrix = new Matrix4();
let tempVec4 = new Vector4();

class ParticleNodes {
    constructor(material, maxInstanceCount, mesh) {

        const emitterObjects = []

        const pIndex = uniform( 0, 'uint');

        const tpf = uniform(0)

        const positionBuffer = instancedArray( maxInstanceCount, 'vec3' );
        const velocityBuffer = instancedArray( maxInstanceCount, 'vec3' );
        const customTimeBuffer = instancedArray( maxInstanceCount, 'vec3' );
    //    const customCurveBuffer = instancedArray( maxInstanceCount, 'vec4' );
    //    const customDimensionBuffer = instancedArray( maxInstanceCount, 'vec4' );

        const ONE = uniform( 1);
        const ZERO = uniform( 0);

        const DATA_ROWNS = 128;
        const DATA_PX_OFFSET = 0.5 / DATA_ROWNS;
        const ROW_SELECT_FACTOR = DATA_PX_OFFSET * 2;

        const dataTx = texture(material.dataTexture);
        const colorTx = texture(material.map);
        const pCurves = uniform(new Vector4());
        const pDimensions = uniform(new Vector4());


        const pPosSpread = uniform(new Vector2()) // : [0, 0.4],
        const pVelSpread = uniform(new Vector2())// : [1, 0.1],
        const pVelVariance = uniform(new Vector2())// : [1.0, 0.3],
        const pLifeTime = uniform(new Vector2())// : [2.2, 0.22],
        const pSizeFrom = uniform(new Vector2())// : [0.1, 0.8],
        const pSizeTo = uniform(new Vector2()) //:   [10.2, 0.9],
        const pSizeMod = uniform(new Vector2()) //:  [18.3, 4.3],
        const pIntensity = uniform(new Vector2()) //: [0.3, 1]

        /*
        const applyParticle = Fn( () => {
            curvesBuffer.element( pIndex ).assign(pCurves);
            positionBuffer.element( pIndex ).assign(pPosition);
            velocityBuffer.element( pIndex ).assign(pVelocity);
            sizeBuffer.element(pIndex).assign(pSizeFromToMod);
            timeBuffer.element(pIndex).assign(vec2(0, pLifeTime));
        } )().compute( 1 );
*/

    //    material.rotationNode = sizeBuffer.toAttribute().mul(99).add(time.sin().mul(0.1));
        material.scaleNode = Fn( () => {

            const timeValues = customTimeBuffer.element(instanceIndex)
            const dimensionValues = pDimensions // customDimensionBuffer.element(instanceIndex)
            const spawnTime     = timeValues.x;
            const sizeCurve     = pCurves.z // customCurveBuffer.element(instanceIndex).z;
            const lifeTimeTotal = timeValues.y.add(tpf);
            const age = max(0, min(time.sub(spawnTime), lifeTimeTotal)); // 12 = pSpawnTime

            const pSizeFrom     = dimensionValues.x;
            const pSizeTo       = dimensionValues.y;
            const sizeModulate  = dimensionValues.z;

            const lifeTimeFraction = min(age.div(lifeTimeTotal), 1);
            const activeOne = max(0, ceil(ONE.sub(lifeTimeFraction)));
            const ltCoordX = lifeTimeFraction.sub(ROW_SELECT_FACTOR).add(DATA_PX_OFFSET);

            const sizeCurveRow = sizeCurve.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
            const sizeColor = dataTx.sample(vec2(ltCoordX, ONE.sub(sizeCurveRow))) //  lifeTimeFraction));
            const sizeMod = sizeModulate.mul(sizeColor.r);
            const lifecycleSize = sizeMod.add(pSizeFrom.mul(ONE.sub(lifeTimeFraction)).add(pSizeTo.mul(lifeTimeFraction)))
            return lifecycleSize // lifecycleSize.mul(ONE.sub(lifeTimeFraction))

        } )();

        material.colorNode = Fn( () => {

            const timeValues = customTimeBuffer.element(instanceIndex)
            const spawnTime     = timeValues.x;
            const lifeTimeTotal = timeValues.y.add(tpf);
            const age = max(0, min(time.sub(spawnTime), lifeTimeTotal)); // 12 = pSpawnTime

            const lifeTimeFraction = min(age.div(lifeTimeTotal), 1);

            const colorCurve    = pCurves.x //ustomCurveBuffer.element(instanceIndex).x;
            const alphaCurve    = pCurves.y // customCurveBuffer.element(instanceIndex).y;

            const colorUvRow = colorCurve.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
            const colorStrengthCurveRow = alphaCurve.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
            const ltCoordX = lifeTimeFraction.sub(ROW_SELECT_FACTOR).add(DATA_PX_OFFSET);

            const curveColor = dataTx.sample(vec2(ltCoordX, ONE.sub(colorUvRow)));
            const stengthColor = dataTx.sample(vec2(ltCoordX, ONE.sub(colorStrengthCurveRow))) ;
            const strengthMod = stengthColor.r;
            const intensityColor = vec4(curveColor.r.mul(strengthMod), curveColor.g.mul(strengthMod), curveColor.b.mul(strengthMod), strengthMod.mul(timeValues.w))

            const txColor = colorTx.sample(customSpriteUv8x8());
            return txColor.mul(intensityColor);
        } )();

        material.positionNode_ = Fn( () => {
            return positionBuffer.element(instanceIndex);
        } )();

        material.positionNode_ = positionBuffer.toAttribute()

        // const computeParticles = Fn( () => {


        material.positionNode = Fn( () => {



            const particlePosition = positionBuffer.element(instanceIndex)



            const particlevelocity = velocityBuffer.element(instanceIndex)
            const timeValues = customTimeBuffer.element(instanceIndex)


            const dragrCurve    = pCurves.w // customCurveBuffer.element(instanceIndex).w;
            const pVelocityX    = particlevelocity.x;
            const pVelocityY    = particlevelocity.y;
            const pVelocityZ    = particlevelocity.z;
            const spawnTime     = timeValues.x;

            const lifeTimeTotal = timeValues.y.add(tpf);
            const age = max(0, min(time.sub(spawnTime), lifeTimeTotal)); // 12 = pSpawnTime

            const lifeTimeFraction = min(age.div(lifeTimeTotal), 1);
            const activeOne = max(0, ceil(ONE.sub(lifeTimeFraction)));

            const frictionCurveRow = dragrCurve.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
            const ltCoordX = lifeTimeFraction.sub(ROW_SELECT_FACTOR).add(DATA_PX_OFFSET);
            const frictionColor = dataTx.sample(vec2(ltCoordX, ONE.sub(frictionCurveRow))) //  lifeTimeFraction));

            const frictionMod = ONE.sub(frictionColor.r);
            //    varyingProperty( 'float', 'p_lifeTimeFraction' ).assign(lifeTimeFraction);
            //    varyingProperty( 'float', 'v_lifecycleScale' ).assign(lifecycleSize);

            //          colorBuffer.element(instanceIndex).assign(intensityColor);

            const velocityOffset = vec3(pVelocityX, pVelocityY, pVelocityZ).mul(age) // .mul(frictionMod);

             // .mul(tpf).mul(frictionMod);
            //    particlePosition.addAssign(velocityOffset) // .mul(activeOne)

            // particlePosition.assign(pPos)
        //    const velocityOffset = vec3(particlePosition.x, particlePosition.y.add(instanceIndex), particlePosition.z)
            return velocityOffset.add(particlePosition)

        } )();

        // } );

        const computeUpdate = Fn( () => {


                const emitterPositionV4 = emitterPositions.element( instanceIndex );
                const emitterDirectionV3 = emitterDirections.element( instanceIndex );
                const emitterVelV4 = emitterVelocities.element( instanceIndex );
                const emittParamsV4 = emitterParams.element( instanceIndex );
            //    const emittCurvesV4 = emitterCurves.element( instanceIndex );
            //    const emittDimensionsV4 = emitterDimensions.element( instanceIndex );
                const emitterPos = emitterPositionV4.xyz // vec3(1179,    emitterPositionV4.y, startIndex.add(3340))
                const emitterSize = emitterPositionV4.w;
                const emitterVel = emitterVelV4.xyz;
                const velocityStretch = emitterVelV4.w;

                const emitCountOffset = emittParamsV4.x;
                const emitCount = int(emittParamsV4.y)
                const particleDuration = emittParamsV4.z

                Loop ( emitCount, ( { i } ) => {
                    const step =  ZERO.add(i);
                    const particleIndex = pIndex.add(emitCountOffset.add(emitCount)).add(i)
                    const emitFraction = step.div(emitCount)

                    const offsetX = step.pow(0.5).mul(emitterSize.mod(step))
                    const offsetY = step.pow(0.5).mul(emitterSize.mod(step.add(offsetX)))
                    const offsetZ = step.pow(0.5).mul(emitterSize.mod(step.add(offsetX).add(offsetY)))

                    const offsetTime = emitFraction.mul(0.02)

                    const offsetPos = emitterDirectionV3.mul(offsetTime).sub(emitterDirectionV3.mul(0.02))// .mul(-1)).add() // .add(vec3(offsetX, offsetY, offsetZ))
                    positionBuffer.element(particleIndex).assign(emitterPos.add(offsetPos))
                    velocityBuffer.element(particleIndex).assign(emitterVel)
                    customTimeBuffer.element(particleIndex).assign(vec3(time.sub(offsetTime), particleDuration, emittParamsV4.w))
                //    customCurveBuffer.element(particleIndex).assign(emittCurvesV4)
                //    customDimensionBuffer.element(particleIndex).assign(emittDimensionsV4)
                } );


        } );


        let lastIndex = 0;

        let activeParticles = 0;
        let isActive = false;
        let clearEmitters = [];
        function update() {

            let applyCount = 0;

            emittersLength.value = emitterObjects.length;

            for (let i = 0; i < emitterObjects.length; ++i) {
                let obj = emitterObjects[i];


                let intensity = pIntensity.value.y;
                let lifeTime = pLifeTime.value.y;
                let sizeMod = pSizeMod.value.y;
                let gain = obj.userData.gain;
                emitterPositions.array[i].set(obj.position.x, obj.position.y, obj.position.z, gain +1);
                let emitCount = Math.floor(MATH.curveSqrt(gain+Math.random())*intensity + (gain+0.5+Math.random())*intensity)
                tempVec.set(0, 0, obj.userData.emitForce);
                tempVec.applyQuaternion(obj.quaternion);
                emitterDirections.array[i].set(tempVec.x, tempVec.y, tempVec.z);
                emitterVelocities.array[i].set(obj.up.x, obj.up.y, obj.up.z, emitCount);
                emitterParams.array[i].set(applyCount, emitCount, MATH.randomBetween(lifeTime, lifeTime*sizeMod), intensity)
                applyCount += emitCount

                if (obj.userData.gain === 0) {
                    clearEmitters.push(obj)
                }

            }


            pIndex.value = lastIndex;
            lastIndex += applyCount;

            if (lastIndex + applyCount > maxInstanceCount) {
                lastIndex = 0;
            }

            isActive = true;
            tpf.value = getFrame().tpf;
        //    now.value = getFrame().gameTime;
            if (emitterObjects.length !== 0) {
                ThreeAPI.getRenderer().computeAsync( computeUpdate().compute( emitterObjects.length ) );
            }

            while (clearEmitters.length) {
                let obj = clearEmitters.pop();
                MATH.splice(emitterObjects, clearEmitters.pop())
            }

        }
/*
        const computeInit = Fn( () => {
            const init = vec3(1, 2, 3)
            positionBuffer.element(instanceIndex).assign(init)
            velocityBuffer.element(instanceIndex).assign(init)
            customTimeBuffer.element(instanceIndex).assign(init)
        } )().compute( maxInstanceCount );

        ThreeAPI.getRenderer().computeAsync(computeInit)
*/
        function updateParticles() {
            update();
        //    ThreeAPI.getRenderer().computeAsync( computeParticles().compute( maxInstanceCount ) );
        }

        console.log("P Nodes Geo: ", mesh);

        let positions = [];
        let velocities = [];
        let directions = [];
        let params = [];

        let curves = [];
        let dimensions = [];

        for (let i = 0; i < 10; i++) {
            positions.push(new Vector4());
            directions.push(new Vector3());
            velocities.push(new Vector4());
            params.push(new Vector4());
        //    curves.push(new Vector4());
       //     dimensions.push(new Vector4());
        }

        const emitterPositions = uniformArray(positions)
        const emitterDirections = uniformArray(directions)
        const emitterVelocities = uniformArray(velocities)
        const emitterParams = uniformArray(params)
    //    const emitterCurves = uniformArray(curves)
     //   const emitterDimensions = uniformArray(dimensions)


        let applyCfg = null;

        const emittersLength = uniform( 0, 'uint' );

        function setParticleEmitterGain(obj3d, config) {

                if (emitterObjects.indexOf(obj3d) === -1) {
                    emitterObjects.push(obj3d)
                }

                if (applyCfg === null) {
                    applyCfg = config;
                    let curves = config.curves;
                    let colorCurve = ENUMS.ColorCurve[curves.color || 'brightMix']
                    let alphaCurve = ENUMS.ColorCurve[curves.alpha || 'oneToZero']
                    let sizeCurve  = ENUMS.ColorCurve[curves.size  || 'oneToZero']
                    let dragrCurve = ENUMS.ColorCurve[curves.drag  || 'zeroToOne']

                    pCurves.value.set(
                        colorCurve,
                        alphaCurve,
                        sizeCurve,
                        dragrCurve
                    ); // color - alpha - size - drag

                    let params = config.params;
                    pDimensions.value.set(
                        params.pSizeFrom[0],
                        params.pSizeTo[0],
                        params.pSizeMod[0],
                        params.pSizeMod[1]
                    );

                    pPosSpread.value.set(params.pPosSpread[0], params.pPosSpread[1]) // = uniform(new Vector2()) // : [0, 0.4],
                    pVelSpread.value.set(params.pVelSpread[0], params.pVelSpread[1])
                    pVelVariance.value.set(params.pVelVariance[0], params.pVelVariance[1])
                    pLifeTime.value.set(params.pLifeTime[0], params.pLifeTime[1])
                    pSizeFrom.value.set(params.pSizeFrom[0], params.pSizeFrom[1])
                    pSizeTo.value.set(params.pSizeTo[0], params.pSizeTo[1])
                    pSizeMod.value.set(params.pSizeMod[0], params.pSizeMod[1])
                    pIntensity.value.set(params.pIntensity[0], params.pIntensity[1])


                }






            activeParticles++;

            if (isActive === false) {
                ThreeAPI.registerPrerenderCallback(updateParticles);
            } else {
                if (emitterObjects.length === 0) {
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