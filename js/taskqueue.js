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
    aria2DownloadFail: 7
};

var Task = {
    init: function () {
        var instance = {};
        instance.id = 0;
        instance.url = "";
        instance.tabid = 0;
        instance.doTask = function () {
            instance.sendMessageToConentScript(0);
            XunleiAPI.init(instance).doTask()
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

var TaskQueue = {
    _init: function () {
        var instance = {};
        var id = 0;
        instance.queue = {};
        // return task
        instance.addTaskToQueue = function (task) {
            id++;
            task.id = id;
            instance.queue[id] = task;
            return task
        };
        instance.removeTask = function (task) {
            delete instance.queue[task.id];
        };
        return instance;
    },
    _shareQueue: undefined,
    shareQueue: function () {
        if (TaskQueue._shareQueue == undefined) {
            TaskQueue._shareQueue = TaskQueue._init()
        }
        return TaskQueue._shareQueue;
    }
};