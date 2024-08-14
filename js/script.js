let socket = null;
let recentValue = null;
let recentCacheInstance = null;
let updatedValue = null;
let recentParent = null;
let recentKey = null;
let recentTTL = null;
function initToggler() {
  var toggler = document.getElementsByClassName("caret");
  var i;

  for (i = 0; i < toggler.length; i++) {
    toggler[i].addEventListener("click", function () {
      this.parentElement.querySelector(".nested").classList.toggle("active");
      this.classList.toggle("caret-down");
    });
  }
}

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
  console.log(recentCacheInstance);
  settingToggleFunc(true)
  socket.send(
    JSON.stringify({
      m: "flush-instance",
      name: recentCacheInstance,
    })
  );
}

function resetList(data) {
  const mainDiv = document.getElementById("div-list");
  mainDiv.innerHTML = null;
  const hasDuplicate = hasDuplicateNames(data);
  if (hasDuplicate) {
    alert("Node-Cache instance have duplicate name, please rename them");
    throw "Duplicate";
  }
  for (const d of data) {
    const ul = document.createElement("ul");
    ul.id = "UL-" + d.name;
    const li = document.createElement("li");
    li.className = 'li-1'
    const span = document.createElement("span");
    const button = document.createElement("button");
    const buttonIdPrefix = "button-set-";
    button.id = buttonIdPrefix + d.name;
    button.className = "image-button";
    const buttonImage = document.createElement("Img");
    buttonImage.src = "image/settings.png";
    button.appendChild(buttonImage);
    function onClickShowSetting(e) {
      console.log(e.target.id);
      recentCacheInstance = d.name;
      socket.send(
        JSON.stringify({
          m: "get-node-values",
          name: e.target.id.replace(buttonIdPrefix, ""),
        })
      );
      settingToggleFunc(false);
    }
    button.addEventListener("click", onClickShowSetting, false);
    span.className = "caret";
    span.textContent = d.name;
    // Create the nested <ul> element
    const nestedUl = document.createElement("ul");
    nestedUl.className = "nested";
    nestedUl.id = d.name;
    for (const k of d.keys) {
      const liW = document.createElement("li");
      liW.textContent = k;
      liW.className = "sub-list";
      liW.onclick = onClickCache;
      nestedUl.appendChild(liW);
    }
    li.appendChild(span);
    li.appendChild(button);
    li.appendChild(nestedUl);

    // Append the first <li> to the main <ul>
    ul.appendChild(li);
    // Find the <div> with id "main"

    // Append the <ul> to the <div>
    mainDiv.appendChild(ul);
  }
  initToggler();
}

function resetList2(data) {
  const mainDiv = document.getElementById("div-list");
  mainDiv.innerHTML = null;
  const hasDuplicate = hasDuplicateNames(data);
  if (hasDuplicate) {
    alert("Node-Cache instance have duplicate name, please rename them");
    throw "Duplicate";
  }
  for (const d of data) {

    mainDiv.innerHTML += `<div class="instance-div" ><div data-parent-key="${d.name}" data-hide-child="0" onclick="hideUnhideChild(this)" style="display: flex;"><img src="image/folder.png" class="instance-div-image-left" /><p class="instance-div-text">${d.name}</p></div><button class="instance-div-setting-button" onclick="sett(this)"><img src="image/settings.png" class="instance-div-image-right" /></button></div>`
    

    for (const k of d.keys) {
      mainDiv.innerHTML += `<div  data-key-name="${k}" onclick="onClickCache(this)" class="instance-div-child" data-child-key="${d.name}"><img src="image/arrow-right.png" class="instance-div-child-image" /><p class="instance-div-child-text">${k}</p></div>`
    }
    
  }
  initToggler();
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
    console.log(e);
  }
}

function initSocket() {
  const token = document.getElementById("jwt-id-p").innerHTML;
  console.log(token);
  const socketUrl = `ws://localhost:3000?t=${token}`;
  socket = new WebSocket(socketUrl);
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.m == "init-tree") {
      resetList2(data.data);
      hideMainDiv(true)
      console.log(data.data);
    }
    if (data.m == "get-value") {
      console.log(data);
      hideMainDiv(false)
      console.log(typeof data.v);
      document.getElementById("value-div").innerHTML =
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
      console.log(data);
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
