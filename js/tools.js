/**
 * Created by zengwenbin on 2017/1/12.
 */

function functionCallToJSONArr(functionCall){
    // remove function name and bracket
    var params = functionCall.replace(/(^\w*\()|(\)$)/g,"");
    // split
    var paramArr = params.split(",");
    var result = [];
    for (var i in paramArr) {
        var param = paramArr[i].trim()
        if(param.match(/^[\'\"].*[\'\"]$/)) {
            result.push(param.replace(/^[\'\"](.*)[\'\"]$/, "$1"))
        } else if (param.startsWith("new")){
            param = param.replace(" ", "_")
            result.push(functionCallToJSONArr(param));
        } else {
            result.push(param)
        }
    }
    return result;
}
// functionCallToJSONArr("queryUrl(1,'OPHBHI4PKPP56NUPNT7ZLJSHGO2AZ3LO','1214296705','[WMSUB][Detective Conan][Episode\'ONE\'][20161209][BIG5][1080P].mp4','0',new Array('[WMSUB][Detective Conan][Episode\'ONE\'][20161209][BIG5][1080P].mp4'),new Array('1.13G'),new Array('1214296705'),new Array('1'),new Array('WMA'),new Array('0'),new Array('0'),'1484198454','0')");