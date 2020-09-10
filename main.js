/*
 * @Author: One_Random
 * @Date: 2020-08-23 11:17:12
 * @LastEditors: One_Random
 * @LastEditTime: 2020-09-10 17:45:43
 * @FilePath: /FS/main.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */

const express = require('express');
const app = express();

const cookieParser = require('cookie-parser')
app.use(cookieParser());

const multer = require('multer');

const sfs = require('./server-js/sfs.js');
const Job = require('./server-js/sfs.js').Job;
const system = new sfs.System();

const fs = require('fs');
const path = require('path');

// app.use(express.static(__dirname));

//css和图片 ty_updated
app.use(express.static(__dirname+'/static'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/html/index.html");
});

app.get('/terminal',(req,res)=>{
    res.sendFile(__dirname+'/html/terminal.html');
})

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
        res.status('200').send("<script type=\"text/javascript\">window.alert(\"You have logged in!\");" + "\n" + "window.location=\"./shell\";</script>");
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
                    res.end();
                }

                else if (cmd == 'mkdir') {
                    let index = system.jobs.length;
                    let size = Math.floor(Math.random()*9 + 1);
                    let in_time = Math.floor(((Date.parse(new Date()) / 1000) - system.start)/5);
                    let run_time = Math.floor(Math.random()*9 + 1);

                    let job = new Job(index+1, cmd, shell.username, size, in_time, run_time);
                    await system.add_jobs(job);

                    let folder_name = args[0];
                    if (folder_name != '' && folder_name != undefined ){
                        let result = await system.new_folder(shell.username, shell.dir, folder_name);
                        if (result) {
                            system.log.send(shell, res, '200');
                            res.end();
                        }
                        else {
                            system.log.send(shell, res, '403');
                            res.end();
                        }
                    }
                    else {
                        await system.log.push('mkdir: missing operand');
                        system.log.send(shell, res, '403');
                        res.end();
                    }
                }

                else if (cmd == 'rm') {
                    let index = system.jobs.length;
                    let size = Math.floor(Math.random()*9 + 1);
                    let in_time = Math.floor(((Date.parse(new Date()) / 1000) - system.start)/5);
                    let run_time = Math.floor(Math.random()*9 + 1);

                    let job = new Job(index+1, cmd, shell.username, size, in_time, run_time);
                    await system.add_jobs(job);
                    
                    if (args[0] == '-r') {
                        let dest_name = args[1];
                        if (dest_name != '' && dest_name != undefined) {
                            let result = await system.delete_folder_file(shell.username, shell.dir, dest_name, 'folder');
                            if (result) {
                                system.log.send(shell, res, '200');
                                res.end();
                            }
                            else {
                                system.log.send(shell, res, '403');
                                res.end();
                            }
                        }
                        else {
                            await system.log.push('rm: missing operand');
                            system.log.send(shell, res, '403');
                            res.end();
                        }
                        
                    }
                    else {
                        let dest_name = args[0];
                        if (dest_name != '' && dest_name != undefined) {
                            let result = await system.delete_folder_file(shell.username, shell.dir, dest_name, 'file');
                            if (result) {
                                system.log.send(shell, res, '200');
                                res.end();
                            }
                            else {
                                system.log.send(shell, res, '403');
                                res.end();
                            }
                        }
                        else {
                            await system.log.push('rm: missing operand');
                            system.log.send(shell, res, '403');
                            res.end();
                        }
                    }
                }

                else if (cmd == 'ls') {
                    let index = system.jobs.length;
                    let size = Math.floor(Math.random()*9 + 1);
                    let in_time = Math.floor(((Date.parse(new Date()) / 1000) - system.start)/5);
                    let run_time = Math.floor(Math.random()*9 + 1);

                    let job = new Job(index+1, cmd, shell.username, size, in_time, run_time);
                    await system.add_jobs(job);

                    if (args[0] == '-l') {
                        let dest_name = args[1];
                        if (dest_name == undefined || dest_name == '')
                            dest_name = "."
                        let result = await system.list(shell, dest_name, true);
                        if (result) {
                            system.log.send(shell, res, '200');
                            res.end();
                        }
                        else {
                            system.log.send(shell, res, '403');
                            res.end();
                        }
                    }
                    else if (args[0] == '-folder') {
                        let dest_name = args[1];
                        if (dest_name == undefined)
                            dest_name = "."
                        let result = await system.list_folder(shell, dest_name, true);
                        if (result) {
                            system.log.send(shell, res, '200');
                            res.end();
                        }
                        else {
                            system.log.send(shell, res, '403');
                            res.end();
                        }
                    }
                    else {
                        let dest_name = args[0];
                        if (dest_name == undefined)
                            dest_name = "."
                        let result = await system.list(shell, dest_name, false);
                        if (result) {
                            system.log.send(shell, res, '200');
                            res.end();
                        }
                        else {
                            system.log.send(shell, res, '403');
                            res.end();
                        }
                    }
                }
                
                else if (cmd == 'cd') {
                    let index = system.jobs.length;
                    let size = Math.floor(Math.random()*9 + 1);
                    let in_time = Math.floor(((Date.parse(new Date()) / 1000) - system.start)/5);
                    let run_time = Math.floor(Math.random()*9 + 1);

                    let job = new Job(index+1, cmd, shell.username, size, in_time, run_time);
                    await system.add_jobs(job);
                    
                    let dest_folder = args[0];
                    if (dest_folder == undefined)
                            dest_folder = "."
                    let result = await system.change_dir(shell, dest_folder);
                    if (result) {
                        system.log.send(shell, res, '200');
                        res.end();
                    }
                    else {
                        system.log.send(shell, res, '403');
                        res.end();
                    }
                }

                else if (cmd == 'touch') {
                    let index = system.jobs.length;
                    let size = Math.floor(Math.random()*9 + 1);
                    let in_time = Math.floor(((Date.parse(new Date()) / 1000) - system.start)/5);
                    let run_time = Math.floor(Math.random()*9 + 1);

                    let job = new Job(index+1, cmd, shell.username, size, in_time, run_time);
                    await system.add_jobs(job);

                    let dest_name = args[0];
                    if (dest_name != undefined) {
                        let result = await system.new_empty_file(shell.username, shell.dir, dest_name);
                        if (result) {
                            system.log.send(shell, res, '200');
                            res.end();
                        }
                        else {
                            system.log.send(shell, res, '403');
                            res.end();
                        }
                    }
                    else {
                        await system.log.push('touch: missing operand');
                        system.log.send(shell, res, '403');
                        res.end();
                    }
                }

                else if (cmd == 'open') {
                    let index = system.jobs.length;
                    let size = Math.floor(Math.random()*9 + 1);
                    let in_time = Math.floor(((Date.parse(new Date()) / 1000) - system.start)/5);
                    let run_time = Math.floor(Math.random()*9 + 1);

                    let job = new Job(index+1, cmd, shell.username, size, in_time, run_time);
                    await system.add_jobs(job);
                    
                    let dest_name = args[0];
                    if (dest_name != undefined) {
                        let result = await system.open_file(shell.username, shell.dir, dest_name);
                        if (result != false) {
                            // await system.decrypt_file(result.ID, result.filename)
                            await system.log.push('./file/preview/' + result.filename);
                            await system.log.send(shell, res, '201');
                            res.end();
                        }
                        else {
                            system.log.send(shell, res, '403');
                            res.end();
                        }
                    }
                    else {
                        await system.log.push('touch: missing operand');
                        system.log.send(shell, res, '403');
                        res.end();
                    }
                }

                else if (cmd == 'download') {
                    let index = system.jobs.length;
                    let size = Math.floor(Math.random()*9 + 1);
                    let in_time = Math.floor(((Date.parse(new Date()) / 1000) - system.start)/5);
                    let run_time = Math.floor(Math.random()*9 + 1);

                    let job = new Job(index+1, cmd, shell.username, size, in_time, run_time);
                    await system.add_jobs(job);
                    
                    let dest_name = args[0];
                    if (dest_name != undefined) {
                        let result = await system.open_file(shell.username, shell.dir, dest_name);
                        if (result != false) {
                            await system.log.push('./file/download/' + result.filename + '/' + result.origin);
                            await fs.mkdirSync(__dirname + '/downloads/' + result.filename);
                            
                            await system.log.send(shell, res, '201');

                            await fs.renameSync(__dirname + '/temp/' + result.filename, __dirname + '/downloads/' + result.filename + '/' + result.origin);
                            res.end();
                        }
                        else {
                            system.log.send(shell, res, '403');
                            res.end();
                        }
                    }
                    else {
                        await system.log.push('touch: missing operand');
                        system.log.send(shell, res, '403');
                        res.end();
                    }
                }

                //rename ty_updated
                else if(cmd == 'rename') {
                    let dest_path = args[0];
                    new_filename = args[1];
                    
                    let result = await system.rename_file_folder(shell.username, shell.dir, dest_path ,new_filename);
                    if (result) {
                        system.log.send(shell, res, '200');
                    }
                    else {
                        system.log.send(shell, res, '403');
                    }

                }
                
                else if (cmd == 'run') {
                    let index = system.jobs.length;
                    let size = Math.floor(Math.random()*99 + 1);
                    let in_time = Math.floor(((Date.parse(new Date()) / 1000) - system.start)/5);
                    let run_time = Math.floor(Math.random()*19 + 1);

                    let job = new Job(index+1, cmd, shell.username, size, in_time, run_time);
                    await system.add_jobs(job);

                    let dest_name = args[0];
                    if (dest_name != undefined) {
                        let result = await system.excute_file(shell.username, shell.dir, dest_name);
                        console.log(result);
                        if (result != false) {
                            await fs.readFile(__dirname + '/temp/' + result, async (err, data) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    data =  data.toString()
                                    console.log(data);
                                    data = data.replace(/\r/g, '\\r');
                                    data = data.replace(/\n/g, '\\n');
                                    await system.log.push(data.toString());
                                    await system.log.send(shell, res, '202');
                                    res.end();
                                }
                            })                    
                        }
                        else {
                            system.log.send(shell, res, '403');
                            res.end();
                        }
                    }
                    else {
                        await system.log.push('touch: missing operand');
                        system.log.send(shell, res, '403');
                        res.end();
                    }
                }
                
                else if (cmd == 'chmod') {
                    let index = system.jobs.length;
                    let size = Math.floor(Math.random()*10);
                    let in_time = Math.floor(((Date.parse(new Date()) / 1000) - system.start)/5);
                    let run_time = Math.floor(Math.random()*10);

                    let job = new Job(index+1, cmd, shell.username, size, in_time, run_time);
                    await system.add_jobs(job);

                    let result = null;
                    if (args[0] == 'u') {
                        result = await system.change_mode(shell, args[2], 'owner', args[1]);
                    }
                    else if (args[0] == 'o') {
                        result = await system.change_mode(shell, args[2], 'other', args[1]);
                    }
                    
                    if (result) {
                        system.log.send(shell, res, '200');
                        res.end();
                    }
                    else {
                        system.log.send(shell, res, '403');
                        res.end();
                    }
                }
                
                else {
                    await system.log.push(cmd + ': command not found');
                    system.log.send(shell, res);
                    res.end();
                }
            }
        }
        
    })
});

app.get('/file/preview/:filename', async (req, res) => {
    const options = {
        root: path.join(__dirname + '/temp'),
        dotfiles: 'deny',
        headers: {
          'Content-Type': 'text/plain'
        }
      };
    
    let fileName = req.params.filename;
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

app.get('/file/download/:ts/:filename', async (req, res) => {
    let ts = req.params.ts;
    let fileName = req.params.filename;
    res.download(__dirname + '/downloads/' + ts + '/' + fileName, fileName);
    //res.end();
});

app.post('/file/upload', 
    multer({dest: 'temp'})
    .single('file'), async (req, res, next) => {
    if (req.file.length === 0) {
        res.render("error", {message: "上传文件不能为空！"});
        return;
    } else {
        let upload_file = await req.file;
        let size = await upload_file.size;

        let uuid = await req.cookies.UUID;
        if (uuid == undefined) {
            res.status('401').send();
            res.end();
        }
        else {
            //await system.encrypt_file(upload_file.filename, 'xxxxx');
            let shell = await system.get_shell(uuid);
            if (shell == null) {
                res.cookie('UUID', '', {maxAge: 0, httpOnly: true});
                res.status('401').send();
                res.end();
            }
            else {
                let index = system.jobs.length;
                let size = Math.floor(Math.random()*10);
                let in_time = Math.floor(((Date.parse(new Date()) / 1000) - system.start)/5);
                let run_time = Math.floor(Math.random()*10);
          
                let job = new Job(index+1, 'write', shell.username, size, in_time, run_time);
                await system.add_jobs(job);
                
                let folder = await system.find_folder_by_dir(shell.username, shell.dir);
                let result = await system.check_permissions(shell.username, folder, system.WRITE);
                if (result) {
                    let file = await system.write_file(shell.username, shell.dir, "./" + upload_file.originalname, size);
                    if (file != false) {
                        await system.encrypt_file(upload_file.filename, file.ID)
                        await system.log.send(shell, res);
                        res.end();
                    }
                    else {
                        await system.log.send(shell, res, '403');
                        res.end();
                    }
                    // let file = await system.new_empty_file(shell.username, shell.dir, upload_file.originalname);
                    // if (file != false) {
                    //     console.log(file);
                    //     // await fs.renameSync('./temp/' + upload_file.filename, './store/' + file.ID);
                    //     await system.encrypt_file(upload_file.filename, file.ID)
                    //     await system.write_file(shell.username, shell.dir, "./" + file.name, size);

                    //     await system.log.send(shell, res);
                    //     res.end();
                    // }
                    // else {
                    //     await system.log.send(shell, res, '403');
                    //     res.end();
                    // }
                }
                else {
                    await system.log.push('No permission');
                    await system.log.send(shell, res, '403');
                    res.end();
                }
            }
        }
    }
});

app.use(express.static(__dirname + '/ma'));

app.get('/manager', async (req, res) => {
    console.log(system.shells);
    let uuid = req.cookies.UUID;
    if (uuid == undefined) {
        res.status('401').send("<script type=\"text/javascript\">window.location=\"./login\";</script>");
        res.end();
    }
    else {
        let shell = await system.get_shell(uuid);
        
        if (shell == null || shell.username != 'root') {
            res.cookie('UUID', '', {maxAge: 0, httpOnly: true});
            res.status('401').send("<script type=\"text/javascript\">window.alert(\"No permssions!" + "\\n" + "Please login again!\");" + "\n" + "window.location=\"./login\";</script>");
            res.end();
        }
        else {
            res.sendFile(__dirname + "/ma/index.html");
        }
    }
});

app.get('/system/users', async (req, res) => {
    let uuid = req.cookies.UUID;
    if (uuid == undefined) {
        res.status('401').send("<script type=\"text/javascript\">window.location=\"./login\";</script>");
        res.end();
    }
    else {
        let shell = await system.get_shell(uuid);
        
        if (shell == null || shell.username != 'root') {
            res.cookie('UUID', '', {maxAge: 0, httpOnly: true});
            res.status('401').send("<script type=\"text/javascript\">window.alert(\"No permssions." + "\\n" + "Please login again!\");" + "\n" + "window.location=\"./login\";</script>");
            res.end();
        }
        else {
            system.log.push(await system.get_users_info());
            system.log.send(shell, res);
            res.end();
        }
    }
});

app.get('/system/shells', async (req, res) => {
    let uuid = req.cookies.UUID;
    if (uuid == undefined) {
        res.status('401').send("<script type=\"text/javascript\">window.location=\"./login\";</script>");
        res.end();
    }
    else {
        let shell = await system.get_shell(uuid);
        
        if (shell == null || shell.username != 'root') {
            res.cookie('UUID', '', {maxAge: 0, httpOnly: true});
            res.status('401').send("<script type=\"text/javascript\">window.alert(\"No permssions." + "\\n" + "Please login again!\");" + "\n" + "window.location=\"./login\";</script>");
            res.end();
        }
        else {
            system.log.push(await system.get_shells_info());
            system.log.send(shell, res);
            res.end();
        }
    }
});

app.get('/system/jobs', async (req, res) => {
    let uuid = req.cookies.UUID;
    if (uuid == undefined) {
        res.status('401').send("<script type=\"text/javascript\">window.location=\"./login\";</script>");
        res.end();
    }
    else {
        let shell = await system.get_shell(uuid);
        
        if (shell == null || shell.username != 'root') {
            res.cookie('UUID', '', {maxAge: 0, httpOnly: true});
            res.status('401').send("<script type=\"text/javascript\">window.alert(\"No permssions." + "\\n" + "Please login again!\");" + "\n" + "window.location=\"./login\";</script>");
            res.end();
        }
        else {
            system.log.push(await system.get_jobs_info());
            system.log.send(shell, res);
            res.end();
        }
    }
});

app.post('/users/new', async (req, res) => {
    let uuid = req.cookies.UUID;
    if (uuid == undefined) {
        res.status('401').send("<script type=\"text/javascript\">window.location=\"./login\";</script>");
        res.end();
    }
    else {
        let shell = await system.get_shell(uuid);
        
        if (shell == null || shell.username != 'root') {
            res.cookie('UUID', '', {maxAge: 0, httpOnly: true});
            res.status('401').send("<script type=\"text/javascript\">window.alert(\"No permssions." + "\\n" + "Please login again!\");" + "\n" + "window.location=\"./login\";</script>");
            res.end();
        }
        else {
            let result = await system.new_user();
            if (result == ture) {
                system.log.send(shell, res);
            }
            else {
                system.log.send(shell, res, '403');
                res.end();
            } 
        }
    }
});

app.post('/users/new', async (req, res) => {
    req.on('data', async data => { 
        let uuid = req.cookies.UUID;
        if (uuid == undefined) {
            res.status('401').send("<script type=\"text/javascript\">window.location=\"./login\";</script>");
            res.end();
        }
        else {
            let shell = await system.get_shell(uuid);
            
            if (shell == null || shell.username != 'root') {
                res.cookie('UUID', '', {maxAge: 0, httpOnly: true});
                res.status('401').send("<script type=\"text/javascript\">window.alert(\"No permssions." + "\\n" + "Please login again!\");" + "\n" + "window.location=\"./login\";</script>");
                res.end();
            }
            else {
                let obj = JSON.parse(data);
                let result = await system.new_user(obj.username, obj.password);
                if (result == ture) {
                    system.log.send(shell, res);
                }
                else {
                    system.log.send(shell, res, '403');
                    res.end();
                } 
            }
        }
    });
});

app.post('/users/delete', async (req, res) => {
    req.on('data', async data => { 
        let uuid = req.cookies.UUID;
        if (uuid == undefined) {
            res.status('401').send("<script type=\"text/javascript\">window.location=\"./login\";</script>");
            res.end();
        }
        else {
            let shell = await system.get_shell(uuid);
            
            if (shell == null || shell.username != 'root') {
                res.cookie('UUID', '', {maxAge: 0, httpOnly: true});
                res.status('401').send("<script type=\"text/javascript\">window.alert(\"No permssions." + "\\n" + "Please login again!\");" + "\n" + "window.location=\"./login\";</script>");
                res.end();
            }
            else {
                let obj = JSON.parse(data);
                let result = await system.delete_user(obj.username);
                if (result == ture) {
                    system.log.send(shell, res);
                }
                else {
                    system.log.send(shell, res, '403');
                    res.end();
                } 
            }
        }
    });
});
app.listen(9005);
