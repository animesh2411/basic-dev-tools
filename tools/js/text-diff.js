document.getElementById("compareBtn").addEventListener("click", () => {
  const original = document.getElementById("originalText").value.split("\n");
  const modified = document.getElementById("modifiedText").value.split("\n");

  const leftBox = document.getElementById("diffLeft");
  const rightBox = document.getElementById("diffRight");

  // Clear previous diff
  leftBox.innerHTML = "";
  rightBox.innerHTML = "";

  if (!original.join("").trim() && !modified.join("").trim()) {
    leftBox.innerHTML = "<em>Please enter text to compare.</em>";
    rightBox.innerHTML = "";
    return;
  }

  const diff = generateFullDiff(original, modified);
  leftBox.innerHTML = diff.left;
  rightBox.innerHTML = diff.right;
});

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("originalText").value = "";
  document.getElementById("modifiedText").value = "";
  document.getElementById("diffLeft").innerHTML = "";
  document.getElementById("diffRight").innerHTML = "";
});

// Full side-by-side diff with inline char-level highlighting
function generateFullDiff(aLines, bLines) {
  const leftHTML = [];
  const rightHTML = [];

  const maxLen = Math.max(aLines.length, bLines.length);

  for (let i = 0; i < maxLen; i++) {
    const aLine = aLines[i] || "";
    const bLine = bLines[i] || "";

    if (aLine === bLine) {
      leftHTML.push(`<div class="diff-line">${aLine}</div>`);
      rightHTML.push(`<div class="diff-line">${bLine}</div>`);
    } else {
      const { left: leftChars, right: rightChars } = inlineCharDiff(aLine, bLine);

      leftHTML.push(`<div class="diff-line">${leftChars}</div>`);
      rightHTML.push(`<div class="diff-line">${rightChars}</div>`);
    }
  }

  return { left: leftHTML.join(""), right: rightHTML.join("") };
}

function inlineCharDiff(a, b) {
  const leftChars = [];
  const rightChars = [];
  const maxLen = Math.max(a.length, b.length);

  for (let i = 0; i < maxLen; i++) {
    const aChar = a[i] || "";
    const bChar = b[i] || "";

    if (aChar === bChar) {
      leftChars.push(aChar);
      rightChars.push(bChar);
    } else {
      if (aChar) leftChars.push(`<span class="char-removed">${aChar}</span>`);
      if (bChar) rightChars.push(`<span class="char-added">${bChar}</span>`);
    }
  }

  return { left: leftChars.join(""), right: rightChars.join("") };
}
