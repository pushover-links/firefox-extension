let APP_TOKEN;
let USER_KEY;
let DEVICES;
let URL;
let URL_FULL;
let FAVICON;
let TITLE;
/**
 * Accepts a URL and changes the URL line in the popup to
 * display the URL that is about to be sent
 */
function updateUrlInPopup(url) {
  let divCurrentUrl = document.querySelector('#current-url')
  divCurrentUrl.innerHTML = URL
  console.log(`Token: ${APP_TOKEN}`)
  console.log(`User: ${USER_KEY}`)
  console.log(url)
}

/**
 * Takes all the devices collected during the verification
 * process and adds them to the select field
 */
function updateDeviceSelect() {
  let select = document.querySelector('#device-selection')
  let options = `<option value="">All Devices</option>`
  DEVICES.forEach(device => {
    options += `<option value="${device}">${device}</option>`
  })
  select.innerHTML = options
}

/**
 * Successuflly sent the message. Display message to user.
 * Then close the window.
 */
function successfulSend() {
  document.querySelector("#main-content").classList.add("hidden");
  disableButtons();
  document.querySelector('#message-success').classList.remove('hidden');
  setTimeout(function() {
    window.close()
  }, 3000)
}

/**
 * Sends the link via Pushover
 */
async function sendLink(event) {
  let body = {
    token: APP_TOKEN,
    user: USER_KEY,
    title: "Link Shared via Firefox",
    message: TITLE,
    html: 1,
    url: URL_FULL,
    url_title: URL
  }
  let selectedDevices = document.querySelector('#device-selection').value
  if (selectedDevices !== "") {
    body.device = selectedDevices
  }
  let req = new Request('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    referrer: 'client',
    body: JSON.stringify(body)
  });
  let res = await fetch(req).then(response => response.json())
  if (res.status === 1) {
    // Success
    successfulSend();
  } else {
    // Failure
    if (res.errors[0]) {
      res.message = res.errors[0]
    } else {
      res.message = "an unknown error occurred"
    }
    reportExecuteScriptError(res);
  }
  console.log(res);

}

/**
 * Cancels the popup which closes it and returns the user to their
 * current tab
 */
function cancelPopup() {
  window.close()
}

/**
 * Truncates url to under 100 characters with an ellipsis at end
 */
function truncateUrl(url) {
  if (url.length > 80) {
    return url.substring(0, 80) + "..."
  }
  return url;
}

/**
 * Buttons are disabled (hidden) by default. This function will enable
 * the buttons.
 */
function enableButtons() {
  let buttonsFooter = document.querySelector('#button-footer')
  buttonsFooter.classList.remove('hidden')
  document.querySelector('#submit-button').addEventListener('click', sendLink)
  document.querySelector('#cancel-button').addEventListener('click', cancelPopup)
}

/**
 * Buttons are disabled (hidden) by default. This function will enable
 * the buttons.
 */
function disableButtons() {
  let buttonsFooter = document.querySelector('#button-footer')
  buttonsFooter.classList.add('hidden')
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#main-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  disableButtons();
  document.querySelector("#error-content .my-notify-error").textContent = "Error: "+error.message;

  console.error(`Failed to execute Pushover Links script: ${error.message}`);
}

function saveAppToken(result) {
  return result.app_token
}
function saveUserKey(result) {
  return result.user_key
}

/**
 * When Pushover validation fails, displays a message to the user
 */
function validationFailed() {
  document.querySelector("#main-content").classList.add("hidden");
  document.querySelector("#validation-failed").classList.remove("hidden");
}

/**
 * Sends a request to Pushover servers to validate the user
 * and app tokens and get the devices available for the account.
 */
async function validatePushoverSettings() {
  let settings = {
    token: APP_TOKEN,
    user: USER_KEY
  }
  let req = new Request('https://api.pushover.net/1/users/validate.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    referrer: 'client',
    body: JSON.stringify(settings)
  });
  return await fetch(req).then(response => response.json())
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
async function gotCurrentTab(tabs) {
  let tab = tabs[0];
  let tabLoadSuccess = new CustomEvent("tabLoadSuccess", {
    detail: {
      url: tab.url,
      title: tab.title,
      favicon: tab.favIconUrl
    }
  })
  APP_TOKEN = await browser.storage.sync.get("app_token").then(saveAppToken)
  USER_KEY = await browser.storage.sync.get("user_key").then(saveUserKey)
  URL = truncateUrl(tab.url),
  URL_FULL = tab.url,
  TITLE = tab.title,
  FAVICON = tab.favIconUrl

  let validation = await validatePushoverSettings().then()
  if (validation.status === 1) {
    console.log(validation)
    DEVICES = validation.devices
    document.dispatchEvent(tabLoadSuccess)
  } else {
    validationFailed();
    console.log('Validation Failed: '+validation.errors[0])
  }
  
}

/**
 * 
 */
function reportError(error) {
  console.log(`Error: ${error}`);
}

/**
 * ! RUNS ON LOAD
 * Gets current tab, and then processes the details of the tab.
 * Gives us the title, favicon and more for a current tab.
 */
var currentTab = browser.tabs.query({active: true, currentWindow: true})
  .then(gotCurrentTab)
  .catch(reportExecuteScriptError);

document.querySelector('#validation-failed-preferences-page').addEventListener('click', function () {
  browser.runtime.openOptionsPage()
  window.close();
})
document.querySelector('#options-page').addEventListener('click', function () {
  browser.runtime.openOptionsPage()
  window.close();
})
document.querySelector('#error-close').addEventListener('click', function() {
  window.close();
});
document.addEventListener('tabLoadSuccess', function (event) {
  updateUrlInPopup(event.detail.url)
  updateDeviceSelect()
  enableButtons()
})