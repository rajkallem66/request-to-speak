/* global module,require*/

// Solr Client
var solr = require("solr-client");
var client = null;
var logger = null;

/**
 * Insert new request into database.
 * @param {Request} newRequest
 */
function insertRequest(newRequest) {
    client.add(newRequest, function(err,obj){
        if(err){
            console.log(err);
        }else{
            console.log(obj);
            client.softCommit(function(err,res){
                if(err){
                    console.log(err);
                }else{
                    console.log(res);
                }
            });
        }
    });
}

module.exports = function(config, logger) {

    this.logger = logger;

    client = solr.createClient(config);

    return {
        version: "1.0",
        dbType: "Apache Solr",
        addRequest: insertRequest,
    };
};
