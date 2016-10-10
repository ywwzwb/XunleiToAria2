/**
 * Created by yww on 16/6/30.
 */

$(function () {
    function messageSendToBackground(code, message, response) {
        chrome.runtime.sendMessage({
            code: code,
            message: message
        }, response);
    }

    function init() {
        messageSendToBackground(102, null, function (response) {
            var currentServerID = response.message.currentServer;
            var servers = response.message.servers;
            var hasCurrentServer = false;
            for (var serverid in servers) {
                var server = servers[serverid];
                if (serverid == currentServerID) {
                    hasCurrentServer = true;
                    displayServerOnMainForm(server);
                }
                $("<option>").val(server.id).text(server.name).appendTo($("#server_profile"));
            }
            if (!hasCurrentServer) {
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
        $("#test_selected_server").attr("data-serverid",server.id);
        $("#update_selected_server").attr("data-serverid",server.id);
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
        $("#update_cancel").show();
        $("#update_back").hide();
        $("#update_form").show();
    });
    $("#update_cancel").click(function () {
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
        $("#update_cancel").hide();
        $("#update_back").show();
        $("#update_form").show();
    });
    $("#update_back").click(function () {
        $("#list_profile").show();
        $("#update_form").hide();
    });
    $("#server_profile").change(function(){
        messageSendToBackground(103, $(this).val(), function (response) {
            displayServerOnMainForm(response.message);
        });
    });
    init();
});