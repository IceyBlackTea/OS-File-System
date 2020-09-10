/*
 * @Author: One_Random
 * @Date: 2020-08-13 00:08:42
 * @LastEditors: One_Random
 * @LastEditTime: 2020-09-10 11:24:57
 * @FilePath: /FS/server-js/sfs.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */

const crypto = require('crypto');
const fs = require('fs');

const sql_client = require('./sql.js');

const encrypt_password = new Buffer.from("password");

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
        this.jobs = new Array();
        this.log = new Log();
        
        this.verbose = true;

        this.start = Date.parse(new Date()) / 1000;

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
        clean_files("./temp/");
        clean_files("./downloads/");

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

    async list(shell, dest_path, verbose) {
        let path = await this.get_absolute_path(shell.dir, dest_path);

        let dest = await this.find_parent_child_by_dir(shell.username, path);

        if (dest == null) {
            this.log.push("ls: " + dest_path + ": No such file or directory");
            return false;
        }

        let folders = dest.parent.folders;
        if (path == '' || path == '/') {
            let folder = this.device;

            let result = await this.check_permissions(shell.username, this.device, this.READ);

            if (result == false) {
                this.log.push("ls: " + dest_path + "Permission denied");
                return false
            }

            for (let i = 0; i < folder.folders.length; i++) {
                if (verbose) {
                    console.log(folder.folders[i].permissions);
                    this.log.push(JSON.stringify(await folder.folders[i].db_json()));
                }
                else {
                    this.log.push(await folder.folders[i].name);
                }
            }

            for (let i = 0; i < folder.files.length; i++) {
                if (verbose) {
                    this.log.push(JSON.stringify(await folder.files[i].db_json()));
                }
                else {
                    this.log.push(await folder.files[i].name);
                }
            }
            
            return true;
        }
        
        for (let i = 0; i < folders.length; i++) {
            if (folders[i].name == '/' + dest.child_name) {
                let folder = folders[i];
                let result = await this.check_permissions(shell.username, folder, this.READ);

                if (result == false) {
                    this.log.push("ls: " + dest_path + "Permission denied");
                    return false;
                }

                for (let j = 0; j < folder.folders.length; j++) {
                    if (verbose) {
                        this.log.push(JSON.stringify(await folder.folders[j].db_json()));
                    }
                    else {
                        this.log.push(await folder.folders[j].name);
                    }
                }

                for (let j = 0; j < folder.files.length; j++) {
                    if (verbose) {
                        this.log.push(JSON.stringify(await folder.files[j].db_json()));
                    }
                    else {
                        this.log.push(await folder.files[j].name);
                    }
                }
                
                return true;
            }   
        }

        let result = await this.check_permissions(shell.username, dest.parent, this.READ);

        if (result == false) {
            this.log.push("ls: " + dest_path + "Permission denied");
            return false;
        }

        let files = dest.parent.files;
        for (let i = 0; i < files.length; i++) {
            if (files[i].name == dest.child_name) {
                if (verbose) {
                    this.log.push(JSON.stringify(await files[i].db_json()));
                }
                else {
                    this.log.push(await files[i].name);
                }
                return true;
            }
        }

        this.log.push("ls: " + dest_path + ": No such file or directory");
        return false;
    }

    async list_folder(shell, dest_path, verbose) {
        let path = await this.get_absolute_path(shell.dir, dest_path);

        let dest = await this.find_parent_child_by_dir(shell.username, path);

        if (dest == null) {
            this.log.push("ls: " + dest_path + ": No such file or directory");
            return false;
        }

        let folders = dest.parent.folders;
        if (path == '' || path == '/') {
            let result = await this.check_permissions(shell.username, this.device, this.READ);

            if (result == false) {
                this.log.push("ls: " + dest_path + "Permission denied");
                return false;
            }

            if (verbose) {
                this.log.push(JSON.stringify(await this.device.db_json()));
            }
            else {
                this.log.push('/');
            }
            
            return true;
        }
        
        for (let i = 0; i < folders.length; i++) {
            if (folders[i].name == '/' + dest.child_name) {
                let folder = folders[i];
                let result = await this.check_permissions(shell.username, folder, this.READ);

                if (result == false) {
                    this.log.push("ls:" + dest_path + ": No permissions");
                    return false;
                }

                if (verbose) {
                    this.log.push(JSON.stringify(await folder.db_json()));
                }
                else {
                    this.log.push(await folder.name);
                }
                
                return true;
            }   
        }

        this.log.push("ls: " + dest_path + ": No such file or directory");
        return false;
    }

    async change_dir(shell, dest_path) {
        let work_dirs = shell.dir;
        let username = shell.username;

        let path = await this.get_absolute_path(work_dirs, dest_path)

        let folder = await this.find_folder_by_dir(username, path);
        
        if (folder == null) {
            this.log.push("cd: " + dest_path + ": No such file or directory");
            return false;
        }

        console.log(folder);
        let result = await this.check_permissions(shell.username, folder, this.EXECUTE);
        
        if (result == false) {
            this.log.push("cd: " + dest_path + "Permission denied");
            return false;
        }

        shell.dir = path;
        return true;
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
                    new_privilege = 'd' + await this.sub_privilege(new_privi) + folder.permissions.privilege.substring(4, 7);
                    folder.permissions.privilege = new_privilege;
                }
                else {
                    new_privilege = folder.permissions.privilege.substring(0, 4) + await this.sub_privilege(new_privi);
                    folder.permissions.privilege = new_privilege;
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
        let files = dest.parent.files;
        for (let i = 0; i < files.length; i++) {
            if (files[i].name == dest.child_name) {
                file = await files[i];
                break;
            }
        }

        if (file != null) {
            if (file.permissions.owner == username || username == 'root') {
                let new_privilege = '';
                if (type == 'owner') {
                    new_privilege = '-' + await this.sub_privilege(new_privi) + file.permissions.privilege.substring(4, 7);
                    file.permissions.privilege = new_privilege;
                }
                else {
                    new_privilege = file.permissions.privilege.substring(0, 4) + await this.sub_privilege(new_privi);
                    file.permissions.privilege = new_privilege;
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

    async new_user(user_name, password) {
        let user_ID = UUID();
        let password_md5 = require('blueimp-md5')(password);
        let created_time = Date.parse(new Date()) / 1000;

        let user = new User(user_ID, user_name);
        this.users.push(user);

        await sql_client.connect();
        await sql_client.insert("user",{ID: user_ID, name: user_name, password: password_md5, created_time: created_time, user_dir: "/home"});
        await sql_client.disconnect();
    }

    // ???
    async delete_user(user_name) {
        for (let i = 0; i < this.users.length; i++) {
            if (this.users[i].name = user_name) {
                this.users.splice(i, 1);
            }
        }

        await sql_client.connect();
        await sql_client.delete("user", {name: user_name});
        await sql_client.disconnect();
    }

    async get_users_info() {
        return (JSON.stringify(this.users));
    }

    async get_shells_info() {
        return (JSON.stringify(this.shells));
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

    async new_folder(username, work_dirs, dest_path) {
        let path = await this.get_absolute_path(work_dirs, dest_path);

        let dest = await this.find_parent_child_by_dir(username, path);

        if (dest == null) {
            this.log.push("rm: " + dest_path + ": No such file or directory");
            return false;
        }

        let result = await this.check_permissions(username, dest.parent, this.WRITE);
        
        if (result == false) {
            this.log.push("mkdir: " + dest_path + ": Permission denied");
            return false;
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
        let permissions = new Permission(username, await this.set_privilege(this.FOLDER, 7, 5));

        let ts = Date.parse(new Date()) / 1000;
        let folder = new Folder(UUID(), dest.parent.ID, '/' + dest.child_name, ts, permissions);
        
        dest.parent.folders.push(folder);

        await sql_client.connect();
        await sql_client.insert("storage", folder.db_json());
        await sql_client.disconnect();

        return true;
    };

    async new_empty_file(username, work_dirs, dest_path) {      
        let path = await this.get_absolute_path(work_dirs, dest_path);

        let dest = await this.find_parent_child_by_dir(username, path);
        
        if (dest == null) {
            this.log.push("rm: " + dest_path + ": No such file or directory");
            return false;
        }

        //permissions
        let result = await this.check_permissions(username, dest.parent, this.WRITE);
        if (result == false) {
            this.log.push("touch: " + dest_path + ": Permission denied");
            return false;
        }

        //console.log('???????');

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
        
        let permissions = new Permission(username, await this.set_privilege(this.FOLDER, 6, 4));

        let ts = Date.parse(new Date()) / 1000;
        let file = new File(UUID(), dest.parent.ID, dest.child_name, ts, permissions, 0, null);
        
        dest.parent.files.push(file);

        await sql_client.connect();
        await sql_client.insert("storage", file.db_json());
        await sql_client.disconnect();

        return file;
    };

    async delete_folder_file(username, work_dirs, dest_path, type='file') {
        if (dest_path == '.' || dest_path == "..") {
            this.log.push("rm: \".\" and \"..\" may not be removed");
            return false;
        }

        let path = await this.get_absolute_path(work_dirs, dest_path);

        let dest = await this.find_parent_child_by_dir(username, path);

        if (dest == null) {
            this.log.push("rm: " + dest_path + ": No such file or directory");
            return false;
        }

        let result = await this.check_permissions(username, dest.parent, this.WRITE);
        if (result == false) {
            this.log.push("rm: " + dest_path + ": Permission denied");
            return false;
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
            let local_files = [];
            if(fs.existsSync("./store/")) {
                local_files = fs.readdirSync("./store/");
                for (let i = 0; i < local_files.length; i++) {
                    if (local_files[i] == file.ID) {
                        var curPath = "./store/" + file.ID;
                        if(fs.statSync(curPath).isDirectory()) { // recurse
                            deleteall(curPath);
                        } else { // delete file
                            fs.unlinkSync(curPath);
                        }
                        break;
                    }
                }
            }

            return true;
        }
        else {
            this.log.push("rm: " + dest.child_name + ": No such file or directory");
            return false;
        }
    };

    async set_privilege(type, user, other) {
        let str = "";
        if (type == this.FOLDER)
            str = "d";
        else if (type == this.FILE)
            str = "-";
        else
            return null;

        if ((user > 7 || user < 0) || (other > 7 || other < 0))
            return null;
            
        return (str + await this.sub_privilege(user) + await this.sub_privilege(other));
    }

    async sub_privilege(privilege) {
        let str = "";
        if (privilege & this.READ) {
            str += "r";
        }
        else {
            str += "-"
        }

        if (privilege & this.WRITE) {
            str += "w";
        }
        else {
            str += "-";
        }

        if (privilege & this.EXECUTE) {
            str += "x";
        }
        else {
            str += "-";
        }

        return str;
    }

    async write_file(username, work_dirs, dest_path, size) {
        let path = await this.get_absolute_path(work_dirs, dest_path);

        let dest = await this.find_parent_child_by_dir(username, path);
        
        if (dest == null) {
            this.log.push("write file: " + dest_path + ": No such file or directory");
            return false;
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
                //permissions
                let result = await this.check_permissions(username, files[i], this.WRITE);
                if (result == false) {
                    this.log.push("write: " + dest_path + ": Permission denied");
                    return false;
                }
                else {
                    files[i].data = files[i].ID;
                    files[i].size = size;
                    await sql_client.connect();
                    await sql_client.update("storage", {ID: files[i].ID}, {$set:{data: files[i].data, size: files[i].size}});
                    await sql_client.disconnect();

                    return files[i];
                }
            }
        }

        let file = await this.new_empty_file(username, work_dirs, dest_path);
        if (file != false) {
            files.data = files.ID;
            files.size = size;
            await sql_client.connect();
            await sql_client.update("storage", {ID: file.ID}, {$set:{data: file.data, size: file.size}});
            await sql_client.disconnect();

            return file;
        }
        else {
            return false;
        }
    };

    async rename_file_folder(username, work_dirs, dest_path, new_filename) {
        if (dest_path == '.' || dest_path == "..") {
            this.log.push("rm: \".\" and \"..\" may not be renamed");
            return false;
        }

        let path = await this.get_absolute_path(work_dirs, dest_path);

        let dest = await this.find_parent_child_by_dir(username, path);

        if (dest == null) {
            this.log.push("rename: " + dest_path + ": No such file or directory");
            return false;
        }

        let result = await this.check_permissions(username, dest.parent, this.WRITE);
        if (result == false) {
            this.log.push("rename: " + dest_path + ": Permission denied");
            return false;
        }

        let folder = null; 
        let folders = dest.parent.folders;
        for (let i = 0; i < folders.length; i++) {
            if (folders[i].name == '/' + new_filename) {
                this.log.push("rename: " + dest.child_name + ": File exists");
                return false;
            }

            if (folders[i].name == '/' + dest.child_name) {
                folder = await folders[i];
                break;
            }
        }

        let file = null; 
        let files = dest.parent.files;
        for (let i = 0; i < files.length; i++) {
            if (files[i].name == new_filename) {
                this.log.push("rename: " + dest.child_name + ": File exists");
                return false;
            }
            
            if (files[i].name == dest.child_name) {
                file = await files[i];
                break;
            }
        }

        if (folder != null) {
            folder.name = new_filename;
                
            await sql_client.connect();
            await sql_client.update("storage", {ID: folder.ID}, {$set: {name: new_filename}});
            await sql_client.disconnect();

            return true;
        }
        else if (file != null) {
            file.name = new_filename;
                
            await sql_client.connect();
            await sql_client.update("storage", {ID: file.ID}, {$set: {name: new_filename}});
            await sql_client.disconnect();

            return true;
        }
        else {
            this.log.push("rename: " + dest.child_name + ": No such file or directory");
            return false;
        }
    }

    async open_file(username, work_dirs, dest_path) {
        let path = await this.get_absolute_path(work_dirs, dest_path);

        let dest = await this.find_parent_child_by_dir(username, path);
        
        if (dest == null) {
            this.log.push("open file: " + dest_path + ": No such file or directory");
            return false;
        }

        let folders = dest.parent.folders;
        for (let i = 0; i < folders.length; i++) {
            if (folders[i].name == '/' + dest.child_name) {
                // this.log.print('already existed');
                this.log.push("open file: " + dest.child_name + ": is a directory");
                return false;
            }
        }

        let files = dest.parent.files;
        for (let i = 0; i < files.length; i++) {
            if (files[i].name == dest.child_name) {
                //permissions
                let result = await this.check_permissions(username, files[i], this.READ);
                if (result == false) {
                    this.log.push("open: " + dest_path + ": Permission denied")
                    return false;
                }
                else {
                    let ts = Date.parse(new Date()) / 1000;
                    await this.decrypt_file(await files[i].ID, ts);

                    return {uuid: files[i].ID, origin: files[i].name, filename: ts};
                }
            }
        }

        this.log.push("open file: " + dest.child_name + ": No such file or directory");
        return false;
    }

    async excute_file(username, work_dirs, dest_path) {
        let path = await this.get_absolute_path(work_dirs, dest_path);

        let dest = await this.find_parent_child_by_dir(username, path);
        
        if (dest == null) {
            this.log.push("run file: " + dest_path + ": No such file or directory");
            return false;
        }

        let folders = dest.parent.folders;
        for (let i = 0; i < folders.length; i++) {
            if (folders[i].name == '/' + dest.child_name) {
                // this.log.print('already existed');
                this.log.push("run file: " + dest.child_name + ": is a directory");
                return false;
            }
        }

        let files = dest.parent.files;
        for (let i = 0; i < files.length; i++) {
            if (files[i].name == dest.child_name) {
                //permissions
                let result = await this.check_permissions(username, files[i], this.EXECUTE);
                if (result == false) {
                    this.log.push("run: " + dest_path + ": Permission denied");
                    return false;
                }
                else {
                    let ts = Date.parse(new Date()) / 1000;
                    await this.decrypt_file(await files[i].ID, ts);
 
                    return ts;
                }
            }
        }

        this.log.push("run file: " + dest.child_name + ": No such file or directory");
        return false;
    }

    async encrypt_file(filename, uuid) {
        var readStream = await fs.createReadStream(__dirname + "/../temp/" + filename);
        var writeStream = await fs.createWriteStream(__dirname + "/../store/" + uuid);
        var encrypt_stream = crypto.createCipher('aes-256-cbc', encrypt_password);

        await readStream
            .pipe(encrypt_stream)
            .pipe(writeStream)
            .on("finish",function(){//写入结束的回调
                console.log("done");
            })        
    }

    async decrypt_file(uuid, filename) {
        var readStream = await fs.createReadStream(__dirname + "/../store/" + uuid);
        var writeStream = await fs.createWriteStream(__dirname + "/../temp/" + filename);
        var decrypt_stream = crypto.createDecipher('aes-256-cbc',encrypt_password);
        
        await readStream
            .pipe(decrypt_stream)
            .pipe(writeStream)
            .on("finish",function(){//解压后的回调
                console.log("done");
            })
    }

    async check_permissions(username, file, opreation) {
        if (username == 'root') 
            return true;

        let user = await file.permissions.owner;
        let privilege = await file.permissions.privilege;
        privilege = await privilege.substring(1);

        if (user == username) {
            if (opreation == this.READ) {
                privilege = await privilege[0];
            }
    
            else if (opreation == this.WRITE) {
                privilege = await privilege[1];
            }
    
            else if (opreation == this.EXECUTE) {
                privilege = await privilege[2];
            }
        }
        else {
            if (opreation == this.READ) {
                privilege = await privilege[3];
            }
    
            else if (opreation == this.WRITE) {
                privilege = await privilege[4];
            }
    
            else if (opreation == this.EXECUTE) {
                privilege = await privilege[5];
            }
        }
        
        if (privilege == '-')
            return false;
        else 
            return true;
    }

    async add_jobs(job) {
        this.jobs.push(job);
    }

    async get_jobs_info(job) {
        return (JSON.stringify(this.jobs));
    }

    // async delete_jobs(job) {
        
    // }
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
                message += "<br>" + this.send_buffers[i];
            }
            //message += shell.username + '@sfs:' + shell.dir + '#';
        }
        let obj = {
            username: shell.username,
            dir: shell.dir,
            message: message
        }

        res.status(code).send(JSON.stringify(obj));
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
        this.permissions = new Permission(permissions.owner, permissions.privilege); // 权限管理
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

class Job {
    constructor(order_number, name, username, size, in_time, run_time) {
        this.order_number = order_number; // 作业序号
        this.name = name;
        this.username = username;
        this.size = size; // 作业使用的内存大小
        this.in_time = in_time; // 作业进入内存时间
        this.run_time = run_time; // 作业运行需要的时间
        this.start_time = -1; // 作业开始运行的时间
        this.end_time = -1; // 作业结束运行的时间
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

function clean_files(path) {
    let files = [];
    if(fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach((file, index) => {
            let curPath = path + file;
            if(fs.statSync(curPath).isDirectory()) { // recurse
                clean_files(curPath + '/');
            } 
            else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        if (path != './temp/' && path != './downloads/')
            fs.rmdirSync(path);
    }
}


// exports
module.exports = {
    System: System,
    Shell: Shell,
    Job: Job,
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