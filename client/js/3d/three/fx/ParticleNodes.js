import {min, transformNormalToView, uniform, texture, vec2, vec4, instance} from "three/tsl";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {
    floor,
    Fn,
    instancedArray,
    instanceIndex,
    max,
    positionLocal,
    vec3,
    time, uv, If, modelViewMatrix, varyingProperty
} from "../../../../../libs/three/Three.TSL.js";
import {Color, Vector2, Vector4} from "three/webgpu";
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
        const pPosition = uniform(new Vector3() );
        const pVelocity = uniform(new Vector3() );
        const pSizeFromToMod = uniform(new Vector3() );
        const pScale = uniform(1 );
        const pIndex = uniform( 0);
        const pIntensity = uniform( 0);
        const tpf = uniform(0)
        const now = uniform(0);
        const pLifeTime = uniform(1);

        const curveData     = new Float32BufferAttribute( new Float32Array( maxInstanceCount * 4 ), 4 );
        const velocityData  = new Float32BufferAttribute( new Float32Array( maxInstanceCount * 4 ), 4 );
        const timeData      = new Float32BufferAttribute( new Float32Array( maxInstanceCount * 4 ), 4 );
        const sizeData      = new Float32BufferAttribute( new Float32Array( maxInstanceCount * 4 ), 4 );

        curveData.updateRanges.push(updateRanges)
        velocityData.updateRanges.push(updateRanges)
        timeData.updateRanges.push(updateRanges)
        sizeData.updateRanges.push(updateRanges)
        curveData.setUsage(DynamicDrawUsage)
        velocityData.setUsage(DynamicDrawUsage)
        timeData.setUsage(DynamicDrawUsage)
        sizeData.setUsage(DynamicDrawUsage)

        mesh.geometry.setAttribute('curveData', curveData)
        mesh.geometry.setAttribute('velocityData', velocityData)
        mesh.geometry.setAttribute('timeData', timeData)
        mesh.geometry.setAttribute('sizeData', sizeData)
        mesh.needsUpdate = true;

        const customCurveBuffer = instancedArray( curveData.array, 'vec4' );
        const customVelocityBuffer = instancedArray( velocityData.array, 'vec4' );
        const customTimeBuffer = instancedArray( timeData.array, 'vec4' );
        const customSizeBuffer = instancedArray( sizeData.array, 'vec4' );
        const colorBuffer = instancedArray( maxInstanceCount, 'vec4' );

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
        material.positionNode = Fn( () => {
        //    varyingProperty( 'vec4', 'v_intensityColor' ).assign(vec4(positionLocal.x.mod(1), positionLocal.y.mod(1), positionLocal.z.mod(1), 1));
            return positionLocal;
        } )();


    //    material.rotationNode = sizeBuffer.toAttribute().mul(99).add(time.sin().mul(0.1));
    //    material.scaleNode = scaleBuffer.toAttribute();
    //    material.normalNode = transformNormalToView(vec3(0, 1, 0));

        material.colorNode = Fn( () => {


            const txColor = colorTx.sample(customSpriteUv8x8());
            const color =  varyingProperty( 'vec4', 'v_intensityColor' ) // colorBuffer.element(instanceIndex)
            return txColor.mul(color.xyz).mul(color.w);
        } )();

        material.geometryNode = Fn( ({ renderer, geometry, object }) => {
                    // color - colorStrength - sizeCurve - velocityDrag


            const curveData =  customCurveBuffer.element(instanceIndex);
            const velocityData = customVelocityBuffer.element(instanceIndex);
            const timeData = customTimeBuffer.element(instanceIndex)
            const sizeData = customSizeBuffer.element(instanceIndex)

            /*
            matrix[0] = colorCurve;
            matrix[1] = alphaCurve;
            matrix[2] = sizeCurve;
            matrix[3] = dragrCurve;
            matrix[4] = pVelocity.x;
            matrix[5] = pVelocity.y;
            matrix[6] = pVelocity.z;
            matrix[7] = pSizeFrom
            matrix[8] = pSizeTo
            matrix[9] = sizeModulate
            matrix[10] = pIntensity;
            matrix[11] = pLifeTime;
            matrix[12] = spawnTime;
             */


                     const lifeTimeTotal = timeData.x; // 11 = pLifeTime
                     const age = now.sub(timeData.y); // 12 = pSpawnTime

                     const lifeTimeFraction = age.div(lifeTimeTotal);
                     const activeOne = max(0, ONE.sub(lifeTimeFraction).sign())
                //    positionLocal.assign(positionLocal.mul(activeOne))

                     const colorUvRow = curveData.x.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
                     const colorStrengthCurveRow = curveData.y.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
                     const sizeCurveRow = curveData.z.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
                     const frictionCurveRow = curveData.w.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)

                     const ltCoordX = (lifeTimeFraction.sub(ROW_SELECT_FACTOR)).add(DATA_PX_OFFSET);

                     const curveColor = dataTx.sample(vec2(ltCoordX, ONE.sub(colorUvRow))) //  lifeTimeFraction));
                     const stengthColor = dataTx.sample(vec2(ltCoordX, ONE.sub(colorStrengthCurveRow))) //  lifeTimeFraction));
                     const sizeColor = dataTx.sample(vec2(ltCoordX, ONE.sub(sizeCurveRow))) //  lifeTimeFraction));
                     const frictionColor = dataTx.sample(vec2(ltCoordX, ONE.sub(frictionCurveRow))) //  lifeTimeFraction));

                     const strengthMod = stengthColor.r;
                     const sizeMod = sizeData.z.mul(sizeColor.r);
                     const frictionMod = frictionColor.r;

                     const lifecycleSize = sizeMod.add(sizeData.x.mul(ONE.sub(lifeTimeFraction)).add(sizeData.y.mul(lifeTimeFraction)))

                    const intensityColor = vec4(curveColor.r.mul(strengthMod), curveColor.g.mul(strengthMod), curveColor.b.mul(strengthMod), pIntensity.mul(strengthMod))
                    const testColor = vec4(age.mod(1), age.mod(2), age.mod(0.5), age.mod(3))
                    varyingProperty( 'vec4', 'v_intensityColor' ).assign(testColor);
               //                  colorBuffer.element(instanceIndex).assign(intensityColor);
             /*
                                 /*
                                 position.addAssign(velocity.mul(tpf).mul(frictionMod));
                                 const scale = scaleBuffer.element(instanceIndex);
                                 scale.assign(lifecycleSize.mul(activeOne))
                                 */
        //    return positionLocal;
        } )();

    //    const computeParticles = computeUpdate().compute( maxInstanceCount );

        let lastIndex = 0;

        let activeParticles = 0;
        let isActive = false;
        function update() {

            isActive = true;
            tpf.value = getFrame().tpfAvg;
            now.value = getFrame().gameTime;
        //    ThreeAPI.getRenderer().computeAsync( computeParticles );
        }

        console.log("P Nodes Geo: ", mesh);

        function spawnNodeParticle(pos, vel, config) {
        //    console.log("spawnNodeParticle", pos, vel, config)

            const matrixElements = tempMatrix.elements; // mat4, 16 elements

            let curves = config.curves;
            let params = config.params;

            let colorCurve = ENUMS.ColorCurve[curves.color || 'brightMix']
            let alphaCurve = ENUMS.ColorCurve[curves.alpha || 'oneToZero']
            let sizeCurve  = ENUMS.ColorCurve[curves.size  || 'oneToZero']
            let dragrCurve = ENUMS.ColorCurve[curves.drag  || 'zeroToOne']



        //    tempColor.set(colorCurve, alphaCurve, sizeCurve)
            mesh.setColorAt(lastIndex, tempColor);

            pCurves.value.set(
                colorCurve,
                alphaCurve,
                sizeCurve,
                dragrCurve
            ); // color - alpha - size - drag


            pVelocity.value.copy( vel );
            let pVelVariance = params['pVelVariance']
            if (pVelVariance) {
                let variance = MATH.randomBetween(pVelVariance[0], pVelVariance[1])
                pVelocity.value.multiplyScalar(1 + variance)
            }



            let pVelSpread = params['pVelSpread']
            if (pVelSpread) {
                let randomVec = MATH.randomVector();
                let speed = vel.length();
                randomVec.multiplyScalar(MATH.randomBetween(pVelSpread[0]*speed, pVelSpread[1]*speed))
                MATH.spreadVector(pVelocity.value, randomVec)
            }



            pSizeFromToMod.value.set(
                MATH.randomBetween(params.pSizeFrom[0], params.pSizeFrom[1]),
                MATH.randomBetween(params.pSizeTo[0], params.pSizeTo[1]),
                MATH.randomBetween(params.pSizeMod[0], params.pSizeMod[1])
            );


            pIntensity.value = MATH.randomBetween(params.pIntensity[0], params.pIntensity[1]);
            pLifeTime.value = MATH.randomBetween(params.pLifeTime[0], params.pLifeTime[1]);

            tempVec4.x = colorCurve;
            tempVec4.y = alphaCurve;
            tempVec4.z = sizeCurve;
            tempVec4.w = dragrCurve;
            tempVec4.toArray( customCurveBuffer.value, lastIndex * 4 );
            curveData.needsUpdate = true;
            tempVec4.x = pVelocity.value.x;
            tempVec4.y = pVelocity.value.y;
            tempVec4.z = pVelocity.value.z;
            tempVec4.w = 0;
            tempVec4.toArray( customVelocityBuffer.value, lastIndex * 4 );
            tempVec4.x = pLifeTime.value;
            tempVec4.y = getFrame().gameTime
            tempVec4.z = 0
            tempVec4.w = 0;
            tempVec4.toArray( customTimeBuffer.value, lastIndex * 4 );
            tempVec4.x = pSizeFromToMod.value.x;
            tempVec4.y = pSizeFromToMod.value.y;
            tempVec4.z = pSizeFromToMod.value.z;
            tempVec4.w = pIntensity.value;
            tempVec4.toArray( customSizeBuffer.value, lastIndex * 4 );

            customCurveBuffer.needsUpdate = true;
            customVelocityBuffer.needsUpdate = true;
            customTimeBuffer.needsUpdate = true;
            customSizeBuffer.needsUpdate = true;

            pIndex.value = lastIndex;

            tempObj.position.copy(pos);
            tempObj.lookAt(vel);
            tempObj.updateMatrix();
            mesh.setMatrixAt(lastIndex, tempObj.matrix);

            lastIndex++;
            if (lastIndex > maxInstanceCount) {
                lastIndex = 0;
            }

        //    ThreeAPI.getRenderer().compute( applyParticle );
            activeParticles++;

            if (isActive === false) {
                console.log(mesh.geometry.attributes)
                ThreeAPI.registerPrerenderCallback(update)
            }

        }

        this.call = {
            spawnNodeParticle:spawnNodeParticle
        }
    }
}

export { ParticleNodes }