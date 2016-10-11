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
        if (downloadPath || downloadPath.length == 0) {
            $("#selected_server_downloadpath").text("使用默认值");
        } else {
            $("#selected_server_downloadpath").text(downloadPath);
        }
        $("#test_selected_server").attr("data-serverid", server.id);
        $("#update_selected_server").attr("data-serverid", server.id);
    }

    function displayServerOnUpdateForm(server, backtoserverlist) {
        $("#update_server_name").val(server.name);
        $("#update_server_url").val(server.url);
        $("#update_server_downloadpath").val(server.downloadPath);
        $("#update_server_save").attr("data-serverid", server.id);
        if (backtoserverlist) {
            $("#update_server_save").attr("data-backtoserverlist", "1");
        }
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

    function refreshProfileList() {
        $("#list_profile_container").html("");
        messageSendToBackground(102, null, function (response) {
            var servers = response.message.servers;
            if (servers.length == 0) {
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
                if (downloadPath || downloadPath.length == 0) {
                    downloadPath = "使用默认值";
                }
                var li = [
                    '<li class="list-group-item">',
                    '    ' + server.name,
                    '    <span class="operate-btn-group-right">',
                    '        <a href="#" class = "list_profile_show" data-serverid="' + server.id + '">详细</a>',
                    '        <a href="#" class = "list_profile_hide" style="display: none" data-serverid="' + server.id + '">收起</a>',
                    '        <a href="#" class = "list_profile_update" data-serverid="' + server.id + '">修改</a>',
                    '        <a href="#" class = "list_profile_delete text-danger" data-serverid="' + server.id + '">删除</a>',
                    '    </span>',
                    '    <hr style="display: none"/>',
                    '    <p style="display: none">',
                    '        服务器地址: <span class="longtextspan">' + server.url + '</span><br/>',
                    '        服务器版本: <span>' + version + '</span> <button class="list_profile_test btn btn-primary btn-xs" data-serverid="' + server.id + '">测试</button><br/>',
                    '        下载路径: <span class="longtextspan">' + server.downloadPath + '</span><br/>',
                    '    </p>',
                    '</li>'
                ].join("\n");
                $(li).appendTo($("#list_profile_container"));
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
        refreshProfileList();
    });
    $(document).on("click", ".list_profile_show", function () {
        $(this).hide();
        $(this).next().show();
        $(this).parents(".list-group-item").children("hr").show();
        $(this).parents(".list-group-item").children("p").show();
    });
    $(document).on("click", ".list_profile_hide", function () {
        $(this).hide();
        $(this).prev().show();
        $(this).parents(".list-group-item").children("hr").hide();
        $(this).parents(".list-group-item").children("p").hide();
    });
    $(document).on("click", ".list_profile_update", function () {
        $("#list_profile").hide();
        $("#update_server_cancel").hide();
        $("#update_server_back").show();
        $("#update_form").show();
        $("#update_server_save").attr("disabled", false);
        messageSendToBackground(103, $(this).attr("data-serverid"), function (response) {
            displayServerOnUpdateForm(response.message, true);
        });
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
        $("#update_server_save").attr("disabled", true);
        $("#update_server_save").attr("data-serverid","");
        $("#update_server_name").val("");
        $("#update_server_url").val("");
        $("#update_server_downloadpath").val("");
        $("#update_server_downloadpath").val("");
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
        messageSendToBackground(103, serverID, function (response) {
            var server = undefined;
            if (response && response.message){
                server = response.message;
            } else {
                server = {
                    id:-1,
                    name:"",
                    url:"",
                    downloadPath:""
                };
            }
            if (name == server.name && url == server.url && downloadPath == server.downloadPath) {
                //没有任何修改
                back();
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
                        reloadUI();
                        back();
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
                                }, function (response) {
                                    reloadUI();
                                    back();
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
    });
    $(document).on("click", ".list_profile_test, #test_selected_server", function () {
        var versionspan = $(this).prev();
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
        messageSendToBackground(103, $(this).attr("data-serverid"), function (response) {
            var server = response.message;
            messageSendToBackground(100, server.url, function (response) {
                setTimeout(function () {
                    clearInterval(timer);
                    if (response.code == 1) {
                        server.version = response.message;
                        versionspan.show().text(response.message);
                    } else {
                        server.version = -1;
                        versionspan.show().text("连接错误");
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
})
;