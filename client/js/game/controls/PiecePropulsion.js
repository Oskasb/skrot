class PiecePropulsion {
    constructor(pointName, json) {
        this.id = pointName;
        this.json = json;
        this.force = json.force;
    }

}

export { PiecePropulsion };