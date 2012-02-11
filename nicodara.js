// Copyright 2012- Soichiro Yoshimura All Rights Reserved.
/**
 * ニコニコ生放送用のコンテントスクリプト
 *
 * 現在生放送で見られるかどうかを監視し、
 * そうで、ない場合は他の生放送で見られる番組にジャンプさせる
 * @fileoverview contents script of chrome extentison.
 * @author yoshimura@soichiro.org (Soichiro Yoshimura)
 */
(function()
 {
   // parse id
   var url = document.URL;
   url.match(/^http:\/\/live\.nicovideo\.jp\/watch\/([a-z]+[0-9]+)($|\?.*$)/);
   var id = RegExp.$1;
   console.log(id);

   // get video endTime
   var statusUrl = 'http://live.nicovideo.jp/api/getplayerstatus';
   $.get(statusUrl, {v:id}, function(data){
     // console.dir(data);
     var isLiveWatch = canLiveWatch(data);
     
     var rssUrl = 'http://live.nicovideo.jp/rss';
     $.get(rssUrl, function(rss){
       // console.dir(rss);
       var items = rss.firstChild.childNodes[1].childNodes;
       //$.each(items, function(i, item){
         
       //}



     });


   });

   /**
    * APIの戻り値のxmlを元に、生放送で現在見られるかを返す
    * @param {Document} http://live.nicovideo.jp/api/getplayerstatus 
    *                   の結果のXML
    * @return {boolean} 生放送で見られるかどうかを返す
    */
   var canLiveWatch = function(data){
     var endTimeElem = $(data).find('end_time');
     var endTime = endTimeElem === null 
       ? null 
       : new Date(parseInt(endTimeElem.text(), 10) * 1000);
     var nowTime = new Date();
     if(endTime === null 
         || endTime.getTime() < nowTime.getTime()){
           alert("現在生で番組見れないよ");
           return false;
         }else{
           alert("現在生で番組見れるよ");
           return true;
         }
   };

 })();
