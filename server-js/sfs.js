/*
 * @Author: One_Random
 * @Date: 2020-08-13 00:08:42
 * @LastEditors: One_Random
 * @LastEditTime: 2020-08-31 16:26:03
 * @FilePath: /FS/server-js/sfs.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */
const sql_client = require('./sql.js');

// fs_system.js
/*
 * 系统的类
 */
class System {
    constructor() {
        // const
        this.FILE = 0;
        this.DIR = 1;
        
        this.OFFLINE = 0;
        this.ONLINE = 1;

        this.FREE = 0;
        this.USING = 1;

        this.ROOT_GROUP = 0;
        this.DEFAULT_GROUP = 1;

        this.ROOT_USER = 0;

        this.POWEROFFF = 0;     // power off

        this.GROUPADD = 11;     // groupadd
        this.GROUPMODIFY = 12;  // groupmod
        this.GOURPDELETE = 13;  // groupdel 
        
        this.USERADD = 21;      // useradd
        this.USERMODIFY = 22;   // usermod
        this.USERDEL = 23;      // userdel
        this.CHANGEGROUP = 24;  // chgrp
        this.SWITCHUSER = 25;   // su
        // this.WHO = 26;          // who
        // this.ID = 27;           // id

        this.PRINTWORKINGDIR = 31; // pwd
        this.CHANGEDIR = 32;       // cd
        this.LIST = "ls";            // ls
        this.MAKEDIR = 34;         // mkdir
        this.REMOVEDIR = 35;       // rmdir

        this.CONCATENATE = 41;  // cat
        this.MOVE = 42;         // move
        this.COPY = 43;         // cp
        this.TOUCH = 44;        // touch
        this.REMOVE = 45;       // rm

        this.CHANGEMODE = 50;   // chmod

        this.initalizate();
    }

    initalizate() {
        // this.users = new Array();
        this.name = "";
        this.version = "";
        this.update = 0;

        this.shells = new Array();
        this.log = new Log();
        
        this.verbose = true;

        this.setup();
        // log
    }

    async setup() {
        await sql_client.connect();

        await this.setup_system();
        await this.setup_storage();
        await this.setup_users();

        await sql_client.disconnect();
    }

    async setup_system() {  
        let info = (await sql_client.find('system'))[0];

        this.name = info.name;
        this.version = info.version;
        this.update = info.update;

        if (this.verbose) {
            this.print_system_info();
        }     
    }

    async setup_storage() {
        var storage = await sql_client.find("storage");

        this.device = new Folder(storage[0].ID, storage[0].parent, storage[0].name, storage[0].created_time, storage[0].permissions);

        storage.splice(0, 1);
        
        await this.find_child_folders(storage, this.device);
        
        this.log.print("+OK: setup storage");
    }

    async find_child_folders(storage, parent_folder) {
        for (let i = 0; i < storage.length; i++) {
            if (storage[i].parent == parent_folder.ID) {
                if (storage[i].name[0] == "/") {
                    let folder = new Folder(storage[i].ID, storage[i].parent, storage[i].name, storage[i].created_time, storage[i].permissions);
                    storage.splice(i, 1);
                    i -= 1;
                    parent_folder.folders.push(folder);
                    await this.find_child_folders(storage, folder);
                }
                else {
                    let file = new File(storage[i].ID, storage[i].parent, storage[i].name, storage[i].created_time, storage[i].permissions, storage[i].size, storage[i].data);
                    storage.splice(i, 1);
                    i -= 1;
                    parent_folder.files.push(file);
                }
            }
        }
    }

    async setup_users() {
        this.users = (await sql_client.find('users', {}, {projection: {"_id": 0, "password": 0}}));
    }

    print_system_info() {
        this.log.print("system name: " + this.name);
        this.log.print("system version: " + this.version);
        this.log.print("update time: " + new Date(parseInt(this.update) * 1000).toLocaleString().replace(/:\d{1,2}$/,' '));
    }

    async authenticate(username, password) {
        let user = null;
        for (let i = 0; i < this.users.length; i++) {
            if (this.users[i].name == username) {
                user = await this.users[i];
                break;
            }
        }

        if (user != null) {
            await sql_client.connect();
            let password_md5 = (await sql_client.find("users", {ID: user.ID}, {projection: {"password": 1}}))[0].password;
            await sql_client.disconnect();

            
            if (password == password_md5) {
                return user;
            }
        }

        return null;
    }

    async get_shell(uuid) {
        let shell = null;
        for (let i = 0; i < this.shells.length; i++) {
            if (this.shells[i].max_age < Date.parse(new Date()) / 1000) {
                // too old
                this.shells.splice(i, 1);
                i -= 1;
            }
            else {
                if (this.shells[i].ID == uuid) {
                    shell = await this.shells[i];
                    break;
                }
            }
        }

        return shell;
    }

    async new_shell(username, password) {
        let user = await this.authenticate(username, password);
        if (user != null) {
            let ts = Date.parse(new Date()) / 1000 + 24 * 3600;
            let shell = new Shell(UUID(), user.name, user.user_dir, ts);
            this.shells.push(shell);

            return shell.ID;
        }
        return null;
    }

    delete_shell(uuid) {
        for (let i = 0; i < this.shells.length; i++) {
            if (this.shells[i].max_age < Date.parse(new Date()) / 1000) {
                // too old
                this.shells.splice(i, 1);
                i -= 1;
            }
            else {
                if (this.shells[i].ID == uuid) {
                    this.shells.splice(i, 1);
                    i -= 1;
                }
            }
        }
    }

    async list(dir) {
        let parent = await this.find_folder_by_dir(dir);
        console.log(parent);
        for (let i = 0; i < parent.folders.length; i++) {
            this.log.push(await parent.folders[i].name);
        }

        for (let i = 0; i < parent.files.length; i++) {
            this.log.push(await parent.files[i].name);
        }
    }

    async change_dir(shell, dir, name) {
        let parent = await this.find_folder_by_dir(dir);
        for (let i = 0; i < parent.folders.length; i++) {
            if (parent.folders[i].name == "/" + name) {
                // change

                return true;
            }
        }

        return false;
    }

    new_user(user_name) {
        let user_ID = ""; // // Random Generate ID
        let new_user = new User(user_ID, user_name);

        // >>>
    }

    // ???
    delete_user(user_ID) {
        // warning
        // if delete the group, the user of the group will also be deteled.

        if (user_ID == system.ROOT_USER) {
            // error, can't delete
            
            return;
        }

    }

    change_group(user_ID) {};

    async find_folder_by_dir(dir) {
        let dirs =  dir.split("/");
        let folder = this.device;
        for (let i = 1; i < dirs.length; i++) {
            for (let j = 0; j < folder.folders.length; j++) {
                if (folder.folders[j].name == "/" + dirs[i]) {
                    folder = await folder.folders[j];
                    break;
                }
            }
        }
        
        return folder;
    }

    async new_folder(user, dir, name) {
        name = "/" + name;
        let parent = await this.find_folder_by_dir(dir);
        
        let folders = parent.folders;
        for (let i = 0; i < folders.length; i++) {
            if (folders[i].name == name) {
                this.log.print('already have');
                return false;
            }
        }

        //permission

        let ts = Date.parse(new Date()) / 1000;
        let folder = new Folder(UUID(), parent.ID, name, ts, null);
        parent.folders.push(folder);

        await sql_client.connect();
        await sql_client.insert("storage", folder.db_json());
        await sql_client.disconnect();

        return true;
    };
    new_file() {};

    async delete_folder(user, dir, name) {
        name = "/" + name;
        let parent = await this.find_folder_by_dir(dir);
        
        //permission
        let folder = null;
        for (let i = 0; i < parent.folders.length; i++) {
            if (parent.folders[i].name == name) {
                folder = await parent.folders[i];
                parent.folders.splice(i, 1);
                break;
            }
        }

        await sql_client.connect();
        await sql_client.delete("storage", {ID: folder.ID});
        await sql_client.delete("storage", {parent: folder.ID});
        await sql_client.disconnect();

        return true;
    };

    delete_file() {};

    move_folder() {};
    move_file() {};
}

/*
 * SHELL的类
 */
class Shell {
    constructor(ID, username, user_dir, max_age) {
        this.ID = ID;
        this.username = username;
        this.dir = user_dir;

        this.max_age = max_age;
    }
}

/*
 * Log的类
 */
class Log {
    constructor() {
        this.send_buffers = new Array();
    }

    print(message) {
        console.log(message);
    }

    push(message) {
        this.send_buffers.push(message.toString());
    }

    clear() {
        this.send_buffers.length = 0;
    }

    send(res) {
        this.sendAll(res);
    }

    save() {
        
    }

    async sendOne(res) {
        await res.status("200").send(this.send_buffers[0] + "<br>");
        this.send_buffers.splice(0, 1);
    }

    async sendAll(res) {
        let message = "";
        for (let i = 0; i < this.send_buffers.length; i++) {
            message += this.send_buffers[i] + "<br>";
        }

        await res.status("200").send(message);
        this.clear();
    }
}


// fs_user.js

/*
 * 用户的类
 */
class User {
    constructor(ID, name) {
        this.ID = ID;      // ID
        this.name = name;    // 名称
        this.group_ID = group_ID; // 用户组

        this.state = System.OFFLINE;
        // this.password = null; // 密码
    }
}


/*
 * 权限管理的类
 */
class Permission {
    constructor() {
        this.INVISIBLE = 0;
        
        this.EXECUTE = 1;
        this.WRITE = 2;
        this.READ = 4;

        this.owner; // user group other all
        this.privilege;
    }
}


// fs_file.js
/*
 *  基础存储的类
 */
class Binary {
    constructor(ID, parent, name, created_time = 0, permissions = null) {
        this.ID = ID;       // 标识
        this.parent = parent; // 父文件夹

        // info
        this.name = name;   // 名称
        this.created_time = created_time;  // 创建时间
        // this.modified_time = modified_time; // 修改时间
        // this.last_open_time; // 上次打开时间
        // this.comments = "";      // 描述

        // default permissions
        this.permissions = permissions; // 权限管理
    }
}

/*
 * 文件的类
 */
class File extends Binary {
    constructor(ID, parent, name, created_time = 0, permissions = null, size, data) {
        super(ID, parent, name, created_time, permissions);
        
        // this.extension = extension;     // 扩展名
        // this.executable = executable;   // 可执行
        this.size = size;   // 大小
        this.data = data;
    }

    db_json() {
        return {
            ID: this.ID,
            parent: this.parent,
            name: this.name,
            created_time: this.created_time,
            modified_time: this.created_time,
            permissions: null,
            size: this.size,
            data: data
        }
    }
}

/*
 * 文件夹的类
 */
class Folder extends Binary {
    constructor(ID, parent, name, created_time = 0, permissions = null) {
        super(ID, parent, name, created_time, permissions); // 继承自Binary类

        this.folders = new Array();   // 子文件夹
        this.files = new Array();  // 子文件
    }

    db_json() {
        return {
            ID: this.ID,
            parent: this.parent,
            name: this.name,
            created_time: this.created_time,
            permissions: null
        }
    }
}

function UUID() {
    var d = new Date().getTime();
    // if (window.performance && typeof window.performance.now === "function") {
    //     d += performance.now(); //use high-precision timer if available
    // }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}


// exports
module.exports = {
    System: System,
    Shell: Shell,
    User: User,
    Permission: Permission,
    File: File,
    Folder: Folder
}

// async function get_system_info() {
//     await sql_client.connect();
//     let info = await sql_client.find('system');
//     await sql_client.disconnect();

//     console.log(info);
// }

// get_system_info();