/* global module,require*/

// SQL Connection
var sql = require("mssql");
var config = null;
var logger = null;
var pool = null;

/**
 * initialize SQL connection.
 */
function setupSql() {
    sql.connect(this.config).then(function(p) {
        pool = p;
    }).then(function(result) {
        if(result) {
            console.dir(result);
        }
    }).catch(function(err) {
        // ... error checks
        console.log("Error?: " + err);
    });

    sql.on("error", function(err) {
        // ... error handler
        console.log("On Error?: " + err);
    });
}

// Query
/*    var query = "SELECT TOP 10 meet.meet_id, meet.meet_type, meet.meet_date, item.item_id, item.caption, page.page_id, " +
    "page.subdir, page.page_description, page.orig_extens, vault.vault_path FROM [sire].[alpha].[ans_meetings] " +
    "meet INNER JOIN [alpha].[ans_meet_items] item ON item.meet_id = meet.meet_id INNER JOIN [alpha].[published_meetings_Page] " +
    "page ON item.item_id = page.item_id INNER JOIN [sire].[alpha].[published_meetings_Doc] doc ON doc.meet_id = meet.meet_id " +
    "INNER JOIN [alpha].[ans_vaults] vault ON vault.vault_id = doc.vault_id ORDER BY vault.vault_path, page.subdir";
*/
/*    new sql.Request().query(query).then(function(recordset) {
        console.dir(recordset);
    }).catch(function(err) {
        console.log(err);
    });
*/
    // Stored Procedure

/*    new sql.Request()
    .input('input_parameter', sql.Int, value)
    .output('output_parameter', sql.VarChar(50))
    .execute('procedure_name').then(function(recordsets) {
        console.dir(recordsets);
    }).catch(function(err) {
        // ... execute error checks
    });
*/
    // ES6 Tagged template literals (experimental)

    // sql.query`select * from mytable where id = ${value}`.then(function(recordset) {
    //     console.dir(recordset);
    // }).catch(function(err) {
    //     // ... query error checks
    // });

/**
 * Insert new request into database.
 * @param {Request} newRequest
 */
function insertRequest(newRequest) {
    // Query

    //     return pool.request()
    //     .input('input_parameter', sql.Int, value)
    //     .query('select * from mytable where id = @input_parameter')
    // }).then(result => {
    // console.dir(recordset);


    var transaction = new sql.Transaction(pool);
    transaction.begin().then(function() {
        var request = new sql.Request(transaction);

        request.input("meetingId", newRequest.meetingId);
        request.input("firstName",newRequest.firstName);
        request.input("lastName", newRequest.lastName);
        request.input("official", newRequest.official);
        request.input("agency", newRequest.agency);
        request.input("item", newRequest.item);
        request.input("offAgenda", newRequest.offAgenda);
        request.input("subTopic", newRequest.subTopic);
        request.input("stance", newRequest.stance);
        request.input("notes", newRequest.notes);
        request.input("phone", newRequest.phone);
        request.input("email", newRequest.email);
        request.input("address", newRequest.address);
        request.input("timeToSpeak", newRequest.timeToSpeak);
        var query = "Insert into Request (meetingId,firstName,lastName,official,agency,item,offAgenda,subTopic,stance,notes,phone,email,address,timeToSpeak) ";
        query += "values (@meetingId,@firstName,@lastName,@official,@agency,@item,@offAgenda,@subTopic,@stance,@notes,@phone,@email,@address,@timeToSpeak)";
        console.log("Statement: " + query);
        request.query(query).then(function() {
            transaction.commit().then(function(recordSet) {
                console.log(recordSet);
            }).catch(function(err) {
                console.log("Error in Transaction Commit " + err);
            });
        }).catch(function(err) {
            console.log("Error in Transaction Begin " + err);
        });
    }).catch(function(err) {
        console.log(err);
    });
}

module.exports = function(config, logger) {
    // config is delivered frozen and this causes problems in mssql. So, just copy over.
    this.config = {
        server: config.server,
        database: config.database,
        user: config.user,
        password: config.password,
        port: config.port
    };

    this.logger = logger;

    setupSql();

    return {
        version: "1.0",
        dbType: "Microsoft SQL Server",
        addRequest: insertRequest,
        setupSql: setupSql
    };
};
