/*
 * @Author: One_Random
 * @Date: 2020-08-13 13:53:08
 * @LastEditors: One_Random
 * @LastEditTime: 2020-08-13 13:53:46
 * @FilePath: /FS/js/fs_file.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */

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

        this.parent = null; // 父文件夹
    }
}

/*
 * 文件的类
 */
class File extends Binary {
    constructor() {
        super();
        this.executable;
    }
}

/*
 * 文件夹的类
 */
class Folder extends Binary {
    constructor() {
        super(); // 继承自Binary类

        this.folders = null;   // 子文件夹
        this.files = null;  // 子文件
    }
}