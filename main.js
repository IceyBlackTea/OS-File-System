/*
 * @Author: One_Random
 * @Date: 2020-08-23 11:17:12
 * @LastEditors: One_Random
 * @LastEditTime: 2020-08-29 23:19:07
 * @FilePath: /FS/main.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */

const express = require('express');
const app = express();

const sfs = require('./js/sfs.js');
const system = new sfs.System();

// const path = require('path');

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/html/index.html")
});

app.get('/shell', (req, res) => {
    res.sendFile(__dirname + "/html/shell.html")
});

app.get('/shell/get/:cmd', (req, res) => {
    let cmd = req.params['cmd'];

    if (cmd == 'ls') {
        system.list(system.device);
        system.log.send(res);
    }

    if (cmd.search(/mkdir/))

    // if (cmd == 'send') {
    //     system.log.send(res);
    // }
    // else if (cmd == 'wrong') {
    //     res.status('400').send();
    // }

    // if (cmd == "system info") {
    //     system.show_system_info();
    // }
    
    res.end();
});

app.get('/shell/get/:cmd/:args', (req, res) => {
    let cmd = req.params['cmd'];
    let args = req.params['args'];
    cmd = cmd + " " + args;

    if (cmd == 'mkdir a') {
        system.new_folder('root', "/root", "a");
    }
    else if (cmd == 'mkdir root') {
        system.new_folder('root', "/", "root");
    }
    else if (cmd == 'mkdir b') {
        system.new_folder('root', "/root/a", "b");
    }
    else if (cmd == 'rm a') {
        system.delete_folder('root', "/root", "a");
    }

    // if (cmd.search(/mkdir/))

    // if (cmd == 'send') {
    //     system.log.send(res);
    // }
    // else if (cmd == 'wrong') {
    //     res.status('400').send();
    // }

    // if (cmd == "system info") {
    //     system.show_system_info();
    // }
    
    res.end();
});

app.listen(9005);   


