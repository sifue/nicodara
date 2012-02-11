// Background page
function checkForValidUrl(tabId, changeInfo, tab) {
  if (tab.url.indexOf('http://live.nicovideo.jp') == 0) {
    chrome.pageAction.show(tabId);
  }
};

// Listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(checkForValidUrl);
