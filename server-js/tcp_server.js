/*
 * @Author: One_Random
 * @Date: 2020-08-24 19:31:44
 * @LastEditors: One_Random
 * @LastEditTime: 2020-08-30 15:19:15
 * @FilePath: /FS/server-js/tcp_server.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */

// this file won't be used any more.

var net = require('net');

class Server {
    constructor() {
        let host = '0.0.0.0';
        let port = 9005;

        this.initalizate(host, port);
    }

    initalizate(host, port) {
        this.server = net.createServer();
        this.clients = [];

        this.server.on('connection', socket =>{
            this.clients.push(socket);
            console.log('connect: ' + socket.remoteAddress + ':' + socket.remotePort);
        
            socket.on('data', data => {
                let msg = data.toString();
                if (msg.substring(data.length - 2) == '\r\n')
                    msg = msg.substring(0, data.length - 2);
        
                if (msg == 'close') {
                    socket.destroy();
                    //this.close();
                }
                else {
                    data = Buffer.from(msg);
                    console.log('data from ' + socket.remoteAddress + ': ' + data);

                    // opreate

                    // write
                    socket.write('');
                } 
            });
        
            socket.on('close', () => {
                this.clients.splice(this.clients.indexOf(socket), 1);
                console.log('close: ' + socket.remoteAddress + ' ' + socket.remotePort);
            });
        });

        this.server.on('close', () => {
            console.log('server close!');
        })
        
        this.server.on('listening', () => {
            console.log('Server listening on ' + host +':'+ port);
        })
        
        this.server.listen(port, host);
    }

    close() {
        for (let i = 0; i < this.clients.length; i++) {
            this.clients[i].destroy();
        }

        this.server.close( () => {
            this.server.unref();
        })
    }
}

module.exports = Server;