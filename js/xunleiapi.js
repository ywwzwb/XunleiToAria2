/**
 * Created by zengwenbin on 16/9/12.
 */
var XunleiLiXian = {
        DEFAULT_REFERER: 'http://lixian.vip.xunlei.com/',
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
                            output.substring(9, param.length - 1);
                            var param = output.replace(/\'/g, "").substring(9, param.length - 1).split(",");
                            param.uid = XunleiLiXian.userId;
                            param.btname = param[3];
                            param.cid = param[1];
                            param.goldbean = 0;
                            param.silverbean = 0;
                            param.tsize = param[2];
                            var findex = "";
                            var size = "";
                            var isFirst = true;
                            var is_valid = param[8].substring(10, param[8].length - 1);
                            for (var i = 0; i < is_valid.length; i++) {
                                if (is_valid[i] == 1) {
                                    if (isFirst) {
                                        findex = findexes[i];
                                        size = sizes[i];
                                    } else {
                                        findex = findex + "_" + findexes[i];
                                        size = size + "_" + sizes[i];
                                    }
                                }
                            }
                            param.findex = param[10];
                            param.size =
                                //             uid: XunleiLiXian.userId,
                                // btname : btname,
                                // cid: cid,
                                // goldbean: "0",
                                // silverbean: "0",
                                // tsize: tsize,
                                // findex: findex,
                                // size: size,
                                // o_taskid: "0",
                                // o_page: "task",
                                // class_id: "0",
                                // from: "0"
                                param.is_full =
                        }
                        ();
                        // XunleiLiXian.commitTask(taskInfo);
                    }
                }
            )
            ;
        },
        commitTask: function (taskInfo) {
            $.ajax({
                url: xunleiLixian.COMMIT_TASK_URL,
                type: "POST",
                data: taskInfo,
                success: function (output, status, xhr) {
                    console.log(output)
                }
            });
        }
        ,
        queryUrl: function (flag, cid, tsize, btname, is_full, names, sizes_, sizes, is_valid, types, findexes, timestamp) {
            var findex = "";
            var size = "";
            var isFirst = true;
            for (var i = 0; i < is_valid.length; i++) {
                if (is_valid[i] == 1) {
                    if (isFirst) {
                        findex = findexes[i];
                        size = sizes[i];
                    } else {
                        findex = findex + "_" + findexes[i];
                        size = size + "_" + sizes[i];
                    }
                }
            }
            var taskInfo = {
                uid: XunleiLiXian.userId,
                btname: btname,
                cid: cid,
                goldbean: "0",
                silverbean: "0",
                tsize: tsize,
                findex: findex,
                size: size,
                o_taskid: "0",
                o_page: "task",
                class_id: "0",
                from: "0"
            };
            return taskInfo;
        }
    }
    ;
