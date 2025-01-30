class BatchInstance {
    constructor() {

        let id = null;
        let batchedMesh = null;

        function activateInstance(n, bMesh) {
            id = n;
            batchedMesh = bMesh;
        }

        function transformObj(obj3d) {
            obj3d.updateMatrix();
            batchedMesh.setMatrixAt(id, obj3d.matrix)
        }

        function getId() {
            return id;
        }

        this.call = {
            activateInstance:activateInstance,
            transformObj:transformObj,
            getId:getId
        }

    }


}

export { BatchInstance }