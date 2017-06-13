/**
 * Created by yww on 16/6/30.
 */

$(function () {
    function messageSendToBackground(code, message, response = null) {
        chrome.runtime.sendMessage({
            code: code,
            message: message
        }, response);
    }

    function init() {
        $("#main_form").hide();
        $("#loading_progress_bar").show();
        refreshMainForm();
    }
    // 刷新主界面
    function refreshMainForm() {
        messageSendToBackground(102, null, function (response) {
            $("#main_form").show();
            $("#loading_progress_bar").hide();
            var selectedServerID = response.message.currentServer;
            var servers = response.message.servers;
            var hasSelectedServer = false;
            var noServer = true;
            $("#server_profile").html("");
            for (var serverid in servers) {
                noServer = false;
                var server = servers[serverid];
                if (serverid == selectedServerID) {
                    hasSelectedServer = true;
                    displayServerOnMainForm(server);
                }
                $("<option>").val(server.id).text(server.name).appendTo($("#server_profile"));
            }
            $("#server_profile").val(selectedServerID);
            if (noServer) {
                $("#no_selected_server_span").hide();
                $("#no_any_server_span").show();
                $("#selected_server_span").hide();
            } else if (!hasSelectedServer) {
                $("#selected_server_span").hide();
                $("#no_selected_server_span").show();
            }
        });
    }
    // 在主界面显示服务器信息
    function displayServerOnMainForm(server) {
        $("#selected_server_span").show();
        $("#no_selected_server_span").hide();
        $("#no_any_server_span").hide();
        var urlwithmask = server.url.replace(/token:(.+)@/, "token:***@");
        $("#selected_server_url").text(server.url);
        $("#selected_server_url_mask").text(urlwithmask);
        var version = parseFloat(server.version);
        if (version < 0.01 && version > -0.01) {
            $("#selected_server_version").text("未知版本");
        } else if (version < -0.01 || isNaN(version)) {
            $("#selected_server_version").text("连接错误");
        } else {
            $("#selected_server_version").text(version);
        }
        var downloadPath = server.downloadPath;
        if (!downloadPath || downloadPath.length == 0) {
            $("#selected_server_downloadpath").text("使用默认值");
        } else {
            $("#selected_server_downloadpath").text(downloadPath);
        }
        $("#test_selected_server").attr("data-serverid", server.id);
        $("#update_selected_server").attr("data-serverid", server.id);
    }
    // 在修改服务器界面显示信息
    function displayServerOnUpdateForm(server, backtoserverlist) {
        $("#update_server_name").val(server.name);
        $("#update_server_url").val(server.url);
        $("#update_server_downloadpath").val(server.downloadPath);
        $("#update_server_save").attr("data-serverid", server.id);
        $("#update_server_save_force").attr("data-serverid", server.id);
        if (backtoserverlist) {
            $("#update_server_save").attr("data-backtoserverlist", "1");
            $("#update_server_save_force").attr("data-backtoserverlist", "1");
        } else {
            $("#update_server_save").attr("data-backtoserverlist", "0");
            $("#update_server_save_force").attr("data-backtoserverlist", "0");
        }
    }
    // 刷新服务器列表
    function refreshProfileList() {
        $("#list_profile_container").html("");
        messageSendToBackground(102, null, function (response) {
            var servers = response.message.servers;
            var serverEmpty = true;
            // servers 是一个 Object, 使用 for in, 来判断是否为空
            for (var i in servers) {
                serverEmpty = false;
                break;
            }
            if (serverEmpty) {
                $("#list_profile_no_data").show();
                return;
            }
            $("#list_profile_no_data").hide();
            for (var serverid in servers) {
                var server = servers[serverid];
                var version = server.version;
                if (server.version == 0) {
                    version = "未知版本";
                } else if (server.version == -1) {
                    version = "连接错误";
                }
                var downloadPath = server.downloadPath;
                if (!downloadPath || downloadPath.length == 0) {
                    downloadPath = "使用默认值";
                }
                var li = [
                    '<li class="list-group-item">',
                    '    ' + server.name,
                    '    <span class="operate-btn-group-right">',
                    '        <a href="#" class = "list_profile_show" data-serverid="' + server.id + '">详细</a>',
                    '        <a href="#" class = "list_profile_hide" style="display: none" data-serverid="' + server.id + '">收起</a>',
                    '        <a href="#" class = "list_profile_update" data-serverid="' + server.id + '">修改</a>',
                    '        <a href="#" class = "list_profile_delete text-danger">删除</a>',
                    '    </span>',
                    '    <span class="operate-btn-group-right" style="display: none">',
                    '        <a href="#" class = "list_profile_delete_confirm text-danger" data-serverid="' + server.id + '">确认删除</a>',
                    '        <a href="#" class = "list_profile_delete_cancel">取消</a>',
                    '    </span>',
                    '    <hr style="display: none"/>',
                    '    <p style="display: none">',
                    '        服务器地址: <span class="longtextspan">' + server.url + '</span><br/>',
                    '        服务器版本: <span>' + version + '</span> <button class="list_profile_test btn btn-primary btn-xs" data-serverid="' + server.id + '">测试</button><br/>',
                    '        下载路径: <span class="longtextspan">' + downloadPath + '</span><br/>',
                    '    </p>',
                    '</li>'
                ].join("\n");
                $(li).appendTo($("#list_profile_container"));
            }
        });
    }

    // 事件响应

    // 主页的修改服务器下拉框
    $("#server_profile").change(function () {
        var select = $(this);
        var selectedServerID = select.val();
        select.attr("disabled", true);
        messageSendToBackground(105, selectedServerID);
        messageSendToBackground(103, selectedServerID, function (response) {
                displayServerOnMainForm(response.message);
                select.attr("disabled", false);
            });
    });
    // 主页的修改服务器按钮
    $("#update_selected_server").click(function () {
        $("#main_form").hide();
        $("#update_server_cancel").show();
        $("#update_server_back").hide();
        $("#update_form").show();
        $("#update_server_save").attr("disabled", false);
        $("#update_server_save").show();
        $("#update_server_save_force").hide();
        $("#update_server_error").hide().text("");
        $("#update_server_info").hide().text("");
        messageSendToBackground(103, $(this).attr("data-serverid"), function (response) {
            displayServerOnUpdateForm(response.message);
        });
    });
    // 主界面点击明文 url (隐藏 token)
    $("#selected_server_url").click(function () {
        $(this).hide();
        $("#selected_server_url_mask").show();
    });
    // 主界面点击隐藏 token 的 url (显示明文)
    $("#selected_server_url_mask").click(function () {
        $(this).hide();
        $("#selected_server_url").show();
    });
    // 主界面点击测试服务器
     $(document).on("click", ".list_profile_test, #test_selected_server", function () {
        var versionspan = $(this).prev();
        $(this).attr("disabled", true);
        var timer = setInterval(function () {
            switch (versionspan.text()) {
                case "连接中":
                    versionspan.text("连接中.");
                    break;
                case "连接中.":
                    versionspan.text("连接中..");
                    break;
                case "连接中..":
                    versionspan.text("连接中...");
                    break;
                default:
                    versionspan.text("连接中");
                    break;
            }
        }, 200);
        var thisBtn = this;
        messageSendToBackground(103, $(this).attr("data-serverid"), function (response) {
            //获取服务器信息
            $(thisBtn).attr("disabled", false);
            var server = response.message;
            messageSendToBackground(100, server.url, function (response) {
                // 测试服务器(服务器有时太快了, 延迟1秒调用)
                setTimeout(function () {
                    clearInterval(timer);
                    if (response.code == 1) {
                        server.version = response.message;
                        versionspan.show().text(response.message);
                    } else {
                        server.version = -1;
                        versionspan.show().text("连接错误");
                    }
                    messageSendToBackground(101, {
                        serverid: server.id,
                        server: server,
                        reloadaria2: true
                    }, function (response) {
                        //设置服务器
                        console.log("ok");
                    });
                }, 1000);
            });
        });
    });
    // 修改服务器界面取消按钮(返回主页)
    $("#update_server_cancel").click(function () {
        $("#main_form").show();
        $("#update_form").hide();
    });

    // 列举所有服务器(主页管理按钮)
    $("#profile_list").click(function () {
        $("#main_form").hide();
        $("#list_profile").show();
        refreshProfileList();
    });

    // 列举服务器界面里面的服务器详情按钮
    $(document).on("click", ".list_profile_show", function () {
        $(this).hide();
        $(this).next().show();
        $(this).parents(".list-group-item").children("hr").show();
        $(this).parents(".list-group-item").children("p").show();
    });
    // 列举服务器界面里面的隐藏详情按钮
    $(document).on("click", ".list_profile_hide", function () {
        $(this).hide();
        $(this).prev().show();
        $(this).parents(".list-group-item").children("hr").hide();
        $(this).parents(".list-group-item").children("p").hide();
    });
    // 列举服务器里面的修改服务器按钮
    $(document).on("click", ".list_profile_update", function () {
        $("#list_profile").hide();
        $("#update_server_cancel").hide();
        $("#update_server_back").show();
        $("#update_form").show();
        $("#update_server_save").attr("disabled", false);
        $("#update_server_save").show();
        $("#update_server_save_force").hide();
        $("#update_server_error").hide().text("");
        $("#update_server_info").hide().text("");
        messageSendToBackground(103, $(this).attr("data-serverid"), function (response) {
            displayServerOnUpdateForm(response.message, true);
        });
    });
    // 列举服务器里面的删除按钮(弹出删除确认和取消按钮)
    $(document).on("click", ".list_profile_delete", function () {
        $(this).parent().hide().next().show()
    });
    // 列举服务器里面的取消删除按钮
    $(document).on("click", ".list_profile_delete_cancel", function () {
        $(this).parent().hide().prev().show()
    });
    // 列举服务器里面的确认删除按钮
    $(document).on("click", ".list_profile_delete_confirm", function () {
        var li = $(this).parents("li");
        var serverid = $(this).attr("data-serverid");
        messageSendToBackground(104, serverid, function (response) {
            var licount = li.parent().children("li").length;
            li.remove();
            if (licount <= 1) {
                $("#list_profile_no_data").show();
            }

        });
    });
    // 列举服务器界面返回按钮(返回主界面)
    $("#list_form_back").click(function () {
        $("#main_form").show();
        $("#list_profile").hide();
        refreshMainForm();
    });
    // 列举服务器界面新建按钮
    $("#list_form_create").click(function () {
        $("#list_profile").hide();
        $("#update_server_cancel").hide();
        $("#update_server_back").show();
        $("#update_form").show();
        $("#update_server_save").attr("disabled", true).attr("data-serverid", "").attr("data-backtoserverlist", "1");
        $("#update_server_save_force").attr("data-serverid", "").attr("data-backtoserverlist", "1");
        $("#update_server_save").show();
        $("#update_server_save_force").hide();
        $("#update_server_name").val("");
        $("#update_server_url").val("");
        $("#update_server_downloadupdate_server_downloadpathpath").val("");
        $("#update_server_downloadpath").val("");
        $("#update_server_error").hide().text("");
        $("#update_server_info").hide().text("");
    });
    // 修改服务器返回按钮(返回列举服务器界面)
    $("#update_server_back").click(function () {
        $("#list_profile").show();
        $("#update_form").hide();
    });
    // 修改界面文本框事件(判断内容是否合法)
    $("#update_server_name, #update_server_url").keyup(function () {
        if ($("#update_server_name").val().trim().length == 0) {
            $("#update_server_save").attr("disabled", true);
            return;
        }
        if ($("#update_server_url").val().trim().length == 0) {
            $("#update_server_save").attr("disabled", true);
            return;
        }
        $("#update_server_save").attr("disabled", false);
    });
    // 修改界面保存按钮
    $("#update_server_save").click(function () {
        var serverID = $(this).attr("data-serverid");
        var name = $("#update_server_name").val().trim();
        var url = $("#update_server_url").val().trim();
        var downloadPath = $("#update_server_downloadpath").val().trim();
        $("#update_server_info").hide();
        $("#update_server_error").hide();
        // 判断是返回主界面还是服务器列表界面
        var backtolist = $(this).attr("data-backtoserverlist") == 1 || serverID.length == 0;
        var back = function () {
            if (backtolist) {
                $("#list_profile").show();
                $("#update_form").hide();
            } else {
                $("#main_form").show();
                $("#update_form").hide();
            }
        };
        var reloadUI = function () {
            if (backtolist) {
                refreshProfileList();
            } else {
                refreshMainForm();
            }
        };
        // 读取当前服务器信息
        messageSendToBackground(103, serverID, function (response) {
            var server = undefined;
            if (response && response.message) {
                server = response.message;
            } else {
                // 没有找到对应服务器就新建一个服务器
                server = {
                    id: -1,
                    name: "",
                    url: "",
                    downloadPath: ""
                };
            }
            if (name == server.name && url == server.url && downloadPath == server.downloadPath) {
                // 没有任何修改
                back();
            } else {
                if (url == server.url) {
                    // url 没有改动
                    server.name = name;
                    server.downloadPath = downloadPath;
                    $("#update_server_info").hide();
                    $("#update_server_error").hide();
                    // 直接保存
                    messageSendToBackground(101, {
                        serverid: server.id,
                        server: server,
                        reloadaria2: false
                    }, function () {
                        reloadUI();
                        back();
                    });
                } else {
                    $("#update_server_save").attr("disabled", true);
                    // 测试url 是否可以连接
                    $("#update_server_info").show();
                    // 连接中动画
                    var timer = setInterval(function () {
                        switch ($("#update_server_info").text()) {
                            case "连接中":
                                $("#update_server_info").text("连接中.");
                                break;
                            case "连接中.":
                                $("#update_server_info").text("连接中..");
                                break;
                            case "连接中..":
                                $("#update_server_info").text("连接中...");
                                break;
                            default:
                                $("#update_server_info").text("连接中");
                                break;
                        }
                    }, 200);
                    messageSendToBackground(100, url, function (response) {
                        $("#update_server_save").attr("disabled", false);
                        clearInterval(timer);
                        if (response.code == 1) {
                            $("#update_server_info").text("已连接, 版本" + response.message);
                            server.name = name;
                            server.url = url;
                            server.downloadPath = downloadPath;
                            server.version = response.message;
                            setTimeout(function () {
                                $("#update_server_info").hide();
                                $("#update_server_error").hide();
                                messageSendToBackground(101, {
                                    serverid: server.id,
                                    server: server,
                                    reloadaria2: true
                                }, function (response) {
                                    reloadUI();
                                    back();
                                });
                            }, 1000);
                        } else {
                            $("#update_server_info").hide();
                            $("#update_server_error").show().html("连接错误");
                            $("#update_server_save").hide();
                            $("#update_server_save_force").show();
                        }
                    });
                }
            }
        });
    });
    $("#update_server_save_force").click(function () {
        var serverID = parseInt($(this).attr("data-serverid"));
        if (serverID == 0 || isNaN(serverID)) {
            serverID = -1;
        }
        var name = $("#update_server_name").val().trim();
        var url = $("#update_server_url").val().trim();
        var downloadPath = $("#update_server_downloadpath").val().trim();
        var server = {
            id: serverID,
            name: name,
            url: url,
            downloadPath: downloadPath
        };
        // 判断是返回主界面还是服务器列表界面
        var backtolist = $(this).attr("data-backtoserverlist") == 1 || serverID.length == 0;
        var reloadUI = function () {
            if (backtolist) {
                refreshProfileList();
            } else {
                refreshMainForm();
            }
        };
        var back = function () {
            if (backtolist) {
                $("#list_profile").show();
                $("#update_form").hide();
            } else {
                $("#main_form").show();
                $("#update_form").hide();
            }
        };
        // 直接保存
        messageSendToBackground(101, {
            serverid: server.id,
            server: server,
            reloadaria2: true
        }, function () {
            reloadUI();
            back();
        });
    });
    init();
});