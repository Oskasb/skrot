import {Fn, transformNormalToView, varyingProperty, vec3} from "../../../../../libs/three/Three.TSL.js";
import {instanceIndex, normalLocal, positionGeometry, positionLocal, time} from "three/tsl";

let NORMAL_NODE_VEGETATION = Fn( () => {
    const up = positionLocal.z;
    const nm = positionLocal.normalize().add(vec3(0, 0, up)).normalize();
//    varyingProperty( 'vec3', 'v_normalView' ).assign(vec3(0, 1, 0)  );
    return transformNormalToView(normalLocal) // transformNormalToView(nm.add(positionLocal.mul(up)).normalize())    //    return transformNormalToView(normalLocal) // .add(transformNormalToView(txNormal).mul(0.8)).normalize() // .add(txNormal).normalize()).mul(cracks).mul(detail);
} )();


let POSITION_NODE_VEGETATION = Fn( () => {
    const upNess = positionGeometry.y;
    const posDir = normalLocal.add(vec3(0, upNess.mul(2).add(0.5), 0)).normalize();
    const sway = time.add(positionGeometry.x).sin().mul(upNess).mul(0.3);
    const swayPos = vec3(positionLocal.x.add(sway.cos()), positionLocal.y, positionLocal.z.add(sway))

    //  normalLocal.assign(vec3(upNess, upNess, upNess))
    varyingProperty( 'vec3', 'v_normalView' ).assign(transformNormalToView(posDir));
    return swayPos // transformNormalToView(nm.add(positionLocal.mul(up)).normalize())    //    return transformNormalToView(normalLocal) // .add(transformNormalToView(txNormal).mul(0.8)).normalize() // .add(txNormal).normalize()).mul(cracks).mul(detail);
} )();

let POSITION_DEBUG = Fn( () => {
    const upNess = positionGeometry.y
    const posDir = vec3(upNess, upNess, upNess) // .normalize();
    return posDir // positionGeometry.normalize() // vec3(0, positionGeometry.y, 0) // positionLocal.normalize() // transformNormalToView(nm.add(positionLocal.mul(up)).normalize())    //    return transformNormalToView(normalLocal) // .add(transformNormalToView(txNormal).mul(0.8)).normalize() // .add(txNormal).normalize()).mul(cracks).mul(detail);
} )();


let customNodes = {}
customNodes['NORMAL_NODE_VEGETATION'] = NORMAL_NODE_VEGETATION;
customNodes['POSITION_NODE_VEGETATION'] = POSITION_NODE_VEGETATION;
customNodes['POSITION_DEBUG'] = POSITION_DEBUG;
export {
    customNodes
}