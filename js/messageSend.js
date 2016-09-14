/**
 * Created by zengwenbin on 16/9/13.
 */
var MessageSendToContentScript = function (code, message, response) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            code: code,
            message: message
        }, response);
    });
};
var MessageSendToBackground = function (code, message, response) {
    chrome.runtime.sendMessage({
        code: code,
        message: message
    }, response);
};