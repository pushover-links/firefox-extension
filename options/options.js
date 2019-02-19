function saveOptions(e) {
  e.preventDefault();
  browser.storage.sync.set({
    app_token: document.querySelector("#app-token").value,
    user_key: document.querySelector('#user-key').value
  });
}

function restoreOptions() {

  function setCurrentChoiceAppToken(result) {
    document.querySelector("#app-token").value = result.app_token || "";
  }

  function setCurrentChoiceUserKey(result) {
    document.querySelector("#user-key").value = result.user_key || "";
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  var currentAppToken = browser.storage.sync.get("app_token");
  currentAppToken.then(setCurrentChoiceAppToken, onError);

  var currentUserKey = browser.storage.sync.get("user_key");
  currentUserKey.then(setCurrentChoiceUserKey, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);