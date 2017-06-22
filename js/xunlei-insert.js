/**
 * Created by zengwenbin on 16/9/19.
 */
//这个用于插入到迅雷远程

$(function () {
    // 添加批量下载按钮
    var batch_download = $('<a href="javascript:;" class="btn_files btn_dis batch_aria2"><span>下载到 Aria2</span></a>');
    batch_download.insertBefore($(".opt_btn>a[clickid=batch_delete]"));
    $(document).on("click", ".j-chk-all,.chk_file", function () {
        setTimeout(function () {
            if ($(".chk_file.checked").length > 0) {
                batch_download.removeClass("btn_dis");
            } else {
                batch_download.addClass("btn_dis");
            }
        }, 1);
    });
    batch_download.click(function () {
    });
    var refreshListInterval = setInterval(function () {
        if ($(".files_list").length > 0 || $(".vip_compare").length > 0) {
            var task_opt_bar_download = $('<a href="javascript:;" title="标记喜欢" class="ico_file ico_f_fav  j-task-coll task_download"></a>');
            task_opt_bar_download.prependTo($(".files_list .file_opt"));
            clearInterval(refreshListInterval);
        } else {
            console.log("loading");
        }
    }, 100);
    // 任务下载按钮
    $(document).on("mouseover", ".files_list", function () {
        if ($(this).find(".task_download").length == 0) {
            var task_opt_bar_download = $('<a href="javascript:;" title="标记喜欢" class="ico_file ico_f_fav  j-task-coll task_download"></a>');
            task_opt_bar_download.prependTo($(this).find(".file_opt"));
        }
    });
    // 右键菜单下载
    $(document).on("mousedown", ".files_list", function(event){
        setTimeout(function(){
            if(event.which == 3) {// 右键单击
                if ($(".j-task-aria2".length == 0)) {
                    var menu_download = $('<li><a href="javascript:;"  class="j-task-aria2">下载到 Aria2</a></li>');
                    menu_download.insertBefore($(".drop_more_m>ul>li:eq(1)"));
                }
            }
        }, 1);
    })
    
    // var task_opt_bar_download = $('<a href="javascript:;" title="标记喜欢" class="ico_file ico_f_fav  j-task-coll"></a>');
    // task_opt_bar_download.prependTo($(".file_opt"));
    // btn.click(function () {
    //     var checkedOkItem = $(".in_ztclick:checked").parents(".rw_list").find(".rwicok").parents(".rw_list");
    //     var tasks = [];
    //     $.each(checkedOkItem, function () {
    //         var id = $(this).attr("taskid");
    //         var openFormat = $(this).attr("openformat");
    //         if (openFormat == "bt") {
    //             tasks.push({
    //                 id: id,
    //                 taskname: $(this).find(".namelink span").attr("title")
    //             });
    //         } else {
    //             var url = $("#dl_url" + id).val();
    //             tasks.push({
    //                 url: url,
    //                 taskname: $(this).find(".namelink span").attr("title")
    //             });
    //         }
    //     });
    //     if (tasks.length > 0) {
    //         chrome.runtime.sendMessage({
    //             code: 202,
    //             message: tasks
    //         });
    //     }
    // });
    // $(document).on('click', '.rw_list,#ckbutton,.in_ztclick', function () {
    //     var checkedOkItem = $(".in_ztclick:checked").parents(".rw_list").find(".rwicok").parents(".rw_list");
    //     if (checkedOkItem.length == 0) {
    //         btn.addClass("noit");
    //     } else {
    //         btn.removeClass("noit")
    //     }

    // });
    // function onrw_listClicked(item) {
    //     var btnContainer = $(item).find(".rwset");
    //     var finish = $(item).find(".rwicok").length > 0;
    //     if (btnContainer.children(".downloadToAria2").length == 0 && finish) {
    //         var downloadBtn = $("<a href='#' class='rwbtn downloadtoariabtn downloadToAria2' title='下载到 Aria2'>下载到 Aria2</a>").prependTo(btnContainer);
    //         downloadBtn.click(function () {
    //             var id = $(item).attr("taskid");
    //             var openFormat = $(item).attr("openformat");
    //             if (openFormat == "bt") {
    //                 chrome.runtime.sendMessage({
    //                     code: 201,
    //                     message: {
    //                         id: id,
    //                         taskname: $(item).find(".namelink span").attr("title")
    //                     }
    //                 });
    //             } else {
    //                 var url = $("#dl_url" + id).val();
    //                 chrome.runtime.sendMessage({
    //                     code: 200,
    //                     message: {
    //                         url: url,
    //                         taskname: $(item).find(".namelink span").attr("title")
    //                     }
    //                 });
    //             }
    //         });
    //     }
    // }

    // $(document).on('click', '.rw_list', function () {
    //     onrw_listClicked(this);
    // });
    // onrw_listClicked($(".rw_list:first"));
    // chrome.runtime.onMessage.addListener(function (request, sender, response) {
    //     switch (request.code) {
    //         case 0:
    //             showDiv();
    //             break;
    //         case 7:
    //             onAria2DownloadFinish();
    //             break;
    //         case 8:
    //             onAria2DownloadFail();
    //             break;
    //         case 10:
    //             onTaskDone();
    //             break;
    //         default:
    //             break;
    //     }
    // });
    // function showDiv() {
    //     if ($("#xunleitoaria2div").length == 0) {
    //         var overlay = $("<div id = 'xunleitoaria2div' class = 'xunleitoaria2overlay'>").appendTo($("body"));
    //         var box = $("<div class = 'box'>").appendTo(overlay);
    //         var title = $("<span class = 'title'>").appendTo(box).text("加载中")
    //     } else {
    //         $("#xunleitoaria2div .title").text("加载中");
    //         $("#xunleitoaria2div").show();
    //     }
    //     $("body").css("overflow", "hidden");
    // }

    // function onAria2DownloadFinish() {
    //     $("#xunleitoaria2div .title").text("下载成功");
    //     $("#xunleitoaria2div>.box>.yzmform").hide();
    // }

    // function onAria2DownloadFail() {
    //     $("#xunleitoaria2div .title").text("下载失败, 请检查设置");
    //     $("#xunleitoaria2div>.box>.yzmform").hide();
    //     setTimeout(function () {
    //         chrome.runtime.sendMessage({
    //             code: 300//open setting page
    //         });
    //     }, 1000);
    // }

    // function onTaskDone() {
    //     setTimeout(function () {
    //         $("#xunleitoaria2div").hide();
    //         $("body").css("overflow", "auto");
    //     }, 2000);
    // }
});