/**
 * Created by zengwenbin on 16/9/12.
 */

console.timelog = function(str){
    var d = new Date();
    console.log(d.toLocaleString()+": "+str);
};
var initDone = false;
function createMenu() {
    console.timelog("开始创建菜单");
    return (new Promise(function (resolve) {
        chrome.contextMenus.removeAll(resolve);//先要清空之前设置的菜单
    })).then(function () {
        return new Promise(function (resolve) {
            chrome.contextMenus.create({
                "id": "xunleitoaria2_downloadoverxunlei",
                "title": "使用迅雷下载到 Aria2",
                "contexts": ["link", "image", "video", "audio"]
            }, resolve);
        })
    }).then(function () {
        return new Promise(function (resolve) {
            chrome.contextMenus.create({
                "id": "xunleitoaria2_downloadirectly",
                "title": "直接下载链接到 Aria2",
                "contexts": ["link", "image", "video", "audio"]
            }, resolve);
        })
    }).then(function () {
        return new Promise(function (resolve) {
            chrome.contextMenus.create({
                "id": "xunleitoaria2_downloadimage",
                "title": "直接下载图片到 Aria2",
                "contexts": ["image"]
            }, resolve);
        })
    })
}

function initdb() {
    console.timelog("开始初始化数据库");
    return new Promise(function (resolve, reject) {
        return ServerManager.shareManager(function (success) {
            if (success) {
                resolve()
            } else {
                reject()
            }
        });//先调用 ServerManager的初始化方法初始化数据库
    })
}

function initServer() {
    console.timelog("开始初始化服务器");
    return new Promise(function (resolve) {
        ServerManager.shareManager().getCurrentServer(function (success, server) {
            if (success) {
                console.timelog("获取到服务器");
                Aria2.shareAria2().setUrl(server.url, function (success, version) {
                    if (success) {
                        server.version = version;
                    } else {
                        server.version = -1;
                    }
                    ServerManager.shareManager().updateServer(server.id, server, resolve);
                });
            } else {
                console.timelog("服务器获取失败");
                resolve()
            }
        });
    })
}

createMenu().then(initdb).then(initServer).then(function(){
    initDone = true;
});


chrome.runtime.onInstalled.addListener(function (previousVersion) {
    setTimeout(function () {
        //弹出chrome通知
        function showNotification(id, opt) {
            var notification = chrome.notifications.create(id, opt, function (notifyId) {
                return notifyId;
            });
            setTimeout(function () {
                chrome.notifications.clear(id, function () {
                });
            }, 5000);
        }
        console.log(previousVersion.previousVersion);
        //软件版本更新提示
        if (previousVersion.previousVersion) {
            var opt = {
                type: "basic",
                title: "更新",
                message: "更新啦! \n设置界面默认隐藏 token 了, 截图给小伙伴也不用担心泄露你的密码了!",
                iconUrl: "image/icon-128.png"
            };
            var id = new Date().getTime().toString();
            showNotification(id, opt);
        }
        //没有配置的情况下, 弹出设置框
        if (!ServerManager.shareManager().getCurrentServerID()) {
            chrome.runtime.openOptionsPage();
        }
    }, 300);
});

chrome.browserAction.onClicked.addListener(function () {
    chrome.tabs.create({
        url: "http://lixian.xunlei.com"
    });
});

function onContextMenuClicked(info, tab){
    if(!initDone) {
        setTimeout(function(){
            onContextMenuClicked(info, tab)
        }, 100);
        return;
    }
    chrome.tabs.executeScript({
        file: "js/jquery-3.1.0.min.js"
    }, function () {
        chrome.tabs.executeScript({
            file: "js/insert.js"
        }, function () {
            chrome.tabs.insertCSS({
                "file": "css/insert.css"
            }, function () {
                var url = info.linkUrl;
                var task = Task.init();
                task.url = url;
                task.tabid = tab.id;
                switch (info.menuItemId) {
                    case "xunleitoaria2_downloadimage":
                        task.directDownloadTask = true;
                        task.url = info.srcUrl;
                        break;
                    case  "xunleitoaria2_downloadirectly":
                        task.directDownloadTask = true;
                        break;
                    default:
                        task.directDownloadTask = false;
                        break;
                }
                task.doTask();
            });
        })
    });
}

chrome.contextMenus.onClicked.addListener(onContextMenuClicked);

function onMessage(request, sender, sendResponse){
    if(!initDone) {
        setTimeout(function(){
            onMessage(request, sender, sendResponse)
        }, 100);
        return true;
    }
     switch (request.code) {
            case 100:
                //测试服务器连接
                var aria2 = Aria2.init().setUrl(request.message, function (success, version) {
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

chrome.runtime.onMessage.addListener(onMessage);
