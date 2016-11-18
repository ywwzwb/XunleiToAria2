/**
 * Created by zengwenbin on 16/9/19.
 */

var ContentMessageCode = {
    taskStart: 0,
    xunleiShowYZM: 1,
    xunleiDownloadFinish: 2,
    xunleiZYJB: 3,//资源被举报
    xunleiDownloading: 4,
    xunleiDownloadFail: 5,
    xunleiloginFail: 6,
    aria2DownloadFinish: 7,
    aria2DownloadFail: 8,
    aria2DownloadFailNotSupportEd2k: 9,
    taskEnd: 10
};

var Task = {
    init: function () {
        var instance = {};
        instance.url = "";
        instance.tabid = 0;
        instance.isLixanUrl = false;
        instance.btTaskID = undefined;
        instance.taskname = undefined;
        instance.directDownloadTask = false;
        var decryptUrl = function () {
            if (instance.url.startsWith("thunder://")) {
                instance.url = atob(instance.ur.replace("thunder://", "")).replace(/^AA|ZZ$/g, "")
            }
        };
        instance.doTask = function () {
            instance.sendMessageToConentScript(ContentMessageCode.taskStart);
            if (instance.directDownloadTask == true) {
                decryptUrl();
                if (instance.url.startsWith("ed2k://")) {
                    instance.sendMessageToConentScript(ContentMessageCode.aria2DownloadFailNotSupportEd2k);
                    setTimeout(function () {
                        instance.sendMessageToConentScript(ContentMessageCode.taskEnd);
                    }, 1000);
                } else {
                    ServerManager.shareManager().getCurrentServer(function (success, server) {
                        if (success && server) {
                            Aria2.shareAria2().download({
                                url: instance.url
                            }, server.downloadPath, function () {
                                instance.sendMessageToConentScript(ContentMessageCode.aria2DownloadFinish);
                                instance.sendMessageToConentScript(ContentMessageCode.taskEnd);
                            }, function () {
                                instance.sendMessageToConentScript(ContentMessageCode.aria2DownloadFail);
                                instance.sendMessageToConentScript(ContentMessageCode.taskEnd);
                            });
                        } else {
                            instance.sendMessageToConentScript(ContentMessageCode.aria2DownloadFail);
                            instance.sendMessageToConentScript(ContentMessageCode.taskEnd);
                        }
                    });

                }
            } else {
                XunleiAPI.init(instance).doTasks()
            }
        };
        instance.sendMessageToConentScript = function (code, message, response) {
            chrome.tabs.sendMessage(instance.tabid, {
                code: code,
                message: message
            }, response);
        };
        return instance
    }
};