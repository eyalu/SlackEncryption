// background.js

// Show page action icon in omnibar.
function showPageAction( tabId, changeInfo, tab ) {
	// only show the page action on slack.com
	if (tab.url.indexOf("slack.com") > -1){
		chrome.pageAction.show(tabId);
	}
};
// Call the above function when the url of a tab changes.
chrome.tabs.onUpdated.addListener(showPageAction);