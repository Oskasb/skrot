
        
class BodyPool {
    constructor(shape, createFunc) {
            let physicsShape = shape;
            let pool = [];

            this.pool = pool;

            var addPatch = function() {
                return createFunc(physicsShape)
            };

            this.generatePatch = function() {
                pool.push(addPatch());
            };
        };

        push(patch) {

            return this.pool.push(patch);
        };

        pop() {
            if (!this.pool.length) {
                this.generatePatch();
            }
            return this.pool.pop()
        };


        shift() {
            if (!this.pool.length) {
                this.generatePatch();
            }
            return this.pool.shift()
        };

        getFromPool() {
            return this.shift()
        };

        returnToPool(body) {
            this.push(body)
        };

        wipePool() {
            this.pool = [];
        };

    }

export {BodyPool}