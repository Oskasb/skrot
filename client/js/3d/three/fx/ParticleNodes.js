import {min, transformNormalToView, uniform, texture, vec2} from "three/tsl";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {
    floor,
    Fn,
    instancedArray,
    instanceIndex,
    max,
    positionLocal,
    vec3,
    time, uv, If
} from "../../../../../libs/three/Three.TSL.js";
import {Vector2, Vector4} from "three/webgpu";
import {getFrame} from "../../../application/utils/DataUtils.js";
import {customSpriteUv8x8} from "./NodeParticleGeometry.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {MATH} from "../../../application/MATH.js";

class ParticleNodes {
    constructor(material, maxInstanceCount) {

        const pCurves = uniform(new Vector4() );
        const pPosition = uniform(new Vector3() );
        const pVelocity = uniform(new Vector3() );
        const pSizeFromToMod = uniform(new Vector3() );
        const pScale = uniform(1 );
        const pIndex = uniform( 0);
        const tpf = uniform(0)
        const pLifeTime = uniform(1);
        const curvesBuffer = instancedArray( maxInstanceCount, 'vec4' );
        const colorBuffer = instancedArray( maxInstanceCount, 'vec3' );
        const positionBuffer = instancedArray( maxInstanceCount, 'vec3' );
        const velocityBuffer = instancedArray( maxInstanceCount, 'vec3' );
        const scaleBuffer = instancedArray( maxInstanceCount);
        const sizeBuffer = instancedArray( maxInstanceCount, 'vec3');
        const timeBuffer = instancedArray( maxInstanceCount, 'vec2');

        const activeIndexArray = new Float32Array( maxInstanceCount );
        const activeIndexBuffer = instancedArray( activeIndexArray ).label( 'ActiveIndex' );

        const ONE = uniform( 1);
        const ZERO = uniform( 0);
        const duration = uniform( 3)

        const DATA_ROWNS = 128;
        const DATA_PX_OFFSET = 0.5 / DATA_ROWNS;
        const ROW_SELECT_FACTOR = DATA_PX_OFFSET * 2;

        const dataTx = texture(material.dataTexture);
        const colorTx = texture(material.map);

        const applyParticle = Fn( () => {
            curvesBuffer.element( pIndex ).assign(pCurves);
            positionBuffer.element( pIndex ).assign(pPosition);
            velocityBuffer.element( pIndex ).assign(pVelocity);
            sizeBuffer.element(pIndex).assign(pSizeFromToMod);
            timeBuffer.element(pIndex).assign(vec2(0, pLifeTime));
        } )().compute( 1 );

        material.positionNode = positionBuffer.toAttribute();
        material.rotationNode = sizeBuffer.toAttribute().mul(99).add(time.sin().mul(0.1));
        material.scaleNode = scaleBuffer.toAttribute();
    //    material.normalNode = transformNormalToView(vec3(0, 1, 0));

        material.colorNode = Fn( () => {

        //    If(activeIndexBuffer.element(instanceIndex).equals(ZERO)).discard();

            const txColor = colorTx.sample(customSpriteUv8x8());
            const color =  colorBuffer.element(instanceIndex)
            return color.mul(txColor);
        } )();

        const computeUpdate = Fn( () => {
                    // color - colorStrength - sizeCurve - velocityDrag
            const timeInit = timeBuffer.element(instanceIndex);
            const lifeTimeTotal = timeInit.y;
            const age = timeInit.x;
            timeInit.assign(vec2(age.add(tpf), lifeTimeTotal));
            const lifeTimeFraction = age.div(lifeTimeTotal);
            const activeOne = max(0, ONE.sub(lifeTimeFraction).sign())
            activeIndexBuffer.element(instanceIndex).assign(activeOne)

            const curves = curvesBuffer.element(instanceIndex);
            const position = positionBuffer.element(instanceIndex);
            const sizeFromToMod = sizeBuffer.element(instanceIndex);
            const velocity = velocityBuffer.element( instanceIndex );
            const colorUvRow = curves.x.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
            const colorStrengthCurveRow = curves.y.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
            const sizeCurveRow = curves.z.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
            const frictionCurveRow = curves.z.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)

            const ltCoordX = (lifeTimeFraction.sub(ROW_SELECT_FACTOR)).add(DATA_PX_OFFSET);

            const curveColor = dataTx.sample(vec2(ltCoordX, ONE.sub(colorUvRow))) //  lifeTimeFraction));
            const stengthColor = dataTx.sample(vec2(ltCoordX, ONE.sub(colorStrengthCurveRow))) //  lifeTimeFraction));
            const sizeColor = dataTx.sample(vec2(ltCoordX, ONE.sub(sizeCurveRow))) //  lifeTimeFraction));
            const frictionColor = dataTx.sample(vec2(ltCoordX, ONE.sub(frictionCurveRow))) //  lifeTimeFraction));

            const stengthMod = stengthColor.r;
            const sizeMod = sizeFromToMod.z.mul(sizeColor.r);
            const frictionMod = frictionColor.r;

            const lifecycleSize = sizeMod.add(sizeFromToMod.x.mul(ONE.sub(lifeTimeFraction)).add(sizeFromToMod.y.mul(lifeTimeFraction)))

            colorBuffer.element(instanceIndex).assign(curveColor.mul(stengthMod));
            position.addAssign(velocity.mul(tpf).mul(frictionMod));

            const scale = scaleBuffer.element(instanceIndex);
            scale.assign(lifecycleSize.mul(activeOne))

        } );

        const computeParticles = computeUpdate().compute( maxInstanceCount );

        let lastIndex = 0;

        let activeParticles = 0;
        let isActive = false;
        function update() {

            isActive = true;
            tpf.value = getFrame().tpf;
            ThreeAPI.getRenderer().computeAsync( computeParticles );
        }

        function spawnNodeParticle(pos, vel, config) {
        //    console.log("spawnNodeParticle", pos, vel, config)
            let curves = config.curves;
            let params = config.params;
            pCurves.value.set(
                ENUMS.ColorCurve[curves.color || 'brightMix'],
                ENUMS.ColorCurve[curves.alpha || 'oneToZero'],
                ENUMS.ColorCurve[curves.size  || 'oneToZero'],
                ENUMS.ColorCurve[curves.drag  || 'zeroToOne']
            ); // color - alpha - size - drag

            pPosition.value.copy( pos );
            let pPosSpread = params['pPosSpread']
            if (pPosSpread) {
                let randomVec = MATH.randomVector()
                randomVec.multiplyScalar(MATH.randomBetween(pPosSpread[0], pPosSpread[1]))
                pPosition.value.add(randomVec);
            }

            pVelocity.value.copy( vel );
            let pVelSpread = params['pVelSpread']
            if (pVelSpread) {
                let randomVec = MATH.randomVector()
                randomVec.multiplyScalar(MATH.randomBetween(pVelSpread[0], pVelSpread[1]))
                pVelocity.value.add(randomVec);
            }

            pSizeFromToMod.value.set(
                MATH.randomBetween(params.pSizeFrom[0], params.pSizeFrom[1]),
                MATH.randomBetween(params.pSizeTo[0], params.pSizeTo[1]),
                MATH.randomBetween(params.pSizeMod[0], params.pSizeMod[1])
            );

            pLifeTime.value = MATH.randomBetween(params.pLifeTime[0], params.pLifeTime[1]);

            pIndex.value = lastIndex;
            lastIndex++;
            if (lastIndex > maxInstanceCount) {
                lastIndex = 0;
            }
            ThreeAPI.getRenderer().computeAsync( applyParticle );
            activeParticles++;

            if (isActive === false) {
                ThreeAPI.registerPrerenderCallback(update)
            }

        }

        this.call = {
            spawnNodeParticle:spawnNodeParticle
        }
    }
}

export { ParticleNodes }