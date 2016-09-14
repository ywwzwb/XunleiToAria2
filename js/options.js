/**
 * Created by yww on 16/6/30.
 */

$(function () {
    function init() {
        MessageSendToBackground(102, null, function (response) {
            $('#serverUrl').val(response.message.serverUrl);
            $('#downloadPath').val(response.message.downloadPath);
            testServer();
        });
    }

    function testServer(setting) {
        $("#server_version").removeClass(".red");
        $("#server_version").html(", 连接到服务器中");
        var updatetimer = setInterval(function () {
            if ($("#server_version").html() == ", 连接到服务器中") {
                $("#server_version").html(", 连接到服务器中.");
            } else if ($("#server_version").html() == ", 连接到服务器中.") {
                $("#server_version").html(", 连接到服务器中..");
            } else if ($("#server_version").html() == ", 连接到服务器中..") {
                $("#server_version").html(", 连接到服务器中");
            }
        }, 200);
        MessageSendToBackground(100, setting, function (response) {
            if (response.code == 0) {
                clearInterval(updatetimer);
                $("#server_version").html(", 服务器连接失败").addClass(".red");
                $("#serverUrl").addClass('red');
            } else {
                clearInterval(updatetimer);
                $("#server_version").removeClass(".red").html(", 当前版本 v" + response.message);
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
        MessageSendToBackground(101, null, function (response) {
            $('#serverUrl').val(response.message.serverUrl);
            $('#downloadPath').val(response.message.downloadPath);
            testServer()
        });
    });
    init();
});