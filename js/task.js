/**
 * Created by zengwenbin on 16/9/19.
 */

var ContentMessageCode = {
    taskStart: 0,
    xunleiShowYZM: 1,
    xunleiDownloadFinish: 2,
    xunleiZYJB: 3,//资源被举报
    xunleiDownloading: 4,
    xunleiloginFail: 5,
    aria2DownloadFinish: 6,
    aria2DownloadFail: 7,
    taskEnd: 8
};

var Task = {
    init: function () {
        var instance = {};
        instance.url = "";
        instance.tabid = 0;
        instance.isLixanUrl = false;
        instance.btTaskID = undefined;
        instance.taskname = undefined;
        instance.doTask = function () {
            instance.sendMessageToConentScript(0);
            XunleiAPI.init(instance).doTasks()
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