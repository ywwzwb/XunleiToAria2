/**
 * Created by zengwenbin on 16/9/12.
 */

chrome.contextMenus.create({
    "id": "xunleiToAria2LinkContextMenu",
    "title": "下载到 Aria2",
    "contexts": ["link", "image", "video", "audio"]
});
XunleiLiXian.init();
chrome.contextMenus.onClicked.addListener(function (info) {
    var url = info.srcUrl ? info.srcUrl : info.linkUrl;
    XunleiLiXian.addTask(url);
});

