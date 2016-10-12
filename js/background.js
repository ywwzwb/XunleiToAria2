/**
 * Created by zengwenbin on 16/9/12.
 */

chrome.contextMenus.removeAll();//先要清空之前设置的菜单
chrome.contextMenus.create({
    "id": "xunleitoaria2_downloadoverxunlei",
    "title": "使用迅雷下载到 Aria2",
    "contexts": ["link", "image", "video", "audio"]
});
chrome.contextMenus.create({
    "id": "xunleitoaria2_downloadirectly",
    "title": "直接下载到 Aria2",
    "contexts": ["link", "image", "video", "audio"]
});
ServerManager.shareManager();//先调用 ServerManager的初始化方法初始化数据库
chrome.runtime.onInstalled.addListener(function (previousVersion) {
    setTimeout(function () {
        //没有配置的情况下, 弹出设置框
        if (!ServerManager.shareManager().getCurrentServerID()) {
            chrome.runtime.openOptionsPage();
        }
    }, 300);
});
setTimeout(function () {
    ServerManager.shareManager().getCurrentServer(function (success, server) {
        if (success) {
            Aria2.shareAria2().setUrl(server.url, function (success, version) {
                if (success) {
                    server.version = version;
                } else {
                    server.version = -1;
                }
                ServerManager.shareManager().updateServer(server.id, server);
            });
        } else {
            console.warn("服务器获取失败");
        }
    });
}, 300);
chrome.browserAction.onClicked.addListener(function () {
    chrome.tabs.create({
        url: "http://lixian.xunlei.com"
    });
});
chrome.contextMenus.onClicked.addListener(function (info, tab) {
    // var menuid = info.menuItemId
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
                task.directDownloadTask = info.menuItemId == "xunleitoaria2_downloadirectly";
                task.doTask();
            });
        })
    });
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        switch (request.code) {
            case 100:
                //测试服务器连接
                Aria2.init().setUrl(request.message, function (success, version) {
                    if (success) {
                        sendResponse({code: 1, message: version});
                    } else {
                        sendResponse({code: 0});
                    }
                });
                return true;//异步消息发送
                break;
            case 101:
                //保存服务器
                var serverid = request.message.serverid;
                if (serverid == -1) {
                    //增加
                    ServerManager.shareManager().addServer(request.message.server, function (success, serverid) {
                        sendResponse({
                            code: 1,
                            message: serverid
                        });
                    });
                } else {
                    //修改
                    ServerManager.shareManager().updateServer(request.message.serverid, request.message.server, function (success) {
                        if (request.message.reloadaria2 && request.message.serverid == ServerManager.shareManager().getCurrentServerID()) {
                            Aria2.shareAria2().setUrl(request.message.server.url);
                        }
                        sendResponse({
                            code: 1
                        });
                    });
                }

                return true;//异步消息发送
                break;
            case 102:
                //获取当前所有服务器配置
                ServerManager.shareManager().getAllServers(function (success, servers) {
                    sendResponse({
                        code: 1,
                        message: {
                            currentServer: ServerManager.shareManager().getCurrentServerID(),
                            servers: servers
                        }
                    });
                });
                return true;//异步消息发送
                break;
            case 103:
                //获取某服务器配置
                if (!request.message) {
                    sendResponse();
                    return;
                }
                ServerManager.shareManager().getServer(request.message, function (success, server) {
                    sendResponse({
                        code: 1,
                        message: server
                    });
                });
                return true;//异步消息发送
                break;
            case 104:
                //删除某服务器
                ServerManager.shareManager().removeServer(request.message, function (success) {
                    sendResponse({
                        code: 1
                    });
                });
                return true;//异步消息发送
                break;
            case 105:
                //选中某服务器
                ServerManager.shareManager().setCurrentServerID(request.message);
                ServerManager.shareManager().getCurrentServer(function (success, server) {
                    if (success && server) {
                        Aria2.shareAria2().setUrl(server.url, function (success, version) {
                            if (success) {
                                sendResponse({
                                    code: 1
                                });
                            } else {
                                sendResponse({
                                    code: 0
                                });
                            }
                        })
                    } else {
                        sendResponse({
                            code: 0
                        });
                    }
                });
                return true;//异步消息发送
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
