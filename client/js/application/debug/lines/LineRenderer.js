class LineRenderer {
    constructor() {
        this.isActive = false;
        this._numRenderingLines = 0;
        this.MAX_NUM_LINES = 50000;

        this.geometry = new THREE.BufferGeometry();

        let positions = new Float32Array( this.MAX_NUM_LINES * 6 ); // 3 vertices per point
        this.geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );

        this.positions = this.geometry.attributes.position.array;


        var colors = new Float32Array( this.MAX_NUM_LINES * 6 ); // 3 vertices per point
        this.geometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );


        this.positions = this.geometry.attributes.position.array;
        this.colors = this.geometry.attributes.color.array;

        this.geometry.setDrawRange( 0, 0);

        this.material = new THREE.LineBasicMaterial( {
            color: 0xffffff,
            blending:THREE.NoBlending,
            fog:false,
            depthTest:false,
            depthWrite:true,
            vertexColors: true,
            side:THREE.DoubleSide
        } );

        this.line = new THREE.LineSegments( this.geometry,  this.material);
        this.line.frustumCulled = false;
        this.line.renderOrder = 1;

    }


    vecByIndex = function(vec, i) {
        if (i === 0) return vec.x;
        if (i === 1) return vec.y;
        if (i === 2) return vec.z;
    };

    _addLine = function (start, end, color) {

        //We can not continue if there is no more space in the buffers.
        if (this._numRenderingLines >= this.MAX_NUM_LINES) {
            console.warn('MAX_NUM_LINES has been exceeded in the LineRenderer.');
            return;
        }

        let vertexIndex = this._numRenderingLines * 6;

        for (let i = 0; i < 3; i++) {

            let firstVertexDataIndex = vertexIndex + i;
            let secondVertexDataIndex = vertexIndex + 3 + i;

            this.positions[firstVertexDataIndex] = this.vecByIndex(start, i);
            this.positions[secondVertexDataIndex] = this.vecByIndex(end, i);

            this.colors[firstVertexDataIndex] = this.vecByIndex(color, i);
            this.colors[secondVertexDataIndex] = this.vecByIndex(color, i);

        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this._numRenderingLines++;

        this.geometry.setDrawRange( 0, this._numRenderingLines * 2 );

        if (!this.isActive) {

            this.isActive = true;
        }

    };

    _clear = function () {
        this._numRenderingLines = 0;
        this.geometry.setDrawRange( 0, 0);
    };

    _pause = function () {
        this._numRenderingLines = 0;
        this.geometry.setDrawRange( 0, this._numRenderingLines * 2 );
    };

    _remove = function () {
        console.log("Should remove linerenderer here")
        ThreeAPI.getScene().remove( this.line );
    };

}

export { LineRenderer }
