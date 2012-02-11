(function(){

  chrome.tabs.getCurrent(function(tab){
    alert(tab.id);
    var iconPath = "icon_on.png";
    chrome.pageAction.setIcon({path: iconPath , tabId: tab.id});
    
    var message = "クリックするとオフになるよ。";
    chrome.pageAction.setTitle({title: message, tabId: tab.id});
  
  });
})()
