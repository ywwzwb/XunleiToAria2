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
        if (serverID.length) {
            messageSendToBackground(103, serverID, function (response) {
                var server = response.message;
                if (name == server.name && url == server.url && downloadPath == server.downloadPath) {
                    //没有任何修改
                    $("#main_form").show();
                    $("#update_form").hide();
                } else {

                }
            });
        } else {

        }
        var serverInfo = {
            id: serverID,
            name: $("#update_server_name").val(),
            url: $("#update_server_url").val(),
            downloadPath: $("#update_server_downloadpath").val(),
            version: 0
        };
        // messageSendToBackground(103, selectedServerID, function (response) {
        //     displayServerOnMainForm(response.message);
        // });
    });
    init();
});