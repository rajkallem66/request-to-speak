/* global module,require*/
/* eslint no-console: "off" */

// SQL Connection
var sql = require("mssql");
var connectString = "";

/**
 * initialize SQL connection.
 */
function setupSql() {
    sql.connect(connectString).then(function() {
        console.log("connected!!!");
    }).catch(function(err) {
        // ... connect error checks
        console.log(err);
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
 * Add request to database.
 * @param {Request} request - Request to add to db
 */
function addRequest(request) {
    console.log(request.meetingId);
}

module.exports = function(connectString) {
    this.connectString = connectString;
    // setupSql();

    return {
        version: "1.0",
        addRequest: addRequest,
        setupSql: setupSql
    };
};
