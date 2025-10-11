const imageInput = document.getElementById("imageInput");
const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");
const sizeInput = document.getElementById("sizeInput");
const resizeBtn = document.getElementById("resizeBtn");
const clearBtn = document.getElementById("clearBtn");
const statusDiv = document.getElementById("status");
const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");
const downloadBtn = document.getElementById("downloadBtn");

let uploadedImage = null;
let resizedBlob = null;

imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
        uploadedImage = img;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        statusDiv.innerText = `Image loaded: ${file.name} (${(file.size/1024/1024).toFixed(2)} MB)`;
        resizeBtn.disabled = false;
        downloadBtn.disabled = true;
    };
    img.src = URL.createObjectURL(file);
});

resizeBtn.addEventListener("click", async () => {
    if (!uploadedImage) {
        alert("Please upload an image first!");
        return;
    }

    resizeBtn.disabled = true;
    clearBtn.disabled = true;
    statusDiv.innerText = "Processing image... ⏳";

    const widthVal = widthInput.value ? parseInt(widthInput.value) : null;
    const heightVal = heightInput.value ? parseInt(heightInput.value) : null;
    const sizeVal = sizeInput.value ? parseFloat(sizeInput.value) : null;

    if ((widthVal || heightVal) && sizeVal) {
        alert("Please either enter Width/Height OR Target Size (MB), not both.");
        statusDiv.innerText = "";
        resizeBtn.disabled = false;
        clearBtn.disabled = false;
        return;
    }

    try {
        let targetWidth = uploadedImage.width;
        let targetHeight = uploadedImage.height;

        if (widthVal || heightVal) {
            targetWidth = widthVal || Math.round((heightVal / uploadedImage.height) * uploadedImage.width);
            targetHeight = heightVal || Math.round((widthVal / uploadedImage.width) * uploadedImage.height);
        }

        resizedBlob = await compressImage(uploadedImage, targetWidth, targetHeight, sizeVal);

        // Show preview
        const previewURL = URL.createObjectURL(resizedBlob);
        const imgPreview = new Image();
        imgPreview.onload = () => {
            canvas.width = imgPreview.width;
            canvas.height = imgPreview.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(imgPreview, 0, 0);
            URL.revokeObjectURL(previewURL);
        };
        imgPreview.src = previewURL;

        statusDiv.innerText = `✅ Done! Resized image: ${(resizedBlob.size/1024/1024).toFixed(2)} MB`;
        downloadBtn.disabled = false;

    } catch (err) {
        console.error(err);
        statusDiv.innerText = "❌ Error processing image!";
    }

    resizeBtn.disabled = false;
    clearBtn.disabled = false;
});

downloadBtn.addEventListener("click", () => {
    if (!resizedBlob) return;
    const url = URL.createObjectURL(resizedBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resized.jpeg";
    link.click();
    URL.revokeObjectURL(url);
});

clearBtn.addEventListener("click", () => {
    imageInput.value = "";
    widthInput.value = "";
    heightInput.value = "";
    sizeInput.value = "";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    statusDiv.innerText = "";
    resizedBlob = null;
    uploadedImage = null;
    resizeBtn.disabled = true;
    downloadBtn.disabled = true;
});

// Converts canvas to proper JPEG Blob
function compressImage(img, width, height, targetMB = null) {
    return new Promise((resolve, reject) => {
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        tempCanvas.width = width;
        tempCanvas.height = height;
        tempCtx.drawImage(img, 0, 0, width, height);

        let quality = 0.95;

        function attempt() {
            const dataURL = tempCanvas.toDataURL("image/jpeg", quality);
            const blob = dataURLtoBlob(dataURL);
            if (targetMB && blob.size / 1024 / 1024 > targetMB && quality > 0.05) {
                quality -= 0.05;
                attempt();
            } else {
                resolve(blob);
            }
        }

        attempt();
    });
}

// Helper to convert dataURL to Blob
function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type: mime});
}
