let socket = null;
let recentValue = null;
let recentCacheInstance = null;
let updatedValue = null;
let recentParent = null;
let recentKey = null;
let recentTTL = null;


function hideMainDiv(hide)
{
  if (hide)
  document.getElementById("main-div").style.display = "none";
else document.getElementById("main-div").style.display = "flex";
}

function settingToggleFunc(settingToggle) {
  if (settingToggle) {
    document.getElementById("main-div").style.display = "flex";
    document.getElementById("setting-div").style.display = "none";
  } else {
    document.getElementById("main-div").style.display = "none";
    document.getElementById("setting-div").style.display = "flex";
  }
  //settingToggle = !settingToggle;
}

function editValue() {
  document.getElementById("edit-value-div").style.display = "flex";
  document.getElementById("value-div").style.display = "none";
  document.getElementById("button-edit").style.display = "none";
  document.getElementById("button-save").style.display = "";
  document.getElementById("button-show-value").style.display = "";
}
function showValue() {
  document.getElementById("edit-value-div").style.display = "none";
  document.getElementById("value-div").style.display = "";
  document.getElementById("button-edit").style.display = "";
  document.getElementById("button-save").style.display = "none";
  document.getElementById("button-show-value").style.display = "none";
}

function hasDuplicateNames(arr) {
  const seen = new Set();

  for (const item of arr) {
    if (seen.has(item.name)) {
      return true; // Duplicate found
    }
    seen.add(item.name);
  }

  return false; // No duplicates
}

function onClickCache(event) {
  settingToggleFunc(true);
  const textContent = event.getAttribute('data-key-name');
  const parent = event.getAttribute('data-child-key');
  recentKey = textContent;
  recentParent = parent;
  socket.send(
    JSON.stringify({
      m: "get-value",
      parent: parent,
      key: textContent,
    })
  );
}

function deleteValue(){
  socket.send(
    JSON.stringify({
      m: "delete-value",
      key: recentKey,
      parent: recentParent
    })
  );
}

function flushAll() {
  settingToggleFunc(true)
  socket.send(
    JSON.stringify({
      m: "flush-instance",
      name: recentCacheInstance,
    })
  );
}



function onClickShowSetting(event) {
  hideMainDiv(true)
  recentCacheInstance = event.getAttribute('data-instance');
  socket.send(
    JSON.stringify({
      m: "get-node-values",
      name: recentCacheInstance,
    })
  );
  settingToggleFunc(false);
}
function resetList2(data) {
  const mainDiv = document.getElementById("div-list");
  
  mainDiv.innerHTML = null;
  mainDiv.innerHTML += `<div style="padding: 10px;width: cover;border-radius: 5px;background-color:black;color:white;font-weight: bold;font-size: 20px;">Instances</div>`
  const hasDuplicate = hasDuplicateNames(data);
  if (hasDuplicate) {
    alert("Node-Cache instance have duplicate name, please rename them");
    throw "Duplicate";
  }

  for (const d of data) {

    
    mainDiv.innerHTML += `<div class="instance-div" ><div data-parent-key="${d.name}" data-hide-child="0" onclick="hideUnhideChild(this)" style="display: flex;"><img src="image/folder.png" class="instance-div-image-left" /><p class="instance-div-text">${d.name}</p></div><button class="instance-div-setting-button" data-instance="${d.name}" onclick="onClickShowSetting(this)"><img src="image/settings.png" class="instance-div-image-right" /></button></div>`
 


    for (const k of d.keys) {
      mainDiv.innerHTML += `<div  data-key-name="${k}" onclick="onClickCache(this)" class="instance-div-child" data-child-key="${d.name}"><img src="image/arrow-right.png" class="instance-div-child-image" /><p class="instance-div-child-text">${k}</p></div>`
    }
    
  }

}
function isNumeric(str) {
  if (typeof str != "string") return false; // we only process strings!
  return (
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}

function saveData() {
  const v = document.getElementById("input-value-textarea").value;
  const type = typeof recentValue;
  const err = onValueChange();

  let data = v;
  if (type == "object" && !err) {
    data = JSON.parse(v);
  } else if (type == "number" && !err) {
    data = parseFloat(v);
  }

  socket.send(
    JSON.stringify({
      m: "update-value",
      parent: recentParent,
      key: recentKey,
      v: data,
      ttl: recentTTL,
    })
  );
}

function onValueChange() {
  const v = document.getElementById("input-value-textarea").value;

  try {
    let err = false;
    const type = typeof recentValue;
    if (type === "object") {
      try {
        JSON.parse(v);
      } catch (e) {
        err = true;
        document.getElementById("error-p").innerHTML =
          "Value is not a valid JSON. It will be saved as string and may corrupt your data";
      }
    }
    if (type === "number") {
      const isN = isNumeric(v);
      if (!isN) {
        err = true;
        document.getElementById("error-p").innerHTML =
          "Value is not a valid Number. It will be saved as string and may corrupt your data";
      }
    }
    if (type === "string") {
    }
    if (!err) document.getElementById("error-p").innerHTML = "";
    return err;
  } catch (e) {
    
  }
}

function initSocket() {
  const token = document.getElementById("jwt-id-p").innerHTML;
  
  const socketUrl = `ws://localhost:3000?t=${token}`;
  socket = new WebSocket(socketUrl);
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.m == "init-tree") {
      resetList2(data.data);
      hideMainDiv(true)
     
    }
    if (data.m == "get-value") {
      
      hideMainDiv(false)
      
      document.getElementById("value-div-p").innerHTML =
        typeof data.v == "object" ? JSON.stringify(data.v) : data.v;
      document.getElementById("key-name").innerHTML = `${data.key}`;
      document.getElementById("key-ttl").innerHTML = data.ttl;
      document.getElementById("key-type").innerHTML = typeof data.v;
      recentValue = data.v;
      recentTTL = data.ttl;
      updatedValue = data.v;
      document.getElementById("input-value-textarea").value =
        typeof data.v == "object" ? JSON.stringify(data.v) : data.v;
    }

    if (data.m == "get-node-values") {
      
      const hits = data.v.hits;
      const keys = data.v.keys;
      const ksize = data.v.ksize;
      const misses = data.v.misses;
      const vsize = data.v.vsize;
      document.getElementById("p-hits").innerHTML = hits;
      document.getElementById("p-keys").innerHTML = keys;
      document.getElementById("p-ksize").innerHTML = ksize;
      document.getElementById("p-misses").innerHTML = misses;
      document.getElementById("p-vsize").innerHTML = vsize;
    }
    //document.getElementById("data").innerText = data.message;
  };

  socket.onerror = (error) => {
    console.error("WebSocket Error:", error);
  };
}
function hideUnhideChild(item) {
  const s = item.getAttribute("data-parent-key");
  const h = item.getAttribute("data-hide-child");
  const elements = document.querySelectorAll(`[data-child-key="${s}"]`);
  for (const e of elements) {
    if (h == "0") {
      e.style.display = "none";
      item.setAttribute("data-hide-child", "1");
    } else {
      e.style.display = "flex";
      item.setAttribute("data-hide-child", "0");
    }
  }
}
function sett() {
  
}
