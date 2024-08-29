import os
import sys


def load_bad_words(language):
    """Load bad words from a specified language file."""
    try:
        script_dir = os.path.dirname(os.path.realpath(__file__))  # Get the script's directory
        file_path = os.path.join(script_dir, 'datasets', f'{language.lower()}.csv')  # Construct the absolute path
        badwords_list = []
        with open(file_path, 'r') as lang_file:
            for word in lang_file:
                badwords_list.append(word.lower().strip('\n'))
        return badwords_list
    except FileNotFoundError:
        print(f"No bad words list found for language: {language}.")
        return []

def process_text(text):
    """Process the provided text to find bad words."""
    language = 'english'  # Set the language to English directly
    badwords = load_bad_words(language)

    if not badwords:
        print("Error: No bad words list loaded. Exiting.")
        return []

    badwords = set(badwords)
    results = []

    text_list = text.split('\n')
    for sentence in text_list:
        line_number = str(text_list.index(sentence) + 1)
        for key in ['.', ',', '"', "'", '?', '!', ':', ';', '(', ')', '[', ']', '{', '}']:
            sentence = sentence.replace(key, '')
        abuses = [i for i in sentence.lower().split() if i in badwords]
        if abuses:
            results.append({'lineNumber': line_number, 'badWords': abuses})

    return results

def main():
    if len(sys.argv) != 2:
        print("Usage: python text_processor.py <text>")
        sys.exit()

    text = sys.argv[1]
    results = process_text(text)
    for result in results:
        print(f"Line {result['lineNumber']}: Bad Words: {', '.join(result['badWords'])}")

if __name__ == "__main__":
    main()
