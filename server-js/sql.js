/*
 * @Author: One_Random
 * @Date: 2020-08-23 23:04:14
 * @LastEditors: One_Random
 * @LastEditTime: 2020-08-27 11:51:44
 * @FilePath: /FS/js/sql.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */
const MongoClient = require('mongodb').MongoClient;

class MongoDB {
    constructor() {
        
        let url_base = "bW9uZ29kYjovL2ZzX2FkbWluOmFkbWluQDEyNy4wLjAuMToyNzAxNy8/YXV0aFNvdXJjZT1maWxlX3N5c3RlbSZyZWFkUHJlZmVyZW5jZT1wcmltYXJ5JmFwcG5hbWU9TW9uZ29EQiUyMENvbXBhc3MlMjBDb21tdW5pdHkmc3NsPWZhbHNl";
        //ty_updated url换成了服务器ip，方便测试
        //let url_base = "bW9uZ29kYjovL2ZzX2FkbWluOmFkbWluQDEwMS4xMzIuMTQ1LjIwNzoyNzAxNy8/YXV0aFNvdXJjZT1maWxlX3N5c3RlbSZyZWFkUHJlZmVyZW5jZT1wcmltYXJ5JmFwcG5hbWU9TW9uZ29EQiUyMENvbXBhc3MlMjBDb21tdW5pdHkmc3NsPWZhbHNl";
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
     * @name: insert
     * @description: database operation, async function; 
     *               use like: var result = await sql.insert(collection_name, {}, {}});
     * @param {string, json, json}
     *  collection_name
     *  doc
     *  options:
     *      ...  
     * @return boolean
     */
    async insert(collection_name, doc, options={}) {
        try {
            const collection = this.db.collection(collection_name);
            await collection.insertOne(doc, options);
            return true;
        }
        catch(e) {
            console.log('Collection ' + collection_name +' insert error!');
            console.log(e);
            return false;
        }
    }

    /**
     * @name: delete
     * @description: database operation, async function; 
     *               use like: var result = await sql.insert(collection_name, {}, {}});
     * @param {string, json, json}
     *  collection_name
     *  filter
     *  options:
     *      ...  
     * @return boolean
     */
    async delete(collection_name, filter, options={}) {
        try {
            const collection = this.db.collection(collection_name);
            await collection.deleteMany(filter, options);
            return true;
        }
        catch(e) {
            console.log('Collection ' + collection_name +' delete error!');
            console.log(e);
            return false;
        }
    }


    /**
     * @name: find
     * @description: database operation, async function; 
     *               use like: var result = await MongoDB.find(collection_name, {}, {projection: {}});
     * @param {string, json, json}
     *  collection_name
     *  query
     *  options:
     *      limit: 0,
     *      sort: [['a', 1], ['b', -1]],
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

// exports
module.exports = new MongoDB();
// module.exports = {
//     MongoDB: new MongoDB()
// };

function test() {
    async function run() {
        let sql = new MongoDB();
        await sql.connect();

        // insert test
        // await sql.insert('system', {name: "test fs", version: "0.2", update: 00000});
        // var result = await sql.find('system', {},{sort: {version: -1}});
        // console.log(result);

        // delete test
        // await sql.delete('system', {name: "test fs"});
        // var result = await sql.find('system', {},{sort: {version: -1}});
        // console.log(result);

        // find test
        // var result = await sql.find('system', {version: "0.1"}, {projection: {version: 0}});
        // console.log(result);

        // var result = await sql.find('storage', {"id" : "0b132e59-2bd4-4e4d-9df3-f75034b26fff"}, {projection: {version: 0}});
        // console.log(result);

        // update test
        // await sql.update('system', {version: "0.2"}, {$set: {version: "0.1"}});
        // var result = await sql.find('system');
        // console.log(result);

        await sql.disconnect();
    }

    run();
}

test();
