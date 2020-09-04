/*
 * @Author: One_Random
 * @Date: 2020-08-13 00:08:42
 * @LastEditors: One_Random
 * @LastEditTime: 2020-09-04 14:36:43
 * @FilePath: /FS/server-js/sfs.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */

const crypto = require('crypto');
const fs = require('fs');

const sql_client = require('./sql.js');

const encrypt_password = new Buffer.from("password");
const encrypt_stream = crypto.createCipher('aes-256-cbc', encrypt_password);
const decrypt_stream = crypto.createDecipher('aes-256-cbc',encrypt_password);

// fs_system.js
/*
 * 系统的类
 */
class System {
    constructor() {
        // const
        this.FILE = 0;
        this.FOLDER = 1;

        this.EXECUTE = 1;
        this.WRITE = 2;
        this.READ = 4;
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

    async new_shell(username, password, ip) {
        let user = await this.authenticate(username, password);
        if (user != null) {
            let ts = Date.parse(new Date()) / 1000 + 24 * 3600;
            let shell = new Shell(UUID(), user.name, user.user_dir, ts, ip);
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

    async list(shell) {
        let parent = await this.find_folder_by_dir(shell.username, shell.dir);

        let result = await this.check_permissions(shell.username, parent, this.READ);

        if (result == this.READ) {
            // no permissions
            return this.READ;
        }
        
        if (parent == null) {
            this.log.push("cd: " + shell.dir + ": No such file or directory");
            return false;
        }

        for (let i = 0; i < parent.folders.length; i++) {
            this.log.push(await parent.folders[i].name);
        }

        for (let i = 0; i < parent.files.length; i++) {
            this.log.push(await parent.files[i].name);
        }
    }

    async change_dir(shell, dest_path) {
        let work_dirs = shell.dir;
        let username = shell.username;
        
        // if ((dest_path[0] == '.' && dest_path[1] == '/') || (dest_path == ".")) {
        //     dest_path = work_dirs + dest_path.substring(1);
        // }
        // else if ((dest_path[0] == '.' && dest_path[1] == '.' && dest_path[2] == '/') || (dest_path == "..")) {
        //     dest_path = work_dirs.substring(0, work_dirs.lastIndexOf('/')) + dest_path.substring(2);
        // }
        // else if (dest_path[0] != '/') {
        //     if (work_dirs == '/') 
        //         dest_path = work_dirs + dest_path;
        //     else 
        //         dest_path = work_dirs + '/' + dest_path;
        // }
        let path = await this.get_absolute_path(work_dirs, dest_path)

        let folder = await this.find_folder_by_dir(username, path);
        let result = await this.check_permissions(shell.username, folder, this.EXECUTE);
        if (result == this.EXECUTE) {
            // no permissions
            return this.EXECUTE;
        }
        
        if (folder != null) {
            shell.dir = path;
            return true;
        }
        else {
            this.log.push("cd: " + dest_path + ": No such file or directory");
            return false;
        }   
    }

    async change_mode(shell, dest_path, type, new_privi) {
        let work_dirs = shell.dir;
        let username = shell.username;
        // find file
        let path = await this.get_absolute_path(work_dirs, dest_path);
        let dest = await this.find_parent_child_by_dir(username, path);

        if (dest == null) {
            this.log.push("chmod: " + dest_path + ": No such file or directory");
            return false;
        }

        let folder = null; 
        let folders = dest.parent.folders;
        for (let i = 0; i < folders.length; i++) {
            if (folders[i].name == '/' + dest.child_name) {
                folder = await folders[i];
                break;
            }
        }

        if (folder != null) {
            if (folder.permissions.owner == username || username == 'root') {
                let new_privilege = '';
                if (type == 'owner') {
                    new_privilege = 'd' + await sub_privilege(new_privi) + folder.permissions.privilege.substring(4, 7);
                }
                else {
                    new_privilege = folder.permissions.privilege.substring(0, 4) + await sub_privilege(new_privi);
                }

                await sql_client.connect();
                await sql_client.update("storage", {ID: folder.ID}, {$set: {"permissions.privilege": new_privilege}});
                await sql_client.disconnect();

                return true;
            }
            else {
                this.log.push('Permission denied.');
                return false;
            }
        }

        let file = null; 
        let files = dest.parent.folders;
        for (let i = 0; i < files.length; i++) {
            if (files[i].name == dest.child_name) {
                file = await files[i];
                break;
            }
        }

        if (file != null) {
            if (folder.permissions.owner == username || username == 'root') {
                let new_privilege = '';
                if (type == 'owner') {
                    new_privilege = await sub_privilege(new_privi) + folder.permissions.privilege.substring(4, 7);
                }
                else {
                    new_privilege = folder.permissions.privilege.substring(0, 4) + await sub_privilege(new_privi);
                }

                await sql_client.connect();
                await sql_client.update("storage", {ID: file.ID}, {$set: {"permissions.privilege": new_privilege}});
                await sql_client.disconnect();

                return true;
            }
            else {
                this.log.push('Permission denied.');
                return false;
            }
        }
        else {
            this.log.push("chmod: " + dest.child_name + ": No such file or directory");
            return false;
        }
    }

    async new_user(user_name) {
        // let user_ID = ""; // // Random Generate ID
        // let new_user = new User(user_ID, user_name);

        // >>>
    }

    // ???
    delete_user(user_ID) {
        // // warning

        // if (user_ID == system.ROOT_USER) {
        //     // error, can't delete
            
        //     return;
        // }

    }

    async get_absolute_path(work_dirs, dest_path) {
        if ((dest_path[0] == '.' && dest_path[1] == '/') || (dest_path == ".")) {
            dest_path = await work_dirs + dest_path.substring(1);;
        }
        else if ((dest_path[0] == '.' && dest_path[1] == '.' && dest_path[2] == '/') || (dest_path == "..")) {
            dest_path = await work_dirs.substring(0, work_dirs.lastIndexOf('/')) + dest_path.substring(2);
        }
        else if (dest_path[0] != '/') {
            if (work_dirs == '/') 
                dest_path = await work_dirs + dest_path;
            else 
                dest_path = await work_dirs + '/' + dest_path;
        }

        return dest_path;
    }

    async find_folder_by_dir(username, path) {            
        let dirs = path.split('/');
        if (dirs[dirs.length-1] == '')
            dirs.pop();

        let folder = this.device;

        for (let i = 1; i < dirs.length; i++) {
            let flag = false;
            for (let j = 0; j < folder.folders.length; j++) {
                if (folder.folders[j].name == "/" + dirs[i]) {
                    folder = await folder.folders[j];
                    flag = true;
                    break;
                }
            }
            if (!flag) {
                return null;
            }
        }
        
        return folder;
    }

    async find_parent_child_by_dir(username, path) {
        let dirs = path.split('/');
        if (dirs[dirs.length-1] == '')
            dirs.pop();
        let child = dirs[dirs.length-1];
            
        let folder = this.device;

        for (let i = 1; i < dirs.length - 1; i++) {
            let flag = false;
            for (let j = 0; j < folder.folders.length; j++) {
                if (folder.folders[j].name == "/" + dirs[i]) {
                    folder = await folder.folders[j];
                    flag = true;
                    break;
                }
            }
            if (!flag) {
                return null;
            }
        }
        
        return {
            parent: folder,
            child_name: child
        };
    }

    // async find_file_by_dir(username, path) {
    //     let dest = await this.find_parent_child_by_dir(username, path);

    //     if (dest == null) {
    //         // this.log.push(": " + dest.child_name + ": No such file or directory");
    //         return null;
    //     } 

    //     let files = dest.parent.files;
    //     for (let i = 0; i < files.length; i++) {
    //         if (files[i].name == '/' + dest.child_name) {
    //             // this.log.print('already existed');
    //             // this.log.push("mkdir: " + dest.child_name + ": File exists");
    //             return files[i];
    //         }
    //     }
    //     return null;
    // }

    async new_folder(username, work_dirs, dest_path) {
        // if ((dest_path[0] == '.' && dest_path[1] == '/') || (dest_path == ".")) {
        //     dest_path = work_dirs + dest_path.substring(1);;
        // }
        // else if ((dest_path[0] == '.' && dest_path[1] == '.' && dest_path[2] == '/') || (dest_path == "..")) {
        //     dest_path = work_dirs.substring(0, work_dirs.lastIndexOf('/')) + dest_path.substring(2);
        // }
        // else if (dest_path[0] != '/') {
        //     if (work_dirs == '/') 
        //         dest_path = work_dirs + dest_path;
        //     else 
        //         dest_path = work_dirs + '/' + dest_path;
        // }
        let path = await this.get_absolute_path(work_dirs, dest_path);

        let dest = await this.find_parent_child_by_dir(username, path);

        if (dest == null) {
            this.log.push("rm: " + dest_path + ": No such file or directory");
            return false;
        }

        let result = await this.check_permissions(username, dest.parent, this.WRITE);
        if (result == this.WRITE) {
            // no permissions
            return this.WRITE;
        }

        let folders = dest.parent.folders;
        for (let i = 0; i < folders.length; i++) {
            if (folders[i].name == '/' + dest.child_name) {
                // this.log.print('already existed');
                this.log.push("mkdir: " + dest.child_name + ": File exists");
                return false;
            }
        }
        let files = dest.parent.files;
        for (let i = 0; i < files.length; i++) {
            if (files[i].name == dest.child_name) {
                // this.log.print('already existed');
                this.log.push("mkdir: " + dest.child_name + ": File exists");
                return false;
            }
        }
        
        //permissions
        let permissions = new Permission(username, this.set_privilege(System.FOLDER, 7, 4));

        let ts = Date.parse(new Date()) / 1000;
        let folder = new Folder(UUID(), dest.parent.ID, '/' + dest.child_name, ts, permissions);
        
        dest.parent.folders.push(folder);

        await sql_client.connect();
        await sql_client.insert("storage", folder.db_json());
        await sql_client.disconnect();

        return true;
    };

    async new_empty_file(username, work_dirs, dest_path) {
        // if ((dest_path[0] == '.' && dest_path[1] == '/') || (dest_path == ".")) {
        //     dest_path = work_dirs + dest_path.substring(1);;
        // }
        // else if ((dest_path[0] == '.' && dest_path[1] == '.' && dest_path[2] == '/') || (dest_path == "..")) {
        //     dest_path = work_dirs.substring(0, work_dirs.lastIndexOf('/')) + dest_path.substring(2);
        // }
        // else if (dest_path[0] != '/') {
        //     if (work_dirs == '/') 
        //         dest_path = work_dirs + dest_path;
        //     else 
        //         dest_path = work_dirs + '/' + dest_path;
        // }
        
        let path = await this.get_absolute_path(work_dirs, dest_path);

        let dest = await this.find_parent_child_by_dir(username, path);
        
        if (dest == null) {
            this.log.push("rm: " + dest_path + ": No such file or directory");
            return false;
        }

        //permissions
        let result = await this.check_permissions(username, dest.parent, this.WRITE);
        if (result == this.WRITE) {
            // no permissions
            return this.WRITE;
        }

        let folders = dest.parent.folders;
        for (let i = 0; i < folders.length; i++) {
            if (folders[i].name == '/' + dest.child_name) {
                // this.log.print('already existed');
                this.log.push("touch: " + dest.child_name + ": File exists");
                return false;
            }
        }
        let files = dest.parent.files;
        for (let i = 0; i < files.length; i++) {
            if (files[i].name == dest.child_name) {
                // this.log.print('already existed');
                this.log.push("touch: " + dest.child_name + ": File exists");
                return false;
            }
        }
        
        let permissions = new Permission(username, this.set_privilege(System.FOLDER, 7, 4));

        let ts = Date.parse(new Date()) / 1000;
        let file = new File(UUID(), dest.parent.ID, '/' + dest.child_name, ts, permissions, 0, null);
        
        dest.parent.files.push(file);

        await sql_client.connect();
        await sql_client.insert("storage", file.db_json());
        await sql_client.disconnect();

        return true;
    };

    async delete_folder_file(username, work_dirs, dest_path, type='file') {
        if (dest_path == '.' || dest_path == "..") {
            this.log.push("rm: \".\" and \"..\" may not be removed");
            return false;
        }
        // if (dest_path[0] == '.' && dest_path[1] == '/') {
        //     dest_path = work_dirs + dest_path.substring(1);;
        // }
        // else if (dest_path[0] == '.' && dest_path[1] == '.' && dest_path[2] == '/') {
        //     dest_path = work_dirs.substring(0, work_dirs.lastIndexOf('/')) + dest_path.substring(2);
        // }
        // else if (dest_path[0] != '/') {
        //     if (work_dirs == '/') 
        //         dest_path = work_dirs + dest_path;
        //     else 
        //         dest_path = work_dirs + '/' + dest_path;
        // }

        let path = await this.get_absolute_path(work_dirs, dest_path);

        let dest = await this.find_parent_child_by_dir(username, path);

        if (dest == null) {
            this.log.push("rm: " + dest_path + ": No such file or directory");
            return false;
        }

        let result = await this.check_permissions(username, dest.parent, this.WRITE);
        if (result == this.WRITE) {
            // no permissions
            return this.WRITE;
        }

        let folder = null; 
        let folders = dest.parent.folders;
        for (let i = 0; i < folders.length; i++) {
            if (folders[i].name == '/' + dest.child_name) {
                folder = await folders[i];
                if (type == 'folder')
                    folders.splice(i, 1);
                break;
            }
        }

        if (folder != null) {
            if (type == 'folder') {
                await sql_client.connect();
                await sql_client.delete("storage", {ID: folder.ID});
                await sql_client.delete("storage", {parent: folder.ID});
                await sql_client.disconnect();
    
                return true;
            }
            else {
                this.log.push("rm: " + dest.child_name + ": is a directory");
                return false;
            }
        }

        let file = null; 
        let files = dest.parent.files;
        for (let i = 0; i < files.length; i++) {
            if (files[i].name == dest.child_name) {
                file = await files[i];
                files.splice(i, 1);
                break;
            }
        }

        if (file != null) {
            await sql_client.connect();
            await sql_client.delete("storage", {ID: file.ID});
            await sql_client.disconnect();

            // delete local file

            return true;
        }
        else {
            this.log.push("rm: " + dest.child_name + ": No such file or directory");
            return false;
        }
    };
    
    async delete_folder(username, work_dirs, dest_path) {
        if (dest_path == '.' || dest_path == "..") {
            this.log.push("rm: \".\" and \"..\" may not be removed");
            return false;
        }

        // if (dest_path[0] == '.' && dest_path[1] == '/') {
        //     dest_path = work_dirs + dest_path.substring(1);;
        // }
        // else if (dest_path[0] == '.' && dest_path[1] == '.' && dest_path[2] == '/') {
        //     dest_path = work_dirs.substring(0, work_dirs.lastIndexOf('/')) + dest_path.substring(2);
        // }
        // else if (dest_path[0] != '/') {
        //     if (work_dirs == '/') 
        //         dest_path = work_dirs + dest_path;
        //     else 
        //         dest_path = work_dirs + '/' + dest_path;
        // }

        let path = await this.get_absolute_path(work_dirs, dest_path);

        let dest = await this.find_parent_child_by_dir(username, path);

        if (dest == null) {
            this.log.push("rm: " + dest_path + ": No such file or directory");
            return false;
        }

        let folder = null; 
        let folders = dest.parent.folders;
        for (let i = 0; i < folders.length; i++) {
            if (folders[i].name == '/' + dest.child_name) {
                folder = await folders[i];
                folders.splice(i, 1);
                break;
            }
        }

        if (folder != null) {
            await sql_client.connect();
            await sql_client.delete("storage", {ID: folder.ID});
            await sql_client.delete("storage", {parent: folder.ID});
            await sql_client.disconnect();

            return true;
        }
        else {
            this.log.push("rm: " + dest.child_name + ": No such file or directory");
            return false;
        }
    };

    // async delete_file(username, work_dirs, dest_path) {
    //     if (dest_path == '.' || dest_path == "..") {
    //         this.log.push("rm: \".\" and \"..\" may not be removed");
    //         return false;
    //     }
    //     if (dest_path[0] == '.' && dest_path[1] == '/') {
    //         dest_path = work_dirs + dest_path.substring(1);;
    //     }
    //     else if (dest_path[0] == '.' && dest_path[1] == '.' && dest_path[2] == '/') {
    //         dest_path = work_dirs.substring(0, work_dirs.lastIndexOf('/')) + dest_path.substring(2);
    //     }
    //     else if (dest_path[0] != '/') {
    //         if (work_dirs == '/') 
    //             dest_path = work_dirs + dest_path;
    //         else 
    //             dest_path = work_dirs + '/' + dest_path;
    //     }

    //     //permissions
    //     let dest = await this.find_parent_child_by_dir(username, dest_path);
    //     if (dest == null) {
    //         this.log.push("rm: " + dest.child_name + ": No such file or directory");
    //         return false;
    //     }

    //     let file = null; 
    //     let files = dest.parent.files;
    //     for (let i = 0; i < files.length; i++) {
    //         if (files[i].name == dest.child_name) {
    //             file = await files[i];
    //             files.splice(i, 1);
    //             break;
    //         }
    //     }

    //     if (file != null) {
    //         await sql_client.connect();
    //         await sql_client.delete("storage", {ID: file.ID});
    //         await sql_client.disconnect();

    //         // delete local file

    //         return true;
    //     }
    //     else {
    //         this.log.push("rm: " + dest.child_name + ": No such file or directory");
    //         return false;
    //     }
    // };

    // move_folder() {};
    // move_file() {};


    set_privilege(type, user = 7, other = 7) {
        let str = "";
        if (type == System.FOLDER)
            str = "d";
        else if (type == System.FILE)
            str = "-";
        else
            return null;

        if ((user > 7 || user < 0) || (other > 7 || other < 0))
            return null;
            
        return (str + this.sub_privilege(user) + this.sub_privilege(other));
    }

    sub_privilege(privilege) {
        let str = ""
        if (privilege & System.READ == System.READ) {
            str += "r";
        }
        else {
            str += "-"
        }

        if (privilege & System.WRITE == System.WRITE) {
            str += "w";
        }
        else {
            str += "-";
        }

        if (privilege & System.EXECUTE == System.EXECUTE) {
            str += "x";
        }
        else {
            str += "-";
        }

        return str;
    }

    async write_file(username, work_dirs, dest_path, size) {
        // if ((dest_path[0] == '.' && dest_path[1] == '/') || (dest_path == ".")) {
        //     dest_path = work_dirs + dest_path.substring(1);;
        // }
        // else if ((dest_path[0] == '.' && dest_path[1] == '.' && dest_path[2] == '/') || (dest_path == "..")) {
        //     dest_path = work_dirs.substring(0, work_dirs.lastIndexOf('/')) + dest_path.substring(2);
        // }
        // else if (dest_path[0] != '/') {
        //     if (work_dirs == '/') 
        //         dest_path = work_dirs + dest_path;
        //     else 
        //         dest_path = work_dirs + '/' + dest_path;
        // }
        
        let path = await this.get_absolute_path(work_dirs, dest_path);

        let dest = await this.find_parent_child_by_dir(username, path);
        
        if (dest == null) {
            this.log.push("write file: " + dest_path + ": No such file or directory");
            return false;
        }

        //permissions
        let result = await this.check_permissions(username, dest.parent, this.WRITE);
        if (result == this.WRITE) {
            // no permissions
            return this.WRITE;
        }

        let folders = dest.parent.folders;
        for (let i = 0; i < folders.length; i++) {
            if (folders[i].name == '/' + dest.child_name) {
                // this.log.print('already existed');
                this.log.push("write file: " + dest.child_name + ": is a directory");
                return false;
            }
        }
        let files = dest.parent.files;
        for (let i = 0; i < files.length; i++) {
            if (files[i].name == dest.child_name) {
                files[i].data = files[i].uuid;
                files[i].size = size;
                await sql_client.connect();
                await sql_client.update("storage", {ID: files[i].ID}, {$set:{data: files[i].data, size: files[i].size}});
                await sql_client.disconnect();

                return true;
            }
        }

        this.log.push("write file: " + dest.child_name + ": No such file or directory");
        return false;
        
        // let permissions = new Permission(username, this.set_privilege(System.FOLDER, 7, 0));

        // let ts = Date.parse(new Date()) / 1000;
        // let file = new File(UUID(), dest.parent.ID, '/' + dest.child_name, ts, permission, 0, null);
        
        // dest.parent.files.push(file);

        
    };

    async encrypt_file(timestamp, uuid) {
        var readStream = fs.createReadStream(__dirname + "/temp/" + timestamp);
        var writeStream = fs.createWriteStream(__dirname + "/store/" + uuid);

        readStream
            .pipe(encrypt_stream)
            .pipe(writeStream)
            .on("finish",function(){//写入结束的回调
                console.log("done");
            })        
    }

    async decrypt_file(uuid) {
        var readStream = fs.createReadStream(__dirname + "/store/" + uuid);
        var writeStream = fs.createWriteStream(__dirname + "/temp/" + uuid);
        readStream
            .pipe(decrypt_stream)
            .pipe(writeStream)
            .on("finish",function(){//解压后的回调
                console.log("done");
            })
    }

    async check_permissions(username, file, opreation) {
        let user = file.permissions.owner;
        let privilege = file.permissions.privilege;
        if (privilege[0] = 'd')
            privilege.splice(0, 1);

        if (user == username || username == 'root') {
            if (opreation == System.READ) {
                privilege = await privilege[0];
            }
    
            else if (opreation == System.WRITE) {
                privilege = await privilege[1];
            }
    
            else if (opreation == System.EXECUTE) {
                privilege = await privilege[2];
            }
        }
        else {
            if (opreation == System.READ) {
                privilege = await privilege[3];
            }
    
            else if (opreation == System.WRITE) {
                privilege = await privilege[4];
            }
    
            else if (opreation == System.EXECUTE) {
                privilege = await privilege[5];
            }
        }
            
        if (privilege == '-')
            return false;
        else 
            return true;       

    }
}

/*
 * SHELL的类
 */
class Shell {
    constructor(ID, username, user_dir, max_age, ip) {
        this.ID = ID;
        this.username = username;
        this.user_dir = user_dir;
        this.dir = user_dir;

        this.max_age = max_age;
        this.ip = ip;
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

    async push(message) {
        this.send_buffers.push(message.toString());
    }

    clear() {
        this.send_buffers.length = 0;
    }

    async send(shell, res, code="200") {
        await this.sendAll(shell, res, code);
    }

    save() {
        
    }

    async sendOne(shell, res, code="200") {
        await res.status(code).send(this.send_buffers[0] + "<br>");
        this.send_buffers.splice(0, 1);
    }

    async sendAll(shell, res, code="200") {
        let message = "";
        if (this.send_buffers.length > 0) {
            message = this.send_buffers[0];
            for (let i = 1; i < this.send_buffers.length; i++) {
                message += this.send_buffers[i] + "<br>";
            }
            //message += shell.username + '@sfs:' + shell.dir + '#';
        }
        let obj = {
            username: shell.username,
            dir: shell.dir,
            message: message
        }

        await res.status(code).send(JSON.stringify(obj));
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

        this.state = System.OFFLINE;
        // this.password = null; // 密码
    }
}


/*
 * 权限管理的类
 */
class Permission {
    constructor(username, privilege) {
        // this.INVISIBLE = 0;
        this.owner = username; // user other all
        this.privilege = privilege; 
    }

    db_json() {
        return {
            owner: this.owner,
            privilege: this.privilege
        };
    }
}


// fs_file.js
/*
 *  基础存储的类
 */
class Binary {
    constructor(ID, parent, name, created_time = 0, permissions) {
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
    constructor(ID, parent, name, created_time = 0, permissions, size, data) {
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
            //modified_time: this.created_time,
            permissions: this.permissions.db_json(),
            size: this.size,
            data: this.data
        };
    }
}

/*
 * 文件夹的类
 */
class Folder extends Binary {
    constructor(ID, parent, name, created_time = 0, permissions) {
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
            permissions: this.permissions.db_json()
        };
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