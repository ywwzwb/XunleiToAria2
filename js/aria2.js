/**
 * Created by yww on 16/6/30.
 */
var ARIA2 = (function () {
    var wsUri, websocket, rpc_secret = null,
        unique_id = 0, ws_callback = {};

    function request_auth(url) {
        return url.match(/^(?:(?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(?:\/\/)?(?:([^:@]*(?::[^:@]*)?)?@)?/)[1];
    }

    function remove_auth(url) {
        return url.replace(/^((?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(\/\/)?(?:(?:[^:@]*(?::[^:@]*)?)?@)?(.*)/, '$1$2$3');
    }

    return {
        serverGood: false,
        init: function (path, onready, onerror) {
            this.serverGood = false;
            wsUri = path;
            var auth_str = request_auth(wsUri);
            if (auth_str && auth_str.indexOf('token:') == 0) {
                rpc_secret = auth_str;
                wsUri = remove_auth(wsUri);
            }
            console.log(wsUri);
            if (wsUri.indexOf("http") === 0) { //http协议
                wsUri = wsUri.replace('http:', 'ws:');
            }

            if (wsUri.indexOf("ws") === 0 && WebSocket) { //ws协议
                websocket = new WebSocket(wsUri);
                websocket.onmessage = function (event) {
                    var data = JSON.parse(event.data);
                    if ($.isArray(data) && data.length && data[0].result) {
                        var id = data[0].id;
                        if (ws_callback[id]) {
                            ws_callback[id].success(data);
                            delete ws_callback[id];
                        }
                    } else {
                        if ($.isArray(data)){
                            data = data[0];
                        }
                        if (ws_callback[data.id]) {
                            if (data.error)
                                ws_callback[data.id].error(data);
                            else
                                ws_callback[data.id].success(data);
                            delete ws_callback[data.id];
                        }
                    }
                };

                websocket.onerror = function (event) {
                    if (onerror) {
                        onerror();
                    }
                    ws_callback = {};
                };

                websocket.onopen = function () {
                    ARIA2.request = ARIA2.request_ws;
                    ARIA2.batch_request = ARIA2.batch_request_ws;
                    if (onready) {
                        onready();
                    } else {
                        ARIA2.get_version();
                    }
                };
            } else { //异常
                console.log("aria2 error")
            }
        },
        request: function () {
        },
        batch_request: function () {
        },
        _request_data: function (method, params, id) {
            var dataObj = {
                jsonrpc: '2.0',
                method: 'aria2.' + method,
                id: id
            };
            if (typeof (params) !== 'undefined') {
                dataObj.params = params;
            }
            return dataObj;
        },
        _get_unique_id: function () {
            ++unique_id;
            return unique_id;
        },
        request_ws: function (method, params, success, error) {
            var id = ARIA2._get_unique_id();
            ws_callback[id] = {
                'success': success || function () {
                },
                'error': error || function () {
                }
            };
            if (rpc_secret) {
                params = params || [];
                if (!$.isArray(params))
                    params = [params];
                params.unshift(rpc_secret);
            }
            try {
                websocket.send(JSON.stringify(ARIA2._request_data(method, params, id)));
            } catch (ex) {
                console.error(ex);
            }
        },
        batch_request_ws: function (method, params, success, error) {
            var data = [];
            var id = ARIA2._get_unique_id();
            ws_callback[id] = {
                'success': success || function () {
                },
                'error': error || function () {

                }
            };
            for (var i = 0, l = params.length; i < l; i++) {
                var n = params[i];
                n = n || [];
                if (!$.isArray(n))
                    n = [n];
                if (rpc_secret) {
                    n.unshift(rpc_secret);
                }
                data.push(ARIA2._request_data(method, n, id));
            }
            websocket.send(JSON.stringify(data));
        },
        download: function (param, downloadDir, success, error) {
            var aria2param = [
                [param.url],
                {
                    out: param.name,
                    header: param.header,
                    dir: downloadDir
                }
            ];
            ARIA2.request_ws("addUri", aria2param, success, error);
        },
        batch_download: function (params, downloadDir, success, error) {
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
            ARIA2.batch_request_ws("addUri", aria2params, success, error);
        },
        get_version: function (success, fail) {
            this.request("getVersion", [],
                function (result) {
                    if (!result.result) {
                        ARIA2.serverGood = false;
                        if (fail) {
                            fail();
                        }
                    } else {
                        ARIA2.serverGood = true;
                        if (success) {
                            success(result.result.version);
                        }
                    }
                }, function () {
                    ARIA2.serverGood = false;
                    if (fail) {
                        fail();
                    }
                }
            );
        }
    };
})();