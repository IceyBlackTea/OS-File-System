/*
 * @Author: One_Random
 * @Date: 2020-08-23 23:04:14
 * @LastEditors: One_Random
 * @LastEditTime: 2020-08-24 15:19:22
 * @FilePath: /FS/js/sql.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */
const MongoClient = require('mongodb').MongoClient;

class MongoDB {
    constructor() {
        let url_base = "bW9uZ29kYjovL2ZzX2FkbWluOmFkbWluQDEyNy4wLjAuMToyNzAxNy8/YXV0aFNvdXJjZT1maWxlX3N5c3RlbSZyZWFkUHJlZmVyZW5jZT1wcmltYXJ5JmFwcG5hbWU9TW9uZ29EQiUyMENvbXBhc3MlMjBDb21tdW5pdHkmc3NsPWZhbHNl";
        this.url = Buffer.from(url_base, 'base64').toString();
    }

    async connect() {
        try {
            this.connection = await MongoClient.connect(this.url, { useNewUrlParser: true, useUnifiedTopology: true });
            this.db = this.connection.db('file_system');
        }
        catch(e) {
            console.log('Open connection error!');
            console.log(e);
        }
    }

    async disconnect() {
        if (this.connection != undefined) {
            try {
                await this.connection.close();
            }
            catch(e) {
                console.log('Close connection error!');
                console.log(e);
            }
        }
        else {
            console.log('Close connection error!');
            console.log('No connection.');
        }
    }

    /**
     * @name: find
     * @description: database operation, async function; 
     *               use like: var result = await MongoDB.find(collection_name, {}, {proejction: {}});
     * @param {string, json, json}
     *  collection_name
     *  query
     *  options:
     *      limit: 0,
     *      sort: [['a', 1]],
     *      projection: {'a': 1, 'b': 0},
     *      ...  
     * @return json | false 
     */
    async find(collection_name, query={}, options={}) {
        try {
            const collection = this.db.collection(collection_name);
            const result = await collection.find(query, options).toArray();
            return result;
        }
        catch(e) {
            console.log('Collection ' + collection_name +' find error!');
            console.log(e);
            return false;
        }
    }

    /**
     * @name: update
     * @description: database operation, async function; 
     *               use like: var result = await sql.update(collection_name, {}, {$set: {}});
     * @param {string, json, json, json}
     *  collection_name
     *  filter
     *  update: {$set: {'a' : 1}}
     *  options:
     *      ...  
     * @return boolean
     */
    async update(collection_name, filter, update, options={}) {
        try {
            const collection = this.db.collection(collection_name);
            await collection.updateMany(filter, update, options);
            return true;
        }
        catch(e) {
            console.log('Collection ' + collection_name +' update error!');
            console.log(e);
            return false;
        }
    }
}

async function test() {
    sql = new MongoDB();
    await sql.connect();

    // find test
    //var result = await sql.find('system', {version: "0.1"}, {projection: {version: 0}});
    //console.log(result);

    // update test
    // await sql.update('system', {version: "0.2"}, {$set: {version: "0.1"}});
    // var result = await sql.find('system');
    // console.log(result);

    await sql.disconnect();
}

test();
