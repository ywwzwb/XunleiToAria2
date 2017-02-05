function functionCallToJSONArr(functionCall){
    return _functionCallToJSONArr(functionCall).result;
}
function _functionCallToJSONArr(functionCall){
    // 去掉函数名和首括号
    var params = functionCall.replace(/(^\w*\()|(\)$)/g,"").trim().unescape();
    // split
    var result = [];
    var otherParams = undefined;
    while(true){
        if (params == undefined || params.length == 0) {
            break;
        }
        if (params.startsWith(")")) {
            otherParams = params.substring(1);
            break;
        }
        var param = undefined;
        var quote = params.match(/^'|"/);
        if(quote){
            var splits = params.split(quote, 2);
            if(splits && splits.length == 2) {
                param = splits[1];
                params = params.substring(param.length + 2).replace(",", "").trim(); //substring两个引号
                result.push(param.trim());
            } else {
                break;
            }
        } else if (params.startsWith("new")){
            params = params.substring(3).trim();
            var resultSub = _functionCallToJSONArr(params);
            result.push(resultSub.result);
            params = resultSub.otherParams;
        } else {
            var splits = params.split(",", 1);
            if(splits && splits.length == 1) {
                param = splits[0];
                params = params.substring(param.length).replace(",", "").trim();
                result.push(param.trim());
            } else {
                break;
            }
        }
    }
    return {"result": result,
        "otherParams" : otherParams
        };
}
String.prototype.unescape = function(){
  return this.replace(/\\'/g, "\'")
      .replace(/\\"/g, "\'")
      .replace(/\\\&/g, "\&")
      .replace(/\\\\/g, "\\")
      .replace(/\[nrtbf]/g, " ");
};
// functionCallToJSONArr("1,'1A00FB0F9BC6320FFDD7A1704E7F76606C2872D3','8559246072','Billy.Lynns.Long.Halftime.Walk.2016.1080p.BluRay.x264-GECKOS[rarbg]','0',new Array('Billy.Lynns.Long.Halftime.Walk.2016.1080p.BluRay.x264-GECKOS.mkv','RARBG.txt','Subs\\/Billy.Lynns.Long.Halftime.Walk.2016.1080p.BluRay.x264-GECKOS.idx','Subs\\/Billy.Lynns.Long.Halftime.Walk.2016.1080p.BluRay.x264-GECKOS.sub','billy.lynns.long.halftime.walk.2016.1080p.bluray.x264-geckos.jpg','billy.lynns.long.halftime.walk.2016.1080p.bluray.x264-geckos.nfo'),new Array('7.94G','30.0B','179K','29.0M','5.14K','3.26K'),new Array('8528581749','30','183939','30480384','5271','3342'),new Array('1','0','1','1','0','0'),new Array('RMVB','PHP','RAR','RAR','RAR','RAR'),new Array('0','1','2','3','4','5'),new Array('0','0','0','0','0','0'),'1486275348','0'")