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
    time, uv
} from "../../../../../libs/three/Three.TSL.js";
import {Vector2, Vector4} from "three/webgpu";
import {getFrame} from "../../../application/utils/DataUtils.js";
import {customSpriteUv8x8} from "./NodeParticleGeometry.js";

class ParticleNodes {
    constructor(material, maxInstanceCount) {

        const pCurves = uniform(new Vector4() );
        const pPosition = uniform(new Vector3() );
        const pVelocity = uniform(new Vector3() );
        const pSizeFromTo = uniform(new Vector2() );
        const pScale = uniform(1 );
        const pIndex = uniform( 0);
        const tpf = uniform(0)
        const pLifeTime = uniform(1);
        const curvesBuffer = instancedArray( maxInstanceCount, 'vec4' );
        const colorBuffer = instancedArray( maxInstanceCount, 'vec3' );
        const positionBuffer = instancedArray( maxInstanceCount, 'vec3' );
        const velocityBuffer = instancedArray( maxInstanceCount, 'vec3' );
        const scaleBuffer = instancedArray( maxInstanceCount);
        const sizeBuffer = instancedArray( maxInstanceCount, 'vec2');
        const timeBuffer = instancedArray( maxInstanceCount, 'vec2');
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
            scaleBuffer.element(pIndex).assign(pScale);
            sizeBuffer.element(pIndex).assign(pSizeFromTo);
            timeBuffer.element(pIndex).assign(vec2(0, pLifeTime));
        } )().compute( 1 );

        material.positionNode = positionBuffer.toAttribute();
        material.rotationNode = sizeBuffer.toAttribute().mul(99).add(time.sin().mul(0.1));
        material.scaleNode = scaleBuffer.toAttribute();
    //    material.normalNode = transformNormalToView(vec3(0, 1, 0));

        material.colorNode = Fn( () => {
            const txColor = colorTx.sample(customSpriteUv8x8());
            const color =  colorBuffer.element(instanceIndex)
            return color.mul(txColor);
        } )();

        const computeUpdate = Fn( () => {
                    // color - colorStrength - sizeCurve - velocityDrag
            const curves = curvesBuffer.element(instanceIndex);
            const scale = scaleBuffer.element(instanceIndex);
            const position = positionBuffer.element(instanceIndex);
            const sizeFromTo = sizeBuffer.element(instanceIndex);
            const velocity = velocityBuffer.element( instanceIndex );
            const timeInit = timeBuffer.element(instanceIndex);
            const age = timeInit.x;
            const lifeTimeTotal = timeInit.y;

            timeInit.assign(vec2(age.add(tpf), lifeTimeTotal));

            const lifeTimeFraction = age.div(lifeTimeTotal);
            const colorUvRow = curves.x.mul(ROW_SELECT_FACTOR).sub(DATA_PX_OFFSET)
            const curveColor = dataTx.sample(vec2(lifeTimeFraction, ONE.sub(colorUvRow))) //  lifeTimeFraction));
            colorBuffer.element(instanceIndex).assign(curveColor);
            position.addAssign(velocity.mul(tpf));

            const activeOne = max(0, ONE.sub(lifeTimeFraction).sign())

            scale.assign(sizeFromTo.x.mul(activeOne))

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
            pCurves.value.set( 23, 5, 7, 10 ); // color - colorStrength - sizeCurve - velocityDrag
            pPosition.value.copy( pos );
            pVelocity.value.copy( vel );
            pSizeFromTo.value.set(1, 2);
            pLifeTime.value = 0.3;
            pScale.value = 1;
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