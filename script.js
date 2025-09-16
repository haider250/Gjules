document.addEventListener('DOMContentLoaded', () => {
    // Get references to all the necessary DOM elements
    const inputText = document.getElementById('inputText');
    const paraphraseBtn = document.getElementById('paraphraseBtn');
    const outputText = document.getElementById('outputText');
    const modeSelect = document.getElementById('mode');
    const levelSlider = document.getElementById('level');
    const levelValue = document.getElementById('levelValue');

    // Initialize winkNLP with the English lite model
    // This is used for Part-of-Speech (POS) tagging
    const nlp = window.winkNLP(window.winkEngLiteModel);
    const its = nlp.its;

    // Define which Part-of-Speech tags we want to replace.
    // We avoid replacing pronouns, prepositions, etc. to maintain sentence structure.
    const replaceablePOS = ['NOUN', 'VERB', 'ADJ', 'ADV'];

    // Add an event listener to the slider to update the percentage display
    levelSlider.addEventListener('input', () => {
        levelValue.textContent = `${levelSlider.value}%`;
    });

    // Add the main event listener for the paraphrase button
    paraphraseBtn.addEventListener('click', async () => {
        const text = inputText.value.trim();
        if (text === '') {
            outputText.textContent = 'Please enter some text to paraphrase.';
            return;
        }

        // Provide feedback to the user that the process has started
        outputText.textContent = 'Paraphrasing...';

        // Get the selected mode and level from the controls
        const mode = modeSelect.value;
        const level = levelSlider.value;
        const apiParam = mode === 'creative' ? 'rel_trg' : 'rel_syn';

        try {
            // Process the text with winkNLP to get tokens and their POS tags
            const doc = nlp.readDoc(text);
            const tokens = doc.tokens().out(its.text, its.pos);

            // Create an array of promises, one for each token
            const paraphrasedWords = await Promise.all(tokens.map(async (token) => {
                // Check if the token's POS is replaceable and if it passes the random level check
                if (replaceablePOS.includes(token.pos) && Math.random() < level / 100) {
                    const word = token.text;
                    // Simple punctuation handling: strip it, find synonym, re-attach it.
                    const punctuation = word.match(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g) || [];
                    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');

                    if (cleanWord === '') {
                        return word; // It was just punctuation
                    }

                    // Call the Datamuse API to get related words
                    const response = await fetch(`https://api.datamuse.com/words?${apiParam}=${cleanWord}&max=5`);
                    if (!response.ok) {
                        return word; // Return original word on API error
                    }
                    const results = await response.json();

                    if (results.length > 0) {
                        // Pick the first result and re-attach punctuation
                        return results[0].word + punctuation.join('');
                    } else {
                        return word; // Return original word if no synonyms found
                    }
                } else {
                    // If the word is not replaceable, return it as is
                    return token.text;
                }
            }));

            // Join the words back into a sentence and display the result
            // Includes a simple fix for spacing around punctuation.
            outputText.textContent = paraphrasedWords.join(' ').replace(/ \./g, '.').replace(/ ,/g, ',');

        } catch (error) {
            console.error('Error paraphrasing text:', error);
            outputText.textContent = 'Failed to paraphrase text. Please try again later.';
        }
    });
});
