// Copyright 2012- Soichiro Yoshimura All Rights Reserved.
/**
 * Content script for niconico live continuous watching.
 * @fileoverview contents script of chrome extentison.
 * @author yoshimura@soichiro.org (Soichiro Yoshimura)
 */
(function()
 {
   /**
    * get niconico live id 
    * @param {string} URL of niconico live
    * @return {string} ID of niconico live
    */
   var getId = function(url){
     url.match(/^http:\/\/live\.nicovideo\.jp\/watch\/([a-z]+[0-9]+)($|\?.*$)/);
     var id = RegExp.$1;
     return id;
   };

   /**
    * get abeilability of live watchning of this video.
    * @param {Document} xml of http://live.nicovideo.jp/api/getplayerstatus 
    * @return {boolean} aveilabilty of live watching.
    **/
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

   /**
    * show next live video.
    */
   var showNextVideo = function(){
     var rssURL = 'http://live.nicovideo.jp/rss';
     $.get(rssURL, function(rss){

       var items = $(rss).find("item").filter(function(index){
         var text =  $(this).text();
         // filter by NG words
         if(text.indexOf('ネットチケットが必要') > 0) return false;
         if(text.indexOf('この番組は有料') > 0) return false;
         return true;
       });

       var liveItems = items.filter(function(index){
         var startTimeStr = $(this).find('start_time').text();
         var startTime = new Date(startTimeStr);
         var diffMsecFromNow =  new Date().getTime() - startTime.getTime();
         // filter by start time.
         return 0 < diffMsecFromNow && diffMsecFromNow < (60 * 60 * 1000);
       });

       // console.log('liveItems.length:'+liveItems.length);
       var nextURL = null;
       if(liveItems.length != 0){ 
         nextURL = liveItems.find('link').first().text();
       }else{
         nextURL = items.find('link').first().text();
       }
       // console.log('nextURL:'+ nextURL);
       if(nextURL == null || nextURL == document.URL) return;

       $('body').animate({"opacity":0}, 1000, function(){
         location.href = nextURL;
       });

     });
   };

   /**
    * Show flash player of niconico live by scroll.
    */
   var showFlashPlayer = function(){
     var fc = $('#flvplayer_container');
     if(fc.length == 0) return;
     var targetOffset = fc.offset().top;
     targetOffset = targetOffset - 30; // height of menu bar
     $('html,body').animate({scrollTop: targetOffset}, 1000);
   }; 

   var isFirstObserve = true;

   /**
    * observe live video status.
    */
   var observe = function(){
     // get status of activation from background.html
     chrome.extension.sendRequest({field: 'isActive'}, function(response) {
       var isActive =  response.isActive;
       // console.log('isActive:' + isActive); 
       var id = getId(document.URL);
       if(id == null) return;

       var statusURL = 'http://live.nicovideo.jp/api/getplayerstatus';
       $.get(statusURL, {v:id}, function(data){
         var isLiveWatch = canLiveWatch(data);
         // console.log('isLiveWatch:' + isLiveWatch);
         if(!isLiveWatch && isActive) {  
           showNextVideo();
         }
         // first observe
         if(isFirstObserve && isActive){
           showFlashPlayer();
           isFirstObserve = false;
         }
         setTimeout(observe,5000); // wait and retry
       });
     });
   }

   /////// start main
   observe();
 })();
