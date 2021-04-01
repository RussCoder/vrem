'use strict';

let currentUrl = null;
//let currentTitle = null;

async function sendData() {
    try {
        await fetch('http://localhost:3211', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: currentUrl,
                //description: currentTitle,
                timestamp: Date.now(),
            }),
        });
    } catch (e) {
        console.error(e);
    }
}

function updateCurrentUrl(tab) {
    const previousUrl = currentUrl;

    currentUrl = null;
    //currentTitle = null;

    if (tab && tab.url) {
        const url = new URL(tab.url);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
            currentUrl = url.origin;
            //currentTitle = tab.title;
        }
    }

    //console.log(currentUrl);

    if (currentUrl || previousUrl) {
        void sendData();
    }
}

function checkTabInTheFocusedWindow(focusedWindowId) {
    focusedWindowId && chrome.tabs.query({ active: true, windowId: focusedWindowId }, ([tab]) => {
        void updateCurrentUrl(tab);
    });
}

setInterval(() => {
    chrome.windows.getLastFocused(win => {
        if (win.focused) {
            //console.log('%cFocus window in interval ' + focusedWindowId, 'color: green;');
            checkTabInTheFocusedWindow(win.id);
        } else {
            updateCurrentUrl(null);
            //console.log('%cNo focused window', 'color: green;');
        }
    });
}, 1000);

// isn't triggered when all windows lose focus
/*
chrome.windows.onFocusChanged.addListener(windowId => {
    focusedWindowId = windowId;
    console.log('Focus changed ', windowId);
    checkTabInTheFocusedWindow();
});

chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
    if (windowId === focusedWindowId) {
        chrome.tabs.get(tabId, tab => {
            console.log('Activated');
            updateCurrentUrl(tab);
        })
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.windowId === focusedWindowId && tab.active) {
        console.log("Updated ", currentUrl);
        updateCurrentUrl(tab);
    }
});
*/

