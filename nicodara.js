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
    * get community id
    * @param {string} ID of video or community
    * @return {string} ID of community
    */
   var getComunityId = function(id){
     if(id.indexOf('co') > -1){ // if community id
       community_id = id;
     } else {
       var channel_url =  $('.commu_name:first').attr("href"); // ZERO

       if(!channel_url){
         channel_url =  $('#title a:first').attr('href'); // Harajyuku
       }

       if(!channel_url){
         channel_url =  $('.smn a:first').attr('href'); // not live
       }

       if(!channel_url){
         return null; // not found
       }

       channel_url.match(/^http:\/\/com\.nicovideo\.jp\/community\/([a-z]+[0-9]+)($|\?.*$)/);
       community_id = RegExp.$1;
     }
     return community_id;
   };

   /**
    * get niconico live id from search url
    * @param {string} URL of niconico live search result
    * @return {string} ID of niconico live
    */
   var getIdFromSearch = function(url){
     url.match(/^http:\/\/live\.nicovideo\.jp\/searchresult\?v=([a-z]+[0-9]+)(&.*$)/);
     var id = RegExp.$1;
     return id;
   };

   /**
    * get abeilability of live watchning of this video.
    * @param {Document} xml of http://live.nicovideo.jp/api/getplayerstatus
    * @return {boolean} aveilabilty of live watching.
    **/
   var isLiveWatchNow = function(data){
     var endTimeElem = $(data).find('end_time');
     var endTime = (endTimeElem.length === 0) ? null : new Date(parseInt(endTimeElem.text(), 10) * 1000);
     var nowTime = new Date();
     if(endTime === null || endTime.getTime() < nowTime.getTime()){
           return false;
         }else{
           return true;
         }
   };

   /**
    * show next official live video.
    * @param {object} status object of background.html
    */
   var showNextOfficial = function(st){
     var rssURL = 'http://live.nicovideo.jp/rss';
     $.get(rssURL, function(rss){

       var ngWords = st.ngWords.split(' ');
       var items = $(rss).find("item").filter(function(index){
         var text =  $(this).text();
         // filter by NG words
         for(i = 0; i < ngWords.length ; i++){
           if(text.indexOf(ngWords[i]) > 0) return false;
         }
         return true;
       });

       var liveItems = items.filter(function(index){
         var startTimeStr = $(this).find('start_time').text();
         var startTime = new Date(startTimeStr);
         var diffMsecFromNow =  new Date().getTime() - startTime.getTime();
         // filter by start time.
         return 0 < diffMsecFromNow && diffMsecFromNow < (60 * 60 * 1000);
       });

       var nextURL = null;
       if(liveItems.length !== 0){
         nextURL = liveItems.find('link').first().text();
       }else{
         nextURL = items.find('link').first().text();
       }
       showNextURL(nextURL);
     });
   };


   /**
    * show next keyword searchd video.
    * @param {object} status object of background.html
    */
   var showNextKeywordSearched = function(st){
     var encodedKeyword = encodeURI(st.keyword);
     var searchURL = 'http://live.nicovideo.jp/search/?orig_filter=+%3Ahidecomonly%3A&sort=point&date=&keyword=' + encodedKeyword + '&submit.x=0&submit.y=0';

     $.get(searchURL, function(data){
      var firstItem = $(data).find('.search_stream_title a').first();
      if(firstItem.length === 0) return;
      var nextURL = firstItem.attr('href');
      showNextURL(nextURL);
     });
   };

   /**
    * show next channnel id video.
    * @param {object} status object of background.html
    */
   var showNextChannelIdSelected = function(st){
     var ids = st.channelIds.split(' ');
     // if first id is null char or not id string, return
     if(ids[0] === '' || ids[0].match(/[a-z]+[0-9]+/).length === 0) return;

     var jumpToNextURL = function(data){
         var isLiveWatch = isLiveWatchNow(data);
         // If live is able, jump.
         if(isLiveWatch){
           var nextURL = 'http://live.nicovideo.jp/watch/' + id;
           showNextURL(nextURL);
           return;
         }
     };
     for(i = 0; i < ids.length ; i++){
       var id = ids[i];
       var statusURL = 'http://live.nicovideo.jp/api/getplayerstatus';
       $.get(statusURL, {v:id, chrome_ext_name:'nicodara'}, jumpToNextURL);
     }

    // if channel is not live. jump top id of channels with waiting
     var nextURL = 'http://live.nicovideo.jp/watch/' + ids[0];
     setTimeout(function(){showNextURL(nextURL);}, 1000);

   };

   /**
    * show next current community id video .
    * @param {string} ID of community
    */
   var showNextCurrentCommunityId = function(id){
     var statusURL = 'http://live.nicovideo.jp/api/getplayerstatus';
     $.get(statusURL, {v:id, chrome_ext_name:'nicodara'}, function(data){
       var isLiveWatch = isLiveWatchNow(data);

       // If live is able, jump.
       if(isLiveWatch){
         var nextURL = 'http://live.nicovideo.jp/watch/' + id;
         showNextURL(nextURL);
         return;
       }
     });

     // if channel is not live. jump top id of channels with waiting
     var nextURL = 'http://live.nicovideo.jp/watch/' + id;
     setTimeout(function(){showNextURL(nextURL);}, 1000);
   };

   /**
    * show next url with animation.
    * if next url is same or same channel id, don't show.
    * @param {string} next url
    */
   var showNextURL = function(nextURL){
       // console.log('nextURL:'+ nextURL);
       if(nextURL === null || nextURL === document.URL || getIdFromSearch(nextURL) === getId(document.URL)) return;

       $('body').animate({"opacity":0}, 1000, function(){
         location.href = nextURL;
       });
   };

   /**
    * Show flash player of niconico live by scroll.
    * @param {object} status object of this extention.
    */
   var showFlashPlayer = function(st){
     var fc = $('#flvplayer_container');
     if(fc.length === 0) return;
     if(!st.isScroll) return;
     var targetOffset = fc.offset().top;
     targetOffset = targetOffset - 30; // height of menu bar
     $('html,body').animate({scrollTop: targetOffset}, 1000);
   };

   var isFirstObserve = true;
   var isLiveWatchLast = true;

   /**
    * observe live video status.
    */
   var observe = function(){
     // get status of activation from background.html
     chrome.extension.sendRequest({field: 'st'}, function(response) {
       var st = response.st;
       var id = getId(document.URL);
       if(id === null || id === '') return;

       var statusURL = 'http://live.nicovideo.jp/api/getplayerstatus';
       $.get(statusURL, {v:id, chrome_ext_name:'nicodara'}, function(data){
         var isLiveWatch = isLiveWatchNow(data);

         // If change "not live" to "live", execute reload.
         if(!isLiveWatchLast && isLiveWatch) location.reload(true);
         isLiveWatchLast = isLiveWatch;

         // show next channel
         if(!isLiveWatch && st.isActive) {
           if(st.searchType === 'official'){
             showNextOfficial(st);
           }else if (st.searchType === 'keyword'){
             showNextKeywordSearched(st);
           }else if (st.searchType === 'channel_id'){
             showNextChannelIdSelected(st);
           }else if (st.searchType === 'current_community_id'){
             var community_id  = getComunityId(id);
             showNextCurrentCommunityId(community_id);
           }
         }

         // if first observe, show flashplayer
         if(isFirstObserve && st.isActive){
           showFlashPlayer(st);
           isFirstObserve = false;
         }
       });
     });
   };

   /////// start main wait 5000msec
   setInterval(observe, 5000);
 })();
