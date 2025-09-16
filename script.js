document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const flashcard = document.getElementById('flashcard');
    const questionText = document.getElementById('questionText');
    const answerText = document.getElementById('answerText');
    const flipBtn = document.getElementById('flipBtn');
    const difficultyControls = document.getElementById('difficulty-controls');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const flashcardContainer = document.getElementById('flashcard-container');
    const categorySelector = document.getElementById('categorySelector');
    const loadDeckBtn = document.getElementById('loadDeckBtn');
    const loader = document.getElementById('loader');
    const deckNameDisplay = document.getElementById('deckNameDisplay');

    // Deck Manager Modal Elements
    const manageDecksBtn = document.getElementById('manageDecksBtn');
    const deckManagerModal = document.getElementById('deckManagerModal');
    const closeModalBtn = document.querySelector('.close-btn');
    const newDeckNameInput = document.getElementById('newDeckName');
    const createDeckBtn = document.getElementById('createDeckBtn');
    const deckSelector = document.getElementById('deckSelector');
    const deleteDeckBtn = document.getElementById('deleteDeckBtn');
    const newCardQuestionInput = document.getElementById('newCardQuestion');
    const newCardAnswerInput = document.getElementById('newCardAnswer');
    const addCardBtn = document.getElementById('addCardBtn');
    const cardListContainer = document.getElementById('card-list-container');

    let appData = {};
    let currentCard = null;

    // --- Data Management ---
    function saveAppData() {
        localStorage.setItem('flashcardAppData', JSON.stringify(appData));
    }

    function loadAppData() {
        const storedData = localStorage.getItem('flashcardAppData');
        if (storedData) {
            appData = JSON.parse(storedData);
        } else {
            appData = {
                decks: {
                    'Sample Deck': [
                        { id: 'sample-1', question: 'Welcome! This is a sample card. What is the capital of France?', answer: 'Paris', repetition: 0, easeFactor: 2.5, interval: 0, dueDate: Date.now() },
                        { id: 'sample-2', question: 'You can load new decks from the trivia API below or create your own in "Manage Decks".', answer: 'Let\'s get learning!', repetition: 0, easeFactor: 2.5, interval: 0, dueDate: Date.now() },
                    ]
                },
                activeDeckName: 'Sample Deck'
            };
            saveAppData();
        }
    }

    function updateDeckNameDisplay() {
        deckNameDisplay.textContent = `Current Deck: ${appData.activeDeckName}`;
    }

    // --- Core Review Logic (SM2, Card Selection, etc.) ---
    function calculateSM2(card, quality) {
        if (quality < 3) {
            card.repetition = 0;
            card.interval = 1;
        } else {
            card.repetition += 1;
            if (card.repetition === 1) card.interval = 1;
            else if (card.repetition === 2) card.interval = 6;
            else card.interval = Math.ceil(card.interval * card.easeFactor);
        }
        card.easeFactor += (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (card.easeFactor < 1.3) card.easeFactor = 1.3;
        const oneDayInMillis = 24 * 60 * 60 * 1000;
        card.dueDate = Date.now() + card.interval * oneDayInMillis;
        saveAppData();
    }

    function getNextCard() {
        const activeDeck = appData.decks[appData.activeDeckName];
        if (!activeDeck || activeDeck.length === 0) return null;
        const now = Date.now();
        const dueCards = activeDeck.filter(card => card.dueDate <= now);
        if (dueCards.length > 0) {
            dueCards.sort((a, b) => a.dueDate - b.dueDate);
            return dueCards[0];
        }
        return null;
    }

    function showCard(card) {
        currentCard = card;
        const noCardsMessage = document.getElementById('no-cards-message') || document.createElement('p');
        noCardsMessage.id = 'no-cards-message';
        document.querySelector('.container').appendChild(noCardsMessage);

        if (currentCard) {
            flashcardContainer.style.display = 'block';
            questionText.textContent = currentCard.question;
            answerText.textContent = currentCard.answer;
            flashcard.classList.remove('is-flipped');
            difficultyControls.style.display = 'none';
            flipBtn.style.display = 'block';
            noCardsMessage.style.display = 'none';
        } else {
            flashcardContainer.style.display = 'none';
            flipBtn.style.display = 'none';
            difficultyControls.style.display = 'none';
            noCardsMessage.textContent = `No cards due for review in "${appData.activeDeckName}". Great job!`;
            noCardsMessage.style.display = 'block';
        }
        updateDeckNameDisplay();
    }

    // --- Deck Management Modal Logic ---
    function openDeckManager() {
        populateDeckSelector();
        deckManagerModal.style.display = 'block';
    }

    function closeDeckManager() {
        deckManagerModal.style.display = 'none';
        // Refresh the main view in case the active deck was changed/deleted
        const nextCard = getNextCard();
        showCard(nextCard);
    }

    function populateDeckSelector() {
        deckSelector.innerHTML = '';
        for (const deckName in appData.decks) {
            const option = document.createElement('option');
            option.value = deckName;
            option.textContent = deckName;
            if (deckName === appData.activeDeckName) {
                option.selected = true;
            }
            deckSelector.appendChild(option);
        }
        renderCardList(deckSelector.value);
    }

    function renderCardList(deckName) {
        cardListContainer.innerHTML = '';
        const deck = appData.decks[deckName];
        if (!deck) return;

        deck.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card-list-item';
            cardEl.innerHTML = `<p>${card.question}</p><button class="delete-card-btn" data-card-id="${card.id}">&times;</button>`;
            cardListContainer.appendChild(cardEl);
        });
    }

    // --- API Integration ---
    async function fetchNewDeck(categoryId, categoryName) {
        loader.style.display = 'block';
        loadDeckBtn.disabled = true;
        try {
            const response = await fetch(`https://opentdb.com/api.php?amount=10&category=${categoryId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.response_code !== 0) {
                alert('Could not fetch new questions. Please try a different category.');
                return;
            }
            const newDeckName = `Trivia: ${categoryName}`;
            appData.decks[newDeckName] = data.results.map((item, index) => ({
                id: `${categoryId}-${Date.now()}-${index}`,
                question: new DOMParser().parseFromString(item.question, "text/html").documentElement.textContent,
                answer: new DOMParser().parseFromString(item.correct_answer, "text/html").documentElement.textContent,
                repetition: 0, easeFactor: 2.5, interval: 0, dueDate: Date.now(),
            }));
            appData.activeDeckName = newDeckName;
            saveAppData();
            const nextCard = getNextCard();
            showCard(nextCard);
        } catch (error) {
            console.error("Failed to fetch new deck:", error);
            alert("Failed to load new deck. Please check your connection and try again.");
        } finally {
            loader.style.display = 'none';
            loadDeckBtn.disabled = false;
        }
    }

    // --- Event Listeners ---
    // Main review controls
    flipBtn.addEventListener('click', () => { if (currentCard) { flashcard.classList.add('is-flipped'); difficultyControls.style.display = 'flex'; flipBtn.style.display = 'none'; }});
    difficultyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            if (!currentCard) return;
            const quality = {'hard': 0, 'good': 3, 'easy': 5}[e.target.dataset.difficulty];
            calculateSM2(currentCard, quality);
            showCard(getNextCard());
        });
    });
    loadDeckBtn.addEventListener('click', () => {
        const selectedCategory = categorySelector.value;
        const selectedCategoryName = categorySelector.options[categorySelector.selectedIndex].text;
        fetchNewDeck(selectedCategory, selectedCategoryName);
    });

    // Deck manager controls
    manageDecksBtn.addEventListener('click', openDeckManager);
    closeModalBtn.addEventListener('click', closeDeckManager);
    deckSelector.addEventListener('change', () => {
        const selectedDeck = deckSelector.value;
        appData.activeDeckName = selectedDeck;
        saveAppData();
        renderCardList(selectedDeck);
    });
    createDeckBtn.addEventListener('click', () => {
        const newName = newDeckNameInput.value.trim();
        if (newName && !appData.decks[newName]) {
            appData.decks[newName] = [];
            appData.activeDeckName = newName;
            saveAppData();
            populateDeckSelector();
            newDeckNameInput.value = '';
        } else {
            alert('Deck name cannot be empty or already exist.');
        }
    });
    deleteDeckBtn.addEventListener('click', () => {
        const deckToDelete = deckSelector.value;
        if (Object.keys(appData.decks).length <= 1) {
            alert("Cannot delete the last remaining deck.");
            return;
        }
        if (confirm(`Are you sure you want to delete the deck "${deckToDelete}"?`)) {
            delete appData.decks[deckToDelete];
            appData.activeDeckName = Object.keys(appData.decks)[0]; // Switch to first available deck
            saveAppData();
            populateDeckSelector();
        }
    });
    addCardBtn.addEventListener('click', () => {
        const question = newCardQuestionInput.value.trim();
        const answer = newCardAnswerInput.value.trim();
        const selectedDeckName = deckSelector.value;
        if (question && answer && selectedDeckName) {
            const newCard = {
                id: `custom-${Date.now()}`,
                question, answer, repetition: 0, easeFactor: 2.5, interval: 0, dueDate: Date.now()
            };
            appData.decks[selectedDeckName].push(newCard);
            saveAppData();
            renderCardList(selectedDeckName);
            newCardQuestionInput.value = '';
            newCardAnswerInput.value = '';
        } else {
            alert('Please fill in both question and answer.');
        }
    });
    cardListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-card-btn')) {
            const cardId = e.target.dataset.cardId;
            const selectedDeckName = deckSelector.value;
            const deck = appData.decks[selectedDeckName];
            const cardIndex = deck.findIndex(card => card.id === cardId);
            if (cardIndex > -1) {
                deck.splice(cardIndex, 1);
                saveAppData();
                renderCardList(selectedDeckName);
            }
        }
    });

    // --- Initial Load ---
    function initializeApp() {
        loadAppData();
        showCard(getNextCard());
    }

    initializeApp();
});
