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
            var aria2param = [
                [param.url],
                {
                    out: param.name,
                    header: param.header,
                    dir: downloadDir
                }
            ];
            instance.sendRequest("addUri", aria2param, success, fail);
        };
        instance.batchDownload = function (params, downloadDir, success, fail) {
            var aria2params = [];
            for (var i = 0, l = params.length; i < l; i++) {
                var n = params[i];
                var aria2param = [
                    [n.url],
                    {
                        out: n.name,
                        header: n.header,
                        dir: downloadDir
                    }
                ];
                aria2params.push(aria2param)
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

//
// var ARIA2 = (function () {
//     var wsUri, websocket, rpc_secret = null,
//         unique_id = 0, ws_callback = {};
//
//     function request_auth(url) {
//         return url.match(/^(?:(?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(?:\/\/)?(?:([^:@]*(?::[^:@]*)?)?@)?/)[1];
//     }
//
//     function remove_auth(url) {
//         return url.replace(/^((?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(\/\/)?(?:(?:[^:@]*(?::[^:@]*)?)?@)?(.*)/, '$1$2$3');
//     }
//
//     return {
//         serverGood: false,
//         init: function (path, onready, onerror) {
//             this.serverGood = false;
//             wsUri = path;
//             var auth_str = request_auth(wsUri);
//             if (auth_str && auth_str.indexOf('token:') == 0) {
//                 rpc_secret = auth_str;
//                 wsUri = remove_auth(wsUri);
//             }
//             console.log(wsUri);
//             if (wsUri.indexOf("http") === 0) { //http协议
//                 wsUri = wsUri.replace('http:', 'ws:');
//             }
//
//             if (wsUri.indexOf("ws") === 0 && WebSocket) { //ws协议
//                 websocket = new WebSocket(wsUri);
//                 websocket.onmessage = function (event) {
//                     var data = JSON.parse(event.data);
//                     if ($.isArray(data) && data.length && data[0].result) {
//                         var id = data[0].id;
//                         if (ws_callback[id]) {
//                             ws_callback[id].success(data);
//                             delete ws_callback[id];
//                         }
//                     } else {
//                         if ($.isArray(data)) {
//                             data = data[0];
//                         }
//                         if (ws_callback[data.id]) {
//                             if (data.error)
//                                 ws_callback[data.id].error(data);
//                             else
//                                 ws_callback[data.id].success(data);
//                             delete ws_callback[data.id];
//                         }
//                     }
//                 };
//
//                 websocket.onerror = function (event) {
//                     if (onerror) {
//                         onerror();
//                     }
//                     ws_callback = {};
//                 };
//
//                 websocket.onopen = function () {
//                     ARIA2.request = ARIA2.request_ws;
//                     ARIA2.batch_request = ARIA2.batch_request_ws;
//                     if (onready) {
//                         onready();
//                     } else {
//                         ARIA2.get_version();
//                     }
//                 };
//             } else { //异常
//                 console.log("aria2 error")
//             }
//         },
//         request: function () {
//         },
//         batch_request: function () {
//         },
//         _request_data: function (method, params, id) {
//             var dataObj = {
//                 jsonrpc: '2.0',
//                 method: 'aria2.' + method,
//                 id: id
//             };
//             if (typeof (params) !== 'undefined') {
//                 dataObj.params = params;
//             }
//             return dataObj;
//         },
//         _get_unique_id: function () {
//             ++unique_id;
//             return unique_id;
//         },
//         request_ws: function (method, params, success, error) {
//             var id = ARIA2._get_unique_id();
//             ws_callback[id] = {
//                 'success': success || function () {
//                 },
//                 'error': error || function () {
//                 }
//             };
//             if (rpc_secret) {
//                 params = params || [];
//                 if (!$.isArray(params))
//                     params = [params];
//                 params.unshift(rpc_secret);
//             }
//             try {
//                 websocket.send(JSON.stringify(ARIA2._request_data(method, params, id)));
//             } catch (ex) {
//                 console.error(ex);
//             }
//         },
//         batch_request_ws: function (method, params, success, error) {
//             var data = [];
//             var id = ARIA2._get_unique_id();
//             ws_callback[id] = {
//                 'success': success || function () {
//                 },
//                 'error': error || function () {
//
//                 }
//             };
//             for (var i = 0, l = params.length; i < l; i++) {
//                 var n = params[i];
//                 n = n || [];
//                 if (!$.isArray(n))
//                     n = [n];
//                 if (rpc_secret) {
//                     n.unshift(rpc_secret);
//                 }
//                 data.push(ARIA2._request_data(method, n, id));
//             }
//             websocket.send(JSON.stringify(data));
//         },
//         download: function (param, downloadDir, success, error) {
//             var aria2param = [
//                 [param.url],
//                 {
//                     out: param.name,
//                     header: param.header,
//                     dir: downloadDir
//                 }
//             ];
//             ARIA2.request_ws("addUri", aria2param, success, error);
//         },
//         batch_download: function (params, downloadDir, success, error) {
//             var aria2params = [];
//             for (var i = 0, l = params.length; i < l; i++) {
//                 var n = params[i];
//                 var aria2param = [
//                     [n.url],
//                     {
//                         out: n.name,
//                         header: n.header,
//                         dir: downloadDir
//                     }
//                 ];
//                 aria2params.push(aria2param)
//             }
//             ARIA2.batch_request_ws("addUri", aria2params, success, error);
//         },
//         get_version: function (success, fail) {
//             this.request("getVersion", [],
//                 function (result) {
//                     if (!result.result) {
//                         ARIA2.serverGood = false;
//                         if (fail) {
//                             fail();
//                         }
//                     } else {
//                         ARIA2.serverGood = true;
//                         if (success) {
//                             success(result.result.version);
//                         }
//                     }
//                 }, function () {
//                     ARIA2.serverGood = false;
//                     if (fail) {
//                         fail();
//                     }
//                 }
//             );
//         }
//     };
// })();