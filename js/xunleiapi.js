/**
 * Created by zengwenbin on 16/9/12.
 */
var XunleiAPI = {
    xunleiUserID: undefined,
    xunleiGDriverID: undefined,
    CookieURL: 'http://dynamic.cloud.vip.xunlei.com/',
    init: function (task) {
        var doMagnetTask = function () {
            var cacheTime = Math.floor((new Date).getTime() / 1000);
            $.ajax({
                url: "http://dynamic.cloud.vip.xunlei.com/interface/url_query",
                type: "GET",
                data: {
                    random: cacheTime.toString(),
                    tcache: cacheTime.toString() + "1",
                    callback: 'queryUrl',
                    u: instance.task.url
                },
                success: function (output, status, xhr) {
                    if (!output.startsWith("queryUrl")) {
                        XunleiAPI.xunleiUserID = undefined;
                        instance.task.sendMessageToConentScript(ContentMessageCode.xunleiloginFail);
                        TaskQueue.shareQueue().removeTask(instance.task);
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
                        return param
                    }();
                    commitMagnetTask(taskinfo)
                }
            });
        };
        var commitMagnetTask = function (taskinfo) {
            $.ajax({
                url: "http://dynamic.cloud.vip.xunlei.com/interface/bt_task_commit",
                type: "POST",
                data: taskinfo,
                success: function (output, status, xhr) {
                    //{"id":"1540202127827456","avail_space":"1123741114859670","time":1.0901968479156,"progress":1})
                    output = JSON.parse(output.substr(1, output.length - 2));
                    if (output.progress == -12 || output.progress == -11) {
                        // -12 表示需要输入验证码, -11 表示验证码错误
                        instance.task.sendMessageToConentScript(ContentMessageCode.xunleiShowYZM, undefined, function (response) {
                            taskinfo.verify_code = response.message;
                            commitMagnetTask(taskinfo)
                        });
                    } else if (output.progress == 1) {
                        //下载完成
                        instance.task.sendMessageToConentScript(ContentMessageCode.xunleiDownloadFinish);
                        getMagnetTaskInfo(output.id, taskinfo.btname)
                    } else if (output.progress == 2) {
                        //资源被举报
                        instance.task.sendMessageToConentScript(ContentMessageCode.xunleiZYJB);
                        TaskQueue.shareQueue().removeTask(instance.task);
                    } else {
                        //还没完成
                        instance.task.sendMessageToConentScript(ContentMessageCode.xunleiDownloading);
                        TaskQueue.shareQueue().removeTask(instance.task);
                    }
                }
            });
        };
        var getMagnetTaskInfo = function (id, btname) {
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
                    if (XunleiAPI.xunleiGDriverID == undefined) {
                        instance.task.sendMessageToConentScript(ContentMessageCode.xunleiloginFail);
                        TaskQueue.shareQueue().removeTask(instance.task);
                        return
                    }
                    var tasks = output.Result[id];
                    var aria2Tasks = [];
                    $.each(tasks, function () {
                        aria2Tasks.push({
                            name: (btname + "/" + this.title).replace(/\\/g, ""),
                            header: "Cookie:" + XunleiAPI.xunleiGDriverID,
                            url: this.downurl
                        })
                    });
                    ARIA2.batch_download(aria2Tasks, localStorage.downloadPath, function () {
                        instance.task.sendMessageToConentScript(ContentMessageCode.aria2DownloadFinish);
                        TaskQueue.shareQueue().removeTask(instance.task);
                    }, function () {
                        instance.task.sendMessageToConentScript(ContentMessageCode.aria2DownloadFail);
                        TaskQueue.shareQueue().removeTask(instance.task);
                    });
                }
            });
        };
        var doNormalTask = function () {
            var cacheTime = Math.floor((new Date).getTime() / 1000);
            $.ajax({
                    url: "http://dynamic.cloud.vip.xunlei.com/interface/task_check",
                    type: "GET",
                    data: {
                        random: cacheTime.toString(),
                        tcache: cacheTime.toString() + "1",
                        url: instance.task.url
                    },
                    success: function (output, status, xhr) {
                        if (!output.startsWith("queryCid")) {
                            XunleiAPI.xunleiUserID = undefined;
                            instance.task.sendMessageToConentScript(ContentMessageCode.xunleiloginFail);
                            TaskQueue.shareQueue().removeTask(instance.task);
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
                            param.url = instance.task.url;
                            if (instance.task.url.startsWith("thunder://")) {
                                param.type = 3;
                            } else if (instance.task.url.startsWith("ed2k://")) {
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
                        normalTaskCommit(taskinfo)
                    }
                }
            );
        };
        var normalTaskCommit = function (taskinfo) {
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
                        instance.task.sendMessageToConentScript(ContentMessageCode.xunleiShowYZM, undefined, function (response) {
                            taskinfo.verify_code = response.message;
                            normalTaskCommit(taskinfo)
                        });
                    } else if (output[0] == 1) {
                        instance.task.sendMessageToConentScript(ContentMessageCode.xunleiDownloadFinish);
                        getNormalTaskInfo(taskinfo.cid, output[1]);
                    } else if (output[0] == 2) {
                        //资源被举报
                        instance.task.sendMessageToConentScript(ContentMessageCode.xunleiZYJB);
                        TaskQueue.shareQueue().removeTask(instance.task);
                    }
                }
            });
        };
        var getNormalTaskInfo = function (cid, id) {
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
                        var task = undefined;
                        $.each(tasks, function () {
                            if ((cid != 0 && this.cid == cid ) || (id != 0 && this.id == id) || (this.url == instance.task.url)) {
                                task = this;
                                return false;
                            }
                        });
                        if (task && task.progress == 100 && task.lixian_url) {
                            if (XunleiAPI.xunleiGDriverID == undefined) {
                                instance.task.sendMessageToConentScript(ContentMessageCode.xunleiloginFail);
                                TaskQueue.shareQueue().removeTask(instance.task);
                                return
                            }
                            var aria2Task = {
                                name: task.taskname.replace(/\\/g, ""),
                                header: "Cookie:" + XunleiAPI.xunleiGDriverID,
                                url: task.lixian_url
                            };
                            ARIA2.download(aria2Task, localStorage.downloadPath, function () {
                                instance.task.sendMessageToConentScript(ContentMessageCode.aria2DownloadFinish);
                                TaskQueue.shareQueue().removeTask(instance.task);
                            }, function () {
                                instance.task.sendMessageToConentScript(ContentMessageCode.aria2DownloadFail);
                                TaskQueue.shareQueue().removeTask(instance.task);
                            });
                        } else {
                            //还没完成
                            instance.task.sendMessageToConentScript(ContentMessageCode.xunleiDownloading);
                            TaskQueue.shareQueue().removeTask(instance.task);
                        }
                    }
                }
            )
        };

        var instance = {};
        instance.task = task;
        instance.doTask = function () {
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
                        if (instance.task.url.startsWith("magnet:?xt")) {
                            doMagnetTask();
                        } else {
                            doNormalTask();
                        }
                    });
                });
            } else {
                if (instance.task.url.startsWith("magnet:?xt")) {
                    doMagnetTask();
                } else {
                    doNormalTask();
                }
            }
        };
        return instance;
    }
};