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


        const positionBuffer = instancedArray( maxInstanceCount, 'vec3' );
        const velocityBuffer = instancedArray( maxInstanceCount, 'vec3' );
        const scaleBuffer = instancedArray( maxInstanceCount, 'float' );
        const customTimeBuffer = instancedArray( maxInstanceCount, 'vec2' );

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

        material.positionNode = Fn( () => {

            const positionInit = positionBuffer.element(instanceIndex);
            return positionInit

        } )();


    //    material.rotationNode = sizeBuffer.toAttribute().mul(99).add(time.sin().mul(0.1));
        material.scaleNode = varyingProperty( 'float', 'v_lifecycleScale' );
    //    material.normalNode = transformNormalToView(vec3(0, 1, 0));

        material.colorNode = Fn( () => {

/*
            const timeValues = customTimeBuffer.element(instanceIndex)
            const spawnTime     = timeValues.x;
            const pLifeTime     = timeValues.y;

            const lifeTimeTotal = pLifeTime; // 11 = pLifeTime
            const age = time.sub(spawnTime); // 12 = pSpawnTime

            const lifeTimeFraction = min(age.div(lifeTimeTotal), 1);

            const colorCurve    = pCurves.x;
            const alphaCurve    = pCurves.y;



            const colorUvRow = colorCurve.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
            const colorStrengthCurveRow = alphaCurve.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
            const ltCoordX = lifeTimeFraction.sub(ROW_SELECT_FACTOR).add(DATA_PX_OFFSET);

            const curveColor = dataTx.sample(vec2(ltCoordX, ONE.sub(colorUvRow)));
            const stengthColor = dataTx.sample(vec2(ltCoordX, ONE.sub(colorStrengthCurveRow))) ;
            const strengthMod = stengthColor.r;
            const intensityColor = vec4(curveColor.r.mul(strengthMod), curveColor.g.mul(strengthMod), curveColor.b.mul(strengthMod), pIntensity.mul(strengthMod))
      */
            const txColor = colorTx.sample(customSpriteUv8x8());
            return vec4(txColor.r, txColor.g, txColor.b, txColor.a ) //.mul(lifeTimeFraction);
        } )();

     //   const computeUpdate_ = Fn( () => {
            material.positionNode = Fn( () => {

            const particlePosition = positionBuffer.element(instanceIndex)
            const particlevelocity = velocityBuffer.element(instanceIndex)
            const timeValues = customTimeBuffer.element(instanceIndex)
            const sizeValues = scaleBuffer.element(instanceIndex)


            const colorCurve    = pCurves.x;
            const alphaCurve    = pCurves.y;
            const sizeCurve     = pCurves.z;
            const dragrCurve    = pCurves.w;
            const pVelocityX    = particlevelocity.x;
            const pVelocityY    = particlevelocity.y;
            const pVelocityZ    = particlevelocity.z;
            const spawnTime     = timeValues.x;
            const pLifeTime     = timeValues.y;
            const pSizeFrom     = sizeValueUniforms.x;
            const pSizeTo       = sizeValueUniforms.y;
            const sizeModulate  = sizeValueUniforms.z;
            const pIntensity    = sizeValueUniforms.w;


                     const lifeTimeTotal = pLifeTime; // 11 = pLifeTime
                     const age = time.sub(spawnTime); // 12 = pSpawnTime

                     const lifeTimeFraction = min(age.div(lifeTimeTotal), 1);
                     const activeOne = max(0, ceil(ONE.sub(lifeTimeFraction)));

                     const colorUvRow = colorCurve.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
                     const colorStrengthCurveRow = alphaCurve.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
                     const sizeCurveRow = sizeCurve.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
                     const frictionCurveRow = dragrCurve.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)

                     const ltCoordX = lifeTimeFraction.sub(ROW_SELECT_FACTOR).add(DATA_PX_OFFSET);


                     const sizeColor = dataTx.sample(vec2(ltCoordX, ONE.sub(sizeCurveRow))) //  lifeTimeFraction));
                     const frictionColor = dataTx.sample(vec2(ltCoordX, ONE.sub(frictionCurveRow))) //  lifeTimeFraction));


                     const sizeMod = sizeModulate.mul(sizeColor.r);
                     const frictionMod = frictionColor.r;

                     const lifecycleSize = sizeMod.add(pSizeFrom.mul(ONE.sub(lifeTimeFraction)).add(pSizeTo.mul(lifeTimeFraction)))


                varyingProperty( 'float', 'p_lifeTimeFraction' ).assign(lifeTimeFraction);
                varyingProperty( 'float', 'v_lifecycleScale' ).assign(lifecycleSize);

                //          colorBuffer.element(instanceIndex).assign(intensityColor);

                const velocityOffset = vec3(pVelocityX, pVelocityY, pVelocityZ).mul(age);

                return particlePosition.add(velocityOffset)

            } )();

        const computeUpdate = Fn( () => {

            const now = time;

                const emitterPositionV4 = emitterPositions.element( instanceIndex );
                const emitterDirectionV3 = emitterDirections.element( instanceIndex );
                const emitterVelV4 = emitterVelocities.element( instanceIndex );
                const emittParamsV4 = emitterParams.element( instanceIndex );
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

                    const offsetTime = emitFraction.mul(tpf)

                    const offsetPos = emitterVel.mul(tpf).sub(emitterDirectionV3.mul(offsetTime)) // .add(vec3(offsetX, offsetY, offsetZ))
                    positionBuffer.element(particleIndex).assign(emitterPos.add(offsetPos))
                    velocityBuffer.element(particleIndex).assign(emitterVel)
                    customTimeBuffer.element(particleIndex).assign(vec2(now.sub(offsetTime), particleDuration))
                    scaleBuffer.element(particleIndex).assign(ONE)
                } );



        } );


        let lastIndex = 0;

        let activeParticles = 0;
        let isActive = false;
        function update() {

            let applyCount = 0;

            for (let i = 0; i < emitterObjects.length; ++i) {
                let obj = emitterObjects[i];
                let gain = obj.userData.gain;
                emitterPositions.array[i].set(obj.position.x, obj.position.y, obj.position.z, gain +1);
                let emitCount = Math.floor(10 + gain*50)
                tempVec.set(0, 0, obj.userData.emitForce);
                tempVec.applyQuaternion(obj.quaternion);
                emitterDirections.array[i].set(tempVec.x, tempVec.y, tempVec.z);
                emitterVelocities.array[i].set(obj.up.x, obj.up.y, obj.up.z, emitCount);
                emitterParams.array[i].set(applyCount, emitCount, 0.1, 0)
                applyCount += emitCount
            }

            emittersLength.value = emitterObjects.length;


            pIndex.value = lastIndex;
            lastIndex += applyCount;

            if (lastIndex + applyCount > maxInstanceCount) {
                lastIndex = 0;
            }

            isActive = true;
            tpf.value = getFrame().tpf;
        //    now.value = getFrame().gameTime;
            ThreeAPI.getRenderer().computeAsync( computeUpdate().compute( emitterObjects.length ) );
        }

        console.log("P Nodes Geo: ", mesh);


        let positions = [];
        let velocities = [];
        let directions = [];
        let params = [];


        for (let i = 0; i < 20; i++) {
            positions.push(new Vector4());
            directions.push(new Vector3());
            velocities.push(new Vector4());
            params.push(new Vector4());
        }

        const emitterPositions = uniformArray(positions)
        const emitterDirections = uniformArray(directions)
        const emitterVelocities = uniformArray(velocities)
        const emitterParams = uniformArray(params)

        const emittersLength = uniform( 0, 'uint' );

        function setParticleEmitterGain(obj3d, config) {
        //    console.log("spawnNodeParticle", pos, vel, config)


            if (obj3d.userData.gain === 0) {
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