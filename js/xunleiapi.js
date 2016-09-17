/**
 * Created by zengwenbin on 16/9/12.
 */
var XunleiLiXian = {
    CookieURL: 'http://dynamic.cloud.vip.xunlei.com/',
    userId: undefined,
    addTask: function (url) {
        chrome.cookies.get({
            "url": XunleiLiXian.CookieURL,
            "name": "userid"
        }, function (cookie) {
            XunleiLiXian.userId = cookie.value;
            if (XunleiLiXian.userId) {
                if (url.startsWith("magnet:?xt")) {
                    XunleiLiXian.addMagnetTask(url)
                } else {
                    XunleiLiXian.addNormalTask(url)
                }
            } else {
                MessageSendToContentScript(7);
            }
        });
    },
    addNormalTask: function (url) {
        var cacheTime = Math.floor((new Date).getTime() / 1000);
        $.ajax({
                url: "http://dynamic.cloud.vip.xunlei.com/interface/task_check",
                type: "GET",
                data: {
                    random: cacheTime.toString(),
                    tcache: cacheTime.toString() + "1",
                    url: url
                },
                success: function (output, status, xhr) {
                    if (output.startsWith("document.cookie")) {
                        XunleiLiXian.userId = undefined;
                        MessageSendToContentScript(7);
                        return
                    }
                    var taskinfo = function () {
                        var result = output.replace(/queryCid\(/g, "[").replace(/new Array\(/g, "[").replace(/\)/g, "]").replace(/\' *,/g, "\",").replace(/, *\'/g, ",\"").replace(/\[\ *'/g, "[\"").replace(/\' *\]/g, "\"]").replace(/\\/g, "\\\\");
                        var json = JSON.parse(result);
                        var param = {};
                        param.uid = XunleiLiXian.userId;
                        param.cid = json[0];
                        param.gcid = json[1];
                        param.size = json[2];
                        param.silverbean = 0;
                        param.goldbean = 0;
                        param.t = json[4];
                        param.url = url;
                        if (url.startsWith("thunder://")) {
                            param.type = 3;
                        } else if (url.startsWith("ed2k://")) {
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
                    XunleiLiXian.normalTaskCommit(taskinfo)
                }
            }
        );
    },
    normalTaskCommit: function (taskinfo) {
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
                    MessageSendToContentScript(1, taskinfo, function (response) {
                        taskinfo.verify_code = response.message;
                        XunleiLiXian.normalTaskCommit(taskinfo)
                    });
                } else if (output[0] == 1) {
                    MessageSendToContentScript(2);
                    XunleiLiXian.getNormalTaskInfo(taskinfo.cid,output[1],taskinfo.url);
                } else if (output[0] == 2) {
                    //资源被举报
                    MessageSendToContentScript(3)
                }
            }
        });
    },
    getNormalTaskInfo: function (cid, id, url) {
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
                    if ((cid != 0 && this.cid == cid )|| (id !=0 && this.id == id)|| (this.url == url)) {
                        task = this;
                        return false;
                    }
                });
                if (task && task.progress == 100 && task.lixian_url) {
                    chrome.cookies.get({
                        "url": XunleiLiXian.CookieURL,
                        "name": "gdriveid"
                    }, function (cookie) {
                        var aria2Task = {
                            name: task.taskname.replace(/\\/g, ""),
                            header: "Cookie:" + cookie.value,
                            url: task.lixian_url
                        };
                        ARIA2.download(aria2Task, localStorage.downloadPath, function () {
                            MessageSendToContentScript(5);
                        }, function () {
                            MessageSendToContentScript(6);
                        });
                    })
                } else {
                    //还没完成
                    MessageSendToContentScript(4)
                }

            }
        })
    },
    addMagnetTask: function (url) {
        var cacheTime = Math.floor((new Date).getTime() / 1000);
        $.ajax({
                url: "http://dynamic.cloud.vip.xunlei.com/interface/url_query",
                type: "GET",
                data: {
                    random: cacheTime.toString(),
                    tcache: cacheTime.toString() + "1",
                    callback: 'queryUrl',
                    u: url
                },
                success: function (output, status, xhr) {
                    if (output.startsWith("document.cookie")) {
                        XunleiLiXian.userId = undefined;
                        MessageSendToContentScript(7);
                        return
                    }
                    var taskinfo = function () {
                        var result = output.replace(/queryUrl\(/g, "[").replace(/new Array\(/g, "[").replace(/\)/g, "]").replace(/\',/g, "\",").replace(/,\'/g, ",\"").replace(/\[\'/g, "[\"").replace(/\'\]/g, "\"]").replace(/\\/g, "\\\\");
                        var json = JSON.parse(result);
                        var param = {};
                        param.uid = XunleiLiXian.userId;
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
                    XunleiLiXian.commitMagnetTask(taskinfo)
                }
            }
        );
    },
    commitMagnetTask: function (taskinfo) {
        $.ajax({
            url: "http://dynamic.cloud.vip.xunlei.com/interface/bt_task_commit",
            type: "POST",
            data: taskinfo,
            success: function (output, status, xhr) {
                //{"id":"1540202127827456","avail_space":"1123741114859670","time":1.0901968479156,"progress":1})
                output = JSON.parse(output.substr(1, output.length - 2));

                if (output.progress == -12 || output.progress == -11) {
                    // -12 表示需要输入验证码, -11 表示验证码错误
                    MessageSendToContentScript(1, taskinfo, function (response) {
                        console.log(response);
                        taskinfo.verify_code = response.message;
                        XunleiLiXian.commitMagnetTask(taskinfo)
                    })
                } else if (output.progress == 1) {
                    //下载完成
                    MessageSendToContentScript(2);
                    XunleiLiXian.getMagnetTaskInfo(output.id, taskinfo.btname)
                } else if (output.progress == 2) {
                    //资源被举报
                    MessageSendToContentScript(3)
                } else {
                    //还没完成
                    MessageSendToContentScript(4)
                }

            }
        });
    },
    getMagnetTaskInfo: function (taskid, taskname) {
        // http://dynamic.cloud.vip.xunlei.com/interface/fill_bt_list?tid=1540931726811648&g_net=1&uid=217002643&callback=jsonp1473841231558
        $.ajax({
            url: "http://dynamic.cloud.vip.xunlei.com/interface/fill_bt_list",
            type: "GET",
            data: {
                tid: taskid,
                g_net: 1,
                uid: XunleiLiXian.userId,
                callback: "jsonp1"
            },
            success: function (output, status, xhr) {
                //{"id":"1540202127827456","avail_space":"1123741114859670","time":1.0901968479156,"progress":1})
                output = JSON.parse(output.substring(7, output.length - 1));
                chrome.cookies.get({
                    "url": XunleiLiXian.CookieURL,
                    "name": "gdriveid"
                }, function (cookie) {
                    var tasks = output.Result[taskid];
                    var aria2Tasks = [];
                    $.each(tasks, function () {
                        aria2Tasks.push({
                            name: taskname + "/" + this.title.replace(/\\/g, ""),
                            header: "Cookie:" + cookie.value,
                            url: this.downurl
                        })
                    });
                    ARIA2.batch_download(aria2Tasks, localStorage.downloadPath, function () {
                        MessageSendToContentScript(5);
                    }, function () {
                        MessageSendToContentScript(6);
                    });
                })

            }
        });
    }
};