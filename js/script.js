var settingToggle = false;
let socket = null;
let recentValue = null;
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

function settingToggleFunc() {
  if (settingToggle) {
    document.getElementById("main-div").style.display = "flex";
    document.getElementById("setting-div").style.display = "none";
  } else {
    document.getElementById("main-div").style.display = "none";
    document.getElementById("setting-div").style.display = "flex";
  }
  settingToggle = !settingToggle;
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
  const textContent = event.target.textContent;

  console.log("Clicked item text:", textContent);
  console.log(event.target.parentNode.id);
  recentKey = textContent;
  recentParent = event.target.parentNode.id;
  socket.send(
    JSON.stringify({
      m: "get-value",
      parent: event.target.parentNode.id,
      key: textContent,
    })
  );
}

function resetList(data) {
  const hasDuplicate = hasDuplicateNames(data);
  if (hasDuplicate) {
    alert("Node-Cache instance have duplicate name, please rename them");
    throw "Duplicate";
  }
  for (const d of data) {
    const ul = document.createElement("ul");
    ul.id = "UL-" + d.name;
    const li = document.createElement("li");

    const span = document.createElement("span");
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
    li.appendChild(nestedUl);

    // Append the first <li> to the main <ul>
    ul.appendChild(li);
    // Find the <div> with id "main"
    const mainDiv = document.getElementById("div-list");

    // Append the <ul> to the <div>
    mainDiv.appendChild(ul);
  }
  initToggler();
}
function isNumeric(str) {
  if (typeof str != "string") return false // we only process strings!  
  return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
         !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function saveData()
{
  const v = document.getElementById("input-value-textarea").value;
  const type = typeof(recentValue);
  const err = onValueChange();

  let data = v;
  if (type == 'object' && !err)
  {
    data = JSON.parse(v);
  }
  else if (type == 'number' && !err)
  {
    data = parseFloat(v);
  }

  socket.send(
    JSON.stringify({
      m: "update-value",
      parent: recentParent,
      key: recentKey,
      v: data,
      ttl: recentTTL
    })
  );





}

function onValueChange()
{
  const v = document.getElementById("input-value-textarea").value;

  try
  {
    let err = false;
    const type = typeof(recentValue)
    if (type === 'object')
    {
      try
      {
        JSON.parse(v);
      }
      catch(e){
        err = true;
        document.getElementById('error-p').innerHTML = 'Value is not a valid JSON. It will be saved as string and may corrupt your data';
      }
      
    }
    if (type === 'number')
    {
      const isN = isNumeric(v);
      if (!isN) {err = true; document.getElementById('error-p').innerHTML = 'Value is not a valid Number. It will be saved as string and may corrupt your data';}
    }
    if (type === 'string')
    {

    }
    if (!err) document.getElementById('error-p').innerHTML = '';
    return err;
    
  }
  catch(e)
  {
    console.log(e)
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
      resetList(data.data);
      console.log(data.data);
    }
    if (data.m == "get-value") {
      console.log(data);
      console.log(typeof data.v);
      document.getElementById("value-div").innerHTML =
        typeof data.v == "object" ? JSON.stringify(data.v) : data.v;
      document.getElementById(
        "key-name"
      ).innerHTML = `${data.key}`;
      document.getElementById(
        "key-ttl"
      ).innerHTML = data.ttl;
      document.getElementById(
        "key-type"
      ).innerHTML = typeof(data.v);
      recentValue = data.v;
      recentTTL = data.ttl;
      updatedValue = data.v;
      document.getElementById("input-value-textarea").value = typeof data.v == "object" ? JSON.stringify(data.v) : data.v;
    }
    //document.getElementById("data").innerText = data.message;
  };

  socket.onerror = (error) => {
    console.error("WebSocket Error:", error);
  };
}
