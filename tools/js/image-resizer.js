const imageInput = document.getElementById("imageInput");
const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");
const sizeInput = document.getElementById("sizeInput");
const resizeBtn = document.getElementById("resizeBtn");
const clearBtn = document.getElementById("clearBtn");
const statusDiv = document.getElementById("status");
const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");

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
        ctx.drawImage(img, 0, 0);
        statusDiv.innerText = `Image loaded: ${file.name} (${(file.size/1024/1024).toFixed(2)} MB)`;
        resizeBtn.disabled = false;
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
        alert("Please either enter Width/Height **OR** Target Size (MB), not both.");
        statusDiv.innerText = "";
        resizeBtn.disabled = false;
        clearBtn.disabled = false;
        return;
    }

    try {
        if (sizeVal) {
            // Resize by target MB
            resizedBlob = await compressImage(uploadedImage, uploadedImage.width, uploadedImage.height, sizeVal);
        } else {
            // Resize by dimensions
            let targetWidth = widthVal || uploadedImage.width;
            let targetHeight = heightVal || uploadedImage.height;

            // Maintain aspect ratio if only one dimension provided
            if (widthVal && !heightVal) {
                targetHeight = Math.round((targetWidth / uploadedImage.width) * uploadedImage.height);
            } else if (!widthVal && heightVal) {
                targetWidth = Math.round((targetHeight / uploadedImage.height) * uploadedImage.width);
            }

            resizedBlob = await compressImage(uploadedImage, targetWidth, targetHeight, null);
        }

        const url = URL.createObjectURL(resizedBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "resized.jpg";

        // Show preview on canvas
        const imgPreview = new Image();
        imgPreview.onload = () => {
            canvas.width = imgPreview.width;
            canvas.height = imgPreview.height;
            ctx.clearRect(0,0,canvas.width, canvas.height);
            ctx.drawImage(imgPreview, 0, 0);
        };
        imgPreview.src = url;

        // Activate download
        statusDiv.innerHTML = `✅ Done! Resized image: ${(resizedBlob.size/1024/1024).toFixed(2)} MB
        <button id="downloadBtn">Download</button>`;
        document.getElementById("downloadBtn").onclick = () => link.click();

    } catch (err) {
        console.error(err);
        statusDiv.innerText = "❌ Error processing image!";
    }

    resizeBtn.disabled = false;
    clearBtn.disabled = false;
});

clearBtn.addEventListener("click", () => {
    imageInput.value = "";
    widthInput.value = "";
    heightInput.value = "";
    sizeInput.value = "";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    statusDiv.innerText = "";
    uploadedImage = null;
    resizedBlob = null;
});


function compressImage(img, width, height, targetMB = null) {
    return new Promise((resolve, reject) => {
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        tempCanvas.width = width;
        tempCanvas.height = height;
        tempCtx.drawImage(img, 0, 0, width, height);

        let quality = 0.95;

        function attempt() {
            tempCanvas.toBlob((blob) => {
                if (!blob) return reject("Failed to create image blob");

                if (targetMB && blob.size / 1024 / 1024 > targetMB && quality > 0.05) {
                    quality -= 0.05;
                    attempt();
                } else {
                    resolve(blob);
                }
            }, "image/jpeg", quality);
        }
        attempt();
    });
}
