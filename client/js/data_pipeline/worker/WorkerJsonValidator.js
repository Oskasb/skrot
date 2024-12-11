"use strict";

define([
	'data_pipeline/worker/lib/tv4'
],
	function(
		tv4
		) {



	    var WorkerJsonValidator = function() {
		    this.schemas = {};
		    this.schemaUrlIndex = {};
		    this.schemaUrls = [];
		    this.lastPollIndex = 0;
		    this.schemaPollDelay = 1000;
	    };

		WorkerJsonValidator.prototype.pollNext = function() {

			if (this.schemaUrls.length <= this.lastPollIndex) {
				this.lastPollIndex = 0;
				return;
			}

			this.workerDataLoader.fetchJsonData(this.schemaUrls[this.lastPollIndex]);
			this.lastPollIndex += 1;
		};

		WorkerJsonValidator.prototype.setupSchemaPoll = function() {
			var pollSchemas = function() {
				this.pollNext();
			}.bind(this);

			setInterval(function() {
				pollSchemas();
			}, this.schemaPollDelay)
		};

		WorkerJsonValidator.prototype.handleUpdatedSchemaData = function(url, schemaData, json) {
			this.schemaUrlIndex[url] = json;
			for (var index in schemaData) {
	//			console.log("Schema updated: ", index, schemaData[index], this.schemas, this.schemaUrlIndex);
				this.schemas[index] = schemaData[index];
			}

			this.schemaUrls = [];
			for (var url in this.schemaUrlIndex) {
				this.schemaUrls.push(url);
			}
		};

		WorkerJsonValidator.prototype.processSchemaData = function(url, parsedJson, json) {
			if (this.schemaUrlIndex[url] != json) {
				this.handleUpdatedSchemaData(url, parsedJson, json)
			}
		};

		WorkerJsonValidator.prototype.checkSchemaUpdate = function(url, parsedJson, json) {
			for (var i = 0; i < parsedJson.length; i++) {
				if (parsedJson[i].schemas) {
					this.processSchemaData(url, parsedJson[i].schemas, json);
					return true;
				}
			}
		};

		WorkerJsonValidator.prototype.processDataAgainstSchema = function(data, schema, onInvalid) {
			var valid = tv4.validate(data, schema);
			return valid;
		};

		WorkerJsonValidator.prototype.checkJsonDataAgainstSchemas = function(dataName, data, onInvalid) {
			var valid = true;
			for (var index in this.schemas) {
				if (index == dataName) {
					valid = this.processDataAgainstSchema(data, this.schemas[index], onInvalid);
				}
			}
            return valid;
		};


		WorkerJsonValidator.prototype.validateJson = function(json, parsed, ok, fail) {
			var valid = true;
			for (var i = 0; i < parsed.length; i++) {
				for (var dataName in parsed[i]) {
					// Json here has format [{"dataName":{"theData":{} / []}}] can be several dataNames in each file...
					// Except for schemas which if detected in the data will end up in here!
					valid = this.checkJsonDataAgainstSchemas(dataName, parsed[i], fail)
				}
			}
			if (valid === true) {
				ok(json)
			} else {
				fail([tv4.error.message, tv4.error.schemaPath]);
				console.error("Validate error: ", tv4.error);
			}

		};

		WorkerJsonValidator.prototype.validateDataAsJson = function(dataLoader, url, json, ok, fail) {
			if (!this.workerDataLoader) {
				this.workerDataLoader = dataLoader;
			//	this.setupSchemaPoll();
			}

			try {

				if (typeof(json) == "string") {
					var parsed = JSON.parse(json);
					this.checkSchemaUpdate(url, parsed, json)
					this.validateJson(json, parsed, ok, fail)
				} else {
					var stringified = JSON.stringify(json);
					this.checkSchemaUpdate(url, json, json)
					this.validateJson(json, json, ok, fail)
				}


			} catch (e) {
			//	console.error("json parse error", e);
				fail(e.message);
			}

		};

		return WorkerJsonValidator;

	});