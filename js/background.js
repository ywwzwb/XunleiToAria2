/**
 * Created by zengwenbin on 16/9/12.
 */

chrome.contextMenus.create({
    "id": "xunleitoaria2_menu"+Math.random()*10000,
    "title": "下载到 Aria2",
    "contexts": ["link", "image", "video", "audio"]
});
chrome.runtime.onInstalled.addListener(function(previousVersion){
    chrome.runtime.openOptionsPage();
});
//初始化
if (!localStorage.serverUrl) {
    localStorage.serverUrl = "http://localhost:6800/jsonrpc";
    localStorage.downloadPath = "/mnt/";
}
Aria2.shareAria2().setUrl(localStorage.serverUrl);
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
                task.doTask();
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
                Aria2.shareAria2().setUrl(localStorage.serverUrl, function(serverOk, message){
                    if (serverOk){
                        sendResponse({code: 1, message: message});
                    } else {
                        sendResponse({code: 0});
                    }
                });
                return true;//异步消息发送
                break;

            case 101:
                //重置aria2 链接
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
            case 200:
                //迅雷页面单普通任务下载
                var task = Task.init();
                task.url = request.message.url;
                task.tabid = sender.tab.id;
                task.isLixanUrl = true;
                task.taskname = request.message.taskname;
                task.doTask();
                break;
            case 201:
                //迅雷页面单bt任务下载
                var task = Task.init();
                task.url = undefined;
                task.tabid = sender.tab.id;
                task.btTaskID = request.message.id;
                task.taskname = request.message.taskname;
                task.doTask();
                break;
            case 202:
                //迅雷页面批量任务下载
                var tasks = [];
                for (var i in request.message) {
                    var info = request.message[i];
                    var task = Task.init();
                    task.url = info["url"];
                    task.tabid = sender.tab.id;
                    task.btTaskID = info["id"];
                    task.taskname = info["taskname"];
                    if (task.url) {
                        task.isLixanUrl = true;
                    }
                    tasks.push(task);
                }
                tasks[0].sendMessageToConentScript(ContentMessageCode.taskStart);
                XunleiAPI.init(tasks).doTasks();
                break;

            case 300:
                chrome.runtime.openOptionsPage();
                break;
            default:
                break;
        }
    }
);
