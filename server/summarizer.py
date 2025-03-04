import sys
import torch
from transformers import MBartForConditionalGeneration, MBartTokenizer

def summarize_text(text: str, target_language: str) -> str:
    # Map common language names to mBART language codes
    language_codes = {
        "English": "en_XX",
        "Spanish": "es_XX",
        "French": "fr_XX",
        "German": "de_DE",
        "Italian": "it_IT",
        "Portuguese": "pt_XX",
        "Russian": "ru_RU",
        "Japanese": "ja_XX",
        "Chinese": "zh_CN",
        "Korean": "ko_KR"
    }

    try:
        print("Loading model and tokenizer...", file=sys.stderr)
        # Load model and tokenizer
        model_name = "facebook/mbart-large-cc25"
        tokenizer = MBartTokenizer.from_pretrained(model_name)
        model = MBartForConditionalGeneration.from_pretrained(model_name)

        # Set output language
        target_lang_code = language_codes.get(target_language, "en_XX")
        tokenizer.src_lang = "en_XX"  # Default to English as source
        print(f"Processing text for language: {target_language} ({target_lang_code})", file=sys.stderr)

        # Tokenize and generate summary
        inputs = tokenizer(text, return_tensors="pt", max_length=1024, truncation=True)
        print("Text tokenized successfully", file=sys.stderr)

        # Generate summary
        summary_ids = model.generate(
            inputs["input_ids"],
            num_beams=4,
            length_penalty=2.0,
            max_length=142,  # Roughly 25% of max input length
            min_length=56,   # Avoid too short summaries
            forced_bos_token_id=tokenizer.lang_code_to_id[target_lang_code]
        )
        print("Summary generated successfully", file=sys.stderr)

        # Decode summary
        summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        print("Summary decoded successfully", file=sys.stderr)
        return summary

    except Exception as e:
        print(f"Error during summarization: {str(e)}", file=sys.stderr)
        return "Failed to generate summary"

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python summarizer.py <text> <language>", file=sys.stderr)
        sys.exit(1)

    print("Starting summarization process...", file=sys.stderr)
    text = sys.argv[1]
    language = sys.argv[2]
    print(f"Input text length: {len(text)}", file=sys.stderr)
    print(f"Target language: {language}", file=sys.stderr)

    summary = summarize_text(text, language)
    print(summary)