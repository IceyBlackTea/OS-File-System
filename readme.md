<!--
 * @Author: One_Random
 * @Date: 2020-08-13 11:59:59
 * @LastEditors: One_Random
 * @LastEditTime: 2020-08-13 12:23:44
 * @FilePath: /FS/readme.md
 * @Description: Copyright © 2020 One_Random. All rights reserved.
-->
## 简单文件系统-基于node.js运行

### 前端
+ shell风格
+ 资源管理器风格

----

### 后端

#### 功能
1. 系统管理
   + 使用命令进行控制
   + 支持多用户
2. 文件管理
   + 基本操作: 创建、删除、读写
   + 支持文件夹嵌套
   + 获取文件(夹)信息
3. 权限管理
   + 权限控制: 运行、读取、写入
   + 用户分类管理: 拥有者, 用户组, 其他

#### 类
1. 系统运行
    + System类 运行的系统实例是唯一的，
    + Shell类  每个用户使用系统会生成一个Shell实例
2. 文件读写
    + Binary类 文件存储的基类
    + File类   文件
    + Folder类 文件夹
3. 用户权限管理
    + Group类 用户组
    + User类  用户
    + Permission类 权限

#### 说明
- 原本的题目设计是运行在本地机器命令行中，本项目改进运行在node.js上，可作为网页应用使用
- 为了更好符合需求，需要对运行环境进行模拟，目前计划实现模拟shell
- 参照传统unix系统进行部分设计