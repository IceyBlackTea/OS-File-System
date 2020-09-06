/*
 * @Author: One_Random
 * @Date: 2020-08-23 11:17:12
 * @LastEditors: One_Random
 * @LastEditTime: 2020-09-06 11:11:45
 * @FilePath: /FS/main.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */

const express = require('express');
const app = express();

const cookieParser = require('cookie-parser')
app.use(cookieParser());

const sfs = require('./server-js/sfs.js');
const system = new sfs.System();

const path = require('path');

// app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/html/index.html");
});

app.get('/shell', async (req, res) => {
    console.log(system.shells);
    let uuid = req.cookies.UUID;
    if (uuid == undefined) {
        res.status('401').send("<script type=\"text/javascript\">window.location=\"./login\";</script>");
        res.end();
    }
    else {
        let shell = await system.get_shell(uuid);
        
        if (shell == null) {
            res.cookie('UUID', '', {maxAge: 0, httpOnly: true});
            res.status('401').send("<script type=\"text/javascript\">window.alert(\"Authentication has expired!" + "\\n" + "Please login again!\");" + "\n" + "window.location=\"./login\";</script>");
            res.end();
        }
        else {
            //log
            
            res.sendFile(__dirname + "/html/shell.html");
        }
    }
});

app.get('/login', (req, res) => {
    if (req.cookies.UUID != undefined) {
        res.status('200').send("<script type=\"text/javascript\">window.alert(\"You have logged in!\");" + "\\n" + "window.location=\"./shell\";</script>");
        res.end();
    }
    else 
        res.sendFile(__dirname + "/html/login.html");
    
});

app.post('/login', (req, res) => {
    req.on('data', async data => {
        let obj = JSON.parse(data);
        let username = obj.username;
        let password_md5 = require('blueimp-md5')(obj.password);

        let uuid = await system.new_shell(username, password_md5, req.ip);

        if (uuid != null) {
            res.cookie('UUID', uuid, {maxAge: 24 * 3600 * 1000, httpOnly: true});
            res.status('200').send();
        }
        else {
            res.status('401').send();
        }

        res.end();
    })
});

app.post('/shell/post', (req, res) => {
    req.on('data', async data => {
        let uuid = req.cookies.UUID;

        if (uuid == undefined) {
            res.status('401').send();
        }
        else {
            let shell = await system.get_shell(uuid);
            if (shell == null) {
                res.cookie('UUID', '', {maxAge: 0, httpOnly: true});
                res.status('401').send();
            }
            else {
                let obj = JSON.parse(data);
                let cmd = obj.cmd;
                let args = obj.args;

                if (cmd == '') {
                    system.log.send(shell, res);
                }

                else if (cmd == 'exit') {
                    system.delete_shell(uuid);
                    res.cookie('UUID', '', {maxAge: 0, httpOnly: true});
                    res.status('200').send("log out");
                }

                else if (cmd == 'mkdir') {
                    let folder_name = args[0];
                    await system.new_folder(shell.username, shell.dir, folder_name);
                    system.log.send(shell, res);
                }

                else if (cmd == 'rm') {
                    if (args[0] == '-r') {
                        let dest_name = args[1];
                        await system.delete_folder_file(shell.username, shell.dir, dest_name, 'folder');
                        system.log.send(shell, res);
                    }
                    else {
                        let dest_name = args[0];
                        await system.delete_folder_file(shell.username, shell.dir, dest_name, 'file');
                        system.log.send(shell, res);
                    }
                }

                else if (cmd == 'ls') {
                    if (args[0] == '-l') {
                        let dest_name = args[1];
                        if (dest_name == undefined)
                            dest_name = "."
                        await system.list(shell, dest_name, true);
                    }
                    else {
                        let dest_name = args[0];
                        if (dest_name == undefined)
                            dest_name = "."
                        await system.list(shell, dest_name, false);
                    }
                    system.log.send(shell, res);
                }
                
                else if (cmd == 'cd') {
                    let dest_foder = args[0];
                    await system.change_dir(shell, dest_foder);
                    system.log.send(shell, res);
                }

                else if (cmd == 'touch') {
                    await system.log.push('./file/get/a.txt')
                    system.log.print('?????');
                    system.log.send(shell, res, '202');
                }

                else if (cmd == 'chmod') {
                    if (args[0] == 'u') {
                        await system.change_mode(shell, args[2], 'owner', args[1]);
                    }
                    else if (args[0] == 'o') {
                        await system.change_mode(shell, args[2], 'other', args[1]);
                    }
                    system.log.send(shell, res);
                }
                
                else if (cmd == 'test') {
                    await system.test();
                    system.log.send(shell, res);
                }
                else if (cmd =='testb') {
                    await system.testb();
                    system.log.send(shell, res);
                }
                
                else {
                    await system.log.push(cmd + ': command not found');
                    system.log.send(shell, res);
                }

            }
        }
        res.end();
    })
});

app.get('/file/get/:uuid', async (req, res) => {
    const options = {
        root: path.join(__dirname),
        dotfiles: 'deny',
        headers: {
          'Content-Type': 'text/html'
        }
      };
    
    const fileName = req.params.uuid;
    console.log(fileName);
    res.sendFile(fileName, options);
    // res.download(__dirname + '/' + fileName);//, options)//, function (err) {
    //     if (err) {
    //       next(err)
    //     } else {
    //       console.log('Sent:', fileName)
    //     }
    //   })
    //res.end();
});

// app.get('/shell/get/:cmd', async (req, res) => {
//     let cmd = req.params['cmd'];

//     if (cmd == 'ls') {
//         await system.list('/');
//         system.log.send(res);
//     }
//     else if (cmd == 'cd_root') {
//         await system.list('/root');
//         system.log.send(res);
//     }
//     else if (cmd == 'cd_a') {
//         await system.list('/root/a');
//         system.log.send(res);
//     }

//     // if (cmd == 'send') {
//     //     system.log.send(res);
//     // }
//     // else if (cmd == 'wrong') {
//     //     res.status('400').send();
//     // }

//     // if (cmd == "system info") {
//     //     system.show_system_info();
//     // }
    
//     res.end();
// });

// app.get('/shell/get/:cmd/:args', async (req, res) => {
//     // let cmd = req.params['cmd'];
//     // let args = req.params['args'];
//     // cmd = cmd + " " + args;

//     // if (cmd == 'mkdir a') {
//     //     await system.new_folder('root', "/root", "a");
//     // }
//     // else if (cmd == 'mkdir root') {
//     //     await system.new_folder('root', "/", "root");
//     // }
//     // else if (cmd == 'mkdir b') {
//     //     await system.new_folder('root', "/root/a", "b");
//     // }
//     // else if (cmd == 'rm a') {
//     //     await system.delete_folder('root', "/root", "a");
//     // }

//     // if (cmd.search(/mkdir/))

//     // if (cmd == 'send') {
//     //     system.log.send(res);
//     // }
//     // else if (cmd == 'wrong') {
//     //     res.status('400').send();
//     // }

//     // if (cmd == "system info") {
//     //     system.show_system_info();
//     // }
    
//     res.end();
// });

app.listen(9005);
