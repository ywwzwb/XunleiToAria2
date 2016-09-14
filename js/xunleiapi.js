/**
 * Created by zengwenbin on 16/9/12.
 */
var XunleiLiXian = {
    DEFAULT_REFERER: 'http://dynamic.cloud.vip.xunlei.com/',
    ADD_TASK_URL: 'http://dynamic.cloud.vip.xunlei.com/interface/url_query',
    userId: undefined,

    init: function () {
        chrome.cookies.get({
            "url": XunleiLiXian.DEFAULT_REFERER,
            "name": "userid"
        }, function (cookie) {
            XunleiLiXian.userId = cookie.value;
        })
    },
    addTask: function (url) {
        if (!XunleiLiXian.userId) {
            console.log("未登录");
            return false;
        }
        if (url.startsWith("magnet:?xt")) {
            XunleiLiXian.addMagnetTask(url)
        }
    },
    addMagnetTask: function (url) {
        var cacheTime = Math.floor((new Date).getTime() / 1000);
        $.ajax({
                url: XunleiLiXian.ADD_TASK_URL,
                type: "GET",
                data: {
                    random: cacheTime.toString(),
                    tcache: cacheTime.toString() + "1",
                    callback: 'queryUrl',
                    u: url
                },
                success: function (output, status, xhr) {
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
                    MessageSendToContentScript(2);
                    XunleiLiXian.getMagnetTaskInfo(output.id, taskinfo.btname)
                } else {
                    MessageSendToContentScript(3)
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
                    "url": XunleiLiXian.DEFAULT_REFERER,
                    "gdriveid": "userid"
                }, function (cookie) {
                    var tasks = output.Result[taskid];
                    var aria2Tasks = [];
                    $.each(tasks, function (task) {
                        aria2Tasks.push({
                            name: taskname+"/"+task.title.replace(/\\/g,""),
                            header: "Cookie:"+cookie.value,
                            url: task.downurl
                        })
                    });
                    MessageSendToBackground(103,aria2Tasks);
                })

            }
        });
    }
};