/*
 * @Author: One_Random
 * @Date: 2020-07-14 08:22:41
 * @LastEditors: One_Random
 * @LastEditTime: 2020-07-16 19:51:25
 * @FilePath: /OS/js/d3.js
 * @Description: Copyright © 2020 One_Random. All rights reserved.
 */ 
var slot = 1000;
var quick_slot = (2 * slot) / 5;
var default_height = 40;
var default_color = "#2ea44e";
var lighter_color = "#72de8f";
var background_color = "whitesmoke";
var rect_x_padding = 0;
var rect_y_padding = 3;
var text_x_padding = 5;
var text_y_padding = 25;
var trans_padding = 10;

var max_size_ = 100;
var dataset = [];
var parts_info = [];
var order = 0;

function svg_x_scale(length) {
    return length * 200 / max_size_;
}

function svg_y_scale(length, times = 1) {
    return length * times;
}

function set_svg(width, height, max_size) {
    // 定义画布
    var svg = d3.select("body").select("#visiable_svg")
                .attr("width", width)
                .attr("height", height)
                .attr("font-family", "Consolas");
                //.attr("font-family", "Helvetica");

    order = 0;
    max_size_ = max_size;
    dataset.push(max_size);
    parts_info.push([0, -1, default_color]);
    
    var rects = svg.selectAll(".mem_rect")
                .data(dataset)
                .enter()
                .append("rect")
                .attr("class", "mem_rect")
                .attr("id", (d, i)  => {
                    return "part_" + parts_info[i][0];
                })
                .attr("y", (d, i)  => {
                    return svg_y_scale(i * default_height) + i * rect_y_padding;
                })
                .attr("x", rect_x_padding)
                .attr("height", svg_y_scale(default_height))
                .attr("width", (d)  => {
                    return svg_x_scale(d);
                })
                .attr("fill", (d, i) => {
                    return parts_info[i][2];
                })
    
    var size_texts = svg.selectAll(".mem_size_text")
                    .data(dataset)
                    .enter()
                    .append("text")
                    .text((d, i) => {
                        return d;
                    })
                    .attr("class", "mem_size_text")
                    .attr("id", (d, i) => {
                        return "size_" + parts_info[i][0];
                    })
                    .attr("x", (d, i) => {
                        return svg_x_scale(parseInt(d)) + rect_x_padding + text_x_padding;
                    })
                    .attr("y", (d, i) => {
                        return svg_y_scale(i * default_height) + i * rect_y_padding + text_y_padding;
                    })
}

async function reset_svg(width, height, max_size) {
    d3.selectAll('.mem_rect').remove();
    d3.selectAll('.mem_size_text').remove();

    order = 0;
    dataset = [];
    parts_info = [];
    dataset.push(max_size);
    parts_info.push([0, -1, default_color]);

    var svg = d3.select("body").select("#visiable_svg");
    
    var rects = svg.selectAll(".mem_rect")
                .data(dataset)
                .enter()
                .append("rect")
                .attr("class", "mem_rect")
                .attr("id", (d, i)  => {
                    return "part_" + parts_info[i][0];
                })
                .attr("y", (d, i)  => {
                    return svg_y_scale(i * default_height) + i * rect_y_padding;
                })
                .attr("x", rect_x_padding)
                .attr("height", svg_y_scale(default_height))
                .attr("width", (d)  => {
                    return svg_x_scale(d);
                })
                .attr("fill", (d, i) => {
                    return parts_info[i][2];
                })
    
    var size_texts = svg.selectAll(".mem_size_text")
                    .data(dataset)
                    .enter()
                    .append("text")
                    .text((d, i) => {
                        return d;
                    })
                    .attr("class", "mem_size_text")
                    .attr("id", (d, i) => {
                        return "size_" + parts_info[i][0];
                    })
                    .attr("x", (d, i) => {
                        return svg_x_scale(parseInt(d)) + rect_x_padding + text_x_padding;
                    })
                    .attr("y", (d, i) => {
                        return svg_y_scale(i * default_height) + i * rect_y_padding + text_y_padding;
                    })
}

function add(index, part_number, job_info){
    let size = dataset[index] - job_info[1];
    if (size == 0) {
        parts_info[index][1] = job_info[0];
        d3.select("#part_" + parts_info[index][0])
        .transition()
        .duration(quick_slot)
        .attr("fill", lighter_color)
        .transition()
        .duration(quick_slot)
        .transition()
        .attr("fill", default_color)
        .transition()
        .duration(quick_slot)
        .attr("fill", lighter_color)
        .transition()
        .duration(quick_slot)
        .attr("fill", default_color)
        .transition()
        .delay(quick_slot)
        .duration(slot)
        .attr("fill", job_info[2]);

        d3.select("#size_" + parts_info[index][0])
        .transition()
        .delay(slot * 2)
        .duration(slot/2)
        .attr("fill", background_color)
        .transition()
        .duration(slot/2)
        .attr("fill", "black")
        .text(dataset[index] + "(job"+parts_info[index][1]+")");
        return 3 * slot;
    }

    d3.selectAll(".mem_rect")
    .transition()
    .delay(slot * 3)
    .duration(slot)
    .attr("y", (d, i) => {
        let y = d3.select("#part_" + parts_info[i][0]).attr("y");
        if (i > index)
            return parseInt(y) + svg_y_scale(default_height) + rect_y_padding;
        else
            return parseInt(y);
    });

    d3.selectAll(".mem_size_text")
    .transition()
    .delay(slot * 3)
    .duration(slot)
    .attr("y", (d, i) => {
        let y = d3.select("#part_" + parts_info[i][0]).attr("y");
        if (i > index)
            return parseInt(y) + svg_y_scale(default_height) + rect_y_padding + text_y_padding;
        else
            return parseInt(y) + text_y_padding;
    });

    let orignal = d3.select("#part_" + parts_info[index][0]);

    let orignal_width = parseInt(orignal.attr("width"));
    let orignal_height = parseInt(orignal.attr("height"));
    let orignal_x = parseInt(orignal.attr("x"));
    let orignal_y = parseInt(orignal.attr("y"));
    
    dataset[index] -= size;
    dataset.splice(index + 1, 0, size);
    parts_info[index][1] = job_info[0];
    parts_info[index][2] = job_info[2];
    parts_info.splice(index + 1, 0, [part_number, -1, default_color]);

    orignal
    .transition()
    .duration(quick_slot)
    .attr("fill", lighter_color)
    .transition()
    .duration(quick_slot)
    .transition()
    .attr("fill", default_color)
    .transition()
    .duration(quick_slot)
    .attr("fill", lighter_color)
    .transition()
    .duration(quick_slot)
    .attr("fill", default_color)
    
    setTimeout(() => {
        orignal
        .attr("fill", default_color)
        .attr("width", orignal_width - svg_x_scale(size))
        .transition()
        .duration(slot)
        .attr("fill", parts_info[index][2]);
    }, slot * 2);
    
    d3.select("#size_" + parts_info[index][0])
    .transition()
    .delay(slot * 2)
    .duration(slot)
    .attr("x", orignal_width + orignal_x + text_x_padding + trans_padding)
    .transition()
    .duration(slot)
    .attr("fill", background_color)
    .transition()
    .duration(slot)
    .attr("x", orignal_width + orignal_x - svg_x_scale(size) + text_x_padding)
    .attr("fill", "black")
    .text(dataset[index] + "(job"+parts_info[index][1]+")");
        
    d3.select("body").select("#visiable_svg")
    .selectAll(".mem_rect")
    .data(dataset)
    .enter()
    .insert("rect", "#size_" + parts_info[index][0])
    .transition()
    .delay(slot * 2)
    .duration(0)
    .attr("fill", default_color)
    .attr("class", "mem_rect")
    .attr("id", "part_" + parts_info[index+1][0])
    .attr("y", orignal_y)
    .attr("x", orignal_width + orignal_x - svg_x_scale(size))
    .attr("height", orignal_height)
    .attr("width", svg_x_scale(size)) //???
    .transition()
    .duration(slot)
    .attr("x", orignal_width + orignal_x - svg_x_scale(size) + trans_padding)
    .transition()
    .duration(slot)
    .attr("y", orignal_y + svg_y_scale(default_height) + rect_y_padding)
    .transition()
    .duration(slot)
    .attr("x", rect_x_padding);

    d3.select("body").select("#visiable_svg")
    .selectAll(".mem_size_text")
    .data(dataset)
    .enter()
    //.insert("text", "#size_" + parts_info[index+2][0])
    .append("text")
    .transition()
    .delay(slot * 2)
    .duration(0)
    .text("")
    .attr("class", "mem_size_text")
    .attr("id", "size_" + parts_info[index+1][0])
    .attr("x", orignal_width + orignal_x + trans_padding + text_x_padding)
    .attr("y", orignal_y + svg_y_scale(default_height) + rect_y_padding + text_y_padding)
    .attr("fill", background_color)
    .transition()
    .delay(slot * 2)
    .duration(slot)
    .text(size)
    .attr("x", orignal_x + svg_x_scale(size) + text_x_padding)
    .attr("fill", "black");

    return slot * 5;
}

function finish(index) {
    parts_info[index][1] = -1;
    d3.select("#part_" + parts_info[index][0])
    .transition()
    .duration(slot)
    .attr("fill", default_color);

    d3.select("#size_" + parts_info[index][0])
    .transition()
    .duration(slot/2)
    .attr("fill", background_color)
    .transition()
    .duration(slot/2)
    .text(dataset[index])
    .attr("fill", "black");

    return slot * 2;
}

function merge(index) {
    let orignal = d3.select("#part_" + parts_info[index][0]);

    let orignal_width = parseInt(orignal.attr("width"));
    let orignal_height = parseInt(orignal.attr("height"));
    let orignal_x = parseInt(orignal.attr("x"));
    let orignal_y = parseInt(orignal.attr("y"));

    for (let i = index + 1; i < parts_info.length; i++) {
        let y = d3.select("#part_" + parts_info[i][0]).attr("y")
        d3.select("#part_" + parts_info[i][0])
        .transition()
        .delay(slot)
        .duration(slot)
        .attr("y", parseInt(y) - svg_y_scale(default_height) - rect_y_padding);
            
        d3.select("#size_" + parts_info[i][0])
        .transition()
        .delay(slot)
        .duration(slot)
        .attr("y", parseInt(y) - svg_y_scale(default_height) - rect_y_padding + text_y_padding); 
    }

    orignal.attr("y", orignal_y)
    .transition()
    .delay(slot * 2)
    .duration(slot)
    .attr("fill", default_color)
    .transition()
    .duration(0)
    .attr("width", orignal_width + svg_x_scale(dataset[index+1]))

    d3.select("#part_" + parts_info[index+1][0])
    .transition()
    .duration(slot)
    .attr("x", orignal_width + orignal_x + trans_padding)
    .transition()
    .duration(slot)
    .attr("y", orignal_y)
    .transition()
    .duration(slot)
    .attr("x", orignal_width + orignal_x)
    //.attr("fill", background_color)
    .remove();

    d3.select("#size_" + parts_info[index][0])
    .transition()
    .duration(slot)
    .attr("x", orignal_width + orignal_x + svg_x_scale(dataset[index + 1]) + text_x_padding + trans_padding)
    .transition()
    .duration(slot)
    .attr("fill", background_color)
    .transition()
    .duration(slot)
    .text(dataset[index] + dataset[index+1])
    .attr("x", orignal_width + orignal_x + svg_x_scale(dataset[index + 1]) + text_x_padding)
    .attr("fill", "black");

    d3.select("#size_" + parts_info[index+1][0])
    .transition()
    .duration(slot)
    .attr("fill", background_color)
    .attr("x", orignal_width + orignal_x + svg_x_scale(dataset[index + 1]) + text_x_padding + trans_padding)
    .remove();

    dataset[index] += dataset[index+1];
    dataset.splice(index + 1, 1);
    parts_info[index][1] = -1;
    parts_info.splice(index + 1, 1);

    // d3.selectAll(".mem_rect").data(dataset);

    return slot * 3;
}
