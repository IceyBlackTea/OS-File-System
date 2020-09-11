/*
 * @Author: One_Random
 * @Date: 2020-07-06 10:50:57
 * @LastEditors: One_Random
 * @LastEditTime: 2020-07-16 23:09:00
 * @FilePath: /OS/js/memory.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */ 

// 解决异步错误问题
function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}  

var queue = new Array();
var time = -1;
const const_time = 50;

/*
 * 系统的类
 */
class System {
    constructor(max_mem_size, type) {
        this.memory = new Memory(max_mem_size); // 系统内存
        this.type = type; // 动态存储分配算法
        // this.jobs = new Array();
        this.wait_jobs = new Array(); // 等待运行作业队列
        this.running_jobs = new Array(); // 运行中作业队列          
        this.end_jobs = new Array(); // 等待结束作业队列
    }

    // 添加作业到作业队列
    add_job(job) {
        if (job.size > system.memory.size) {
            console.log(job);
            alert('The size of the job ' + job.order_number +' is too big!');
            return false;
        }

        if (this.wait_jobs.length == 0){
            this.wait_jobs.push(job);
            return true;
        }
            
        sleep(0).then(() => {
            for (let i = 0; i < this.wait_jobs.length; i++) {
                if (this.wait_jobs[i].order_number == job.order_number) {
                    alert('The job ' + job.order_number +' has been added already!')
                    return false;
                }   
            }
            
            for (let i = 0; i < this.wait_jobs.length; i++) {
                if (this.wait_jobs[i].in_time > job.in_time) {
                    this.wait_jobs.splice(i, 0, job);
                    return true; 
                }  
            }

            this.wait_jobs.push(job);
            return true;
        });
    }

    // 持续运行, 扫描，先检查作业完成释放资源，然后加载作业执行
    run() {
        if (this.wait_jobs.length == 0)
            return;
        
        time = -1;
        queue.length = 0;
        
        while (true) {
            if (this.wait_jobs.length == 0 && this.running_jobs.length == 0)
                break;
                
            time += 1;
            
            this.finish_jobs();
            this.begin_jobs();

            console.log("time " + time);
            queue.push({"time": time, "func" : "pass"});
            console.log(queue);
        }
    }

    // 清除所有作业
    remove_jobs() {
        this.wait_jobs.length = 0;
        this.running_jobs.length = 0;
        this.end_jobs.length = 0;
    }

    // 处理完成的作业
    finish_jobs() {
        // 遍历寻找完成的作业
        console.log("running", time, this.running_jobs);
        let time_ = time;
        for (let i = 0; i < this.running_jobs.length; i++) {
            let job = this.running_jobs[i];
            if (job.end_time == time_) {
                // 处理作业队列
                // console.log('finish jobs', time, job);
                this.running_jobs.splice(i, 1);
                this.end_jobs.push(job);
                sleep(0).then(() => {
                        console.log(job);
                        add_full_job_display(job);
                })
                i -= 1;
            }
        }

        if (this.end_jobs.length != 0)
            this.memory.unload_job(this.end_jobs);
    }

    // 处理等待执行的作业
    begin_jobs() {
        // 采用先进先出原则，要加载的永远是队列的第0号作业
        while (true) {
            if (this.wait_jobs.length == 0)
                break;
        
            let job = this.wait_jobs[0];
            console.log('begin jobs', time, job);
            if (job.in_time <= time) {
                let part_num = -1;
                if (this.type == 'FF')
                    part_num = this.memory.FF(job);
                else if (this.type == 'BF')
                    part_num = this.memory.BF(job);
                else if (this.type == 'WF')
                    part_num = this.memory.WF(job);
                if (part_num != -1) {
                    // 设置作业属性，开始运行
                    job.start_time = time;
                    job.end_time = job.start_time + job.run_time;

                    this.memory.load_job(part_num, job);
                    // 处理作业队列
                    this.wait_jobs.splice(0, 1);
                    this.running_jobs.push(job);
                }
                else
                    break;
            }
            else
                break;
        }
    }

    // 输出信息，用于debug
    print() {
        console.log('system info');
        console.log('system type: ' + this.type);
        console.log('system time: ' + time);
        console.log('\n');
        
        this.memory.print();
    }
}

/*
 * 模拟的内存的类
 */
class Memory {
    constructor(max_size) {
        // 声明一个分区对象，添加到分区数组中
        var part = new Part(0, max_size);
        var mem_parts = new Array();
        mem_parts.push(part);

        this.size = max_size; // 内存大小
        this.used_size = 0; // 已使用的内存大小
        this.parts = mem_parts; // 指向内存分区
        this.max_order_number = 0; // 指向内存分区最大编号
    }

    // allocation function
    // find a part to load the job
    // if can find, return the order num of the part
    // else return -1
    
    // 首次适应算法
    FF(job) {
        for (let i = 0; i < this.parts.length; i++) {
            if (this.parts[i].job_num == -1 && this.parts[i].size >= job.size)
                return i;
        }
        return -1;
    }

    // 最佳适应算法
    BF(job) {
        let size = job.size;
        let best_size = 9999;
        let part_num = -1;
        for (let i = 0; i < this.parts.length; i++) {
            let part = this.parts[i];
            if (part.job_num == -1 && part.size >= size) {
                if (part.size < best_size) {
                    part_num = i;
                    best_size = part.size
                }
            }
        }
        return part_num;
    }
    
    // 最差适应算法
    WF(job) {
        let size = job.size;
        let worst_size = 0;
        let part_num = -1;
        for (let i = 0; i < this.parts.length; i++) {
            let part = this.parts[i];
            if (part.job_num == -1 && part.size >= size) {
                if (part.size > worst_size) {
                    part_num = i;
                    worst_size = part.size
                }
            }
        }
        return part_num;
    }
    // 添加作业到内存中
    load_job(part_num, job) {
        // 将旧的分区拆开出新的分区
        let part = this.parts[part_num];
        let new_part_size = part.size - job.size;
        if (new_part_size != 0) {
            let new_part = new Part(this.max_order_number + 1, part.size - job.size);
            this.parts.splice(part_num + 1, 0, new_part);
        }
        
        // 旧分区装入作业
        part.size = job.size;
        part.job_num = job.order_number;

        this.used_size += job.size;
        this.max_order_number += 1;

        function color16(){//十六进制颜色随机
			var r = Math.floor(Math.random()*256);
			var g = Math.floor(Math.random()*256);
			var b = Math.floor(Math.random()*256);
			var color = '#'+r.toString(16)+g.toString(16)+b.toString(16);
            return color;
        }

        let color = "#2ea44e";
        while (color == "#2ea44e" || color == "#72de8f") {
            color = color16();
        }
        
        //console.log("add " + part_num);
        queue.push({"time": time, "func": "add", "para" : [part_num, this.max_order_number, [job.order_number, job.size, color]]});
        //console.log(queue);
    }

    // 完成作业，释放内存资源
    unload_job(end_jobs) {
        // 遍历寻找完成的作业
        for (let i = this.parts.length-1; i >= 0; i--) {
            for (let j = 0; j < end_jobs.length; j++)
                if (this.parts[i].job_num == end_jobs[j].order_number) {
                    this.used_size -= this.parts[i].size;
                    this.parts[i].job_num = -1;

                    // console.log("finish " + i);
                    queue.push({"time": time, "func" : "finish", "para":[i, end_jobs[j].order_number]});
                    // console.log(queue);
                    end_jobs.splice(j, 1);
                    break;
                }
        }
        
        for (let i = this.parts.length-1; i >= 0; i--) {
            // 考虑后一个分区能否与该分区合并
            if ((i < this.parts.length-1) && this.parts[i].job_num == -1 && this.parts[i + 1].job_num == -1) {
                if (this.parts[i+1].order_number == this.max_order_number)
                    this.max_order_numbe -= 1;
                this.parts[i].size += this.parts[i + 1].size;
                this.parts.splice(i + 1, 1);
                // ("merge " + i); 
                queue.push({"time" : time, "func" : "merge", "para":[i]});
                // console.log(queue);
            }        
        }
    }
    // 输出信息，用于debug
    print() {
        console.log('memory info');
        console.log('memory size: ' + this.size);
        console.log('memory used: ' + this.used_size);
        console.log('\n');
        for (let i = 0; i < this.parts.length; i++) {
            this.parts[i].print();
        }
    }
}

/*
 * 模拟的内存分区的类
 */
class Part {
    constructor(order_number, size) {
        this.order_number = order_number; // 分区序号
        this.size = size; // 分区大小
        this.job_num = -1; // 装入的作业编号, -1代表可用
    }
    
    // 输出信息，用于debug
    print() {
        console.log('part info');
        console.log('order number:' + this.order_number);
        console.log('part size:' + this.size);
        console.log('job number:' + this.job_num);
        console.log('\n')
    }
}

/*
 * 作业的类
 */
class Job {
    constructor(order_number, size, in_time, run_time) {
        this.order_number = order_number; // 作业序号
        this.size = size; // 作业使用的内存大小
        this.in_time = in_time; // 作业进入内存时间
        this.run_time = run_time; // 作业运行需要的时间
        this.start_time = -1; // 作业开始运行的时间
        this.end_time = -1; // 作业结束运行的时间
    }
}

class Anime {
    constructor() {
        this.play_time = 0;
        this.wait_time = 0;
        this.before_time = 0;
        this.index = -1;
        this.go_on = true;
    }

    async step_play() {
        if (this.index == queue.length - 1)
            return;
        
        this.index += 1;
            
        let i = this.index;
        console.log(this.play_time, queue[i].func);
        if (queue[i].func == "add") {
            this.wait_time = add(queue[i].para[0], queue[i].para[1], queue[i].para[2]);
            let str =   "Select Part " + queue[i].para[1] + "<br>" + 
                        "The job start to run: " +
                        "No.     " + queue[i].para[2][0] + " " +
                        "Size:   " + queue[i].para[2][1];
                        // "Color: " + queue[i].para[2] + "<br>";
                        
            add_operation_display(str);
        }
        else if (queue[i].func == "finish") {
            let str = "The job " + queue[i].para[1] +" at part " + queue[i].para[0] + " finished.<br>";
                        
            add_operation_display(str);
            this.wait_time = finish(queue[i].para[0]);
        }
        else if (queue[i].func == "merge") {
            let str = "Merge two parts:<br>" +
                        "part " + queue[i].para[0] + " and " +
                        "part " + parseInt(queue[i].para[0] + 1) + "<br>" ;
                        
            add_operation_display(str);
            this.wait_time = merge(queue[i].para[0]);
        }
        else if (queue[i].func == "pass") {
            this.wait_time = 1000;
            this.play_time += 1;

            let str = "Time go on: " + this.play_time;
                        
            add_operation_display(str);
        } 
    }

    async auto_play() {
        if (this.play_time > time) {
            let str = "The animation is over.<br>It took " + this.play_time + " time slices to show the process.";
                        
            add_operation_display(str);
            
            return;
        }
        else {
            if (this.go_on == true) {
                await this.step_play();
                if (this.index != queue.length - 1) {
                    await sleep(this.wait_time + const_time).then(() => {this.auto_play();});
                }
                else {
                    let str = "The animation is over.<br>It took " + this.play_time + " time slices to show the process.";
                        
                    add_operation_display(str);
                }
            }
            else {
                let str = "Pause.";
                        
                add_operation_display(str);
            }
        }
    }
}