document.getElementById("compareBtn").addEventListener("click", () => {
  const original = document.getElementById("originalText").value.split("\n");
  const modified = document.getElementById("modifiedText").value.split("\n");

  const leftBox = document.getElementById("diffLeft");
  const rightBox = document.getElementById("diffRight");

  // Clear previous diff first
  leftBox.innerHTML = "";
  rightBox.innerHTML = "";

  if (!original.join("").trim() && !modified.join("").trim()) {
    leftBox.innerHTML = "<em>Please enter text to compare.</em>";
    rightBox.innerHTML = "";
    return;
  }

  const diff = generateSideDiff(original, modified);
  leftBox.innerHTML = diff.left;
  rightBox.innerHTML = diff.right;
});

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("originalText").value = "";
  document.getElementById("modifiedText").value = "";
  document.getElementById("diffLeft").innerHTML = "";
  document.getElementById("diffRight").innerHTML = "";
});


function generateSideDiff(a, b) {
  let i = 0, j = 0;
  let leftHTML = "", rightHTML = "";

  while (i < a.length || j < b.length) {
    if (a[i] === b[j]) {
      leftHTML += `<div class="diff-line">${a[i] || ""}</div>`;
      rightHTML += `<div class="diff-line">${b[j] || ""}</div>`;
      i++; j++;
    } else {
      if (a[i] && !b.includes(a[i])) {
        leftHTML += `<div class="diff-line diff-removed">- ${a[i]}</div>`;
        rightHTML += `<div class="diff-line"></div>`;
        i++;
      } else if (b[j] && !a.includes(b[j])) {
        leftHTML += `<div class="diff-line"></div>`;
        rightHTML += `<div class="diff-line diff-added">+ ${b[j]}</div>`;
        j++;
      } else {
        if (a[i]) {
          leftHTML += `<div class="diff-line diff-removed">- ${a[i]}</div>`;
          i++;
        }
        if (b[j]) {
          rightHTML += `<div class="diff-line diff-added">+ ${b[j]}</div>`;
          j++;
        }
      }
    }
  }

  return { left: leftHTML.trim(), right: rightHTML.trim() };
}
