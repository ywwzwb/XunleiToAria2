/**
 * Created by zengwenbin on 16/9/12.
 */

chrome.contextMenus.create({
    "id": "xunleiToAria2LinkContextMenu",
    "title": "下载到 Aria2",
    "contexts": ["link", "image", "video", "audio"]
});
XunleiLiXian.init();
chrome.contextMenus.onClicked.addListener(function (info) {
    chrome.tabs.executeScript({
        file: "js/jquery-3.1.0.min.js"
    }, function () {
        chrome.tabs.executeScript({
            file: "js/insert.js"
        }, function () {
            chrome.tabs.insertCSS({
                "file": "css/insert.css"
            }, function () {
                MessageSend(0);
                var url = info.srcUrl ? info.srcUrl : info.linkUrl;
                XunleiLiXian.addTask(url);
            });

        })
    });
});

chrome.runtime.onMessage.addListener(function (request){
    if(request.code == 0) {
        //传过来的验证码
        var yzm = request.message;
        var taskInfo = request.taskInfo;
        taskInfo.verify_code = yzm;
        XunleiLiXian.commitMagnetTask(taskInfo);
    }
});


