/*
 * @Author: One_Random
 * @Date: 2020-08-13 13:53:08
 * @LastEditors: One_Random
 * @LastEditTime: 2020-08-17 10:34:09
 * @FilePath: /FS/js/fs_file.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */

/*
 *  基础存储的类
 */
class Binary {
    constructor(ID, name, extension, parent) {
        this.ID = ID;       // 标识
        this.name = name;   // 名称
        this.extension = extension;     // 扩展名
        this.size = 0;   // 大小
        this.created_time = new Date().getTime();  // 创建时间
        this.modified_time = this.created_time; // 修改时间
        // this.last_open_time; // 上次打开时间
        // this.comments = "";      // 描述

        // default permissions
        this.permissions = null; // 权限管理

        this.parent = parent; // 父文件夹
    }
}

/*
 * 文件的类
 */
class File extends Binary {
    constructor(ID, name, extension, parent, executable=false) {
        super(ID, name, extension, parent);
        this.executable = executable;

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