

class SimpleStatus {
    constructor(statusValues) {
        this.statusMap = statusValues || {};
    }

    setStatusKey(key, status) {
        this.statusMap[key] = status;
    }

    getStatus(key) {
        if (!key) {
            return this.statusMap;
        }
        return this.statusMap[key];
    }

    getStatusByKey(key) {
        if (!key) {
            return this.statusMap;
        }
        return this.statusMap[key];
    }

}

export { SimpleStatus }