/**
 * Created by zengwenbin on 16/10/9.
 */

var ServerManager = {
    init: function () {
        var instance = {};
        var db = undefined;
        if (!localStorage.autoInCreaseServerID) {
            localStorage.autoInCreaseServerID = 1;
        }
        var request = indexedDB.open("ServerList", 1);
        request.onerror = function (event) {
            console.error("打开数据库出错");
        };
        request.onsuccess = function (event) {
            db = this.result;
        };
        request.onupgradeneeded = function (event) {
            var db = event.target.result;
            var objectStore = db.createObjectStore("servers", {keyPath: "id"});
            if (localStorage.serverUrl) {
                objectStore.add({
                    id: localStorage.autoInCreaseServerID++,
                    name: "Aria2",
                    url: localStorage.serverUrl,
                    downloadPath: localStorage.downloadPath,
                    version: 0
                }).onsuccess = function (event) {
                    delete localStorage.serverUrl;
                    delete localStorage.downloadPath;
                    instance.setCurrentServerID(event.target.result);
                };
            }

        };

        instance.addServer = function (server, callback) {
            callback = callback || function () {
                };
            var transaction = db.transaction(["servers"], "readwrite");
            transaction.onerror = function (event) {
                callback(false);
            };
            var objectStore = transaction.objectStore("servers");
            server.id = localStorage.autoInCreaseServerID++;
            var request = objectStore.add(server);
            request.onsuccess = function (event) {
                callback(true, event.target.result);
            };
        };
        instance.removeServer = function (serverid, callback) {
            callback = callback || function () {
                };
            var transaction = db.transaction(["servers"], "readwrite");
            transaction.onerror = function (event) {
                callback(false);
            };
            var objectStore = transaction.objectStore("servers");
            var request = objectStore.delete(serverid);
            request.onsuccess = function (event) {
                callback(true);
            };
        };
        instance.updateServer = function (serverid, newServerInfo, callback) {
            callback = callback || function () {
                };
            var transaction = db.transaction(["servers"], "readwrite");
            transaction.onerror = function (event) {
                callback(false);
            };
            var objectStore = transaction.objectStore("servers");
            var request = objectStore.put(newServerInfo);
            request.onsuccess = function (event) {
                callback(true);
            };
        };
        instance.getServer = function (serverid, callback) {
            callback = callback || function () {
                };
            serverid = parseInt(serverid);
            if (!serverid || serverid == 0 || serverid.length == 0) {
                callback(false);
                return;
            }
            var transaction = db.transaction(["servers"]);
            transaction.onerror = function (event) {
                callback(false);
            };
            var objectStore = transaction.objectStore("servers");
            var request = objectStore.get(serverid);
            request.onsuccess = function (event) {
                callback(true, request.result);
            };
        };
        instance.getAllServers = function (callback) {
            callback = callback || function () {
                };
            var transaction = db.transaction(["servers"]);
            transaction.onerror = function (event) {
                callback(false);
            };
            var allServers = {};
            var objectStore = transaction.objectStore("servers");
            objectStore.openCursor().onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    allServers[cursor.key] = cursor.value;
                    cursor.continue();
                } else {
                    callback(true, allServers);
                }
            }
        };
        instance.setCurrentServerID = function (serverid) {
            localStorage.currentServerID = serverid;
        };
        instance.getCurrentServerID = function () {
            return localStorage.currentServerID;
        };
        instance.getCurrentServer = function (callback) {
            instance.getServer(instance.getCurrentServerID(), callback);
        };
        return instance;
    },
    _shareManager: undefined,
    shareManager: function () {
        if (ServerManager._shareManager == undefined) {
            ServerManager._shareManager = ServerManager.init()
        }
        return ServerManager._shareManager;
    }
};