// =============================
// GET ELEMENTS
// =============================

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const video = document.getElementById("camera");

const cameraBtn = document.getElementById("cameraBtn");
const cameraMessage = document.getElementById("cameraMessage");

const brushSize = document.getElementById("brushSize");
const sizeValue = document.getElementById("sizeValue");

const brushBtn = document.getElementById("brushBtn");
const eraserBtn = document.getElementById("eraserBtn");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

const clearBtn = document.getElementById("clearBtn");
const downloadBtn = document.getElementById("downloadBtn");

const flipCameraBtn = document.getElementById("flipCameraBtn");
const cameraOnlyBtn = document.getElementById("cameraOnlyBtn");

const customColor = document.getElementById("customColor");


// =============================
// VARIABLES
// =============================

let drawing = false;

let currentColor = "#ff0000";

let currentSize = 8;

let eraser = false;

let cameraStream = null;

let cameraFacingMode = "user";

let cameraOnly = false;


// Undo / Redo

let undoStack = [];
let redoStack = [];


// =============================
// CANVAS SIZE
// =============================

function resizeCanvas() {

    const oldCanvas = document.createElement("canvas");

    oldCanvas.width = canvas.width;
    oldCanvas.height = canvas.height;

    if (canvas.width > 0 && canvas.height > 0) {
        oldCanvas.getContext("2d").drawImage(canvas, 0, 0);
    }

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (oldCanvas.width > 0 && oldCanvas.height > 0) {

        ctx.drawImage(
            oldCanvas,
            0,
            0,
            oldCanvas.width,
            oldCanvas.height,
            0,
            0,
            canvas.width,
            canvas.height
        );
    }
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();


// =============================
// DRAWING
// =============================

function getPosition(event) {

    const rect = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left) * canvas.width / rect.width,
        y: (event.clientY - rect.top) * canvas.height / rect.height
    };
}


function startDrawing(event) {

    drawing = true;

    saveState();

    const position = getPosition(event);

    ctx.beginPath();

    ctx.moveTo(position.x, position.y);

    draw(event);
}


function draw(event) {

    if (!drawing) return;

    const position = getPosition(event);

    ctx.lineWidth = currentSize;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (eraser) {

        ctx.globalCompositeOperation = "destination-out";

    } else {

        ctx.globalCompositeOperation = "source-over";

        ctx.strokeStyle = currentColor;
    }

    ctx.lineTo(position.x, position.y);

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(position.x, position.y);
}


function stopDrawing() {

    if (!drawing) return;

    drawing = false;

    ctx.beginPath();

    ctx.globalCompositeOperation = "source-over";
}


// Mouse

canvas.addEventListener("pointerdown", startDrawing);

canvas.addEventListener("pointermove", draw);

canvas.addEventListener("pointerup", stopDrawing);

canvas.addEventListener("pointercancel", stopDrawing);

canvas.addEventListener("pointerleave", stopDrawing);


// =============================
// COLORS
// =============================

const colorButtons = document.querySelectorAll(".color");

colorButtons.forEach(button => {

    button.addEventListener("click", () => {

        currentColor = button.dataset.color;

        eraser = false;

        brushBtn.classList.add("active");
        eraserBtn.classList.remove("active");

        colorButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        customColor.value = currentColor;
    });

});


customColor.addEventListener("input", () => {

    currentColor = customColor.value;

    eraser = false;

    brushBtn.classList.add("active");
    eraserBtn.classList.remove("active");

});


// =============================
// BRUSH
// =============================

brushSize.addEventListener("input", () => {

    currentSize = Number(brushSize.value);

    sizeValue.textContent = currentSize + " px";

});


// =============================
// BRUSH BUTTON
// =============================

brushBtn.addEventListener("click", () => {

    eraser = false;

    brushBtn.classList.add("active");

    eraserBtn.classList.remove("active");

});


// =============================
// ERASER
// =============================

eraserBtn.addEventListener("click", () => {

    eraser = true;

    eraserBtn.classList.add("active");

    brushBtn.classList.remove("active");

});


// =============================
// UNDO
// =============================

function saveState() {

    if (undoStack.length > 30) {
        undoStack.shift();
    }

    undoStack.push(
        canvas.toDataURL()
    );

    redoStack = [];
}


function restoreState(dataURL) {

    const image = new Image();

    image.onload = () => {

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
        );

    };

    image.src = dataURL;
}


undoBtn.addEventListener("click", () => {

    if (undoStack.length === 0) return;

    redoStack.push(canvas.toDataURL());

    const previous = undoStack.pop();

    restoreState(previous);

});


redoBtn.addEventListener("click", () => {

    if (redoStack.length === 0) return;

    undoStack.push(canvas.toDataURL());

    const next = redoStack.pop();

    restoreState(next);

});


// =============================
// CLEAR
// =============================

clearBtn.addEventListener("click", () => {

    saveState();

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

});


// =============================
// DOWNLOAD
// =============================

downloadBtn.addEventListener("click", () => {

    const output = document.createElement("canvas");

    output.width = canvas.width;
    output.height = canvas.height;

    const outputCtx = output.getContext("2d");

    // Camera background

    if (video.readyState >= 2) {

        outputCtx.save();

        if (cameraFacingMode === "user") {

            outputCtx.translate(output.width, 0);
            outputCtx.scale(-1, 1);

        }

        outputCtx.drawImage(
            video,
            0,
            0,
            output.width,
            output.height
        );

        outputCtx.restore();

    } else {

        outputCtx.fillStyle = "#111";

        outputCtx.fillRect(
            0,
            0,
            output.width,
            output.height
        );
    }


    // Drawing layer

    outputCtx.drawImage(
        canvas,
        0,
        0
    );


    const link = document.createElement("a");

    link.download = "drawcam-image.png";

    link.href = output.toDataURL("image/png");

    link.click();

});


// =============================
// CAMERA
// =============================

async function startCamera() {

    try {

        if (cameraStream) {

            cameraStream.getTracks().forEach(track => {
                track.stop();
            });

        }

        cameraStream = await navigator.mediaDevices.getUserMedia({

            video: {
                facingMode: cameraFacingMode
            },

            audio: false

        });

        video.srcObject = cameraStream;

        cameraMessage.style.display = "none";

        cameraBtn.textContent = "⏹ Stop Camera";

    }

    catch (error) {

        console.error(error);

        alert(
            "Camera access failed. Please allow camera permission and try again."
        );

    }

}


function stopCamera() {

    if (!cameraStream) return;

    cameraStream.getTracks().forEach(track => {
        track.stop();
    });

    cameraStream = null;

    video.srcObject = null;

    cameraMessage.style.display = "flex";

    cameraBtn.textContent = "📷 Start Camera";

}


cameraBtn.addEventListener("click", () => {

    if (cameraStream) {

        stopCamera();

    } else {

        startCamera();

    }

});


// =============================
// FLIP CAMERA
// =============================

flipCameraBtn.addEventListener("click", async () => {

    cameraFacingMode =
        cameraFacingMode === "user"
            ? "environment"
            : "user";


    if (cameraStream) {

        await startCamera();

    }

});


// =============================
// CAMERA ONLY MODE
// =============================

cameraOnlyBtn.addEventListener("click", () => {

    cameraOnly = !cameraOnly;

    if (cameraOnly) {

        canvas.style.pointerEvents = "none";

        cameraOnlyBtn.textContent = "✏️ Drawing Mode";

    } else {

        canvas.style.pointerEvents = "auto";

        cameraOnlyBtn.textContent = "👁️ Camera Only";

    }

});