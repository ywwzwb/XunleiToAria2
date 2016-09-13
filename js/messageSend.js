/**
 * Created by zengwenbin on 16/9/13.
 */
var MessageSend = function (code, message) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        console.log(tabs);
        chrome.tabs.sendMessage(tabs[0].id, {
            code: code,
            message: message
        });
    });
};