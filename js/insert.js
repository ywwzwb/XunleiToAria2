/**
 * Created by zengwenbin on 16/9/13.
 */
chrome.runtime.onMessage.addListener(function (request) {
    console.log(request);
    switch (request.code) {
        case 0:
            showDiv();
            break;
        case 1:
            showYZMInput(request.message);
            break;
        case 2:
            onXunleiDownloadFinish();
            break;
        default:
            break;
    }
});
function showDiv() {
    if ($("#xunleitoaria2div").length == 0) {
        var overlay =  $("<div id = 'xunleitoaria2div' class = 'xunleitoaria2overlay'>").appendTo($("body"));
        var box = $("<div class = 'box'>").appendTo(overlay);
        var title = $("<span class = 'title'>").appendTo(box).text("加载中")
    } else {
        $("#xunleitoaria2div").show();
    }
    $("body").css("overflow","hidden");
}
function showYZMInput(taskInfo) {
    if ($("#xunleitoaria2div>.box>.yzmform").length == 0) {
        var box = $("#xunleitoaria2div>.box");
        var form = $("<div class = 'yzmform'><hr/><div/>").appendTo(box);
        var image = $("<img class = 'yzmimage'>").attr("src","http://verify2.xunlei.com/image?t=MVA&cachetime="+Math.floor((new Date).getTime() / 1000)).click(function(){
            var cacheTime = Math.floor((new Date).getTime() / 1000);
            $(this).attr("src","http://verify2.xunlei.com/image?t=MVA&cachetime="+cacheTime)
        }).appendTo(form);
        var input = $("<input class = 'yzminput'/>").appendTo(form);
        var button = $("<button class = 'yzmsubmit'>确定</button>").appendTo(form).click(function(){
            $("#xunleitoaria2div .title").text("请稍后");
            var yzm = $("#xunleitoaria2div .yzminput").val();
            chrome.runtime.sendMessage(null,{code:0, message:yzm, taskInfo: taskInfo});
        })
    } else {
        $("#xunleitoaria2div>.box>.yzmform").show();
        $("#xunleitoaria2div .yzmimage").attr("src","http://verify2.xunlei.com/image?t=MVA&cachetime="+Math.floor((new Date).getTime() / 1000))
    }
    $("#xunleitoaria2div .title").text("输入验证码")
}
function onXunleiDownloadFinish(){
    $("#xunleitoaria2div .title").text("请稍后");
    $("#xunleitoaria2div>.box>.yzmform").hide();
}