const mysql = require('mysql');

client = typeof client === 'undefined' ? undefined : client
let initClient = function(event) {
    if (typeof client === 'undefined') {
        client = mysql.createConnection({
            host: event['host'] || process.env['host'],
            user: event['username'] || process.env['username'],
            password: event['password'] || process.env['password'],
            port: event['port'] || process.env['port'] || 3306,
            database: event['database'] || process.env['database'],
            multipleStatements: true
        });
        client.connect()
    }
    return client
}

let query = async (sql, params) => {
    return new Promise((resolve, reject) => {
        client.query(sql, params, (err, results) => {
            if (err){
                reject(err);
            }
            resolve(results);
        });
    });
};

let checkEnvironments = async function() {
    try {
        await query('SELECT * FROM lambda_scheduler.events')
    } catch (e) {
        await query('CREATE DATABASE IF NOT EXISTS lambda_scheduler character set UTF8mb4 collate utf8mb4_bin')
        await query('CREATE TABLE IF NOT EXISTS lambda_scheduler.events AS SELECT * FROM information_schema.events')
        await query('ALTER TABLE lambda_scheduler.events ADD PRIMARY KEY(EVENT_SCHEMA, EVENT_NAME)')
    }
}

let updateEventScheduler = async function() {
    await query('REPLACE INTO lambda_scheduler.events\n' +
        'SELECT e.EVENT_CATALOG, e.EVENT_SCHEMA, e.EVENT_NAME, e.DEFINER, e.TIME_ZONE, e.EVENT_BODY, e.EVENT_DEFINITION, e.EVENT_TYPE, e.EXECUTE_AT, e.INTERVAL_VALUE, e.INTERVAL_FIELD, e.SQL_MODE, e.STARTS, e.ENDS, e.STATUS, e.`ON_COMPLETION`, e.CREATED, e.LAST_ALTERED, le.`LAST_EXECUTED`, e.EVENT_COMMENT, e.ORIGINATOR, e.CHARACTER_SET_CLIENT, e.COLLATION_CONNECTION, e.`DATABASE_COLLATION` FROM information_schema.events e, lambda_scheduler.events le where e.event_schema = le.event_schema and e.event_name = le.event_name')
}

let getExecutableEvents = async function() {
    return await query("SELECT * FROM lambda_scheduler.events WHERE status = 'ENABLED' AND (starts < now() or starts is null) AND (ends > now() or ends is null) and (last_executed is null or " +
        "(CASE interval_field " +
        "WHEN 'YEAR' THEN last_executed + INTERVAL interval_value YEAR " +
        "WHEN 'MONTH' THEN last_executed + INTERVAL interval_value MONTH " +
        "WHEN 'WEEK' THEN last_executed + INTERVAL interval_value WEEK " +
        "WHEN 'DAY' THEN last_executed + INTERVAL interval_value DAY " +
        "WHEN 'HOUR' THEN last_executed + INTERVAL interval_value HOUR " +
        "WHEN 'MINUTE' THEN last_executed + INTERVAL interval_value MINUTE " +
        "WHEN 'SECOND' THEN last_executed + INTERVAL interval_value SECOND " +
        "END < now())" +
        ");")
}

let executeEvent = async function(event) {
    await query(`use ${event['EVENT_SCHEMA']}`)
    let qry = event['EVENT_DEFINITION'].replace(/^BEGIN/, '').replace(/END$/, '').trim()
    let name = event['EVENT_SCHEMA'] + '.' + event['EVENT_NAME']
    console.log(`EXECUTE QUERY ${name}`)
    let stime = +new Date
    await query(qry)
    let etime = +new Date
    await query('UPDATE lambda_scheduler.events SET last_executed = now() WHERE EVENT_SCHEMA = ? AND EVENT_NAME = ?',
        [event['EVENT_SCHEMA'], event['EVENT_NAME']])
    console.log(`DONE QUERY ${name} : ${etime - stime}ms`)

}

exports.handler = async function (event, context) {
    context.callbackWaitsForEmptyEventLoop = false;
    initClient(event)
    await checkEnvironments()
    await updateEventScheduler()
    let events = await getExecutableEvents()

    for (let idx in events) {
        let e = events[idx]
        await executeEvent(e)
    }

    return 'SUCCESS'
};

