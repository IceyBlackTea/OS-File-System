/*
 * @Author: One_Random
 * @Date: 2020-08-13 00:08:42
 * @LastEditors: One_Random
 * @LastEditTime: 2020-08-13 00:41:59
 * @FilePath: /HTML/OS/FS/js/fs.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */ 

/*
 * 用户的类
 */
class User {
    constructor(){
        this.userID = null;   // ID
        this.username = null; // 名称
        // this.password = null; // 密码

        this.type = null;     // 类别
        this.root = null;     // 根文件夹
    }
}

/*
 * 文件夹的类
 */
class Folder {
    constructor(){
        this.name = null;   // 名称
        this.size = null;   // 大小
        this.created_time;  // 创建时间
        //this.modified_time; // 修改时间
        //this.last_open_time; // 上次打开时间
        this.comments;      // 描述
        this.permissions; // 权限管理

        this.parent = null; // 父文件夹
        this.folders = null;   // 子文件夹
        this.files = null;  // 子文件
    }
}

/*
 * 文件的类
 */
class File {
    constructor(){
        this.name = null;   // 名称
        this.extension;     // 扩展名
        this.size = null;   // 大小
        this.created_time;  // 创建时间
        //this.modified_time; // 修改时间
        //this.last_open_time; // 上次打开时间
        this.comments;      // 描述
        this.permissions; // 权限管理

        this.parent = null; // 父文件夹
    }
}

/*
 * 权限管理的类
 */
class Privilege {
    constructor() {
        this.CANTREAD = -1;
        this.READONLY = 0;
        this.READWRITE = 1;
    }
}

class Permission {
    constructor() {
        this.name;
        this.privilege;
    }
}

/*
 * 系统的类
 */
class System {
    constructor() {
        this.users = new Array();
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