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
            console.log(cookie.value)
        })
    },
    addTask: function (url, callback) {
        if (!XunleiLiXian.userId) {
            console.log("未登录");
            return false;
        }
        if (url.startsWith("magnet:?xt")) {
            XunleiLiXian.addMagnetTask(url, callback)
        }
    },
    addMagnetTask: function (url, callback) {
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
                    var taskInfo = function () {
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
                    XunleiLiXian.commitMagnetTask(taskInfo)
                }
            }
        );
    },
    commitMagnetTask: function (taskInfo) {
        $.ajax({
            url: "http://dynamic.cloud.vip.xunlei.com/interface/bt_task_commit",
            type: "POST",
            data: taskInfo,
            success: function (output, status, xhr) {
                //{"id":"1540202127827456","avail_space":"1123741114859670","time":1.0901968479156,"progress":1})
                output = JSON.parse(output.substr(1, output.length - 2));
                console.log(output);
                if (output.progress == -12 || output.progress == -11) {
                    // -12 表示需要输入验证码, -11 表示验证码错误
                    MessageSend(1, taskInfo)
                } else if (output.progress == 1) {
                    MessageSend(2,output.id)
                } else {
                    // console.log("download fail")

                }

            }
        });
    }
};