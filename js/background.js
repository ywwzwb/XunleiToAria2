/**
 * Created by zengwenbin on 16/9/12.
 */

chrome.contextMenus.create({
    "id": "xunleiToAria2LinkContextMenu",
    "title": "下载到 Aria2",
    "contexts": ["link", "image", "video", "audio"]
});
//初始化
if (!localStorage.serverUrl) {
    localStorage.serverUrl = "http://localhost:6800/jsonrpc";
}
if (!localStorage.downloadPath) {
    localStorage.downloadPath = "/mnt/";
}
ARIA2.init(localStorage.serverUrl);
chrome.browserAction.onClicked.addListener(function () {
    chrome.tabs.create({
        url: "http://lixian.xunlei.com"
    });
});
chrome.contextMenus.onClicked.addListener(function (info, tab) {
    chrome.tabs.executeScript({
        file: "js/jquery-3.1.0.min.js"
    }, function () {
        chrome.tabs.executeScript({
            file: "js/insert.js"
        }, function () {
            chrome.tabs.insertCSS({
                "file": "css/insert.css"
            }, function () {
                var url = info.srcUrl ? info.srcUrl : info.linkUrl;
                var task = Task.init();
                task.url = url;
                task.tabid = tab.id;
                TaskQueue.shareQueue().addTaskToQueue(task).doTask();
            });
        })
    });
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        switch (request.code) {
            case 100:
                //设置 aria2 链接/ 测试服务器连接
                if (request.message) {
                    localStorage.serverUrl = request.message.url;
                    localStorage.downloadPath = request.message.downloadPath;
                }
                ARIA2.init(localStorage.serverUrl, function () {
                    ARIA2.get_version(function (version) {
                        sendResponse({code: 1, message: version});
                    }, function () {
                        sendResponse({code: 0});
                    });
                }, function () {
                    sendResponse({code: 0});
                });
                return true;//异步消息发送
                break;

            case 101:
                //重置aria2 链接/ 测试服务器连接
                localStorage.serverUrl = "http://localhost:6800/jsonrpc";
                localStorage.downloadPath = "/mnt/";
                sendResponse({
                    code: 1,
                    message: {serverUrl: localStorage.serverUrl, downloadPath: localStorage.downloadPath}
                });
                break;
            case 102:
                //获取配置
                sendResponse({
                    code: 1,
                    message: {serverUrl: localStorage.serverUrl, downloadPath: localStorage.downloadPath}
                });
                break;
            default:
                break;
        }
    }
);
