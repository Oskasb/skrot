import {min, transformNormalToView, uniform} from "three/tsl";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {
    floor,
    Fn,
    instancedArray,
    instanceIndex,
    max,
    positionLocal,
    vec3,
    time
} from "../../../../../libs/three/Three.TSL.js";
import {Vector2} from "three/webgpu";

class ParticleNodes {
    constructor(material, maxInstanceCount) {

        const pPosition = uniform(new Vector3() );
        const pVelocity = uniform(new Vector3() );
        const pSizeFromTo = uniform(new Vector2() );
        const pScale = uniform(1 );
        const pIndex = uniform( 0)
        const positionBuffer = instancedArray( maxInstanceCount, 'vec3' );
        const velocityBuffer = instancedArray( maxInstanceCount, 'vec3' );
        const scaleBuffer = instancedArray( maxInstanceCount);
        const sizeBuffer = instancedArray( maxInstanceCount, 'vec2');
        const timeInitBuffer = instancedArray( maxInstanceCount);
        const tpf = uniform( 0.01);
        const ONE = uniform( 1);
        const ZERO = uniform( 0);
        const duration = uniform( 3)


        const applyParticle = Fn( () => {
            positionBuffer.element( pIndex ).assign(pPosition);
            velocityBuffer.element( pIndex ).assign(pVelocity);
            scaleBuffer.element(pIndex).assign(pScale);
            sizeBuffer.element(pIndex).assign(pSizeFromTo);
            timeInitBuffer.element(pIndex).assign(time);
        } )().compute( 1 );

        material.positionNode = Fn( () => {

            const scale = scaleBuffer.element(instanceIndex);
            const position = positionBuffer.element(instanceIndex);
            const sizeFromTo = sizeBuffer.element(instanceIndex);
            const velocity = velocityBuffer.element( instanceIndex );
            const timeInit = timeInitBuffer.element(instanceIndex);
            const age = time.sub(timeInit);
         //   position.add();
         //   scale.assign(sizeFromTo.x)
            return velocity.mul(age).add(position)
        } )();
        material.rotationNode = sizeBuffer.toAttribute().mul(99).add(time.sin().mul(0.1));
        material.scaleNode = scaleBuffer.toAttribute();

        material.normalNode = transformNormalToView(vec3(0, 1, 0));

        const computeUpdate = Fn( () => {

            const scale = scaleBuffer.element(instanceIndex);
            const position = positionBuffer.element(instanceIndex);
            const sizeFromTo = sizeBuffer.element(instanceIndex);
            const velocity = velocityBuffer.element( instanceIndex );
            const timeInit = timeInitBuffer.element(instanceIndex);
            const age = time.sub(timeInit);
            position.addAssign(velocity.mul(0.1));
            scale.assign(sizeFromTo.x)

        } );

        const computeParticles = computeUpdate().compute( maxInstanceCount );

        let lastIndex = 0;

        let activeParticles = 0;
        let isActive = false;
        function update() {
        //    ThreeAPI.getRenderer().computeAsync( computeParticles );
        }

        function spawnNodeParticle(pos, vel, config) {
        //    console.log("spawnNodeParticle", pos, vel, config)
            pPosition.value.copy( pos );
            pVelocity.value.copy( vel );
            pSizeFromTo.value.set(1, 2);
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