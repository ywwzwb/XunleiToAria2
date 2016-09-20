/**
 * Created by zengwenbin on 16/9/19.
 */
//这个用于插入到迅雷远程

$(function () {
    var btn = $("<a href='#' id='li_task_to_aria2' title='下载到 Aria2' class='btn_m'><span><em class='icdwlocal'>下载到 Aria2</em></span></a>");
    btn.prependTo($("#li_task_down").parent());
    btn.click(function () {
        var checkedOkItem = $(".in_ztclick:checked").parents(".rw_list").find(".rwicok").parents(".rw_list");
        var tasks = [];
        $.each(checkedOkItem, function () {
            var id = $(this).attr("taskid");
            var openFormat = $(this).attr("openformat");
            if (openFormat == "bt") {
                tasks.push({
                    id: id,
                    taskname: $(this).find(".namelink span").attr("title")
                });
            } else {
                var url = $("#dl_url" + id).val();
                tasks.push({
                    url: url,
                    taskname: $(this).find(".namelink span").attr("title")
                });
            }
        });
        if (tasks.length > 0) {
            chrome.runtime.sendMessage({
                code: 202,
                message: tasks
            });
        }
    });
    $(".rw_list,#ckbutton,.in_ztclick").click(function () {
        var checkedOkItem = $(".in_ztclick:checked").parents(".rw_list").find(".rwicok").parents(".rw_list");
        if (checkedOkItem.length == 0) {
            btn.addClass("noit");
        } else {
            btn.removeClass("noit")
        }

    });
    function onrw_listClicked(item) {
        var btnContainer = $(item).find(".rwset");
        var finish = $(item).find(".loadnum").text() == "100%";
        if (btnContainer.children(".downloadToAria2").length == 0 && finish) {
            var downloadBtn = $("<a href='#' class='rwbtn downloadtoariabtn downloadToAria2' title='下载到 Aria2'>下载到 Aria2</a>").prependTo(btnContainer);
            downloadBtn.click(function () {
                var id = $(item).attr("taskid");
                var openFormat = $(item).attr("openformat");
                if (openFormat == "bt") {
                    chrome.runtime.sendMessage({
                        code: 201,
                        message: {
                            id: id,
                            taskname: $(item).find(".namelink span").attr("title")
                        }
                    });
                } else {
                    var url = $("#dl_url" + id).val();
                    chrome.runtime.sendMessage({
                        code: 200,
                        message: {
                            url: url,
                            taskname: $(item).find(".namelink span").attr("title")
                        }
                    });
                }
            });
        }
    }

    $(".rw_list").click(function () {
        onrw_listClicked(this);
    });
    onrw_listClicked($(".rw_list:first"));
    chrome.runtime.onMessage.addListener(function (request, sender, response) {
        switch (request.code) {
            case 0:
                showDiv();
                break;
            case 6:
                onAria2DownloadFinish();
                break;
            case 7:
                onAria2DownloadFail();
                break;
            case 8:
                onTaskDone();
                break;
            default:
                break;
        }
    });
    function showDiv() {
        if ($("#xunleitoaria2div").length == 0) {
            var overlay = $("<div id = 'xunleitoaria2div' class = 'xunleitoaria2overlay'>").appendTo($("body"));
            var box = $("<div class = 'box'>").appendTo(overlay);
            var title = $("<span class = 'title'>").appendTo(box).text("加载中")
        } else {
            $("#xunleitoaria2div .title").text("加载中");
            $("#xunleitoaria2div").show();
        }
        $("body").css("overflow", "hidden");
    }

    function onAria2DownloadFinish() {
        $("#xunleitoaria2div .title").text("下载成功");
        $("#xunleitoaria2div>.box>.yzmform").hide();
    }

    function onAria2DownloadFail() {
        $("#xunleitoaria2div .title").text("下载失败, 请检查设置");
        $("#xunleitoaria2div>.box>.yzmform").hide();
        setTimeout(function () {
            chrome.runtime.sendMessage({
                code: 300//open setting page
            });
        }, 1000);
    }

    function onTaskDone() {
        setTimeout(function () {
            $("#xunleitoaria2div").hide();
            $("body").css("overflow", "auto");
        }, 2000);
    }
});