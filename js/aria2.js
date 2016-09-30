/**
 * Created by yww on 16/6/30.
 */

var Aria2 = {
    init: function () {
        var instance = {};
        var _socket = undefined;
        // function( response:object )
        var _successCallBack = {};
        var _failCallBack = {};
        var _uid = 1;
        instance.url = "";
        instance.serverGood = undefined;
        instance.token = undefined;
        instance.serverAddr = undefined;
        instance.serverPort = undefined;
        //callback :function(bool:serverok,string:message);
        instance.makeuid = function () {
            return _uid++;
        };
        instance.setUrl = function (url, callback) {
            if (!callback) {
                callback = function () {
                };
            }
            _successCallBack = {};
            _failCallBack = {};
            instance.serverGood = undefined;
            if (url == 0) {
                instance.serverGood = false;
                callback(false, "URL Empty");
                return;
            }
            if (url.startsWith("https")) {
                url = url.replace("https", "wss");
            } else if (url.startsWith("http")) {
                url = url.replace("http", "ws");
            }
            var reg = /\/\/token:(\w+)@([\w.]+):(\d+)\//;
            if (!reg.test(url)) {
                instance.serverGood = false;
                callback(false, "URL Error");
                return;
            }
            var result = reg.exec(url);
            instance.token = result[1];
            url = url.replace("token:" + instance.token + "@", "");
            instance.serverAddr = result[2];
            instance.serverPort = result[3];
            instance.url = url;
            if (_socket) {
                _socket.close();
            }
            _socket = undefined;
            try {
                _socket = new WebSocket(url);
            } catch (err) {
                if (_socket) {
                    _socket.close()
                }
                _socket = undefined;
                callback(false, "conect error");
                return;
            }
            _socket.onmessage = function (event) {
                var data = JSON.parse(event.data);
                if (data instanceof Array) {
                    data = data[0];
                }
                var id = data.id;
                var result = data["result"];
                var error = data["error"];
                if (error) {
                    if (_failCallBack[id]) {
                        _failCallBack[id]();
                        delete _failCallBack[id];
                        delete _successCallBack[id]
                    }
                    return;
                }
                if (_successCallBack[id]) {
                    _successCallBack[id](result);
                    delete _failCallBack[id];
                    delete _successCallBack[id]
                }
            };
            _socket.onerror = function () {
                callback(false, "connect error connect error");
            };
            _socket.onopen = function () {
                instance.getVersion(function (msg) {
                    instance.serverGood = true;
                    callback(true, msg);
                }, function () {
                    instance.serverGood = false;
                    callback(false, "connect error");
                })
            }
        };
        //success: function(msg:String)
        //error: function()
        instance.sendRequest = function (method, param, success, fail) {
            if (instance.serverGood == false || _socket.readyState != 1) {
                fail();
                return;
            }
            if (!param) {
                param = []
            }
            param.unshift("token:" + instance.token);
            var dataObj = {
                jsonrpc: '2.0',
                method: 'aria2.' + method,
                id: instance.makeuid(),
                params: param
            };

            if (success) {
                _successCallBack[dataObj.id] = success;
            }
            if (fail) {
                _failCallBack[dataObj.id] = fail;
            }
            try {
                _socket.send(JSON.stringify(dataObj));
            } catch (ex) {
                fail();
            }
        };

        instance.sendBatchRequest = function (method, params, success, fail) {
            if (instance.serverGood == false || _socket.readyState != 1) {
                fail();
                return;
            }

            if (!params || params.length == 0) {
                success();
                return;
            }
            var data = [];
            for (var i in params) {
                var param = params[i];
                param.unshift("token:" + instance.token);
                var dataObj = {
                    jsonrpc: '2.0',
                    method: 'aria2.' + method,
                    id: instance.makeuid(),
                    params: param
                };
                data.push(dataObj);
            }
            if (success) {
                _successCallBack[data[0].id] = success;
            }
            if (fail) {
                _failCallBack[data[0].id] = fail;
            }
            try {
                _socket.send(JSON.stringify(data));
            } catch (ex) {
                fail();
                delete _successCallBack[data[0].id];
                delete _failCallBack[data[0].id];
            }
        };
        instance.download = function (param, downloadDir, success, fail) {
            var aria2param = undefined;
            if (downloadDir && downloadDir.length > 0) {
                downloadDir = downloadDir.replace(/\\/g, "/");
                if (downloadDir.endsWith("/")) {
                    downloadDir = downloadDir.substr(0, downloadDir.length - 1);
                }
            }
            aria2param = [
                [param.url],
                {
                    out: param.name,
                    header: param.header,
                    dir: downloadDir
                }
            ];
            if (!downloadDir || downloadDir.length == 0) {
                delete aria2param[1].dir;
            }
            if (!param.name || param.name.length == 0) {
                delete aria2param[1].out;
            }
            if (!param.header || param.name.header == 0) {
                delete aria2param[1].header;
            }
            instance.sendRequest("addUri", aria2param, success, fail);
        };
        instance.batchDownload = function (params, downloadDir, success, fail) {
            var aria2params = [];
            if (downloadDir && downloadDir.length > 0) {
                downloadDir = downloadDir.replace(/\\/g, "/");
                if (downloadDir.endsWith("/")) {
                    downloadDir = downloadDir.substr(0, downloadDir.length - 1);
                }
                for (var i = 0, l = params.length; i < l; i++) {
                    var n = params[i];
                    aria2params.push([
                        [n.url],
                        {
                            out: n.name,
                            header: n.header,
                            dir: downloadDir
                        }
                    ]);
                }
            } else {
                for (var i = 0, l = params.length; i < l; i++) {
                    var n = params[i];
                    aria2params.push([
                        [n.url],
                        {
                            out: n.name,
                            header: n.header
                        }
                    ]);
                }
            }
            instance.sendBatchRequest("addUri", aria2params, success, fail);
        };
        instance.getVersion = function (success, fail) {
            instance.sendRequest("getVersion", null,
                function (result) {
                    success(result.version);
                }, fail);
        };

        return instance;
    },
    _shareAria2: undefined,
    shareAria2: function () {
        if (Aria2._shareAria2 == undefined) {
            Aria2._shareAria2 = Aria2.init()
        }
        return Aria2._shareAria2;
    }
};