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
    const amountSelector = document.getElementById('amountSelector');
    const loadDeckBtn = document.getElementById('loadDeckBtn');
    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loader-text');

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

    // Gamification Elements
    const streakDisplay = document.getElementById('streak-display');
    const achievementsBtn = document.getElementById('achievementsBtn');
    const achievementsModal = document.getElementById('achievementsModal');
    const closeAchievementsModalBtn = achievementsModal.querySelector('.close-btn');
    const achievementsListContainer = document.getElementById('achievements-list-container');

    // Leech Management Elements
    const leechManagerBtn = document.getElementById('leechManagerBtn');
    const leechCount = document.getElementById('leech-count');
    const leechManagerModal = document.getElementById('leechManagerModal');
    const closeLeechModalBtn = leechManagerModal.querySelector('.close-btn');
    const leechCardQuestion = document.getElementById('leechCardQuestion');
    const leechCardAnswer = document.getElementById('leechCardAnswer');
    const leechSaveChangesBtn = document.getElementById('leechSaveChangesBtn');
    const leechSuspendBtn = document.getElementById('leechSuspendBtn');
    const leechListModal = document.getElementById('leechListModal');
    const closeLeechListModalBtn = leechListModal.querySelector('.close-btn');
    const leechListContainer = document.getElementById('leech-list-container');

    const newDeckNameInput = document.getElementById('newDeckName');
    const createDeckBtn = document.getElementById('createDeckBtn');
    const importDeckBtn = document.getElementById('importDeckBtn');
    const importDeckInput = document.getElementById('importDeckInput');
    const importTxtBtn = document.getElementById('importTxtBtn');
    const importTxtInput = document.getElementById('importTxtInput');
    const txtSeparator = document.getElementById('txtSeparator');
    const importPdfBtn = document.getElementById('importPdfBtn');
    const importPdfInput = document.getElementById('importPdfInput');
    const importDocxBtn = document.getElementById('importDocxBtn');
    const importDocxInput = document.getElementById('importDocxInput');
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
    let isLeechModalFromReview = false;

    // --- Data & State Management ---
    function saveAppData() {
        localStorage.setItem('flashcardAppData', JSON.stringify(appData));
    }

    function loadAppData() {
        const storedData = localStorage.getItem('flashcardAppData');
        if (storedData) {
            appData = JSON.parse(storedData);
            // Data migration for older versions
            Object.values(appData.decks).forEach(deck => {
                deck.forEach(card => {
                    if (!card.incorrect_answers) card.incorrect_answers = [];
                    if (card.leechScore === undefined) card.leechScore = 0;
                    if (card.isLeech === undefined) card.isLeech = false;
                });
            });
        } else {
            appData = {
                decks: { 'Sample Deck': [
                    { id: 'sample-1', question: 'Welcome! What is the capital of France?', answer: 'Paris', incorrect_answers: ['London', 'Berlin', 'Madrid'], repetition: 0, easeFactor: 2.5, interval: 0, dueDate: Date.now(), leechScore: 0, isLeech: false },
                    { id: 'sample-2', question: 'This app now has a Quiz Mode. What is 2 + 2?', answer: '4', incorrect_answers: ['3', '5', '6'], repetition: 0, easeFactor: 2.5, interval: 0, dueDate: Date.now(), leechScore: 0, isLeech: false },
                ]},
                activeDeckName: 'Sample Deck'
            };
            saveAppData();
        }
        if (!appData.reviewHistory) appData.reviewHistory = [];
        if (!appData.gamification) {
            appData.gamification = {
                currentStreak: 0,
                longestStreak: 0,
                lastStudyDay: null,
                unlockedAchievements: []
            };
        }
    }

    // --- View Switching ---
    function setStudyMode(mode) {
        isDailyReviewActive = false;
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
        const allDueCards = Object.values(appData.decks).flat().filter(card => card.dueDate <= now && !card.isLeech);
        dailyReviewCount.textContent = `(${allDueCards.length})`;
    }

    function startDailyReview() {
        const now = Date.now();
        dailyReviewDeck = Object.values(appData.decks).flat().filter(card => card.dueDate <= now && !card.isLeech);

        if (dailyReviewDeck.length === 0) {
            alert("No cards are due for review today!");
            return;
        }

        dailyReviewDeck.sort(() => 0.5 - Math.random());
        isDailyReviewActive = true;
        studyMode.value = 'recall';
        quizView.style.display = 'none';
        recallView.style.display = 'block';
        showCard(getNextCard());
    }

    // --- Recall Mode Logic ---
    function getNextCard() {
        if (isDailyReviewActive) {
            return dailyReviewDeck.length > 0 ? dailyReviewDeck[0] : null;
        }

        const activeDeck = appData.decks[appData.activeDeckName];
        if (!activeDeck || activeDeck.length === 0) return null;

        const now = Date.now();
        const dueCards = activeDeck.filter(card => card.dueDate <= now && !card.isLeech);
        return dueCards.length > 0 ? dueCards.sort((a, b) => a.dueDate - b.dueDate)[0] : null;
    }

    function showCard(card) {
        currentCard = card;
        answerResult.style.display = 'none';
        answerResult.className = 'answer-result';
        interactiveControls.style.display = 'none';
        const noCardsMessage = document.getElementById('no-cards-message') || document.createElement('p');
        noCardsMessage.id = 'no-cards-message';
        recallView.appendChild(noCardsMessage);

        document.getElementById('questionMedia').innerHTML = '';
        document.getElementById('answerMedia').innerHTML = '';

        if (currentCard) {
            document.getElementById('flashcard-container').style.display = 'block';
            questionText.textContent = currentCard.question;
            answerText.textContent = currentCard.answer;

            if (currentCard.questionImageUrl) {
                const img = document.createElement('img'); img.src = currentCard.questionImageUrl;
                document.getElementById('questionMedia').appendChild(img);
            }
            if (currentCard.questionAudioUrl) {
                const audio = document.createElement('audio'); audio.src = currentCard.questionAudioUrl; audio.controls = true;
                document.getElementById('questionMedia').appendChild(audio);
            }
            if (currentCard.answerImageUrl) {
                const img = document.createElement('img'); img.src = currentCard.answerImageUrl;
                document.getElementById('answerMedia').appendChild(img);
            }
            if (currentCard.answerAudioUrl) {
                const audio = document.createElement('audio'); audio.src = currentCard.answerAudioUrl; audio.controls = true;
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
        deckNameDisplay.textContent = isDailyReviewActive ? `Daily Review (${dailyReviewDeck.length} cards remaining)` : `Current Deck: ${appData.activeDeckName}`;
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
        let originalCard = card;
        if (isDailyReviewActive) {
            for (const deckName in appData.decks) {
                const foundCard = appData.decks[deckName].find(c => c.id === card.id);
                if (foundCard) { originalCard = foundCard; break; }
            }
        }

        if (quality < 3) {
            originalCard.repetition = 0;
            originalCard.interval = 1;
            originalCard.leechScore = (originalCard.leechScore || 0) + 1;
        } else {
            originalCard.leechScore = Math.max(0, (originalCard.leechScore || 0) - 1);
            originalCard.repetition = (originalCard.repetition || 0) + 1;
            if (originalCard.repetition === 1) originalCard.interval = 1;
            else if (originalCard.repetition === 2) originalCard.interval = 6;
            else originalCard.interval = Math.ceil((originalCard.interval || 1) * originalCard.easeFactor);
        }
        originalCard.easeFactor = (originalCard.easeFactor || 2.5) + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (originalCard.easeFactor < 1.3) originalCard.easeFactor = 1.3;

        originalCard.dueDate = Date.now() + originalCard.interval * 24 * 60 * 60 * 1000;

        appData.reviewHistory.push({ cardId: originalCard.id, timestamp: Date.now(), quality: quality });

        const today = new Date().toISOString().split('T')[0];
        if (appData.gamification.lastStudyDay !== today) {
            if (appData.gamification.lastStudyDay === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
                appData.gamification.currentStreak++;
            } else {
                appData.gamification.currentStreak = 1;
            }
            appData.gamification.lastStudyDay = today;
            if (appData.gamification.currentStreak > appData.gamification.longestStreak) {
                appData.gamification.longestStreak = appData.gamification.currentStreak;
            }
            if (appData.gamification.currentStreak >= 3) checkAndUnlockAchievement('streak_3');
            if (appData.gamification.currentStreak >= 7) checkAndUnlockAchievement('streak_7');
        }

        checkAndUnlockAchievement('first_review');
        if (Object.values(appData.decks).flat().filter(c => c.interval >= 21).length >= 10) {
            checkAndUnlockAchievement('deck_master_10');
        }

        if (originalCard.leechScore >= 4 && !originalCard.isLeech) {
            originalCard.isLeech = true;
            updateLeechCount();
            handleLeech(originalCard, true);
        }

        saveAppData();
    }

    // --- Quiz Mode Logic ---
    function startQuiz() {
        const activeDeck = appData.decks[appData.activeDeckName];
        if (!activeDeck || activeDeck.length < 4) {
            quizQuestion.textContent = 'Quiz mode requires at least 4 cards in the deck.';
            quizOptionsContainer.innerHTML = ''; quizProgress.textContent = ''; quizScore.textContent = '';
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
            const img = document.createElement('img'); img.src = questionData.questionImageUrl;
            quizMediaContainer.appendChild(img);
        }
        if (questionData.questionAudioUrl) {
            const audio = document.createElement('audio'); audio.src = questionData.questionAudioUrl; audio.controls = true;
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
            const otherAnswers = appData.decks[appData.activeDeckName].filter(c => c.id !== card.id).map(c => c.answer);
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

    // --- Leech Management Logic ---
    function updateLeechCount() {
        const allLeeches = Object.values(appData.decks).flat().filter(card => card.isLeech);
        leechCount.textContent = allLeeches.length;
    }

    function findCardById(cardId) {
        for (const deck of Object.values(appData.decks)) {
            const card = deck.find(c => c.id === cardId);
            if (card) return card;
        }
        return null;
    }

    function renderLeechList() {
        leechListContainer.innerHTML = '';
        const allLeeches = Object.values(appData.decks).flat().filter(card => card.isLeech);

        if (allLeeches.length === 0) {
            leechListContainer.innerHTML = '<p>No leeches found. Good job!</p>';
            return;
        }

        allLeeches.forEach(card => {
            const item = document.createElement('div');
            item.className = 'leech-list-item';
            item.innerHTML = `
                <p title="${card.question}">${card.question}</p>
                <div class="leech-item-actions">
                    <button class="edit-leech-btn" data-card-id="${card.id}">Edit</button>
                    <button class="suspend-leech-btn" data-card-id="${card.id}">Suspend</button>
                </div>
            `;
            leechListContainer.appendChild(item);
        });
    }

    function openLeechListModal() {
        renderLeechList();
        leechListModal.style.display = 'block';
    }

    function closeLeechListModal() {
        leechListModal.style.display = 'none';
    }

    function handleLeech(card, fromReview = false) {
        isLeechModalFromReview = fromReview;
        leechCardToHandle = card;
        leechCardQuestion.value = card.question;
        leechCardAnswer.value = card.answer;
        leechManagerModal.style.display = 'block';
    }

    function closeLeechModal() {
        leechManagerModal.style.display = 'none';
        if (isLeechModalFromReview) {
            showCard(getNextCard());
        }
        leechCardToHandle = null;
    }

    function resolveLeechByEditing() {
        if (!leechCardToHandle) return;
        const newQuestion = leechCardQuestion.value.trim();
        const newAnswer = leechCardAnswer.value.trim();

        if (newQuestion && newAnswer) {
            leechCardToHandle.question = newQuestion;
            leechCardToHandle.answer = newAnswer;
            leechCardToHandle.isLeech = false;
            leechCardToHandle.leechScore = 0;
            saveAppData();
            updateLeechCount();
            if (leechListModal.style.display === 'block') {
                renderLeechList();
            }
            closeLeechModal();
        } else {
            alert('Question and Answer cannot be empty.');
        }
    }

    function resolveLeechBySuspending() {
        if (!leechCardToHandle) return;
        leechCardToHandle.dueDate = Date.now() + 24 * 60 * 60 * 1000;
        leechCardToHandle.isLeech = false;
        leechCardToHandle.leechScore = 0;
        saveAppData();
        updateLeechCount();
        if (leechListModal.style.display === 'block') {
            renderLeechList();
        }
        closeLeechModal();
    }

    // --- Gamification Logic ---
    const ACHIEVEMENTS = {
        first_deck: { name: 'Creator', description: 'Create your first deck.' },
        first_review: { name: 'Getting Started', description: 'Complete your first review.' },
        streak_3: { name: 'On a Roll', description: 'Maintain a 3-day study streak.' },
        streak_7: { name: 'Committed', description: 'Maintain a 7-day study streak.' },
        deck_master_10: { name: 'Novice', description: 'Get 10 cards to "Mature" status.'},
    };

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.className = toast.className.replace('show', '');
            document.body.removeChild(toast);
        }, 3000);
    }

    function checkAndUnlockAchievement(achievementId) {
        if (!appData.gamification.unlockedAchievements.includes(achievementId)) {
            appData.gamification.unlockedAchievements.push(achievementId);
            const achievement = ACHIEVEMENTS[achievementId];
            showToast(`Achievement Unlocked: ${achievement.name}!`);
            saveAppData();
        }
    }

    function updateStreak() {
        const today = new Date().toISOString().split('T')[0];
        const lastDay = appData.gamification.lastStudyDay;
        if (lastDay && lastDay !== today && lastDay !== new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
            appData.gamification.currentStreak = 0;
        }
        updateStreakDisplay();
    }

    function updateStreakDisplay() {
        const streak = appData.gamification.currentStreak;
        if (streak > 0) {
            streakDisplay.textContent = `🔥 ${streak}`;
            streakDisplay.title = `${streak}-day study streak!`;
        } else {
            streakDisplay.textContent = '';
        }
    }

    function renderAchievements() {
        achievementsListContainer.innerHTML = '';
        for (const id in ACHIEVEMENTS) {
            const achievement = ACHIEVEMENTS[id];
            const isUnlocked = appData.gamification.unlockedAchievements.includes(id);
            const item = document.createElement('div');
            item.className = 'achievement-item' + (isUnlocked ? ' unlocked' : '');
            item.innerHTML = `<h4>${achievement.name}</h4><p>${achievement.description}</p>`;
            achievementsListContainer.appendChild(item);
        }
    }

    function openAchievementsModal() {
        renderAchievements();
        achievementsModal.style.display = 'block';
    }

    function closeAchievementsModal() {
        achievementsModal.style.display = 'none';
    }

    // --- Statistics Logic ---
    function getReviewDataForCalendar() {
        const reviewsByDay = {};
        appData.reviewHistory.forEach(review => {
            const date = new Date(review.timestamp).toISOString().split('T')[0];
            reviewsByDay[date] = (reviewsByDay[date] || 0) + 1;
        });
        return reviewsByDay;
    }

    function getCardMaturityData() {
        const maturity = { new: 0, learning: 0, mature: 0 };
        Object.values(appData.decks).flat().forEach(card => {
            if (card.interval >= 21) maturity.mature++;
            else if (card.interval >= 1) maturity.learning++;
            else maturity.new++;
        });
        return maturity;
    }

    function getUpcomingReviewsData() {
        const forecast = Array(7).fill(0);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const oneDayInMillis = 24 * 60 * 60 * 1000;
        Object.values(appData.decks).flat().forEach(card => {
            const diff = card.dueDate - today.getTime();
            if (diff >= 0 && diff < 7 * oneDayInMillis) {
                forecast[Math.floor(diff / oneDayInMillis)]++;
            }
        });
        return forecast;
    }

    let maturityChartInstance, forecastChartInstance;
    function renderStatistics() {
        if (maturityChartInstance) maturityChartInstance.destroy();
        if (forecastChartInstance) forecastChartInstance.destroy();

        const maturityData = getCardMaturityData();
        maturityChartInstance = new Chart(maturityChartCtx, {
            type: 'pie',
            data: {
                labels: ['New', 'Learning', 'Mature'],
                datasets: [{ data: [maturityData.new, maturityData.learning, maturityData.mature], backgroundColor: ['#36a2eb', '#ffcd56', '#4bc0c0'] }]
            },
        });

        const forecastData = getUpcomingReviewsData();
        forecastChartInstance = new Chart(forecastChartCtx, {
            type: 'bar',
            data: {
                labels: Array.from({length: 7}, (_, i) => `+${i} Day${i > 0 ? 's' : ''}`),
                datasets: [{ label: 'Upcoming Reviews', data: forecastData, backgroundColor: '#ff6384' }]
            },
            options: { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });

        const heatmapData = getReviewDataForCalendar();
        heatmapContainer.innerHTML = 'Last 30 days of reviews:<br>';
        for (let i = 29; i >= 0; i--) {
            const date = new Date(); date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            const count = heatmapData[dateString] || 0;
            const cell = document.createElement('span');
            cell.className = 'heatmap-cell';
            cell.style.backgroundColor = `rgba(0, 123, 255, ${Math.min(count / 10, 1)})`;
            cell.title = `${dateString}: ${count} reviews`;
            heatmapContainer.appendChild(cell);
        }
    }

    function openStatsModal() { statsModal.style.display = 'block'; renderStatistics(); }
    function closeStatsModal() { statsModal.style.display = 'none'; }

    // --- Deck Management Modal Logic ---
    function openDeckManager() { populateDeckSelector(); deckManagerModal.style.display = 'block'; }
    function closeDeckManager() { deckManagerModal.style.display = 'none'; setStudyMode(studyMode.value); }

    function populateDeckSelector() {
        const currentDeck = deckSelector.value || appData.activeDeckName;
        deckSelector.innerHTML = '';
        Object.keys(appData.decks).forEach(deckName => {
            const option = document.createElement('option');
            option.value = deckName; option.textContent = deckName;
            deckSelector.appendChild(option);
        });
        deckSelector.value = appData.decks[currentDeck] ? currentDeck : Object.keys(appData.decks)[0];
        appData.activeDeckName = deckSelector.value;
        renderCardList(deckSelector.value);
    }

    function renderCardList(deckName) {
        cardListContainer.innerHTML = '';
        const deck = appData.decks[deckName];
        if (!deck) return;
        deck.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card-list-item';
            const mediaIcon = (card.questionImageUrl || card.answerImageUrl || card.questionAudioUrl || card.answerAudioUrl) ? '<span class="media-icon" title="This card contains multimedia">📎</span>' : '';
            cardEl.innerHTML = `<p>${card.question} ${mediaIcon}</p><button class="delete-card-btn" data-card-id="${card.id}">&times;</button>`;
            cardListContainer.appendChild(cardEl);
        });
    }

    function exportDeck() {
        const deck = appData.decks[deckSelector.value];
        if (!deck) return;
        const dataStr = JSON.stringify(deck, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url; a.download = `${deckSelector.value.replace(/\s+/g, '-')}.json`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    function importDeck(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const deckData = JSON.parse(e.target.result);
                if (!Array.isArray(deckData) || deckData.some(c => !c.question || !c.answer)) throw new Error('Invalid deck format.');
                let deckName = file.name.replace(/\.json$/, '').replace(/[-_]/g, ' ');
                let originalDeckName = deckName; let counter = 1;
                while (appData.decks[deckName]) deckName = `${originalDeckName} (${counter++})`;
                appData.decks[deckName] = deckData.map(card => ({
                    ...card, id: `imported-${Date.now()}-${Math.random()}`,
                    repetition: 0, easeFactor: 2.5, interval: 0, dueDate: Date.now(), leechScore: 0, isLeech: false,
                    incorrect_answers: card.incorrect_answers || [],
                }));
                appData.activeDeckName = deckName;
                saveAppData(); populateDeckSelector();
                alert(`Deck "${deckName}" imported successfully!`);
            } catch (error) {
                alert('Failed to import deck.'); console.error(error);
            } finally {
                importDeckInput.value = '';
            }
        };
        reader.readAsText(file);
    }

    function createDeckFromText(text, fileName) {
        const separator = txtSeparator.value.trim();
        if (!separator) {
            alert('Please provide a separator.');
            return;
        }

        const parts = text.split(separator);
        const cards = [];
        for (let i = 0; i < parts.length - 1; i += 2) {
            const question = parts[i].trim();
            const answer = parts[i + 1].trim();
            if (question && answer) {
                cards.push({
                    id: `file-${Date.now()}-${cards.length}`,
                    question,
                    answer,
                    incorrect_answers: [],
                    repetition: 0, easeFactor: 2.5, interval: 0, dueDate: Date.now(), leechScore: 0, isLeech: false,
                });
            }
        }

        if (cards.length === 0) {
            throw new Error('No valid card pairs found. Make sure your file is formatted correctly with the separator.');
        }

        let deckName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        let originalDeckName = deckName; let counter = 1;
        while (appData.decks[deckName]) deckName = `${originalDeckName} (${counter++})`;

        appData.decks[deckName] = cards;
        appData.activeDeckName = deckName;
        saveAppData();
        populateDeckSelector();
        alert(`Deck "${deckName}" with ${cards.length} cards imported successfully!`);
    }

    function importDeckFromTxt(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                createDeckFromText(e.target.result, file.name);
            } catch (error) {
                alert('Failed to import deck from text file. ' + error.message);
                console.error(error);
            } finally {
                importTxtInput.value = '';
            }
        };
        reader.readAsText(file);
    }

    function handlePdfUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const pdfData = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    fullText += textContent.items.map(item => item.str).join(' ') + '\n';
                }
                createDeckFromText(fullText.trim(), file.name);
            } catch (error) {
                alert('Failed to import deck from PDF. ' + error.message);
                console.error(error);
            } finally {
                importPdfInput.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function handleDocxUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                const result = await mammoth.extractRawText({ arrayBuffer });
                createDeckFromText(result.value, file.name);
            } catch (error) {
                alert('Failed to import deck from DOCX file. ' + error.message);
                console.error(error);
            } finally {
                importDocxInput.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // --- API Integration ---
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    async function fetchNewDeck(categoryId, categoryName, amount) {
        loader.style.display = 'flex'; loadDeckBtn.disabled = true;
        loaderText.textContent = '';
        let allResults = [];

        try {
            const numAmount = parseInt(amount, 10);
            const maxPerRequest = 50;
            let requestsNeeded = Math.ceil(numAmount / maxPerRequest);
            let amountRemaining = numAmount;

            for (let i = 0; i < requestsNeeded; i++) {
                const amountToFetch = Math.min(maxPerRequest, amountRemaining);
                loaderText.textContent = `Loading ${allResults.length} of ${numAmount}...`;

                const response = await fetch(`https://opentdb.com/api.php?amount=${amountToFetch}&type=multiple&category=${categoryId}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const data = await response.json();
                if (data.response_code === 1) {
                    alert('Not enough questions in this category to fulfill the request. The deck will be created with the questions found.');
                    break;
                }
                if (data.response_code !== 0) {
                    throw new Error(`API returned response code ${data.response_code}`);
                }

                allResults.push(...data.results);
                amountRemaining -= amountToFetch;

                if (i < requestsNeeded - 1) {
                    await sleep(5000); // Wait 5 seconds to respect rate limit
                }
            }

            if(allResults.length === 0) {
                alert('Could not fetch any new questions.');
                return;
            }

            const newDeckName = `Trivia: ${categoryName} (${allResults.length} cards)`;
            appData.decks[newDeckName] = allResults.map((item, index) => ({
                id: `${categoryId}-${Date.now()}-${index}`,
                question: new DOMParser().parseFromString(item.question, "text/html").documentElement.textContent,
                answer: new DOMParser().parseFromString(item.correct_answer, "text/html").documentElement.textContent,
                incorrect_answers: item.incorrect_answers.map(ia => new DOMParser().parseFromString(ia, "text/html").documentElement.textContent),
                repetition: 0, easeFactor: 2.5, interval: 0, dueDate: Date.now(), leechScore: 0, isLeech: false,
            }));
            appData.activeDeckName = newDeckName;
            saveAppData(); studyMode.value = 'quiz'; setStudyMode('quiz');
        } catch (error) {
            console.error(error); alert("Failed to load new deck. " + error.message);
        } finally {
            loader.style.display = 'none'; loadDeckBtn.disabled = false;
            loaderText.textContent = '';
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
            if (isDailyReviewActive) dailyReviewDeck.shift();
            showCard(getNextCard());
            updateDailyReviewCount();
        });
    });

    loadDeckBtn.addEventListener('click', () => {
        const categoryId = categorySelector.value;
        const categoryName = categorySelector.options[categorySelector.selectedIndex].text;
        const amount = amountSelector.value;
        fetchNewDeck(categoryId, categoryName, amount);
    });
    manageDecksBtn.addEventListener('click', openDeckManager);
    closeDeckManagerBtn.addEventListener('click', closeDeckManager);
    statsBtn.addEventListener('click', openStatsModal);
    closeStatsModalBtn.addEventListener('click', closeStatsModal);
    achievementsBtn.addEventListener('click', openAchievementsModal);
    closeAchievementsModalBtn.addEventListener('click', closeAchievementsModal);
    leechSaveChangesBtn.addEventListener('click', resolveLeechByEditing);
    leechSuspendBtn.addEventListener('click', resolveLeechBySuspending);
    closeLeechModalBtn.addEventListener('click', closeLeechModal);
    exportDeckBtn.addEventListener('click', exportDeck);
    importDeckBtn.addEventListener('click', () => importDeckInput.click());
    importDeckInput.addEventListener('change', importDeck);
    importTxtBtn.addEventListener('click', () => importTxtInput.click());
    importTxtInput.addEventListener('change', importDeckFromTxt);
    importPdfBtn.addEventListener('click', () => importPdfInput.click());
    importPdfInput.addEventListener('change', handlePdfUpload);
    importDocxBtn.addEventListener('click', () => importDocxInput.click());
    importDocxInput.addEventListener('change', handleDocxUpload);

    leechManagerBtn.addEventListener('click', openLeechListModal);
    closeLeechListModalBtn.addEventListener('click', closeLeechListModal);
    leechListContainer.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const cardId = button.dataset.cardId;
        if (!cardId) return;

        const card = findCardById(cardId);
        if (!card) return;

        if (button.classList.contains('edit-leech-btn')) {
            // Don't close the list modal, so the user returns to it after editing.
            handleLeech(card, false);
        } else if (button.classList.contains('suspend-leech-btn')) {
            card.dueDate = Date.now() + 24 * 60 * 60 * 1000;
            card.isLeech = false;
            card.leechScore = 0;
            saveAppData();
            updateLeechCount();
            renderLeechList();
        }
    });

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
            checkAndUnlockAchievement('first_deck');
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
        if (question && answer && deckSelector.value) {
            appData.decks[deckSelector.value].push({
                id: `custom-${Date.now()}`, question, answer,
                questionImageUrl: newCardQuestionImageUrl.value.trim(),
                answerImageUrl: newCardAnswerImageUrl.value.trim(),
                questionAudioUrl: newCardQuestionAudioUrl.value.trim(),
                answerAudioUrl: newCardAnswerAudioUrl.value.trim(),
                incorrect_answers: [], repetition: 0, easeFactor: 2.5, interval: 0, dueDate: Date.now(), leechScore: 0, isLeech: false
            });
            saveAppData();
            renderCardList(deckSelector.value);
            [newCardQuestionInput, newCardAnswerInput, newCardQuestionImageUrl, newCardAnswerImageUrl, newCardQuestionAudioUrl, newCardAnswerAudioUrl].forEach(i => i.value = '');
        } else { alert('Please fill in both question and answer.'); }
    });

    cardListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-card-btn')) {
            const cardId = e.target.dataset.cardId;
            const deck = appData.decks[deckSelector.value];
            const cardIndex = deck.findIndex(card => card.id === cardId);
            if (cardIndex > -1) { deck.splice(cardIndex, 1); saveAppData(); renderCardList(deckSelector.value); }
        }
    });

    // --- Initial Load ---
    function initializeApp() {
        loadAppData();
        updateStreak();
        updateStreakDisplay();
        updateLeechCount();
        populateDeckSelector();
        setStudyMode(studyMode.value);
        updateDailyReviewCount();
    }

    initializeApp();
});
