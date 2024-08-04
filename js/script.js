
// Connect to the WebSocket server
const socket = new WebSocket("ws://localhost:3000");
var settingToggle = false;
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
  socket.send({
    m: 'getValue',
    key: textContent
  });
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



socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.m == "init-tree") {
    resetList(data.data);
    console.log(data.data);
  }
  //document.getElementById("data").innerText = data.message;
};

socket.onerror = (error) => {
  console.error("WebSocket Error:", error);
};
