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
   /**
    * ニコニコ生放送のURLからIDを取得する
    * * @param {string} ニコニコ生放送のURL
    * * @return {string} ニコニコ生放送のID
    */
   var getId = function(url){
     url.match(/^http:\/\/live\.nicovideo\.jp\/watch\/([a-z]+[0-9]+)($|\?.*$)/);
     var id = RegExp.$1;
     return id;
   };

   /**
    * APIの戻り値のxmlを元に、生放送で現在見られるかを返す
    * @param {Document} http://live.nicovideo.jp/api/getplayerstatus 
    *                   の結果のXML
    * @return {boolean} 生放送で見られるかどうかを返す
    */
   var canLiveWatch = function(data){
     //console.dir(data);
     var endTimeElem = $(data).find('end_time');
     //console.dir(endTimeElem);
     var endTime = endTimeElem.length === 0 
       ? null 
       : new Date(parseInt(endTimeElem.text(), 10) * 1000);
     var nowTime = new Date();
     if(endTime === null 
         || endTime.getTime() < nowTime.getTime()){
           return false;
         }else{
           return true;
         }
   };

   /////// start main

   var url = document.URL;
   var id = getId(url);

   var statusURL = 'http://live.nicovideo.jp/api/getplayerstatus';
   $.get(statusURL, {v:id}, function(data){
     var isLiveWatch = canLiveWatch(data);
     console.log('isLiveWatch:' + isLiveWatch);
     if(!isLiveWatch) showNextVideo();
   });

   /**
    * 次のビデオを表示する
    */
   var showNextVideo = function(){
     var rssURL = 'http://live.nicovideo.jp/rss';
     $.get(rssURL, function(rss){

       var items = $(rss).find("item");
       var liveItems = items.filter(function(index){
         var startTimeStr = $(this).find('start_time').text();
         var startTime = new Date(startTimeStr);
         var diffMsecFromNow =  new Date().getTime() - startTime.getTime();
         // console.log('diffMsecFromNow:' + diffMsecFromNow);
         // 始まって60分以内のものだけ抽出
         return 0 < diffMsecFromNow && diffMsecFromNow < (60 * 60 * 1000);
       });

       console.log('liveItems.length:'+liveItems.length);
       if(liveItems.length != 0){
         var nextURL = liveItems.find('link').first().text();
         console.log(nextURL);
       }
     });
   };

 })();
