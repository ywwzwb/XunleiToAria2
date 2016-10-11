/**
 * Created by yww on 16/6/30.
 */

$(function () {
    var selectedServerID = undefined;

    function messageSendToBackground(code, message, response) {
        chrome.runtime.sendMessage({
            code: code,
            message: message
        }, response);
    }

    function init() {
        refreshMainForm(true);

    }

    function refreshMainForm(saveCurrentServer) {
        messageSendToBackground(102, null, function (response) {
            if (saveCurrentServer) {
                selectedServerID = response.message.currentServer;
            }
            var servers = response.message.servers;
            var hasSelectedServer = false;
            $("#server_profile").html("");
            for (var serverid in servers) {
                var server = servers[serverid];
                if (serverid == selectedServerID) {
                    hasSelectedServer = true;
                    displayServerOnMainForm(server);
                }
                $("<option>").val(server.id).text(server.name).appendTo($("#server_profile"));
            }
            $("#server_profile").val(selectedServerID);
            if (!hasSelectedServer) {
                $("#current_server_span").hide();
                $("#no_current_server_span").show();
            }
        });
    }

    function displayServerOnMainForm(server) {
        $("#selected_server_span").show();
        $("#no_selected_server_span").hide();
        $("#selected_server_url").text(server.url);
        var version = server.version;
        if (version == 0) {
            $("#selected_server_version").text("未知版本");
        } else if (version == -1) {
            $("#selected_server_version").text("连接错误");
        } else {
            $("#selected_server_version").text(version);
        }
        var downloadPath = server.downloadPath;
        if (downloadPath && downloadPath.length == 0) {
            $("#selected_server_downloadpath").text("使用默认值");
        } else {
            $("#selected_server_downloadpath").text(downloadPath);
        }
        $("#test_selected_server").attr("data-serverid", server.id);
        $("#update_selected_server").attr("data-serverid", server.id);
    }

    function displayServerOnUpdateForm(server) {
        $("#update_server_name").val(server.name);
        $("#update_server_url").val(server.url);
        $("#update_server_downloadpath").val(server.downloadPath);
        $("#update_server_save").attr("data-serverid", server.id);
    }

    function testServer(setting) {
        $("#server_version").removeClass(".red");
        $("#server_version").html("(连接中)");
        var updatetimer = setInterval(function () {
            if ($("#server_version").html() == "(连接中)") {
                $("#server_version").html("(连接中.)");
            } else if ($("#server_version").html() == "(连接中.)") {
                $("#server_version").html("(连接中..)");
            } else if ($("#server_version").html() == "(连接中..)") {
                $("#server_version").html("(连接中)");
            }
        }, 200);
        messageSendToBackground(100, setting, function (response) {
            if (response.code == 0) {
                clearInterval(updatetimer);
                $("#server_version").html("(连接失败)").addClass(".red");
                $("#serverUrl").addClass('red');
            } else {
                clearInterval(updatetimer);
                $("#server_version").removeClass(".red").html("(已连接 v" + response.message + ")");
                $("#serverUrl").removeClass('red');
            }
        });
    }

    $("#save").click(function () {
        var serverUrl = $('#serverUrl').val();
        var downloadPath = $('#downloadPath').val();
        testServer({url: serverUrl, downloadPath: downloadPath});
    });
    $("#reset").click(function () {
        messageSendToBackground(101, null, function (response) {
            $('#serverUrl').val(response.message.serverUrl);
            $('#downloadPath').val(response.message.downloadPath);
            testServer()
        });
    });
    $("#update_selected_server").click(function () {
        $("#main_form").hide();
        $("#update_server_cancel").show();
        $("#update_server_back").hide();
        $("#update_form").show();
        $("#update_server_save").attr("disabled", false);
        messageSendToBackground(103, $(this).attr("data-serverid"), function (response) {
            displayServerOnUpdateForm(response.message);
        });
    });
    $("#update_server_cancel").click(function () {
        $("#main_form").show();
        $("#update_form").hide();
    });
    $("#profile_list").click(function () {
        $("#main_form").hide();
        $("#list_profile").show();
    });
    $("#list_form_back").click(function () {
        $("#main_form").show();
        $("#list_profile").hide();
    });
    $("#list_form_create").click(function () {
        $("#list_profile").hide();
        $("#update_server_cancel").hide();
        $("#update_server_back").show();
        $("#update_form").show();
    });
    $("#update_server_back").click(function () {
        $("#list_profile").show();
        $("#update_form").hide();
    });
    $("#server_profile").change(function () {
        selectedServerID = $(this).val();
        messageSendToBackground(103, selectedServerID, function (response) {
            displayServerOnMainForm(response.message);
        });
    });
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
    $("#update_server_save").click(function () {
        var serverID = $(this).attr("data-serverid");
        var name = $("#update_server_name").val().trim();
        var url = $("#update_server_url").val().trim();
        var downloadPath = $("#update_server_downloadpath").val().trim();
        $("#update_server_info").hide();
        $("#update_server_error").hide();
        if (serverID.length) {
            //修改
            messageSendToBackground(103, serverID, function (response) {
                var server = response.message;
                if (name == server.name && url == server.url && downloadPath == server.downloadPath) {
                    //没有任何修改
                    $("#main_form").show();
                    $("#update_form").hide();
                } else {
                    if (url == server.url) {
                        // url 没有改动
                        server.name = name;
                        server.downloadPath = downloadPath;
                        $("#update_server_info").hide();
                        $("#update_server_error").hide();
                        messageSendToBackground(101, {
                            serverid: server.id,
                            server: server,
                            reloadaria2: false
                        }, function () {
                            refreshMainForm();
                            $("#main_form").show();
                            $("#update_form").hide();
                        });
                    } else {
                        //测试url 是否可以连接
                        $("#update_server_info").show();
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
                                    }, function () {

                                        refreshMainForm();
                                        $("#main_form").show();
                                        $("#update_form").hide();
                                    });
                                }, 1000);
                            } else {
                                $("#update_server_info").hide();
                                $("#update_server_error").show().text("连接错误");
                            }
                        });
                    }
                }
            });
        } else {
            //新增服务器
        }
    });
    $("#test_selected_server").click(function () {
        var timer = setInterval(function () {
            switch ($("#selected_server_version").text()) {
                case "连接中":
                    $("#selected_server_version").text("连接中.");
                    break;
                case "连接中.":
                    $("#selected_server_version").text("连接中..");
                    break;
                case "连接中..":
                    $("#selected_server_version").text("连接中...");
                    break;
                default:
                    $("#selected_server_version").text("连接中");
                    break;
            }
        }, 200);
        messageSendToBackground(103, $(this).attr("data-serverid"), function (response) {
            var server = response.message;
            messageSendToBackground(100, server.url, function (response) {
                setTimeout(function () {
                    clearInterval(timer);
                    if (response.code == 1) {
                        server.version = response.message;
                        $("#selected_server_version").show().text(response.message);
                    } else {
                        server.version = -1;
                        $("#selected_server_version").show().text("连接错误");
                    }
                    server.version = response.message;
                    messageSendToBackground(101, {
                        serverid: server.id,
                        server: server,
                        reloadaria2: true
                    });
                }, 1000);
            });
        });
    });
    init();
});