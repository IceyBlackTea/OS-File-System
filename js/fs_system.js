/*
 * @Author: One_Random
 * @Date: 2020-08-13 13:51:52
 * @LastEditors: One_Random
 * @LastEditTime: 2020-08-17 11:00:39
 * @FilePath: /FS/js/fs_system.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */

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
        this.groups = new Array();

        this.log = new Log();
        
        // log
    }

    check_permission() {};

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
    constructor(user, user_dir) {
        this.user = user;
        this.dir = user_dir;
    }

    check_permission() {}
}

/*
 * Log的类
 */
class Log {
    constructor() {
        
    }
}