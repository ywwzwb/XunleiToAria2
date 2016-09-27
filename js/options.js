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
            $('#serverUrl').val(response.message.serverUrl);
            $('#downloadPath').val(response.message.downloadPath);
            testServer();
        });
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
    init();
});