/**
 * Created by zengwenbin on 16/10/9.
 */

var ServerManager = {
    init: function () {
        var instance = {};
        var db = undefined;
        var request = indexedDB.open("ServerList", 1);
        request.onerror = function (event) {
            console.error("打开数据库出错");
        };
        request.onsuccess = function (event) {
            db = request.result;
        };
        request.onupgradeneeded = function (event) {
            var db = event.target.result;
            var objectStore = db.createObjectStore("servers", {autoIncrement: true});
            objectStore.add({
                name: "Aria2",
                url: localStorage.serverUrl,
                downloadPath: localStorage.downloadPath,
                version: version
            }).onsuccess = function(event){
                delete localStorage.serverUrl;
                delete localStorage.downloadPath;
                instance.setCurrentServerID(event.target.result);
            };
        };
        db.onerror = function (event) {
            console.error("未处理的错误:", event.target.errorCode);
        };
        instance.addServer = function (name, url, downloadPath, version, callback) {
            callback = callback || function () {
                };
            var transaction = db.transaction(["servers"], "readwrite");
            transaction.onerror = function (event) {
                callback(false);
            };
            var objectStore = transaction.objectStore("servers");
            var request = objectStore.add({
                name: name,
                url: url,
                downloadPath: downloadPath,
                version: version
            });
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
        instance.getServer = function (serverid, callback) {
            callback = callback || function () {
                };
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
            var allServers = [];
            var objectStore = transaction.objectStore("servers");
            objectStore.openCursor().onsuccess = function(event){
                var cursor = event.target.result;
                if (cursor) {
                    allServers.push(cursor.value);
                    cursor.continue();
                } else {
                    callback(true, allServers);
                }
            }
        };
        instance.setCurrentServerID = function(serverid) {
            localStorage.currentServerID = serverid;
        };
        instance.getCurrentServerID = function(){
            return localStorage.currentServerID;
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