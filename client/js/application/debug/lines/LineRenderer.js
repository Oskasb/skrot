import {
    BufferAttribute,
    BufferGeometry,
    DoubleSide,
    LineSegments,
    NoBlending
} from "../../../../../libs/three/Three.Core.js";
import { LineBasicNodeMaterial} from "../../../../../libs/three/materials/nodes/NodeMaterials.js";

function vecByIndex(vec, i) {
    if (i === 0) return vec.x;
    if (i === 1) return vec.y;
    if (i === 2) return vec.z;
};

class LineRenderer {
    constructor() {
        this.isActive = false;
        this._numRenderingLines = 0;
        this.MAX_NUM_LINES = 50000;

    this.geometry = new BufferGeometry();
        //        this.geometry = new LineGeometry();

        let positions = new Float32Array( this.MAX_NUM_LINES * 6 ); // 3 vertices per point
        this.geometry.setAttribute( 'position', new BufferAttribute( positions, 3 ) );




        let colors = new Float32Array( this.MAX_NUM_LINES * 6 ); // 3 vertices per point
        this.geometry.setAttribute( 'color', new BufferAttribute( colors, 3 ) );


        this.positions = this.geometry.attributes.position.array;
        this.colors = this.geometry.attributes.color.array;

        //    this.positions = positions;
        //    this.colors = colors;

    //    this.geometry.setPositions( positions );
    //    this.geometry.setColors( colors );

        this.geometry.setDrawRange( 0, 0);

        this.material = new LineBasicNodeMaterial( {
            color: 0xffffff,
            blending:NoBlending,
            fog:false,
            depthTest:false,
            depthWrite:true,
            vertexColors: true,
            side:DoubleSide
        } );

        console.log("LineBasicNodeMaterial", this.geometry, this.material)

        this.line = new LineSegments( this.geometry,  this.material);
        this.line.frustumCulled = false;
        this.line.renderOrder = 1;
        this.line.matrixAutoUpdate = false;

/*
        return;

        this.geometry = new BufferGeometry();
        //   this.geometry = new LineGeometry();

        let positions = new Float32Array( this.MAX_NUM_LINES * 6 ); // 3 vertices per point
        this.geometry.setAttribute( 'position', new BufferAttribute( positions, 3 ) );




        let colors = new Float32Array( this.MAX_NUM_LINES * 6 ); // 3 vertices per point
        this.geometry.setAttribute( 'color', new BufferAttribute( colors, 3 ) );


        this.positions = this.geometry.attributes.position.array;
        this.colors = this.geometry.attributes.color.array;

        //    this.positions = positions;
        //    this.colors = colors;

        //    this.geometry.setPositions( positions );
        //    this.geometry.setColors( colors );

        this.geometry.setDrawRange( 0, 0);

        this.material = new LineBasicNodeMaterial( {
            color: 0xffffff,
            blending:NoBlending,
            fog:false,
            depthTest:false,
            depthWrite:true,
            vertexColors: true,
            side:DoubleSide
        } );

        console.log("LineBasicNodeMaterial", this.geometry, this.material)

        this.line = new LineSegments( this.geometry,  this.material);
        this.line.frustumCulled = false;
        this.line.renderOrder = 1;
        this.line.matrixAutoUpdate = false;

*/
    }




    _addLine(start, end, color) {

        //We can not continue if there is no more space in the buffers.
        if (this._numRenderingLines >= this.MAX_NUM_LINES) {
            console.warn('MAX_NUM_LINES has been exceeded in the LineRenderer.');
            return;
        }

        let vertexIndex = this._numRenderingLines * 6;

        for (let i = 0; i < 3; i++) {

            let firstVertexDataIndex = vertexIndex + i;
            let secondVertexDataIndex = vertexIndex + 3 + i;

            this.positions[firstVertexDataIndex] = vecByIndex(start, i);
            this.positions[secondVertexDataIndex] = vecByIndex(end, i);

            this.colors[firstVertexDataIndex] = vecByIndex(color, i);
            this.colors[secondVertexDataIndex] = vecByIndex(color, i);

        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this._numRenderingLines++;

        this.geometry.setDrawRange( 0, this._numRenderingLines * 2 );

        if (!this.isActive) {

            this.isActive = true;
        }

    };

    _clear() {
        this._numRenderingLines = 0;
        this.geometry.setDrawRange( 0, 0);
    };

    _pause() {
        this._numRenderingLines = 0;
        this.geometry.setDrawRange( 0, this._numRenderingLines * 2 );
    };

    _remove () {
        console.log("Should remove linerenderer here")
        ThreeAPI.getScene().remove( this.line );
    };

}

export { LineRenderer }
