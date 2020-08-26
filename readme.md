<!--
 * @Author: One_Random
 * @Date: 2020-08-13 11:59:59
 * @LastEditors: One_Random
 * @LastEditTime: 2020-08-26 15:39:17
 * @FilePath: /FS/readme.md
 * @Description: Copyright © 2020 One_Random. All rights reserved.
-->
## 简单文件系统-基于node.js运行

----

### 运行环境
+ node.js
+ chromium browser

----

### 前端
+ shell风格
+ 资源管理器风格

----

### 后端

#### 功能
1. 系统管理
   + 使用命令进行控制
   + 支持多用户
   + 日志管理
2. 文件管理
   + 基本操作: 创建、删除、读写
   + 支持文件夹嵌套 (树状结构目录)
   + 获取文件(夹)信息
3. 权限管理
   + 权限控制: 运行、读取、写入
   + 用户分类管理: 拥有者, 用户组, 其他

#### 类
1. 系统管理
    + System类 运行的系统实例是唯一的
    + Shell类  每个用户每次生成一个Shell实例与系统交互
    + Log类    每次生成System实例后用以记录日志
2. 文件管理
    + Binary类 文件存储的基类
    + File类   文件
    + Folder类 文件夹
3. 权限管理
    + Group类 用户组
    + User类  用户
    + Permission类 权限

#### 说明
+ 在权限管理上，设备默认用户组与root用户
+ 在数据库直接存储文件的数据与文件(夹)的结构

<details>
    <summary>problem?</summary>
    (x)在实际内容的存储上，直接存储文件夹结构
</details>

----

### 持久化存储
功能上要求持久化存储，包括但不限于：
+ 系统设置
+ 用户数据
+ 文件资源

选用与node.js适应较好的MogonDB作为数据库存储，优先使用json格式保存数据。

<details>
    <summary>problem?</summary>
    (x)在服务器机器中直接保存配置信息，优先使用json格式保存数据。
</details>


----

### 其他
- 原本的题目设计是运行在本地机器命令行中，本项目改进运行在node.js上，可作为网页应用使用
- 参照传统unix系统进行部分设计
- 模拟操作系统运行环境，通过ajax发送GET/POST可模拟shell终端，并符合多线程需求

<details>
    <summary>problem?</summary>
    (x)之后补充
</details>

----

### 日志
+ 8.13 建立项目，开始设计
+ 8.15 设计后端类与数据结构，编写readme文档
+ 8.24 整理文件结构，编写数据库接口
+ 8.26 (放弃编写tcp服务端)编写简单ajax接口，通过页面发送命令，接受结果。
