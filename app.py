import base64
import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from groq import Groq
from google import genai
from google.genai import types

# Load API key from .env file in the project folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 15 * 1024 * 1024

# A legacy unnumbered key and up to five numbered keys per provider are supported.
# Groq keys are tried first; Gemini keys are the backup provider.
def read_api_keys(prefix, count=5):
    keys = []
    names = [prefix] + [f"{prefix}_{index}" for index in range(1, count + 1)]
    for name in names:
        key = os.getenv(name, "").strip()
        if key and key not in keys:
            keys.append(key)
    return keys


GROQ_API_KEYS = read_api_keys("GROQ_API_KEY")
GEMINI_API_KEYS = read_api_keys("GEMINI_API_KEY")

# Models configured for image and text analysis.
GROQ_MODEL_NAME = "qwen/qwen3.8-27b"
GEMINI_MODEL_NAME = "gemini-3.8-flash"


def get_language(language):
    """Return a supported output language."""
    return "Hindi (हिंदी)" if language == "hi" else "English"


def get_instructions(section):
    """Return safety instructions for the selected analysis type."""
    if section == "health":
        return """
You are a cautious health information assistant.

- Do not claim that an image or text confirms a diagnosis.
- Explain possible causes and clearly state uncertainty.
- Do not prescribe medicines or personalized medication doses.
- Explain warning signs and when professional medical care is needed.
- If emergency symptoms are described, recommend urgent local
  emergency medical assistance.
- For images, describe only visible features.
- Do not identify a disease with certainty from appearance alone.
"""
    return """
You are a cautious environmental observation assistant.

- Describe visible environmental conditions such as litter, smoke, water appearance,
  vegetation, erosion, or habitat changes.
- Separate visible observations from possible explanations.
- Do not claim that an image measures air quality, water safety, or pollutant levels.
- Do not identify hazardous substances with certainty from appearance alone.
- Suggest safe, practical next steps. Do not advise touching unknown waste,
  entering polluted water, or approaching smoke, fire, or chemical spills.
- Recommend contacting local environmental authorities or qualified experts
  when a serious hazard may be present.
- Ask for location, date, weather, and context when useful.
"""


def make_prompt(section, language, input_type, description=""):
    """Build the analysis prompt."""
    output_language = get_language(language)
    instructions = get_instructions(section)

    if section == "health":
        topic = "Health concern"
    else:
        topic = "Environmental condition or surroundings concern"

    if input_type == "image":
        input_details = """
Analyze the attached image carefully.
Describe visible observations and distinguish observations
from possible explanations.
"""
    else:
        input_details = f"""
The user has described the following {topic}:

{description}

Analyze the description. Do not assume details that the user
has not provided. If important information is missing, mention it.
"""

    return f"""
{instructions}

{input_details}

Write the entire response in {output_language}.

Use these headings and explain each one clearly:

### 1. Observations / दिखाई देने वाली स्थिति
Describe the available information.

### 2. Possible Causes / संभावित कारण
List possible explanations without claiming certainty.

### 3. Severity and Uncertainty / गंभीरता और अनिश्चितता
Explain what can and cannot be concluded from the information.
Do not invent a precise severity score or predict tomorrow's
condition without sufficient evidence.

### 4. Recommended Next Steps / अगले कदम
Give safe, practical next steps appropriate to the selected topic.

### 5. Prevention and Cautions / बचाव और सावधानियाँ
Explain relevant precautions and when professional help is needed.

Keep the report readable, organized, and practical.
"""


def analyze_with_ai(prompt, image_bytes=None, mime_type=None):
    """Try configured Groq keys, then fall back to configured Gemini keys."""
    if not GROQ_API_KEYS and not GEMINI_API_KEYS:
        raise RuntimeError("API key missing")

    if image_bytes is not None:
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        groq_content = [
            {"type": "text", "text": prompt},
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{mime_type};base64,{encoded_image}"
                }
            }
        ]
    else:
        groq_content = prompt

    failures = []

    for key_number, api_key in enumerate(GROQ_API_KEYS, start=1):
        try:
            client = Groq(api_key=api_key)
            response = client.chat.completions.create(
                model=GROQ_MODEL_NAME,
                messages=[{"role": "user", "content": groq_content}],
                max_completion_tokens=2048
            )

            answer = response.choices[0].message.content
            if answer and answer.strip():
                return answer.strip()

            raise ValueError("Groq returned an empty response.")
        except Exception as error:
            failures.append(error)
            app.logger.warning(
                "Groq key slot %s failed (%s). Trying the next configured key.",
                key_number,
                type(error).__name__
            )

    for key_number, api_key in enumerate(GEMINI_API_KEYS, start=1):
        try:
            client = genai.Client(api_key=api_key)

            if image_bytes is not None:
                contents = [
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type=mime_type
                    ),
                    prompt
                ]
            else:
                contents = prompt

            response = client.models.generate_content(
                model=GEMINI_MODEL_NAME,
                contents=contents
            )

            answer = response.text
            if answer and answer.strip():
                return answer.strip()

            raise ValueError("Gemini returned an empty response.")
        except Exception as error:
            failures.append(error)
            app.logger.warning(
                "Gemini key slot %s failed (%s). Trying the next configured key.",
                key_number,
                type(error).__name__
            )

    if failures:
        raise RuntimeError(
            "All configured Groq and Gemini API keys failed."
        ) from failures[-1]

    raise RuntimeError("No API keys are configured.")


def error_message(language, error_type="general"):
    """Return a user-friendly error message."""
    messages = {
        "api": {
            "en": "No Groq or Gemini API key is configured. Check your .env file.",
            "hi": "Groq या Gemini API key नहीं मिली। अपनी .env फ़ाइल जाँचें।"
        },
        "image": {
            "en": "Please upload an image.",
            "hi": "कृपया एक फोटो अपलोड करें।"
        },
        "format": {
            "en": "Use a JPG, PNG, or WEBP image.",
            "hi": "JPG, PNG या WEBP फोटो चुनें।"
        },
        "empty_image": {
            "en": "The uploaded image is empty.",
            "hi": "अपलोड की गई फोटो खाली है।"
        },
        "text": {
            "en": "Please describe the problem first.",
            "hi": "कृपया पहले समस्या का विवरण लिखें।"
        },
        "general": {
            "en": (
                "AI analysis failed. Check the model name, API key, "
                "internet connection, API access, and usage limits."
            ),
            "hi": (
                "AI विश्लेषण नहीं हो पाया। मॉडल का नाम, API key, "
                "इंटरनेट कनेक्शन, API access और usage limits जाँचें।"
            )
        }
    }

    return messages.get(error_type, messages["general"]).get(
        language, messages.get(error_type, messages["general"])["en"]
    )


def validate_options():
    """Read and validate language and analysis section."""
    language = request.form.get("language", "en").lower()
    section = request.form.get("section", "health").lower()

    if language not in ("en", "hi"):
        language = "en"

    if section not in ("health", "environment"):
        section = "health"

    return language, section


@app.route("/")
def home():
    return render_template("index.html", active_section="health")


@app.route("/health")
def health():
    return render_template("index.html", active_section="health")


@app.route("/environment")
def environment():
    return render_template("index.html", active_section="environment")


@app.route("/analyze", methods=["POST"])
def analyze():
    """Analyze an uploaded health or environmental image."""
    language, section = validate_options()

    if not GROQ_API_KEYS and not GEMINI_API_KEYS:
        return jsonify({"error": error_message(language, "api")}), 500

    image = request.files.get("image")

    if image is None or not image.filename:
        return jsonify({"error": error_message(language, "image")}), 400

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp"
    }

    if image.mimetype not in allowed_types:
        return jsonify({"error": error_message(language, "format")}), 400

    image_bytes = image.read()

    if not image_bytes:
        return jsonify({
            "error": error_message(language, "empty_image")
        }), 400

    try:
        prompt = make_prompt(
            section=section,
            language=language,
            input_type="image"
        )

        answer = analyze_with_ai(
            prompt=prompt,
            image_bytes=image_bytes,
            mime_type=image.mimetype
        )

        return jsonify({
            "result": answer,
            "section": section,
            "language": language
        })

    except Exception:
        app.logger.exception("Image analysis failed")

        return jsonify({
            "error": error_message(language)
        }), 502


@app.route("/analyze-text", methods=["POST"])
def analyze_text():
    """Analyze a written health or environmental concern."""
    language, section = validate_options()

    if not GROQ_API_KEYS and not GEMINI_API_KEYS:
        return jsonify({"error": error_message(language, "api")}), 500

    description = request.form.get("description", "").strip()

    if not description:
        return jsonify({"error": error_message(language, "text")}), 400

    if len(description) > 5000:
        return jsonify({
            "error": (
                "Description must be 5000 characters or fewer."
                if language == "en"
                else "विवरण 5000 अक्षरों या उससे कम का होना चाहिए।"
            )
        }), 400

    try:
        prompt = make_prompt(
            section=section,
            language=language,
            input_type="text",
            description=description
        )

        answer = analyze_with_ai(prompt=prompt)

        return jsonify({
            "result": answer,
            "section": section,
            "language": language
        })

    except Exception:
        app.logger.exception("Text analysis failed")

        return jsonify({
            "error": error_message(language)
        }), 502


@app.errorhandler(413)
def file_too_large(error):
    language = request.form.get("language", "en")

    message = (
        "The uploaded request is too large. Images must be smaller than 15 MB."
        if language != "hi"
        else "अपलोड की गई फ़ाइल बहुत बड़ी है। फोटो 15 MB से छोटी होनी चाहिए।"
    )

    return jsonify({"error": message}), 413


if __name__ == "__main__":
    
    app.run(host="0.0.0.0", port=5000, debug=False)