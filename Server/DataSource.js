class DataSource {
    constructor(id, system) {
        this.id = id;
        this.system = system
    }

    fetch = function (method, args, data, clientId) {
        if (this.system[method]) {
            return JSON.stringify({id: this.id, data: this.system[method](data, clientId)});
        } else {
            return JSON.stringify({id: this.id, data: "No Data to fetch for " + this.id});
        }
    };

}

export {DataSource}