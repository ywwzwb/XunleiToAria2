/**
 * Created by zengwenbin on 16/9/13.
 */
if ($("#xunleitoaria2hidden").length == 0) {
    $("<input id ='xunleitoaria2hidden' type = 'hidden'/>").appendTo($("body"));
    chrome.runtime.onMessage.addListener(function (request, sender, response) {
        switch (request.code) {
            case 0:
                showDiv();
                break;
            case 1:
                showYZMInput(response);
                return true;//异步消息
                break;
            case 2:
                onXunleiDownloadFinish();
                break;
            case 3:
                onXunleiJB();
                break;
            case 4:
                onXunleiDownloadDoing();
                break;
            case 5:
                onXunleiLoginFail();
                break;
            case 6:
                onAria2DownloadFinish();
                break;
            case 7:
                onAria2DownloadFail();
                break;
            default:
                break;
        }
    });
}
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
function showYZMInput(response) {
    if ($("#xunleitoaria2div>.box>.yzmform").length == 0) {
        var box = $("#xunleitoaria2div>.box");
        var form = $("<div class = 'yzmform'><hr/><div/>").appendTo(box);
        var image = $("<img class = 'yzmimage'>").attr("src", "http://verify2.xunlei.com/image?t=MVA&cachetime=" + Math.floor((new Date).getTime() / 1000)).click(function () {
            var cacheTime = Math.floor((new Date).getTime() / 1000);
            $(this).attr("src", "http://verify2.xunlei.com/image?t=MVA&cachetime=" + cacheTime)
        }).appendTo(form);
        var input = $("<input class = 'yzminput'/>").appendTo(form);
        var button = $("<button class = 'yzmsubmit'>确定</button>").appendTo(form);
    } else {
        $("#xunleitoaria2div>.box>.yzmform").show();
        $("#xunleitoaria2div .yzmimage").attr("src", "http://verify2.xunlei.com/image?t=MVA&cachetime=" + Math.floor((new Date).getTime() / 1000))
    }
    $("#xunleitoaria2div .yzmsubmit").click(function () {
        $("#xunleitoaria2div .title").text("请稍后");
        var yzm = $("#xunleitoaria2div .yzminput").val();
        response({code: 0, message: yzm})
    });
    $("#xunleitoaria2div .title").text("输入验证码")
}
function onXunleiDownloadFinish() {
    $("#xunleitoaria2div .title").text("添加到迅雷成功");
    $("#xunleitoaria2div>.box>.yzmform").hide();
}
function onXunleiJB() {
    $("#xunleitoaria2div .title").text("资源被举报了");
    $("#xunleitoaria2div>.box>.yzmform").hide();
    setTimeout(function () {
        $("#xunleitoaria2div").hide();
        $("body").css("overflow", "auto");
    }, 2000);
}
function onXunleiDownloadDoing() {
    $("#xunleitoaria2div .title").text("迅雷远程下载中, 请稍后再试");
    $("#xunleitoaria2div>.box>.yzmform").hide();
    setTimeout(function () {
        $("#xunleitoaria2div").hide();
        $("body").css("overflow", "auto");
    }, 2000);
}
function onAria2DownloadFinish() {
    $("#xunleitoaria2div .title").text("下载成功");
    $("#xunleitoaria2div>.box>.yzmform").hide();
    setTimeout(function () {
        $("#xunleitoaria2div").hide();
        $("body").css("overflow", "auto");
    }, 2000);
}
function onAria2DownloadFail() {
    $("#xunleitoaria2div .title").text("下载失败, 请检查设置");
    $("#xunleitoaria2div>.box>.yzmform").hide();
    setTimeout(function () {
        $("#xunleitoaria2div").hide();
        $("body").css("overflow", "auto");
        if (chrome.runtime.openOptionsPage) {
            // New way to open options pages, if supported (Chrome 42+).
            chrome.runtime.openOptionsPage();
        } else {
            // Reasonable fallback.
            window.open(chrome.runtime.getURL('options.html'));
        }
    }, 2000);
}
function onXunleiLoginFail() {
    $("#xunleitoaria2div .title").text("请先登录");
    $("#xunleitoaria2div>.box>.yzmform").hide();
    setTimeout(function () {
        $("#xunleitoaria2div").hide();
        $("body").css("overflow", "auto");
        window.open("http://lixian.xunlei.com", "_blank");
    }, 2000);
}