/**
 * Created by zengwenbin on 16/9/12.
 */
var XunleiAPI = {
    xunleiUserID: undefined,
    xunleiGDriverID: undefined,
    CookieURL: 'http://dynamic.cloud.vip.xunlei.com/',
    init: function (tasks) {
        if (!(tasks instanceof Array)) {
            tasks = [tasks]
        }
        var aria2Tasks = [];
        var firstTask = undefined;
        var doMagnetTask = function (callback, task) {
            var cacheTime = Math.floor((new Date).getTime() / 1000);
            $.ajax({
                url: "http://dynamic.cloud.vip.xunlei.com/interface/url_query",
                type: "GET",
                data: {
                    random: cacheTime.toString(),
                    tcache: cacheTime.toString() + "1",
                    callback: 'queryUrl',
                    u: task.url
                },
                success: function (output, status, xhr) {
                    if (!output.startsWith("queryUrl")) {
                        XunleiAPI.xunleiUserID = undefined;
                        task.sendMessageToConentScript(ContentMessageCode.xunleiloginFail);
                        instance.tasks =[];
                        task.sendMessageToConentScript(ContentMessageCode.taskEnd);
                        return
                    }
                    var taskinfo = function () {
                        var result = output.replace(/queryUrl\(/g, "[").replace(/new Array\(/g, "[").replace(/\)/g, "]").replace(/\',/g, "\",").replace(/,\'/g, ",\"").replace(/\[\'/g, "[\"").replace(/\'\]/g, "\"]").replace(/\\/g, "\\\\");
                        var json = JSON.parse(result);
                        var param = {};
                        param.uid = XunleiAPI.xunleiUserID;
                        param.btname = json[3];
                        param.cid = json[1];
                        param.goldbean = 0;
                        param.silverbean = 0;
                        param.tsize = json[2];
                        var sizeArr = json[7];
                        var sizeArrCount = sizeArr.length;
                        var findexArr = [];
                        for (var i = 0; i < sizeArrCount; i++) {
                            findexArr.push(i)
                        }
                        param.findex = findexArr.join("_") + "_";
                        param.size = sizeArr.join("_") + "_";
                        param.o_taskid = "0";
                        param.o_page = "task";
                        param.class_id = "0";
                        param.interfrom = "task";
                        return param;
                    }();
                    commitMagnetTask(taskinfo, callback, task);
                }
            });
        };
        var commitMagnetTask = function (taskinfo, callback, task) {
            $.ajax({
                url: "http://dynamic.cloud.vip.xunlei.com/interface/bt_task_commit",
                type: "POST",
                data: taskinfo,
                success: function (output, status, xhr) {
                    //{"id":"1540202127827456","avail_space":"1123741114859670","time":1.0901968479156,"progress":1})
                    output = JSON.parse(output.substr(1, output.length - 2));
                    if (output.progress == -12 || output.progress == -11) {
                        // -12 表示需要输入验证码, -11 表示验证码错误
                        task.sendMessageToConentScript(ContentMessageCode.xunleiShowYZM, undefined, function (response) {
                            taskinfo.verify_code = response.message;
                            commitMagnetTask(taskinfo, callback, task);
                        });
                    } else if (output.progress == 1) {
                        //下载完成
                        task.sendMessageToConentScript(ContentMessageCode.xunleiDownloadFinish);
                        getMagnetTaskInfo(output.id, taskinfo.btname, callback, task)
                    } else if (output.progress == 2) {
                        //资源被举报
                        task.sendMessageToConentScript(ContentMessageCode.xunleiZYJB);
                        callback();
                    } else {
                        //还没完成
                        task.sendMessageToConentScript(ContentMessageCode.xunleiDownloading);
                        callback();
                    }
                }
            });
        };
        var getMagnetTaskInfo = function (id, btname, callback, task) {
            $.ajax({
                url: "http://dynamic.cloud.vip.xunlei.com/interface/fill_bt_list",
                type: "GET",
                data: {
                    tid: id,
                    g_net: 1,
                    uid: XunleiAPI.xunleiUserID,
                    callback: "jsonp1"
                },
                success: function (output, status, xhr) {
                    //{"id":"1540202127827456","avail_space":"1123741114859670","time":1.0901968479156,"progress":1})
                    output = JSON.parse(output.substring(7, output.length - 1));
                    var tasks = output.Result[id];
                    $.each(tasks, function () {
                        aria2Tasks.push({
                            name: (btname + "/" + this.title).replace(/\\/g, ""),
                            header: "Cookie:" + XunleiAPI.xunleiGDriverID,
                            url: this.downurl
                        })
                    });
                    callback()
                }
            });
        };
        var doNormalTask = function (callback, task) {
            var cacheTime = Math.floor((new Date).getTime() / 1000);
            $.ajax({
                    url: "http://dynamic.cloud.vip.xunlei.com/interface/task_check",
                    type: "GET",
                    data: {
                        random: cacheTime.toString(),
                        tcache: cacheTime.toString() + "1",
                        url: task.url
                    },
                    success: function (output, status, xhr) {
                        if (!output.startsWith("queryCid")) {
                            XunleiAPI.xunleiUserID = undefined;
                            task.sendMessageToConentScript(ContentMessageCode.xunleiloginFail);
                            instance.tasks = [];
                            task.sendMessageToConentScript(ContentMessageCode.taskEnd);
                            return
                        }
                        var taskinfo = function () {
                            var result = output.replace(/queryCid\(/g, "[").replace(/new Array\(/g, "[").replace(/\)/g, "]").replace(/\' *,/g, "\",").replace(/, *\'/g, ",\"").replace(/\[\ *'/g, "[\"").replace(/\' *\]/g, "\"]").replace(/\\/g, "\\\\");
                            var json = JSON.parse(result);
                            var param = {};
                            param.uid = XunleiAPI.xunleiUserID;
                            param.cid = json[0];
                            param.gcid = json[1];
                            param.size = json[2];
                            param.silverbean = 0;
                            param.goldbean = 0;
                            param.t = json[4];
                            param.url = task.url;
                            if (task.url.startsWith("thunder://")) {
                                param.type = 3;
                            } else if (task.url.startsWith("ed2k://")) {
                                param.type = 2;
                            } else {
                                param.type = 0
                            }
                            param.o_page = "history";
                            param.o_taskid = "0";
                            param.class_id = "0";
                            param.interfrom = "task";
                            param.callback = "ret_task";
                            param.database = "undefined";
                            param.verify_code = "";
                            param.time = new Date().toString();
                            return param
                        }();
                        normalTaskCommit(taskinfo, callback, task)
                    }
                }
            );
        };
        var normalTaskCommit = function (taskinfo, callback, task) {
            $.ajax({
                url: "http://dynamic.cloud.vip.xunlei.com/interface/task_commit",
                type: "GET",
                data: taskinfo,
                success: function (output, status, xhr) {
                    //ret_task(1,'1542067162259968','0.17468810081482')
                    var result = output.replace(/ret_task\(/g, "[").replace(/new Array\(/g, "[").replace(/\)/g, "]").replace(/\' *,/g, "\",").replace(/, *\'/g, ",\"").replace(/\[\ *'/g, "[\"").replace(/\' *\]/g, "\"]").replace(/\\/g, "\\\\");
                    output = JSON.parse(result);
                    //
                    if (output[0] == -12 || output[0] == -11) {
                        // -12 表示需要输入验证码, -11 表示验证码错误
                        task.sendMessageToConentScript(ContentMessageCode.xunleiShowYZM, undefined, function (response) {
                            taskinfo.verify_code = response.message;
                            normalTaskCommit(taskinfo, callback, task);
                        });
                    } else if (output[0] == 1) {
                        task.sendMessageToConentScript(ContentMessageCode.xunleiDownloadFinish);
                        getNormalTaskInfo(taskinfo.cid, output[1], callback, task);
                    } else if (output[0] == 2) {
                        //资源被举报
                        task.sendMessageToConentScript(ContentMessageCode.xunleiZYJB);
                        callback();
                    }
                }
            });
        };
        var getNormalTaskInfo = function (cid, id, callback, task) {
            //http://dynamic.cloud.vip.xunlei.com/interface/showtask_unfresh?callback=jsonp1470122229847&t=Tue%20Aug%2002%202016%2015:18:58%20GMT+0800&type_id=4&page=1&tasknum=1&p=1&interfrom=task
            $.ajax({
                    url: "http://dynamic.cloud.vip.xunlei.com/interface/showtask_unfresh",
                    type: "GET",
                    data: {
                        "callback": "jsonp1",
                        "t": new Date().toString(),
                        "type_id": 4,
                        "page": 1,
                        "tasknum": 20,
                        "p": 1,
                        "interfrom": "task"
                    },
                    success: function (output, status, xhr) {
                        var json = JSON.parse(output.substring(7, output.length - 1));
                        var tasks = json.info.tasks;
                        var taskjson = undefined;
                        $.each(tasks, function () {
                            if ((cid != 0 && this.cid == cid ) || (id != 0 && this.id == id) || (this.url == task.url)) {
                                taskjson = this;
                                return false;
                            }
                        });
                        if (taskjson && taskjson.progress == 100 && taskjson.lixian_url) {
                             aria2Tasks.push({
                                name: taskjson.taskname.replace(/\\/g, ""),
                                header: "Cookie:" + XunleiAPI.xunleiGDriverID,
                                url: taskjson.lixian_url
                            });
                            callback()
                        } else {
                            //还没完成
                            task.sendMessageToConentScript(ContentMessageCode.xunleiDownloading);
                            callback();
                        }
                    }
                }
            )
        };
        var startAria2Download = function () {
            if(aria2Tasks.length == 0){
                firstTask.sendMessageToConentScript(ContentMessageCode.taskEnd);
                return;
            }
            Aria2.shareAria2().batchDownload(aria2Tasks, localStorage.downloadPath, function () {
                firstTask.sendMessageToConentScript(ContentMessageCode.aria2DownloadFinish);
                firstTask.sendMessageToConentScript(ContentMessageCode.taskEnd);
            }, function () {
                firstTask.sendMessageToConentScript(ContentMessageCode.aria2DownloadFail);
                firstTask.sendMessageToConentScript(ContentMessageCode.taskEnd);
            });
        };
        var _doTask = function () {
            if (XunleiAPI.xunleiGDriverID == undefined || XunleiAPI.xunleiUserID == undefined){
                tasks = [];
                firstTask.sendMessageToConentScript(ContentMessageCode.xunleiloginFail);
                firstTask.sendMessageToConentScript(ContentMessageCode.taskEnd);
                return;
            }
            var task = instance.tasks.pop();
            if (task == undefined) {
                startAria2Download();
                return;
            }
            if (task.isLixanUrl) {
                aria2Tasks.push({
                    name: task.taskname.replace(/\\/g, ""),
                    header: "Cookie:" + XunleiAPI.xunleiGDriverID,
                    url: task.url
                });
                _doTask();
            } else if (task.btTaskID) {
                getMagnetTaskInfo(task.btTaskID, task.taskname, _doTask, task);
            } else if (task.url.startsWith("magnet:?xt")) {
                doMagnetTask(_doTask, task);
            } else {
                doNormalTask(_doTask, task);
            }
        };
        var instance = {};
        instance.tasks = tasks;
        firstTask = tasks[0];
        instance.doTasks = function () {
            if (instance.tasks.length == 0){
                firstTask.sendMessageToConentScript(ContentMessageCode.taskEnd);
                return;
            }
            if (XunleiAPI.xunleiUserID == undefined || XunleiAPI.xunleiGDriverID == undefined) {
                chrome.cookies.get({
                    "url": XunleiAPI.CookieURL,
                    "name": "userid"
                }, function (cookie) {
                    XunleiAPI.xunleiUserID = cookie.value;
                    chrome.cookies.get({
                        "url": XunleiAPI.CookieURL,
                        "name": "gdriveid"
                    }, function (cookie) {
                        XunleiAPI.xunleiGDriverID = cookie.value;
                        _doTask();
                    });
                });
            } else {
                _doTask();
            }
        };
        return instance;
    }
};