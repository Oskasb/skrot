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
    attribute, uniformArray, ceil, hash, uint, transformDirection
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
    time, uv, If, modelViewMatrix, varyingProperty, Loop, int, transformedTangentWorld
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
import {varying} from "../../../../../libs/three/nodes/core/VaryingNode.js";
import {normalLocal} from "../../../../../libs/three/nodes/accessors/Normal.js";

import {evt} from "../../../application/event/evt.js";

let tempObj = new Object3D();
let tempVec = new Vector3();
let tempColor = new Color();
let tempMatrix = new Matrix4();
let tempVec4 = new Vector4();

class ParticleNodes {
    constructor(material, maxInstanceCount, mesh, sharedUniforms) {



        const gravity = uniform( sharedUniforms['gravity'] || 0, 'float')



        const emitterObjects = []

        const pIndex = uniform( 0, 'uint');

        const tpf = uniform(0)

        const emitterCount = 10;

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
        const pVelInherit = uniform(new Vector2())// : [1, 0.1],
        const pVelVariance = uniform(new Vector2())// : [1.0, 0.3],
        const pLifeTime = uniform(new Vector2())// : [2.2, 0.22],
        const pSizeFrom = uniform(new Vector2())// : [0.1, 0.8],
        const pSizeTo = uniform(new Vector2()) //:   [10.2, 0.9],
        const pSizeMod = uniform(new Vector2()) //:  [18.3, 4.3],
        const pIntensity = uniform(new Vector2()) //: [0.3, 1]
        const pScaleExp = uniform(new Vector2()) //: [0.3, 1]
        const pSpriteX = uniform(0, 'uint')
        const pSpriteY = uniform(0, 'uint')
        /*
        const applyParticle = Fn( () => {
            curvesBuffer.element( pIndex ).assign(pCurves);
            positionBuffer.element( pIndex ).assign(pPosition);
            velocityBuffer.element( pIndex ).assign(pVelocity);
            sizeBuffer.element(pIndex).assign(pSizeFromToMod);
            timeBuffer.element(pIndex).assign(vec2(0, pLifeTime));
        } )().compute( 1 );
*/
        const computeScale = Fn( () => {

            const timeValues = customTimeBuffer.element(instanceIndex)
            const spawnTime     = timeValues.x;
            const lifeTimeTotal = timeValues.y;
            const age = max(0, min(time.sub(spawnTime), lifeTimeTotal)); // 12 = pSpawnTime
            const lifeTimeFraction = min(age.div(lifeTimeTotal), 1);
            const forceFade = max(0, ONE.sub(lifeTimeFraction.pow(4.5)));
            const sizeFrom     = pSizeFrom.x;
            const sizeTo       = pSizeTo.x;
            const sizeModulate  = timeValues.z;
            const scaleExp = pScaleExp.x;
            const activeOne = max(0, ceil(ONE.sub(lifeTimeFraction)));
            const sizeMod = sizeModulate.mul(lifeTimeFraction.pow(scaleExp));
            const lifecycleSize = sizeFrom.add(sizeMod).mul(ONE.sub(lifeTimeFraction).add(sizeTo.mul(lifeTimeFraction)))
            const fadedScale = forceFade.mul(lifecycleSize)
            return fadedScale

        } );


        material.scaleNode = Fn( () => {
            return computeScale()
        } )();

        material.colorNode = Fn( () => {


            const timeValues = customTimeBuffer.element(instanceIndex)
            const spawnTime     = timeValues.x;
            const lifeTimeTotal = timeValues.y;
            const age = max(0, min(time.sub(spawnTime), lifeTimeTotal)); // 12 = pSpawnTime
            const lifeTimeFraction = min(age.div(lifeTimeTotal), 1);
            const forceFade = max(0, ONE.sub(lifeTimeFraction.pow(3)))

            const colorIntensity = pIntensity.x;
            const colorCurve    = pCurves.x //ustomCurveBuffer.element(instanceIndex).x;
            const alphaCurve    = pCurves.y // customCurveBuffer.element(instanceIndex).y;

            const colorUvRow = colorCurve.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
            const colorStrengthCurveRow = alphaCurve.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
            const ltCoordX = lifeTimeFraction.sub(ROW_SELECT_FACTOR).add(DATA_PX_OFFSET);

            const curveColor = dataTx.sample(vec2(ltCoordX, ONE.sub(colorUvRow)));
            const strengthColor = dataTx.sample(vec2(ltCoordX, ONE.sub(colorStrengthCurveRow))) ;
            const strengthMod = strengthColor.r.mul(forceFade);

            const colorBoost = ONE.add(max(0, colorIntensity.sub(1)));

            const intensityColor = vec4(curveColor.r.mul(colorBoost).add(ONE.sub(forceFade)), curveColor.g.mul(colorBoost), curveColor.b.mul(colorBoost), strengthMod.mul(colorIntensity).mul(forceFade))

            const txColor = colorTx.sample(customSpriteUv8x8());
            const finalColor = txColor.mul(intensityColor);
            return finalColor;
        } )();

        const computePosition = Fn( () => {
            const x = pSpriteX;
            const y = pSpriteY;
            varyingProperty('vec2', 'pSpriteXY').assign( vec2(x, y) );

            const particlePosition = positionBuffer.element(instanceIndex)
            const particlevelocity = velocityBuffer.element(instanceIndex)
            const timeValues = customTimeBuffer.element(instanceIndex)

            const dragrCurve    = pCurves.w // customCurveBuffer.element(instanceIndex).w;
            const pVelocityX    = particlevelocity.x;
            const pVelocityY    = gravity.add(particlevelocity.y);
            const pVelocityZ    = particlevelocity.z;
            const spawnTime     = timeValues.x;
            const lifeTimeTotal = timeValues.y.add(tpf);
            const age = max(0, min(time.sub(spawnTime), lifeTimeTotal)); // 12 = pSpawnTime
            const lifeTimeFraction = min(age.div(lifeTimeTotal), 1);
            const velocityOffset = vec3(pVelocityX, pVelocityY, pVelocityZ).mul(age) // .mul(frictionMod);
            const frictionDrag = max(0, ONE.sub(lifeTimeFraction.mul(pVelInherit.y)))

            return particlePosition.add(velocityOffset.mul(frictionDrag)) //

        } );

        if (material.isSpriteNodeMaterial) {
            material.positionNode = Fn( () => {
                return computePosition()

            } )();
        } else {
            material.positionNode = Fn( () => {
                const posLoc = vec3(positionLocal.x, positionLocal.z, positionLocal.y);
                return posLoc.mul(computeScale()).add(computePosition())
            } )();
        }

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

                const inheritVelocity = pVelInherit.x;

                const emitCountOffset = emittParamsV4.x;
                const emitCount = int(emittParamsV4.y)
                const particleDuration = emittParamsV4.z

                Loop ( emitCount, ( { i } ) => {
                    const step =  ZERO.add(i);
                    const particleIndex = pIndex.add(emitCountOffset.add(emitCount)).add(i)
                    const emitFraction = step.div(emitCount)
                    const offsetTime = emitFraction.mul(tpf)

                    const spread = emitterPositionV4.y.add(emitFraction.add(emitterPositionV4.x)).mod(1).mul(pPosSpread.y.sub(pPosSpread.x)).add(pPosSpread.x)
                    const posRandom = vec3(
                        emitterPositionV4.y.add(emitFraction).mod(1),
                        emitterPositionV4.z.add(emitFraction).mod(1),
                        emitterPositionV4.x.add(emitFraction).mod(1)
                    ).sub( 0.5 ).mul( spread);

                    const spreadVelocity = emitterPositionV4.z.add(emitFraction.add(emitterPositionV4.y)).mod(1).mul(pVelSpread.y.sub(pVelSpread.x)).add(pVelSpread.x)

                    const velRandom = vec3(
                        emitterPositionV4.z.add(emitFraction.add(spreadVelocity)).mod(1),
                        emitterPositionV4.x.add(emitFraction.add(spreadVelocity)).mod(1),
                        emitterPositionV4.y.add(emitFraction.add(spreadVelocity)).mod(1)
                    ).sub( 0.5 ).mul( spreadVelocity);

                    const varyVelocity = emitterPositionV4.x.add(emitFraction.add(spreadVelocity)).mod(1).mul(pVelVariance.y.sub(pVelVariance.x)).add(pVelVariance.x)
                    const emitterVel = emitterVelV4.xyz.mul(ONE.add(varyVelocity))
                    const spreadSizeMod = emitterPositionV4.x.add(emitFraction.add(emitterPositionV4.z)).mod(1).mul(pSizeMod.y.sub(pSizeMod.x)).add(pSizeMod.x)

                    const offsetPos = emitterDirectionV3.mul(offsetTime).sub(emitterDirectionV3.mul(tpf))// .mul(-1)).add() // .add(vec3(offsetX, offsetY, offsetZ))
                    positionBuffer.element(particleIndex).assign(emitterPos.add(offsetPos).add(posRandom))
                    velocityBuffer.element(particleIndex).assign(emitterVel.mul(inheritVelocity).add(emitterVel.mul(velRandom)))
                    customTimeBuffer.element(particleIndex).assign(vec3(time.sub(offsetTime), particleDuration, spreadSizeMod))

                } );

        } );

        let lastIndex = 0;

        let activeParticles = 0;
        let isActive = false;
        let clearEmitters = [];

        const updateEmitters = computeUpdate().compute( emitterCount )

        function update() {

            let applyCount = 0;

            while (emitterObjects.length > emitterCount) {
                clearEmitters.push(emitterObjects.shift());
            }

            emittersLength.value = emitterObjects.length;

            for (let i = 0; i < emitterObjects.length; ++i) {
                let obj = emitterObjects[i];

                let intensity = pIntensity.value.y;
                let lifeTime = MATH.randomBetween(pLifeTime.value.x, pLifeTime.value.y)
                let sizeMod = pSizeMod.value.y;
                let gain = obj.userData.gain;
                emitterPositions.array[i].set(obj.position.x, obj.position.y, obj.position.z, gain +1);

                if (obj.position.lengthSq() < 100000) { //something isnt cleaning up right...
                //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:obj.position, color:'RED'})
                    obj.userData.gain = 0;
                } else {
                //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:obj.position, color:'GREEN'})
                    let emitCount = 1 //Math.ceil(MATH.curveSqrt(gain*intensity+Math.random()*intensity*gain*0.5));
                    tempVec.set(0, 0, obj.userData.emitForce);
                    tempVec.applyQuaternion(obj.quaternion);
                    emitterDirections.array[i].set(tempVec.x, tempVec.y, tempVec.z);
                    emitterVelocities.array[i].set(obj.up.x, obj.up.y, obj.up.z, emitCount);
                    emitterParams.array[i].set(applyCount, emitCount, lifeTime, intensity)
                    applyCount += emitCount
                }


                if (obj.userData.gain === 0) {
                    clearEmitters.push(obj)
                }
            }

            for (let i = emitterObjects.length; i < emitterCount; i++) {
                emitterVelocities.array[i].set(0, 0, 0, 0);
                emitterParams.array[i].set(0, 0, 0, 0)
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
                ThreeAPI.getRenderer().computeAsync( updateEmitters );
            }

            while (clearEmitters.length) {
                let obj = clearEmitters.pop();
                obj.userData.gain = 0;
                MATH.splice(emitterObjects, obj)
            }

        }

        function updateParticles() {
            update();
        }

        console.log("P Nodes Geo: ", mesh);

        let positions = [];
        let velocities = [];
        let directions = [];
        let params = [];

        let curves = [];
        let dimensions = [];

        for (let i = 0; i < emitterCount; i++) {
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
                    let spreadCurve  = ENUMS.ColorCurve[curves.spread  || 'oneToZero']
                    let dragrCurve = ENUMS.ColorCurve[curves.drag  || 'zeroToOne']

                    pCurves.value.set(
                        colorCurve,
                        alphaCurve,
                        spreadCurve,
                        dragrCurve
                    ); // color - alpha - size - drag

                    let params = config.params;
                    pDimensions.value.set(
                        params.pSizeFrom[0],
                        params.pSizeTo[0],
                        params.pSizeMod[0],
                        params.pSizeMod[1]
                    );

                    pSpriteX.value = params.pSprite[0];
                    pSpriteY.value = params.pSprite[1];
                    pPosSpread.value.set(params.pPosSpread[0], params.pPosSpread[1]) // = uniform(new Vector2()) // : [0, 0.4],
                    pVelSpread.value.set(params.pVelSpread[0], params.pVelSpread[1])
                    pVelInherit.value.set(params.pVelInherit[0], params.pVelInherit[1])
                    pVelVariance.value.set(params.pVelVariance[0], params.pVelVariance[1])
                    pLifeTime.value.set(params.pLifeTime[0], params.pLifeTime[1])
                    pSizeFrom.value.set(params.pSizeFrom[0], params.pSizeFrom[1])
                    pSizeTo.value.set(params.pSizeTo[0], params.pSizeTo[1])
                    pSizeMod.value.set(params.pSizeMod[0], params.pSizeMod[1])
                    pIntensity.value.set(params.pIntensity[0], params.pIntensity[1])
                    pScaleExp.value.set(params.pScaleExp[0], params.pScaleExp[1])

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