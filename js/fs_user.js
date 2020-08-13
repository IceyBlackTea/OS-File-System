/*
 * @Author: One_Random
 * @Date: 2020-08-13 13:52:33
 * @LastEditors: One_Random
 * @LastEditTime: 2020-08-13 13:53:00
 * @FilePath: /FS/js/fs_user.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */

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
        this.EXECUTE = 1;
        this.WRITE = 2;
        this.READ = 4;

        this.name; // user group other all
        this.privilege;
    }
}