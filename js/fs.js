/*
 * @Author: One_Random
 * @Date: 2020-08-13 00:08:42
 * @LastEditors: One_Random
 * @LastEditTime: 2020-08-13 01:27:13
 * @FilePath: /FS/js/fs.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */

/*
 * 用户组的类
 */
class User_Group {
    constructor() {
        this.ID;
        this.name;
    }
}

/*
 * 用户的类
 */
class User {
    constructor() {
        this.ID = null;   // ID
        this.name = null; // 名称
        // this.password = null; // 密码

        this.groupID = null;     // 用户组
    }
}

/*
 *  基础存储的类
 */
class Binary {
    constructor() {
        this.ID;            // 标识
        this.name = null;   // 名称
        this.extension;     // 扩展名
        this.size = null;   // 大小
        this.created_time;  // 创建时间
        //this.modified_time; // 修改时间
        //this.last_open_time; // 上次打开时间
        this.comments;      // 描述
        this.permissions; // 权限管理
    }
}

/*
 * 文件的类
 */
class File extends Binary {
    constructor() {
        super();
        this.executable;

        this.parent = null; // 父文件夹
    }
}

/*
 * 文件夹的类
 */
class Folder extends Binary {
    constructor() {
        super(); // 继承自Binary类

        this.parent = null; // 父文件夹
        this.folders = null;   // 子文件夹
        this.files = null;  // 子文件
    }
}

/*
 * 权限管理的类
 */
class Privilege {
    constructor() {
        this.EXECUTE = 1;
        this.WRITE = 2;
        this.READ = 4;
    }
}

class Permission {
    constructor() {
        this.name; // user group other all
        this.privilege;
    }
}

/*
 * 系统的类
 */
class System {
    constructor() {
        this.FILE = 0;
        this.DIR = 1;

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