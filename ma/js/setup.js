/*
 * @Author: One_Random
 * @Date: 2020-07-14 08:58:47
 * @LastEditors: One_Random
 * @LastEditTime: 2020-09-11 09:53:31
 * @FilePath: /FS/ma/js/setup.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */ 
const debug = false;
const release = true;
// var jobs = new Array();
var system;
var anime;
var input_size = 0;
async function set_up_system() {
    // let set_mem_select = document.getElementById('setofmem');
    // let setofmem = parseInt(set_mem_select.options[set_mem_select.selectedIndex].value);
    // let size = parseInt(setofmem * document.getElementById('max_mem_size').value);
    let size = 100; //arseInt(document.getElementById('max_mem_size').value);
    input_size = size;
    
    let algorithm_select = document.getElementById('algorithm');
    let type = algorithm_select.options[algorithm.selectedIndex].value;

    // error handle
    if(isNumber(size) == true && size > 0){
        let size = 100;//parseInt(document.getElementById('max_mem_size').value);
        input_size = size;
    }
    else{
        alert("Invalid memory size.\nMemory size cannot be less than 1 bytes");
        return;
    }
        
    system = new System(size, type);

    // remove_all_jobs_display(); 
    
    // add debug info
    if (debug)
        console.log(system)

    if (release) {
        let str = "The system has been set up and initialized.\n" 
            + "The memory size is " + size + " " + "MB.\n"
            + "The allocation algorithm is " +  type + ".\n\n"
            + "The system has been initialized.\n";
            + "Now the size of the used is 0 bytes.\n";
    }
}

function remove_all_jobs() {
    // document.getElementById('confirmed_jobs').innerHTML = "";
    jobs.length = 0;
    remove_all_jobs_display();
    if (release) {
        let str = "The jobs has been removed.\n";
    }
}

function read_from_file() {
    remove_all_jobs();
    
    let selectedFile = document.getElementById("json_file").files[0];
    let reader = new FileReader();
    let jobs_json;
    reader.readAsText(selectedFile);

    reader.onload = function(){
        let jobs_json;
        try{
            jobs_json = JSON.parse(this.result);
        }
        catch(e) {
            if (release) {
                let str = "The file isn't supported!\n" 
                    + "Please check the file!\n";
            }
            alert("The file isn't supported!");
            return;
        }
        if (jobs_json != undefined) {
            for (let i = 0; i < jobs_json.length; i++) {
                job = jobs_json[i];

                // add debug info
                if (debug)
                    console.log(job);

                if(isJob(job)){
                    jobs.push(job);
                    //console.log(job);
                    add_job_display(job);
                }
                else{
                    alert("Invalid jobs.\nPlease check the jobs.");
                    remove_all_jobs_display();
                    return;
                }
            }
        }
    }
}

function add_a_job(order_number, size, in_time, run_time) {
    // let order_number = parseInt(document.getElementById('order_number').value);

    // // let set_job_select = document.getElementById('setofjob');
    // // let setofjob = parseInt(set_job_select.options[set_job_select.selectedIndex].value);
    // // let size = parseInt(setofjob * document.getElementById('size').value);
    // let size = parseInt(document.getElementById('job_size').value);

    // let in_time = parseInt(document.getElementById('in_time').value);
    // let run_time = parseInt(document.getElementById('run_time').value);
    
    let job = new Job(order_number, size, in_time, run_time);

    if(isJob(job)){
        add_job_display(job);
        jobs.push(job);
    }
    else{
        alert("Invalid input. Please check the input.")
        return;
    }
}

function display_manually() {
    if (document.getElementById('manually').innerHTML == 'hide') {
        document.getElementById('input').style='display:none'; 
        document.getElementById('manually').innerHTML = 'add jobs manually';
    }
    else {
        document.getElementById('input').style='display:block'; 
        document.getElementById('manually').innerHTML = 'hide';
    }
}

function pause() {
    anime.go_on = !anime.go_on;
    let btn = document.getElementById("btn-pause");
    if (btn.innerHTML == "pause") {
        btn.style = "background-color:#f9c513; color: white; width: 70px; margin-left: 48px;"
        btn.innerHTML = "resume";
    } 
    else {
        btn.style = "background-color:#79b8ff; color: white; width: 70px; margin-left: 48px;"
        btn.innerHTML = "pause";
    }
    anime.auto_play();
}

async function load_jobs() {
    console.log(document.getElementById('btn-reset').innerHTML);
    if (document.getElementById('btn-reset').innerHTML == 'set jobs') {
        await set_up_system();
        await origin_to_jobs();
        console.log(jobs);
        for (let i = 0; i < jobs.length; i++) {
           if (await system.add_job(jobs[i]) == false) {
               alert('The job cannot be added.\nPlease check!');
               return;
           }
        }
        document.getElementById('btn-reset').innerHTML = 'reset jobs';
        document.getElementById('btn-reset').style = 'width: 80px; background-color: #e34c25; color:white; margin-left: 40px;';
        document.getElementById('btn-pause').innerHTML = 'pause'; 
        
        let str = "The system has been set up.<br>" +
                "The algorithm is " + system.type + ".<br>" +
                "The max memory size is " + system.memory.size + "MB.<br>";
        add_operation_display(str);

        sleep(0).then(() => {system.run();});
        
        add_operation_display("You can play the animation now.\n");

        set_svg(400, 600, input_size);
        anime = new Anime();        
    }
    else {
        pause();
        set_up_system();
        await set_up_system();
        for (let i = 0; i < jobs.length; i++) {
           if (await system.add_job(jobs[i]) == false) {
               alert('The job cannot be added.\nPlease check!');
               return;
           }
        }           
        reset_svg(400, 600, input_size);
        
        let str = "The system has been reset up.<br>" +
                "The algorithm is " + system.type + ".<br>" +
                "The max memory size is " + system.memory.size + "MB.<br>";
                
        add_operation_display(str);
        
        sleep(0).then(() => {system.run();});

        add_operation_display("You can play the animation now.\n");
        
        document.getElementById('btn-pause').innerHTML = 'pause'; 
        anime = new Anime();
    }      
}

function isNumber(obj) {
    var reg = /(^[1-9]\d*$)/;
    if (reg.test(obj)) {
      return true;
    }
    return false;
}

function isJob(job) {
    // let max_size = document.getElementById("max_mem_size").value;
    if(job.size < 0)
        return false;
    else if(job.order_number < 0)
        return false;
    else if(job.in_time < 0)
        return false;
    else if(job.run_time < 0)
        return false;
    return true;
}

/*display jobs on frontpage 07/16*/
function add_job_display(job) {
    let p = document.getElementById('jobs');
    let str='<tr class="default"><td>'+job.order_number+'</td><td>'+job.size+'</td><td>'+job.in_time+'</td><td>'+job.run_time+'</td><td>'+ "-" +"</td><td>" + "-" +"</td>";
    p.innerHTML += str;
}

function add_full_job_display(job) {
    let p = document.getElementById('jobs');
    let str='<tr class="default"><td>'+job.order_number+'</td><td>'+job.size+'</td><td>'+job.in_time+'</td><td>'+job.run_time+'</td><td>'+ job.start_time +"</td><td>" + job.end_time +"</td>";
    p.innerHTML += str;
}

/*display operation on frontpage 07/16*/
function add_operation_display(operation) {
    let str ='<div class="p-3 height-fit border" style="width:inherit;">'+operation+'</div>';
    let p = document.getElementById('process');
    p.innerHTML = str + p.innerHTML;
}

/*07/16 */
function remove_all_jobs_display() {
    document.getElementById('jobs').innerHTML = '';
}