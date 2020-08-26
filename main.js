/*
 * @Author: One_Random
 * @Date: 2020-08-23 11:17:12
 * @LastEditors: One_Random
 * @LastEditTime: 2020-08-26 15:23:58
 * @FilePath: /FS/main.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */

const express = require('express');
const app = express();

// const path = require('path');

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/html/index.html")
});

app.get('/shell', (req, res) => {
    res.sendFile(__dirname + "/html/shell.html")

    const sfs = require('./js/sfs.js');
});

app.get('/shell/get/:cmd', (req, res) => {
    let cmd = req.params["cmd"];
    res.end(cmd);
});

app.listen(9005);   


