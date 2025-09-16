document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const deckNameDisplay = document.getElementById('deckNameDisplay');
    const studyMode = document.getElementById('studyMode');
    const recallView = document.getElementById('recall-view');
    const quizView = document.getElementById('quiz-view');

    // Recall View Elements
    const flashcard = document.getElementById('flashcard');
    const questionText = document.getElementById('questionText');
    const answerText = document.getElementById('answerText');
    const difficultyControls = document.getElementById('difficulty-controls');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const interactiveControls = document.getElementById('interactive-controls');
    const answerInput = document.getElementById('answerInput');
    const submitAnswerBtn = document.getElementById('submitAnswerBtn');
    const answerResult = document.getElementById('answerResult');

    // Quiz View Elements
    const quizProgress = document.getElementById('quiz-progress');
    const quizScore = document.getElementById('quiz-score');
    const quizQuestion = document.getElementById('quiz-question');
    const quizOptionsContainer = document.getElementById('quiz-options-container');
    const quizFeedback = document.getElementById('quiz-feedback');
    const nextQuizBtn = document.getElementById('next-quiz-btn');

    // Deck Loader Elements
    const categorySelector = document.getElementById('categorySelector');
    const loadDeckBtn = document.getElementById('loadDeckBtn');
    const loader = document.getElementById('loader');

    // Daily Review Elements
    const startDailyReviewBtn = document.getElementById('start-daily-review-btn');
    const dailyReviewCount = document.getElementById('daily-review-count');

    // Deck Manager Modal Elements
    const manageDecksBtn = document.getElementById('manageDecksBtn');
    const deckManagerModal = document.getElementById('deckManagerModal');
    const closeDeckManagerBtn = deckManagerModal.querySelector('.close-btn');

    // Statistics Modal Elements
    const statsBtn = document.getElementById('statsBtn');
    const statsModal = document.getElementById('statsModal');
    const maturityChartCtx = document.getElementById('maturityChart').getContext('2d');
    const forecastChartCtx = document.getElementById('forecastChart').getContext('2d');
    const heatmapContainer = document.getElementById('heatmap-container');
    const closeStatsModalBtn = statsModal.querySelector('.close-btn');

    const newDeckNameInput = document.getElementById('newDeckName');
    const createDeckBtn = document.getElementById('createDeckBtn');
    const importDeckBtn = document.getElementById('importDeckBtn');
    const importDeckInput = document.getElementById('importDeckInput');
    const deckSelector = document.getElementById('deckSelector');
    const exportDeckBtn = document.getElementById('exportDeckBtn');
    const deleteDeckBtn = document.getElementById('deleteDeckBtn');
    const newCardQuestionInput = document.getElementById('newCardQuestion');
    const newCardAnswerInput = document.getElementById('newCardAnswer');
    const newCardQuestionImageUrl = document.getElementById('newCardQuestionImageUrl');
    const newCardAnswerImageUrl = document.getElementById('newCardAnswerImageUrl');
    const newCardQuestionAudioUrl = document.getElementById('newCardQuestionAudioUrl');
    const newCardAnswerAudioUrl = document.getElementById('newCardAnswerAudioUrl');
    const addCardBtn = document.getElementById('addCardBtn');
    const cardListContainer = document.getElementById('card-list-container');

    let appData = {};
    let currentCard = null;
    let quizState = {};
    let isDailyReviewActive = false;
    let dailyReviewDeck = [];

    // --- Data & State Management ---
    function saveAppData() {
        localStorage.setItem('flashcardAppData', JSON.stringify(appData));
    }

    function loadAppData() {
        const storedData = localStorage.getItem('flashcardAppData');
        if (storedData) {
            appData = JSON.parse(storedData);
            Object.values(appData.decks).forEach(deck => {
                deck.forEach(card => {
                    if (!card.incorrect_answers) card.incorrect_answers = [];
                });
            });
        } else {
            appData = {
                decks: { 'Sample Deck': [
                    { id: 'sample-1', question: 'Welcome! What is the capital of France?', answer: 'Paris', incorrect_answers: ['London', 'Berlin', 'Madrid'], repetition: 0, easeFactor: 2.5, interval: 0, dueDate: Date.now() },
                    { id: 'sample-2', question: 'This app now has a Quiz Mode. What is 2 + 2?', answer: '4', incorrect_answers: ['3', '5', '6'], repetition: 0, easeFactor: 2.5, interval: 0, dueDate: Date.now() },
                ]},
                activeDeckName: 'Sample Deck'
            };
            saveAppData();
        }
        if (!appData.reviewHistory) {
            appData.reviewHistory = [];
        }
    }

    // --- View Switching ---
    function setStudyMode(mode) {
        isDailyReviewActive = false; // Always reset daily review mode when switching
        if (mode === 'recall') {
            quizView.style.display = 'none';
            recallView.style.display = 'block';
            showCard(getNextCard());
        } else if (mode === 'quiz') {
            recallView.style.display = 'none';
            quizView.style.display = 'block';
            startQuiz();
        }
    }

    // --- Daily Review Logic ---
    function updateDailyReviewCount() {
        const now = Date.now();
        const allDueCards = Object.values(appData.decks).flat().filter(card => card.dueDate <= now);
        dailyReviewCount.textContent = `(${allDueCards.length})`;
    }

    function startDailyReview() {
        const now = Date.now();
        dailyReviewDeck = Object.values(appData.decks).flat().filter(card => card.dueDate <= now);

        if (dailyReviewDeck.length === 0) {
            alert("No cards are due for review today!");
            return;
        }

        dailyReviewDeck.sort(() => 0.5 - Math.random()); // Shuffle the daily deck
        isDailyReviewActive = true;
        studyMode.value = 'recall'; // Daily review always uses recall mode
        quizView.style.display = 'none';
        recallView.style.display = 'block';
        showCard(getNextCard()); // getNextCard will now use the daily review deck
    }

    // --- Recall Mode Logic ---
    function getNextCard() {
        if (isDailyReviewActive) {
            return dailyReviewDeck.length > 0 ? dailyReviewDeck[0] : null;
        }

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
        answerResult.style.display = 'none';
        answerResult.className = 'answer-result';
        interactiveControls.style.display = 'none';
        const noCardsMessage = document.getElementById('no-cards-message') || document.createElement('p');
        noCardsMessage.id = 'no-cards-message';
        recallView.appendChild(noCardsMessage);

        // Clear previous media
        document.getElementById('questionMedia').innerHTML = '';
        document.getElementById('answerMedia').innerHTML = '';

        if (currentCard) {
            document.getElementById('flashcard-container').style.display = 'block';
            questionText.textContent = currentCard.question;
            answerText.textContent = currentCard.answer;

            // Render Question Media
            if (currentCard.questionImageUrl) {
                const img = document.createElement('img');
                img.src = currentCard.questionImageUrl;
                document.getElementById('questionMedia').appendChild(img);
            }
            if (currentCard.questionAudioUrl) {
                const audio = document.createElement('audio');
                audio.src = currentCard.questionAudioUrl;
                audio.controls = true;
                document.getElementById('questionMedia').appendChild(audio);
            }

            // Render Answer Media
            if (currentCard.answerImageUrl) {
                const img = document.createElement('img');
                img.src = currentCard.answerImageUrl;
                document.getElementById('answerMedia').appendChild(img);
            }
            if (currentCard.answerAudioUrl) {
                const audio = document.createElement('audio');
                audio.src = currentCard.answerAudioUrl;
                audio.controls = true;
                document.getElementById('answerMedia').appendChild(audio);
            }

            flashcard.classList.remove('is-flipped');
            difficultyControls.style.display = 'none';
            interactiveControls.style.display = 'flex';
            answerInput.value = '';
            noCardsMessage.style.display = 'none';
            setTimeout(() => answerInput.focus(), 100);
        } else {
            interactiveControls.style.display = 'none';
            difficultyControls.style.display = 'none';
            document.getElementById('flashcard-container').style.display = 'none';
            noCardsMessage.textContent = `No cards due for review in "${appData.activeDeckName}". Great job!`;
            noCardsMessage.style.display = 'block';
        }
        if (isDailyReviewActive) {
            deckNameDisplay.textContent = `Daily Review (${dailyReviewDeck.length} cards remaining)`;
        } else {
            deckNameDisplay.textContent = `Current Deck: ${appData.activeDeckName}`;
        }
    }

    function checkAnswer() {
        if (!currentCard) return;
        const userAnswer = answerInput.value.trim().toLowerCase();
        const correctAnswer = currentCard.answer.trim().toLowerCase();
        interactiveControls.style.display = 'none';
        answerResult.style.display = 'block';
        if (userAnswer === correctAnswer) {
            answerResult.textContent = 'Correct!';
            answerResult.classList.add('correct');
        } else {
            answerResult.textContent = `Incorrect. The correct answer was: ${currentCard.answer}`;
            answerResult.classList.add('incorrect');
        }
        flashcard.classList.add('is-flipped');
        difficultyControls.style.display = 'flex';
    }

    function calculateSM2(card, quality) {
        // If in a daily review, find the original card to update
        let originalCard = card;
        if (isDailyReviewActive) {
            for (const deckName in appData.decks) {
                const foundCard = appData.decks[deckName].find(c => c.id === card.id);
                if (foundCard) {
                    originalCard = foundCard;
                    break;
                }
            }
        }

        if (quality < 3) {
            originalCard.repetition = 0;
            originalCard.interval = 1;
        } else {
            originalCard.repetition = (originalCard.repetition || 0) + 1;
            if (originalCard.repetition === 1) {
                originalCard.interval = 1;
            } else if (originalCard.repetition === 2) {
                originalCard.interval = 6;
            } else {
                originalCard.interval = Math.ceil((originalCard.interval || 1) * originalCard.easeFactor);
            }
        }
        originalCard.easeFactor = (originalCard.easeFactor || 2.5) + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (originalCard.easeFactor < 1.3) originalCard.easeFactor = 1.3;

        const oneDayInMillis = 24 * 60 * 60 * 1000;
        originalCard.dueDate = Date.now() + originalCard.interval * oneDayInMillis;

        appData.reviewHistory.push({
            cardId: originalCard.id,
            timestamp: Date.now(),
            quality: quality
        });

        saveAppData();
    }

    // --- Quiz Mode Logic ---
    function startQuiz() {
        recallView.style.display = 'none';
        quizView.style.display = 'block';
        const activeDeck = appData.decks[appData.activeDeckName];
        if (!activeDeck || activeDeck.length < 4) {
            quizQuestion.textContent = 'Quiz mode requires at least 4 cards in the deck.';
            quizOptionsContainer.innerHTML = '';
            quizProgress.textContent = '';
            quizScore.textContent = '';
            return;
        }
        quizState = {
            questions: [...activeDeck].sort(() => 0.5 - Math.random()),
            currentQuestionIndex: 0,
            score: 0,
        };
        showQuizQuestion();
    }

    function showQuizQuestion() {
        quizFeedback.textContent = '';
        nextQuizBtn.style.display = 'none';

        const quizMediaContainer = document.getElementById('quizQuestionMedia');
        quizMediaContainer.innerHTML = '';

        const questionData = quizState.questions[quizState.currentQuestionIndex];

        if (questionData.questionImageUrl) {
            const img = document.createElement('img');
            img.src = questionData.questionImageUrl;
            quizMediaContainer.appendChild(img);
        }
        if (questionData.questionAudioUrl) {
            const audio = document.createElement('audio');
            audio.src = questionData.questionAudioUrl;
            audio.controls = true;
            quizMediaContainer.appendChild(audio);
        }

        quizQuestion.textContent = questionData.question;
        quizProgress.textContent = `Question: ${quizState.currentQuestionIndex + 1} / ${quizState.questions.length}`;
        quizScore.textContent = `Score: ${quizState.score}`;

        const options = generateQuizOptions(questionData);
        quizOptionsContainer.innerHTML = '';
        options.forEach(optionText => {
            const optionBtn = document.createElement('button');
            optionBtn.className = 'quiz-option-btn';
            optionBtn.textContent = optionText;
            optionBtn.addEventListener('click', handleOptionClick);
            quizOptionsContainer.appendChild(optionBtn);
        });
    }

    function generateQuizOptions(card) {
        let options = [...card.incorrect_answers];
        if (options.length < 3) {
            const otherAnswers = appData.decks[appData.activeDeckName]
                .filter(c => c.id !== card.id)
                .map(c => c.answer);
            options = [...new Set([...options, ...otherAnswers])];
        }
        options = options.sort(() => 0.5 - Math.random()).slice(0, 3);
        options.push(card.answer);
        return options.sort(() => 0.5 - Math.random());
    }

    function handleOptionClick(e) {
        const selectedBtn = e.target;
        const selectedAnswer = selectedBtn.textContent;
        const correctAnswer = quizState.questions[quizState.currentQuestionIndex].answer;

        document.querySelectorAll('.quiz-option-btn').forEach(btn => btn.disabled = true);

        if (selectedAnswer === correctAnswer) {
            selectedBtn.classList.add('correct');
            quizFeedback.textContent = 'Correct!';
            quizState.score++;
        } else {
            selectedBtn.classList.add('incorrect');
            quizFeedback.textContent = `Incorrect! The answer was: ${correctAnswer}`;
        }
        quizScore.textContent = `Score: ${quizState.score}`;
        nextQuizBtn.style.display = 'block';
    }

    function handleNextQuizClick() {
        quizState.currentQuestionIndex++;
        if (quizState.currentQuestionIndex < quizState.questions.length) {
            showQuizQuestion();
        } else {
            quizQuestion.textContent = 'Quiz Complete!';
            quizOptionsContainer.innerHTML = `You scored ${quizState.score} out of ${quizState.questions.length}.`;
            nextQuizBtn.style.display = 'none';
            quizFeedback.textContent = '';
        }
    }

    // --- Statistics Logic ---
    function getReviewDataForCalendar() {
        const reviewsByDay = {};
        appData.reviewHistory.forEach(review => {
            const date = new Date(review.timestamp).toISOString().split('T')[0];
            if (!reviewsByDay[date]) {
                reviewsByDay[date] = 0;
            }
            reviewsByDay[date]++;
        });
        return reviewsByDay;
    }

    function getCardMaturityData() {
        const maturity = { new: 0, learning: 0, mature: 0 };
        const allCards = Object.values(appData.decks).flat();
        allCards.forEach(card => {
            if (card.interval >= 21) {
                maturity.mature++;
            } else if (card.interval >= 1) {
                maturity.learning++;
            } else {
                maturity.new++;
            }
        });
        return maturity;
    }

    function getUpcomingReviewsData() {
        const forecast = Array(7).fill(0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const oneDayInMillis = 24 * 60 * 60 * 1000;

        const allCards = Object.values(appData.decks).flat();
        allCards.forEach(card => {
            const diff = card.dueDate - today.getTime();
            if (diff >= 0 && diff < 7 * oneDayInMillis) {
                const dayIndex = Math.floor(diff / oneDayInMillis);
                forecast[dayIndex]++;
            }
        });
        return forecast;
    }

    let maturityChartInstance, forecastChartInstance;

    function renderStatistics() {
        const maturityData = getCardMaturityData();
        const forecastData = getUpcomingReviewsData();

        if (maturityChartInstance) maturityChartInstance.destroy();
        maturityChartInstance = new Chart(maturityChartCtx, {
            type: 'pie',
            data: {
                labels: ['New', 'Learning', 'Mature'],
                datasets: [{
                    label: 'Card Maturity',
                    data: [maturityData.new, maturityData.learning, maturityData.mature],
                    backgroundColor: ['#36a2eb', '#ffcd56', '#4bc0c0'],
                }]
            },
        });

        if (forecastChartInstance) forecastChartInstance.destroy();
        forecastChartInstance = new Chart(forecastChartCtx, {
            type: 'bar',
            data: {
                labels: ['Today', '+1 Day', '+2 Days', '+3 Days', '+4 Days', '+5 Days', '+6 Days'],
                datasets: [{
                    label: 'Upcoming Reviews',
                    data: forecastData,
                    backgroundColor: '#ff6384',
                }]
            },
            options: {
                scales: { y: { beginAtZero: true } }
            }
        });

        // Simple heatmap rendering (can be improved later)
        const heatmapData = getReviewDataForCalendar();
        heatmapContainer.innerHTML = 'Last 30 days of reviews:<br>';
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            const count = heatmapData[dateString] || 0;
            const cell = document.createElement('span');
            cell.style.display = 'inline-block';
            cell.style.width = '20px';
            cell.style.height = '20px';
            cell.style.backgroundColor = `rgba(0, 123, 255, ${Math.min(count / 10, 1)})`;
            cell.title = `${dateString}: ${count} reviews`;
            heatmapContainer.appendChild(cell);
        }
    }

    function openStatsModal() {
        statsModal.style.display = 'block';
        renderStatistics();
    }

    function closeStatsModal() {
        statsModal.style.display = 'none';
    }


    // --- Deck Management Modal Logic ---
    function openDeckManager() {
        populateDeckSelector();
        deckManagerModal.style.display = 'block';
    }

    function closeDeckManager() {
        deckManagerModal.style.display = 'none';
        setStudyMode(studyMode.value);
    }

    function populateDeckSelector() {
        const currentDeck = deckSelector.value || appData.activeDeckName;
        deckSelector.innerHTML = '';
        for (const deckName in appData.decks) {
            const option = document.createElement('option');
            option.value = deckName;
            option.textContent = deckName;
            deckSelector.appendChild(option);
        }
        deckSelector.value = appData.decks[currentDeck] ? currentDeck : appData.activeDeckName;
        renderCardList(deckSelector.value);
    }

    function renderCardList(deckName) {
        cardListContainer.innerHTML = '';
        const deck = appData.decks[deckName];
        if (!deck) return;
        deck.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card-list-item';

            let mediaIcon = '';
            if (card.questionImageUrl || card.answerImageUrl || card.questionAudioUrl || card.answerAudioUrl) {
                mediaIcon = '<span class="media-icon" title="This card contains multimedia">📎</span>';
            }

            cardEl.innerHTML = `<p>${card.question} ${mediaIcon}</p><button class="delete-card-btn" data-card-id="${card.id}">&times;</button>`;
            cardListContainer.appendChild(cardEl);
        });
    }

    function exportDeck() {
        const deckNameToExport = deckSelector.value;
        const deck = appData.decks[deckNameToExport];
        if (!deck) {
            alert('Could not find the selected deck to export.');
            return;
        }

        // Create a Blob from the JSON data
        const dataStr = JSON.stringify(deck, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);

        // Create a temporary link to trigger the download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${deckNameToExport.replace(/\s+/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();

        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importDeck(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const deckData = JSON.parse(e.target.result);

                // Basic validation
                if (!Array.isArray(deckData) || deckData.some(card => !card.question || !card.answer)) {
                    throw new Error('Invalid deck format.');
                }

                let deckName = file.name.replace(/\.json$/, '').replace(/[-_]/g, ' ');
                let originalDeckName = deckName;
                let counter = 1;
                while (appData.decks[deckName]) {
                    deckName = `${originalDeckName} (${counter++})`;
                }

                // Sanitize and add default values to imported cards
                appData.decks[deckName] = deckData.map(card => ({
                    ...card,
                    id: `imported-${Date.now()}-${Math.random()}`,
                    repetition: 0,
                    easeFactor: 2.5,
                    interval: 0,
                    dueDate: Date.now(),
                    incorrect_answers: card.incorrect_answers || [],
                }));

                appData.activeDeckName = deckName;
                saveAppData();
                populateDeckSelector();
                alert(`Deck "${deckName}" imported successfully!`);

            } catch (error) {
                alert('Failed to import deck. Please make sure it is a valid JSON file with the correct structure.');
                console.error("Error importing deck:", error);
            } finally {
                // Reset file input to allow importing the same file again
                importDeckInput.value = '';
            }
        };
        reader.readAsText(file);
    }

    // --- API Integration ---
    async function fetchNewDeck(categoryId, categoryName) {
        loader.style.display = 'block';
        loadDeckBtn.disabled = true;
        try {
            const response = await fetch(`https://opentdb.com/api.php?amount=10&type=multiple&category=${categoryId}`);
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
                incorrect_answers: item.incorrect_answers.map(ia => new DOMParser().parseFromString(ia, "text/html").documentElement.textContent),
                repetition: 0, easeFactor: 2.5, interval: 0, dueDate: Date.now(),
            }));
            appData.activeDeckName = newDeckName;
            saveAppData();
            studyMode.value = 'quiz';
            setStudyMode('quiz');
        } catch (error) {
            console.error("Failed to fetch new deck:", error);
            alert("Failed to load new deck. Please check your connection and try again.");
        } finally {
            loader.style.display = 'none';
            loadDeckBtn.disabled = false;
        }
    }

    // --- Event Listeners ---
    studyMode.addEventListener('change', (e) => setStudyMode(e.target.value));
    startDailyReviewBtn.addEventListener('click', startDailyReview);
    submitAnswerBtn.addEventListener('click', checkAnswer);
    answerInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkAnswer(); });
    nextQuizBtn.addEventListener('click', handleNextQuizClick);

    difficultyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            if (!currentCard) return;
            const quality = {'hard': 0, 'good': 3, 'easy': 5}[e.target.dataset.difficulty];
            calculateSM2(currentCard, quality);

            if (isDailyReviewActive) {
                // Remove the card from the temporary daily deck
                dailyReviewDeck.shift();
            }

            showCard(getNextCard());
            updateDailyReviewCount(); // Update the count on the main button
        });
    });

    loadDeckBtn.addEventListener('click', () => {
        const selectedCategory = categorySelector.value;
        const selectedCategoryName = categorySelector.options[categorySelector.selectedIndex].text;
        fetchNewDeck(selectedCategory, selectedCategoryName);
    });

    manageDecksBtn.addEventListener('click', openDeckManager);
    closeDeckManagerBtn.addEventListener('click', closeDeckManager);
    statsBtn.addEventListener('click', openStatsModal);
    closeStatsModalBtn.addEventListener('click', closeStatsModal);
    exportDeckBtn.addEventListener('click', exportDeck);
    importDeckBtn.addEventListener('click', () => importDeckInput.click());
    importDeckInput.addEventListener('change', importDeck);

    deckSelector.addEventListener('change', () => {
        appData.activeDeckName = deckSelector.value;
        saveAppData();
        renderCardList(deckSelector.value);
        setStudyMode(studyMode.value);
    });

    createDeckBtn.addEventListener('click', () => {
        const newName = newDeckNameInput.value.trim();
        if (newName && !appData.decks[newName]) {
            appData.decks[newName] = [];
            appData.activeDeckName = newName;
            saveAppData();
            populateDeckSelector();
            newDeckNameInput.value = '';
        } else { alert('Deck name cannot be empty or already exist.'); }
    });

    deleteDeckBtn.addEventListener('click', () => {
        if (Object.keys(appData.decks).length <= 1) { alert("Cannot delete the last remaining deck."); return; }
        const deckToDelete = deckSelector.value;
        if (confirm(`Are you sure you want to delete the deck "${deckToDelete}"?`)) {
            delete appData.decks[deckToDelete];
            appData.activeDeckName = Object.keys(appData.decks)[0];
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
                question,
                answer,
                questionImageUrl: newCardQuestionImageUrl.value.trim(),
                answerImageUrl: newCardAnswerImageUrl.value.trim(),
                questionAudioUrl: newCardQuestionAudioUrl.value.trim(),
                answerAudioUrl: newCardAnswerAudioUrl.value.trim(),
                incorrect_answers: [],
                repetition: 0,
                easeFactor: 2.5,
                interval: 0,
                dueDate: Date.now()
            };
            appData.decks[selectedDeckName].push(newCard);
            saveAppData();
            renderCardList(selectedDeckName);
            // Clear all inputs
            newCardQuestionInput.value = '';
            newCardAnswerInput.value = '';
            newCardQuestionImageUrl.value = '';
            newCardAnswerImageUrl.value = '';
            newCardQuestionAudioUrl.value = '';
            newCardAnswerAudioUrl.value = '';
        } else { alert('Please fill in both question and answer.'); }
    });

    cardListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-card-btn')) {
            const cardId = e.target.dataset.cardId;
            const selectedDeckName = deckSelector.value;
            const deck = appData.decks[selectedDeckName];
            const cardIndex = deck.findIndex(card => card.id === cardId);
            if (cardIndex > -1) { deck.splice(cardIndex, 1); saveAppData(); renderCardList(selectedDeckName); }
        }
    });

    // --- Initial Load ---
    function initializeApp() {
        loadAppData();
        setStudyMode(studyMode.value);
        updateDailyReviewCount();
    }

    initializeApp();
});
