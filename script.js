"use strict";

// ============================================
// HopeG AI - Main JavaScript
// Image Scanner + Text Analysis + Camera
// English + Hindi
// ============================================

let currentLanguage = "en";
let currentScanner = "health";
let currentAnalysisMode = "image";
let selectedImage = null;
let cameraStream = null;
let requestInProgress = false;

const $ = (id) => document.getElementById(id);

const languageSelect = $("languageSelect");
const imageInput = $("imageInput");
const imagePreview = $("imagePreview");
const removeImageButton = $("removeImage");
const cameraBox = $("cameraBox");
const cameraVideo = $("cameraVideo");
const cameraCanvas = $("cameraCanvas");
const scanMessage = $("scanMessage");
const resultBox = $("resultBox");
const scannerTitle = $("scannerTitle");
const scannerDescription = $("scannerDescription");
const analyzeBtn = $("analyzeBtn");
const analyzeTextBtn = $("analyzeTextBtn");
const textDescription = $("textDescription");
const textCharCount = $("textCharCount");
const imageAnalysisPanel = $("imageAnalysisPanel");
const textAnalysisPanel = $("textAnalysisPanel");
const imageModeBtn = $("imageModeBtn");
const textModeBtn = $("textModeBtn");
const voiceModeBtn = $("voiceModeBtn");
const voiceAnalysisPanel = $("voiceAnalysisPanel");
const voiceTranscript = $("voiceTranscript");
const voiceCharCount = $("voiceCharCount");
const startVoiceBtn = $("startVoiceBtn");
const stopVoiceBtn = $("stopVoiceBtn");
const analyzeVoiceBtn = $("analyzeVoiceBtn");

let voiceRecognition = null;
let suppressVoiceEndStatus = false;

const translations = {
    en: {
        healthTitle: 'Start your <span>Health AI scan</span>',
        environmentTitle: 'Start your <span>Environment Detector</span>',

        healthDescription:
            "Upload a clear image or describe your health concern.",

        environmentDescription:
            "Upload a clear photo or describe an environmental concern.",

        noImage:
            "Please upload a photo or take one with your camera first.",

        imageReady:
            "Image ready. You can now analyze it.",

        cameraUnsupported:
            "Your browser does not support camera access.",

        cameraPermission:
            "Camera could not be opened. Allow camera permission and try again.",

        cameraSecure:
            "Camera access generally requires localhost or a secure HTTPS website.",

        cameraClosed:
            "Camera closed.",

        captured:
            "Photo captured successfully.",

        invalidImage:
            "Please choose a valid JPEG, PNG or WebP image.",

        largeImage:
            "Please choose an image smaller than 15 MB.",

        imageError:
            "Could not read the image. Please try again.",

        remove:
            "Remove Photo",

        prepare:
            "Analyze Image →",

        choose:
            "📁 Choose Photo",

        useCamera:
            "📷 Use Camera",

        capture:
            "Capture Photo",

        closeCamera:
            "Close Camera",

        healthTab:
            "♡ Health AI",

        environmentTab:
            "🌿 Environment Detector",

        imageMode:
            "📷 Image Scanner",

        textMode:
            "✍️ Text Analysis",

        voiceMode:
            "🎙 Voice Input",

        textLabelHealth:
            "Describe your health concern",

        textLabelEnvironment:
            "Describe an environmental concern",

        textHelpHealth:
            "Describe your symptoms, how long they have lasted, and any relevant details. Do not include private personal information.",

        textHelpEnvironment:
            "Describe the visible conditions, location, and when you noticed them.",

        textPlaceholderHealth:
            "Example: I have a red, itchy patch on my arm that started three days ago...",

        textPlaceholderEnvironment:
            "Example: There is litter beside the stream and the water looks cloudy...",

        emptyText:
            "Please describe your concern before submitting.",

        analyzingImage:
            "AI is analyzing your image. Please wait...",

        analyzingText:
            "AI is analyzing your description. Please wait...",

        reportTitle:
            "AI Analysis Report",

        imageFailed:
            "Image analysis failed.",

        textFailed:
            "Text analysis failed.",

        voiceUnsupported:
            "Speech recognition is not available here. Use Chrome and allow microphone access.",

        voicePermission:
            "Microphone access was blocked. Allow microphone permission and try again.",

        voiceListening:
            "Listening... Speak clearly.",

        voiceFinished:
            "Voice input ready. Review the transcript, then analyze it.",

        voiceNoSpeech:
            "No speech was detected. Try again.",

        voiceFailed:
            "Voice input failed. Check microphone permission and try again.",

        genericError:
            "Something went wrong. Please try again.",

        healthDisclaimer:
            "Health information is for awareness only and is not a medical diagnosis. Consult a qualified healthcare professional, especially if symptoms are severe or worsening.",

        environmentDisclaimer:
            "Environmental image analysis is an estimate. A photo cannot measure air or water quality or confirm pollutants.",

        characters:
            "characters"
    },

    hi: {
        healthTitle:
            "अपना <span>हेल्थ AI स्कैन</span> शुरू करें",

        environmentTitle:
            "अपना <span>पर्यावरण डिटेक्टर</span> शुरू करें",

        healthDescription:
            "साफ फोटो अपलोड करें या अपनी स्वास्थ्य समस्या का विवरण लिखें।",

        environmentDescription:
            "पर्यावरण की साफ फोटो अपलोड करें या दिखाई देने वाली स्थिति का विवरण लिखें।",

        noImage:
            "पहले फोटो अपलोड करें या कैमरे से फोटो लें।",

        imageReady:
            "फोटो तैयार है। अब उसका विश्लेषण कर सकते हैं।",

        cameraUnsupported:
            "आपका ब्राउज़र कैमरा इस्तेमाल करने की सुविधा नहीं देता।",

        cameraPermission:
            "कैमरा नहीं खुला। कैमरे की अनुमति दें और फिर कोशिश करें।",

        cameraSecure:
            "कैमरे के लिए आम तौर पर localhost या सुरक्षित HTTPS वेबसाइट जरूरी है।",

        cameraClosed:
            "कैमरा बंद कर दिया गया है।",

        captured:
            "फोटो सफलतापूर्वक ले ली गई।",

        invalidImage:
            "कृपया सही JPEG, PNG या WebP इमेज चुनें।",

        largeImage:
            "कृपया 15 MB से छोटी फोटो चुनें।",

        imageError:
            "फोटो पढ़ी नहीं जा सकी। दोबारा कोशिश करें।",

        remove:
            "फोटो हटाएँ",

        prepare:
            "फोटो का विश्लेषण करें →",

        choose:
            "📁 फोटो चुनें",

        useCamera:
            "📷 कैमरा खोलें",

        capture:
            "फोटो लें",

        closeCamera:
            "कैमरा बंद करें",

        healthTab:
            "♡ हेल्थ AI",

        environmentTab:
            "🌿 पर्यावरण डिटेक्टर",

        imageMode:
            "📷 इमेज स्कैनर",

        textMode:
            "✍️ टेक्स्ट विश्लेषण",

        voiceMode:
            "🎙 आवाज़ से लिखें",

        textLabelHealth:
            "अपनी स्वास्थ्य समस्या का विवरण दें",

        textLabelEnvironment:
            "पर्यावरण की स्थिति का विवरण दें",

        textHelpHealth:
            "अपने लक्षण, उनकी अवधि और संबंधित जानकारी लिखें। निजी व्यक्तिगत जानकारी न लिखें।",

        textHelpEnvironment:
            "जो स्थिति दिखाई दे रही है, उसका स्थान और आपने उसे कब देखा, यह लिखें।",

        textPlaceholderHealth:
            "उदाहरण: मेरी बाँह पर लाल और खुजली वाला निशान है, जो तीन दिन पहले शुरू हुआ...",

        textPlaceholderEnvironment:
            "उदाहरण: नाले के पास कचरा है और पानी धुंधला दिखाई दे रहा है...",

        emptyText:
            "आगे बढ़ने से पहले अपनी समस्या का विवरण लिखें।",

        analyzingImage:
            "AI आपकी फोटो का विश्लेषण कर रहा है। कृपया प्रतीक्षा करें...",

        analyzingText:
            "AI आपके विवरण का विश्लेषण कर रहा है। कृपया प्रतीक्षा करें...",

        reportTitle:
            "AI विश्लेषण रिपोर्ट",

        imageFailed:
            "फोटो का विश्लेषण नहीं हो पाया।",

        textFailed:
            "टेक्स्ट का विश्लेषण नहीं हो पाया।",

        voiceUnsupported:
            "यहाँ आवाज़ पहचान उपलब्ध नहीं है। Chrome इस्तेमाल करें और माइक्रोफ़ोन की अनुमति दें।",

        voicePermission:
            "माइक्रोफ़ोन की अनुमति नहीं मिली। माइक्रोफ़ोन की अनुमति देकर फिर कोशिश करें।",

        voiceListening:
            "सुन रहा है... साफ़ बोलें।",

        voiceFinished:
            "आवाज़ का टेक्स्ट तैयार है। जाँचें और फिर विश्लेषण करें।",

        voiceNoSpeech:
            "कोई आवाज़ नहीं मिली। फिर से कोशिश करें।",

        voiceFailed:
            "आवाज़ इनपुट नहीं हुआ। माइक्रोफ़ोन की अनुमति जाँचें और फिर कोशिश करें।",

        genericError:
            "कुछ गड़बड़ हुई। कृपया दोबारा कोशिश करें।",

        healthDisclaimer:
            "स्वास्थ्य संबंधी जानकारी केवल जागरूकता के लिए है, यह चिकित्सकीय निदान नहीं है। गंभीर या बढ़ते लक्षणों में योग्य डॉक्टर से सलाह लें।",

        environmentDisclaimer:
            "पर्यावरण फोटो विश्लेषण एक अनुमान है। फोटो से हवा या पानी की गुणवत्ता या प्रदूषक की पुष्टि नहीं की जा सकती।",

        characters:
            "अक्षर"
    }
};


// ============================================
// LANGUAGE
// ============================================

function setLanguage(language) {
    currentLanguage = language === "hi" ? "hi" : "en";

    document.documentElement.lang = currentLanguage;

    // Translate regular HTML text.
    document.querySelectorAll("[data-en][data-hi]").forEach((element) => {
        const value = element.getAttribute(`data-${currentLanguage}`);

        if (value !== null) {
            // Existing content includes intentional spans in some headings.
            element.innerHTML = value;
        }
    });

    updateScannerText();
    updateModeButtons();
    updateTextAnalysisLabels();
    updateCharacterCount();
    updateVoiceCharacterCount();

    if (removeImageButton) {
        removeImageButton.textContent = translations[currentLanguage].remove;
    }

    const chooseButton = document.querySelector(
        '#uploadArea button[onclick*="imageInput"]'
    );

    if (chooseButton) {
        chooseButton.textContent = translations[currentLanguage].choose;
    }

    const cameraButton = document.querySelector(
        '#uploadArea button[onclick="openCamera()"]'
    );

    if (cameraButton) {
        cameraButton.textContent = translations[currentLanguage].useCamera;
    }

    if (analyzeBtn) {
        analyzeBtn.textContent = translations[currentLanguage].prepare;
    }

    const captureButton = document.querySelector(
        '#cameraBox button[onclick="capturePhoto()"]'
    );

    if (captureButton) {
        captureButton.textContent = translations[currentLanguage].capture;
    }

    const closeButton = document.querySelector(
        '#cameraBox button[onclick="closeCamera()"]'
    );

    if (closeButton) {
        closeButton.textContent = translations[currentLanguage].closeCamera;
    }

    const healthTab = $("healthTab");
    const environmentTab = $("environmentTab");

    if (healthTab) {
        healthTab.textContent = translations[currentLanguage].healthTab;
    }

    if (environmentTab) {
        environmentTab.textContent = translations[currentLanguage].environmentTab;
    }

    // Update the existing report's language only on the next analysis.
    // Do not erase a result just because the language selector changed.
}

function updateScannerText() {
    if (!scannerTitle || !scannerDescription) return;

    const t = translations[currentLanguage];

    if (currentScanner === "health") {
        scannerTitle.innerHTML = t.healthTitle;
        scannerDescription.textContent = t.healthDescription;
    } else {
        scannerTitle.innerHTML = t.environmentTitle;
        scannerDescription.textContent = t.environmentDescription;
    }

    const healthTab = $("healthTab");
    const environmentTab = $("environmentTab");

    if (healthTab) {
        healthTab.classList.toggle("active", currentScanner === "health");
    }

    if (environmentTab) {
        environmentTab.classList.toggle("active", currentScanner === "environment");
    }

    updateTextAnalysisLabels();
}

function updateModeButtons() {
    if (imageModeBtn) {
        imageModeBtn.textContent = translations[currentLanguage].imageMode;
        imageModeBtn.classList.toggle("active", currentAnalysisMode === "image");
    }

    if (textModeBtn) {
        textModeBtn.textContent = translations[currentLanguage].textMode;
        textModeBtn.classList.toggle("active", currentAnalysisMode === "text");
    }

    if (voiceModeBtn) {
        voiceModeBtn.textContent = translations[currentLanguage].voiceMode;
        voiceModeBtn.classList.toggle("active", currentAnalysisMode === "voice");
    }
}

function updateTextAnalysisLabels() {
    const t = translations[currentLanguage];

    const label = $("textInputLabel");
    const help = $("textInputHelp");

    if (label) {
        label.textContent = currentScanner === "health"
            ? t.textLabelHealth
            : t.textLabelEnvironment;
    }

    if (help) {
        help.textContent = currentScanner === "health"
            ? t.textHelpHealth
            : t.textHelpEnvironment;
    }

    if (textDescription) {
        textDescription.placeholder = currentScanner === "health"
            ? t.textPlaceholderHealth
            : t.textPlaceholderEnvironment;
    }

    if (voiceTranscript) {
        voiceTranscript.placeholder = currentLanguage === "hi"
            ? "आपके बोले हुए शब्द यहाँ दिखाई देंगे..."
            : "Your spoken words will appear here...";
    }
}


// ============================================
// SWITCH BETWEEN IMAGE AND TEXT ANALYSIS
// ============================================

function setAnalysisMode(mode) {
    const nextMode = ["text", "voice"].includes(mode) ? mode : "image";

    if (currentAnalysisMode === "voice" && nextMode !== "voice") {
        stopVoiceInput(true);
    }

    currentAnalysisMode = nextMode;

    if (imageAnalysisPanel) {
        imageAnalysisPanel.hidden = currentAnalysisMode !== "image";
    }

    if (textAnalysisPanel) {
        textAnalysisPanel.hidden = currentAnalysisMode !== "text";
    }

    if (voiceAnalysisPanel) {
        voiceAnalysisPanel.hidden = currentAnalysisMode !== "voice";
    }

    if (scanMessage) {
        scanMessage.textContent = "";
    }

    if (resultBox) {
        resultBox.hidden = true;
    }

    updateModeButtons();
    updateTextAnalysisLabels();
}


// ============================================
// SELECT HEALTH OR ENVIRONMENT
// ============================================

function openScanner(type) {
    currentScanner = type === "environment" ? "environment" : "health";

    updateScannerText();
    updateTextAnalysisLabels();

    if (scanMessage) {
        scanMessage.textContent = "";
    }

    if (resultBox) {
        resultBox.hidden = true;
    }

    const scanner = $("scanner");

    if (scanner) {
        scanner.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


// ============================================
// IMAGE PREVIEW
// ============================================

function showPreview(file) {
    if (!file) return;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        scanMessage.textContent = translations[currentLanguage].invalidImage;
        if (imageInput) imageInput.value = "";
        return;
    }

    const maxSize = 15 * 1024 * 1024;

    if (file.size > maxSize) {
        scanMessage.textContent = translations[currentLanguage].largeImage;
        if (imageInput) imageInput.value = "";
        return;
    }

    closeCamera(false);

    selectedImage = file;

    const reader = new FileReader();

    reader.onload = function (event) {
        if (!imagePreview || !removeImageButton) return;

        imagePreview.src = event.target.result;
        imagePreview.hidden = false;
        removeImageButton.hidden = false;

        scanMessage.textContent = translations[currentLanguage].imageReady;

        if (resultBox) resultBox.hidden = true;
    };

    reader.onerror = function () {
        scanMessage.textContent = translations[currentLanguage].imageError;
    };

    reader.readAsDataURL(file);
}

function clearImage() {
    selectedImage = null;

    if (imageInput) imageInput.value = "";

    if (imagePreview) {
        imagePreview.removeAttribute("src");
        imagePreview.hidden = true;
    }

    if (removeImageButton) {
        removeImageButton.hidden = true;
    }

    if (scanMessage) scanMessage.textContent = "";
    if (resultBox) resultBox.hidden = true;
}


// ============================================
// CAMERA
// ============================================

async function openCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        scanMessage.textContent =
            translations[currentLanguage].cameraUnsupported + " " +
            translations[currentLanguage].cameraSecure;
        return;
    }

    try {
        closeCamera(false);

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: "environment" }
            },
            audio: false
        });

        cameraVideo.srcObject = cameraStream;
        cameraBox.hidden = false;

        await cameraVideo.play();

        scanMessage.textContent = "";
    } catch (error) {
        console.error("Camera error:", error);

        closeCamera(false);

        scanMessage.textContent =
            translations[currentLanguage].cameraPermission;
    }
}

function capturePhoto() {
    if (!cameraStream || !cameraVideo.videoWidth) {
        scanMessage.textContent =
            translations[currentLanguage].cameraPermission;
        return;
    }

    cameraCanvas.width = cameraVideo.videoWidth;
    cameraCanvas.height = cameraVideo.videoHeight;

    const context = cameraCanvas.getContext("2d");

    context.drawImage(
        cameraVideo,
        0,
        0,
        cameraCanvas.width,
        cameraCanvas.height
    );

    cameraCanvas.toBlob((blob) => {
        if (!blob) {
            scanMessage.textContent =
                currentLanguage === "hi"
                    ? "फोटो नहीं बन सकी। दोबारा कोशिश करें।"
                    : "Could not capture the photo. Please try again.";
            return;
        }

        const photoFile = new File(
            [blob],
            "hopeg-camera-photo.jpg",
            { type: "image/jpeg" }
        );

        showPreview(photoFile);
        closeCamera(false);

        scanMessage.textContent = translations[currentLanguage].captured;
    }, "image/jpeg", 0.92);
}

function closeCamera(showMessage = true) {
    if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        cameraStream = null;
    }

    if (cameraVideo) {
        cameraVideo.srcObject = null;
    }

    if (cameraBox) {
        cameraBox.hidden = true;
    }

    if (showMessage && scanMessage) {
        scanMessage.textContent = translations[currentLanguage].cameraClosed;
    }
}


// ============================================
// SAFE REPORT RENDERING
// Supports headings, bullets, bold and paragraphs.
// All AI-generated text is HTML-escaped first.
// ============================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function renderReport(markdown) {
    const safeText = escapeHTML(markdown || "");
    const lines = safeText.replace(/\r\n/g, "\n").split("\n");

    let html = "";
    let inList = false;

    function closeList() {
        if (inList) {
            html += "</ul>";
            inList = false;
        }
    }

    for (const originalLine of lines) {
        const line = originalLine.trim();

        if (!line) {
            closeList();
            continue;
        }

        if (/^[-*_]{3,}$/.test(line)) {
            closeList();
            html += '<hr class="report-divider">';
            continue;
        }

        const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);

        if (headingMatch) {
            closeList();

            const level = headingMatch[1].length + 2;
            const content = formatInlineMarkdown(headingMatch[2]);

            html += `<h${level}>${content}</h${level}>`;
            continue;
        }

        const bulletMatch = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);

        if (bulletMatch) {
            if (!inList) {
                html += "<ul>";
                inList = true;
            }

            html += `<li>${formatInlineMarkdown(bulletMatch[1])}</li>`;
            continue;
        }

        closeList();

        html += `<p>${formatInlineMarkdown(line)}</p>`;
    }

    closeList();

    return html || "<p></p>";
}

function formatInlineMarkdown(text) {
    // Text is escaped before formatting, so generated HTML cannot execute.
    return text
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/__(.+?)__/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/_(.+?)_/g, "<em>$1</em>");
}

function displayReport(reportText) {
    if (!resultBox) return;

    resultBox.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = translations[currentLanguage].reportTitle;

    const reportContent = document.createElement("div");
    reportContent.className = "ai-report-content";
    reportContent.innerHTML = renderReport(reportText);

    const disclaimer = document.createElement("p");
    disclaimer.className = "report-disclaimer";
    disclaimer.textContent = currentScanner === "health"
        ? translations[currentLanguage].healthDisclaimer
        : translations[currentLanguage].environmentDisclaimer;

    resultBox.append(heading, reportContent, disclaimer);
    resultBox.hidden = false;

    resultBox.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


// ============================================
// SHARED API RESPONSE HANDLER
// ============================================

async function sendAnalysisRequest(url, options, loadingMessage, failureMessage, button) {
    if (requestInProgress) return;

    requestInProgress = true;

    if (button) button.disabled = true;

    scanMessage.textContent = loadingMessage;
    resultBox.hidden = true;

    try {
        const response = await fetch(url, options);

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error(
                currentLanguage === "hi"
                    ? "सर्वर से सही जवाब नहीं मिला। Flask सर्वर और API सेटिंग जाँचें।"
                    : "The server returned an invalid response. Check the Flask server and API settings."
            );
        }

        if (!response.ok) {
            throw new Error(data.error || failureMessage);
        }

        if (typeof data.result !== "string" || !data.result.trim()) {
            throw new Error(failureMessage);
        }

        displayReport(data.result);
        scanMessage.textContent = "";

    } catch (error) {
        console.error("Analysis error:", error);

        scanMessage.textContent = error.message || failureMessage;

    } finally {
        requestInProgress = false;

        if (button) button.disabled = false;
    }
}


// ============================================
// IMAGE ANALYSIS
// Requires the existing Flask POST /analyze route.

async function analyzeImage() {
    if (!selectedImage) {
        scanMessage.textContent = translations[currentLanguage].noImage;
        return;
    }

    const formData = new FormData();

    formData.append("image", selectedImage);
    formData.append("language", currentLanguage);
    formData.append("section", currentScanner);

    await sendAnalysisRequest(
        "/analyze",
        {
            method: "POST",
            body: formData
        },
        translations[currentLanguage].analyzingImage,
        translations[currentLanguage].imageFailed,
        analyzeBtn
    );
}


// TEXT ANALYSIS
// Requires the existing Flask POST /analyze-text route.

async function analyzeText(descriptionOverride = null, submitButton = analyzeTextBtn) {
    const fromVoice = typeof descriptionOverride === "string";
    const sourceField = fromVoice ? voiceTranscript : textDescription;
    const description = fromVoice
        ? descriptionOverride.trim()
        : (textDescription ? textDescription.value.trim() : "");

    if (!description) {
        scanMessage.textContent = translations[currentLanguage].emptyText;

        if (sourceField) {
            sourceField.focus();
        }

        return;
    }

    if (description.length > 5000) {
        scanMessage.textContent =
            currentLanguage === "hi"
                ? "कृपया 5000 अक्षरों या उससे कम का विवरण लिखें।"
                : "Please keep your description to 5000 characters or fewer.";

        return;
    }

    const formData = new FormData();

    formData.append("description", description);
    formData.append("language", currentLanguage);
    formData.append("section", currentScanner);

    await sendAnalysisRequest(
        "/analyze-text",
        {
            method: "POST",
            body: formData
        },
        translations[currentLanguage].analyzingText,
        translations[currentLanguage].textFailed,
        submitButton
    );
}

async function analyzeVoice() {
    if (voiceRecognition) {
        stopVoiceInput(true);
    }

    await analyzeText(
        voiceTranscript ? voiceTranscript.value : "",
        analyzeVoiceBtn
    );
}

function startVoiceInput() {
    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        scanMessage.textContent = translations[currentLanguage].voiceUnsupported;
        return;
    }

    if (!voiceTranscript || voiceRecognition) return;

    const recognition = new SpeechRecognition();
    const textBeforeListening = voiceTranscript.value.trim();
    let recognitionError = "";
    suppressVoiceEndStatus = false;

    recognition.lang = currentLanguage === "hi" ? "hi-IN" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        if (startVoiceBtn) startVoiceBtn.disabled = true;
        if (stopVoiceBtn) stopVoiceBtn.disabled = false;
        scanMessage.textContent = translations[currentLanguage].voiceListening;
    };

    recognition.onresult = (event) => {
        let finalText = "";
        let interimText = "";

        for (let index = 0; index < event.results.length; index += 1) {
            const result = event.results[index];
            const phrase = result[0].transcript.trim();

            if (result.isFinal) {
                finalText += phrase + " ";
            } else {
                interimText += phrase + " ";
            }
        }

        voiceTranscript.value = [
            textBeforeListening,
            finalText.trim(),
            interimText.trim()
        ].filter(Boolean).join(" ").slice(0, 5000);

        updateVoiceCharacterCount();
    };

    recognition.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            recognitionError = translations[currentLanguage].voicePermission;
        } else if (event.error === "no-speech") {
            recognitionError = translations[currentLanguage].voiceNoSpeech;
        } else {
            recognitionError = translations[currentLanguage].voiceFailed;
        }
    };

    recognition.onend = () => {
        if (voiceRecognition === recognition) {
            voiceRecognition = null;
        }

        if (startVoiceBtn) startVoiceBtn.disabled = false;
        if (stopVoiceBtn) stopVoiceBtn.disabled = true;

        if (suppressVoiceEndStatus) {
            suppressVoiceEndStatus = false;
        } else {
            scanMessage.textContent = recognitionError
                || translations[currentLanguage].voiceFinished;
        }
    };

    voiceRecognition = recognition;

    try {
        recognition.start();
    } catch (error) {
        voiceRecognition = null;
        if (startVoiceBtn) startVoiceBtn.disabled = false;
        if (stopVoiceBtn) stopVoiceBtn.disabled = true;
        scanMessage.textContent = translations[currentLanguage].voiceFailed;
    }
}

function stopVoiceInput(suppressStatus = false) {
    if (!voiceRecognition) return;

    const recognition = voiceRecognition;
    voiceRecognition = null;
    suppressVoiceEndStatus = suppressStatus;

    if (startVoiceBtn) startVoiceBtn.disabled = false;
    if (stopVoiceBtn) stopVoiceBtn.disabled = true;

    try {
        recognition.stop();
    } catch (error) {
        scanMessage.textContent = translations[currentLanguage].voiceFailed;
    }
}


// CHARACTER COUNTER
// ============================================

function updateCharacterCount() {
    if (!textDescription || !textCharCount) return;

    textCharCount.textContent =
        textDescription.value.length + " / 5000 " + translations[currentLanguage].characters;
}

function updateVoiceCharacterCount() {
    if (!voiceTranscript || !voiceCharCount) return;

    voiceCharCount.textContent =
        voiceTranscript.value.length + " / 5000 " + translations[currentLanguage].characters;
}


// ============================================
// EVENT LISTENERS
// ============================================

if (languageSelect) {
    languageSelect.addEventListener("change", (event) => {
        setLanguage(event.target.value);
    });
}

if (imageInput) {
    imageInput.addEventListener("change", (event) => {
        const file = event.target.files && event.target.files[0];

        if (file) {
            showPreview(file);
        }
    });
}

if (textDescription) {
    textDescription.addEventListener("input", updateCharacterCount);
}

if (voiceTranscript) {
    voiceTranscript.addEventListener("input", updateVoiceCharacterCount);
}

window.addEventListener("beforeunload", () => {
    closeCamera(false);
    stopVoiceInput(true);
});


// ============================================
// INITIALIZATION
// ============================================

const yearElement = $("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

setLanguage("en");
setAnalysisMode("image");
updateCharacterCount();
updateVoiceCharacterCount();