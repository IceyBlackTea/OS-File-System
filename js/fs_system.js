/*
 * @Author: One_Random
 * @Date: 2020-08-13 13:51:52
 * @LastEditors: One_Random
 * @LastEditTime: 2020-08-13 13:52:25
 * @FilePath: /FS/js/fs_system.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */

/*
 * 系统的类
 */
class System {
    constructor() {
        this.FILE = 0;
        this.DIR = 1;
        
        this.OFFLINE = 0;
        this.ONLINE = 1;

        this.groups = new Array();
    }

    new_group(group_name) {
        let group_ID = ""; // Random Generate ID
        let new_group = new Group(group_ID, group_name);
        
        this.groups.push(new_group);

        // log
    }

    delete_group(group_ID) {
        // warning
        // if delete the group, the user of the group will also be deteled.

        if (group_ID == 0 || group_ID == 1) {
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

        if (user_ID == 0) {
            // error, can't delete
            
            return;
        }

    }
}

/*
 * SHELL的类
 */
class Shell {
    constructor() {
        this.user;
        this.dir;
    }
}

/*
 * Log的类
 */
class Log {
    constructor() {
        
    }
}