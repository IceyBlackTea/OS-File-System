/*
 * @Author: One_Random
 * @Date: 2020-08-13 00:08:42
 * @LastEditors: One_Random
 * @LastEditTime: 2020-08-26 11:56:50
 * @FilePath: /FS/js/sfs.js
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
        this.LIST = 33;            // ls
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
        
        this.setup();
        // log
    }

    async setup() {
        await this.setup_system();
        await this.setup_storage();
        // this.setup_groups();
    }

    async setup_system() {
        await sql_client.connect();
        let info = (await sql_client.find('system'))[0];
        await sql_client.disconnect();

        this.name = info.name;
        this.version = info.version;
        this.update = info.update;

        // this.log.print(info);
        // this.show_system_info();
    }

    async setup_storage() {
        
    }

    show_system_info() {
        this.log.print(this.name);
        this.log.print(this.version);
        this.log.print(new Date(parseInt(this.update) * 1000).toLocaleString().replace(/:\d{1,2}$/,' '));
    }

    check_permission() {};

    new_shell(user) {
        let ID = "";
        let user_dir = "";
        let shell = new Shell(ID, user, user_dir);
        this.shells.push(shell);
    }

    delete_shell(shell_ID) {
        for (let i = 0; i < this.shelss.length; i++) {
            if (this.shells[i].ID = shell_ID){
                this.shells.splice(i, 1);
            }
        }
    }

    new_group(group_name) {
        let group_ID = ""; // Random Generate ID

        let new_group = new Group(group_ID, group_name);
        
        this.groups.push(new_group);

        // store

        // log
    }

    delete_group(group_ID) {
        // warning
        // if delete the group, the user of the group will also be deteled.

        if (group_ID == system.ROOT_GROUP || group_ID == system.DEFAULT_GROUP) {
            // error, can't delete
            
            return;
        }

        for (let i = 2; i < this.groups.length; i++) {
            if (this.groups[i].ID = group_ID) {
                // if user is using
                if (this.groups[i].state == System.ONLINE) {
                    // error, can't delete

                    return;
                }

                // delete users
                this.groups[i].remove_all_users();

                // delete the group
                this.groups.splice(i, 1);
                
                // log
                
                break;
            }
        }
    }

    new_user(user_name) {
        let user_ID = ""; // // Random Generate ID
        let new_user = new User(user_ID, user_name);

        this.groups[1].append_user(new_user);
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

    new_folder() {};
    new_file() {};

    delete_folder() {};
    delete_file() {};

    move_folder() {};
    move_file() {};
}

/*
 * SHELL的类
 */
class Shell {
    constructor(ID, user, user_dir) {
        this.ID = ID;
        this.user = user;
        this.dir = user_dir;

        this.print('Shell 1.0');
    }

    check_permission() {}

    print(message) {
        console.log(message);
    }
}

/*
 * Log的类
 */
class Log {
    constructor() {
        
    }

    print(message) {
        console.log(message);
    }
}


// fs_user.js

/*
 * 用户组的类
 */
class Group {
    constructor(ID, group_name) {
        this.ID = ID;
        this.name = group_name;
        this.users = new Array();

        this.state = System.OFFLINE;
    }

    append_user(user) {
        this.users.push(user);

        // log
    }

    remove_user(user_ID) {
        for (let i = 0; i < this.users.length; i++) {
            if (this.users[i].ID = user_ID) {
                this.users.splice(i, 1);
                
                // log
                
                break;
            }
        }
    }

    remove_all_users() {
        // log
        
        this.users.length = 0;
    }
}

/*
 * 用户的类
 */
class User {
    constructor(ID, name, group_ID) {
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
    constructor(ID, name, extension, parent) {
        this.ID = ID;       // 标识
        this.parent = parent; // 父文件夹

        // info
        this.name = name;   // 名称
        this.created_time = new Date().getTime();  // 创建时间
        this.modified_time = this.created_time; // 修改时间
        // this.last_open_time; // 上次打开时间
        // this.comments = "";      // 描述

        // default permissions
        this.permissions = null; // 权限管理


    }
}

/*
 * 文件的类
 */
class File extends Binary {
    constructor(ID, name, extension, parent, executable=false) {
        super(ID, name, extension, parent);
        
        this.extension = extension;     // 扩展名
        this.executable = executable;   // 可执行
        this.size = 0;   // 大小
        this.data = "";
    }
}

/*
 * 文件夹的类
 */
class Folder extends Binary {
    constructor(ID, name, extension, parent) {
        super(ID, name, extension, parent); // 继承自Binary类

        this.folders = null;   // 子文件夹
        this.files = null;  // 子文件
    }
}


// exports
module.exports = {
    System: System,
    Shell: Shell,
    Group: Group,
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