// App state
const state = {
    usedIndexes: new Set(),
    currentQuote: null,
    isFetching: false,
    isSpeaking: false,
    availableCategories: new Set(['all', 'motivation', 'inspiration', 'success']), 
    currentCategory: 'all' ,// Default category
    quotes: [
        { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela", tags: ["motivation", "success"]  },
        { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", tags: ["motivation", "success"]  },
        { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" , tags: ["motivation", "success"] },
        { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", tags: ["motivation", "success"]  },
        { text: "You only live once, but if you do it right, once is enough.", author: "Mae West" },
        { text: "In the end, we will remember not the words of our enemies, but the silence of our friends.", author: "Martin Luther King Jr.", tags: ["motivation"]  },
        { text: "The purpose of our lives is to be happy.", author: "Dalai Lama", tags: ["motivation", "success"]  },
        { text: "Get busy living or get busy dying.", author: "Stephen King", tags: ["motivation", "success"]  },
        { text: "You have to be odd to be number one.", author: "Dr. Seuss", tags: ["motivation", "success"]  },
        { text: "You have within you right now, everything you need to deal with whatever the world can throw at you.", author: "Brian Tracy", tags: ["motivation", "inspiration"]  },
        { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", tags: ["motivation", "inspiration"]  },
        { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", tags: ["motivation", "inspiration"] },
        { text: "Act as if what you do makes a difference. It does.", author: "William James", tags: ["motivation", "inspiration"]  },
        { text: "Success is not how high you have climbed, but how you make a positive difference to the world.", author: "Roy T. Bennett", tags: ["motivation", "inspiration"]   },
        { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", tags: ["motivation", "inspiration"]   },
        { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
        { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
        { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" }
    ]
};
// DOM elements
const elements = {
    quoteText: document.getElementById("quote-text"),
    quoteAuthor: document.getElementById("quote-author"),
    generateBtn: document.getElementById("generate-btn"),
    copyBtn: document.getElementById("copy-btn"),
    shareBtn: document.getElementById("share-btn"),
    saveBtn: document.getElementById("save-btn"),
    downloadBtn: document.getElementById("download-btn"),
    speakBtn: document.getElementById("speak-btn"),
    spinner: document.getElementById("spinner"),
    categorySelect: document.getElementById("category"),
    categorySpinner: document.getElementById("category-spinner"),
    savedQuotesBtn: document.getElementById("saved-quotes-btn"), // Added
    savedQuotesList: document.getElementById("saved-quotes-list"), // Added
    modalOverlay: document.getElementById("modal-overlay"),
    closeSaved: document.getElementById("close-saved"),
    savedQuotesModal: document.getElementById("saved-quotes-modal")};
// Initialize app
function init() {
    setupEventListeners();
    displayQuote();
    loadCategories();
}

// Event listeners
function setupEventListeners() {
    elements.generateBtn.addEventListener("click", displayQuote);
    elements.copyBtn.addEventListener("click", copyQuote);
    elements.shareBtn.addEventListener("click", shareQuote);
    elements.saveBtn.addEventListener("click", saveQuote);
    elements.downloadBtn.addEventListener("click", downloadQuote);
    elements.speakBtn.addEventListener("click", toggleSpeak);
    elements.categorySelect.addEventListener("change", handleCategoryChange);
    elements.savedQuotesBtn.addEventListener("click", showSavedQuotes);
    elements.closeSaved.addEventListener("click", hideSavedQuotes);
}

// Category functions
async function loadCategories() {
    elements.categorySpinner.style.display = "block";
    try {
        const response = await fetch("https://api.quotable.io/tags");
        const categories = await response.json();
        categories.forEach(cat => state.availableCategories.add(cat.name));
        updateCategorySelector();
    } catch (error) {
        console.log("Using default categories:", error);
    } finally {
        elements.categorySpinner.style.display = "none";
    }
}
function updateCategorySelector() {
    elements.categorySelect.innerHTML = ''; // Clear existing options

    // Add "All Categories" as the default option
    const allOption = document.createElement("option");
    allOption.value = 'all';
    allOption.textContent = 'All Categories';
    elements.categorySelect.appendChild(allOption);

    // Add other categories dynamically
    state.availableCategories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        elements.categorySelect.appendChild(option);
    });

    // Set the current category as selected
    elements.categorySelect.value = state.currentCategory;
}

function handleCategoryChange(e) {
    state.currentCategory = e.target.value; // Update the selected category
    state.usedIndexes.clear(); // Reset used indexes for the new category
    displayQuote(); // Refresh the displayed quote
}
async function displayQuote() {
    stopSpeech();
    toggleLoading(true);

    
    try {
        const quote = await getUniqueQuote();
        state.currentQuote = quote;

        // Fade animation
        elements.quoteText.style.opacity = 0;
        elements.quoteAuthor.style.opacity = 0;

        setTimeout(() => {
            elements.quoteText.textContent = `"${quote.text}"`;
            elements.quoteAuthor.textContent = `— ${quote.author}`;
            elements.quoteText.style.opacity = 1;
            elements.quoteAuthor.style.opacity = 1;
            document.body.style.backgroundColor = getRandomLightColor();
            toggleLoading(false);
        }, 300);
    } catch (error) {
        console.error("Error displaying quote:", error);
        showFeedback(elements.generateBtn, "Error!");
        toggleLoading(false);
    }
}

async function getUniqueQuote() {
    const filteredQuotes = getFilteredQuotes();

    if (state.usedIndexes.size >= filteredQuotes.length) {
        if (!state.isFetching) {
            await loadMoreQuotes();
        }
        state.usedIndexes.clear();
    }

    let index;
    let quote;
    do {
        index = Math.floor(Math.random() * filteredQuotes.length);
        quote = filteredQuotes[index];
    } while (state.usedIndexes.has(index));

    state.usedIndexes.add(index);
    return quote;
}

function getFilteredQuotes() {
    return state.quotes.filter(quote => 
        state.currentCategory === 'all' || 
        (quote.tags && quote.tags.includes(state.currentCategory))
    );
}
// Data loading functions
// Load more quotes with category filtering and duplicate check
async function loadMoreQuotes() {
    state.isFetching = true;
    toggleLoading(true); // Show spinner

    try {
        const url = state.currentCategory === 'all'
            ? "https://api.quotable.io/quotes?limit=20"
            : `https://api.quotable.io/quotes?tags=${state.currentCategory}&limit=20`;

        const response = await fetch(url);
        const data = await response.json();

        const newQuotes = data.results.map(q => ({
            text: q.content,
            author: q.author,
            tags: q.tags || []
        }));

        // Avoid duplicates by checking text and author
        state.quotes = [
            ...state.quotes,
            ...newQuotes.filter(newQuote =>
                !state.quotes.some(existing =>
                    existing.text === newQuote.text && existing.author === newQuote.author
                )
            )
        ];
    } catch (error) {
        console.error("Failed to fetch quotes:", error);
    } finally {
        state.isFetching = false;
        toggleLoading(false); // Hide spinner
    }
}


// Saved quotes functionality
function loadSavedQuotes() {
    return JSON.parse(localStorage.getItem("savedQuotes") || "[]");
}

function showSavedQuotes() {
    const savedQuotes = loadSavedQuotes();
    elements.savedQuotesList.innerHTML = '';
    
    if (savedQuotes.length === 0) {
        elements.savedQuotesList.innerHTML = '<li>No saved quotes yet</li>';
        return;
    }

    savedQuotes.forEach((quote, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
        <blockquote>"${quote.text}"</blockquote>
            <cite>— ${quote.author}</cite>
            <button class="load-saved" data-index="${index}">Load</button>
            <button class="delete-saved" data-index="${index}">Delete</button>
        `;
        elements.savedQuotesList.appendChild(li);
    });

    // Add event listeners to the new buttons
    document.querySelectorAll('.load-saved').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            loadSavedQuote(index);
        });
    });
    document.querySelectorAll('.delete-saved').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            deleteSavedQuote(index);
        });
    });
}
function hideSavedQuotes() {
    elements.savedQuotesModal.style.display = 'none';
    elements.modalOverlay.style.display = 'none';
} 
function loadSavedQuote(index) {
    const savedQuotes = loadSavedQuotes();
    if (index >= 0 && index < savedQuotes.length) {
        state.currentQuote = savedQuotes[index];
        displayQuote();
    }
}

function deleteSavedQuote(index) {
    let savedQuotes = loadSavedQuotes();
    if (index >= 0 && index < savedQuotes.length) {
        savedQuotes.splice(index, 1);
        localStorage.setItem("savedQuotes", JSON.stringify(savedQuotes));
        showSavedQuotes();
    }
}

function toggleLoading(isLoading) {
    elements.spinner.style.display = isLoading ? "block" : "none";
}
// Helpers
function getRandomLightColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 80%, 90%)`;
}

function copyQuote() {
    if (!state.currentQuote) return;
    const text = `"${state.currentQuote.text}" — ${state.currentQuote.author}`;
    navigator.clipboard.writeText(text)
        .then(() => showFeedback(elements.copyBtn, "Copied!"))
        .catch(() => showFeedback(elements.copyBtn, "Failed"));
}

function shareQuote() {
    if (!state.currentQuote) return;
    const text = `"${state.currentQuote.text}" — ${state.currentQuote.author}`;
    if (navigator.share) {
        navigator.share({ title: 'Quote', text, url: window.location.href });
    } else {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
    }
}

function saveQuote() {
    if (!state.currentQuote) return;
    const savedQuotes = JSON.parse(localStorage.getItem("savedQuotes") || "[]");
    savedQuotes.push({ ...state.currentQuote, savedAt: new Date().toISOString() });
    localStorage.setItem("savedQuotes", JSON.stringify(savedQuotes));
    showFeedback(elements.saveBtn, "Saved!");
}

function downloadQuote() {
    if (!state.currentQuote) return;
    const text = `"${state.currentQuote.text}" — ${state.currentQuote.author}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quote_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showFeedback(elements.downloadBtn, "Downloaded!");
}

function toggleSpeak() {
    if (state.isSpeaking) {
        stopSpeech();
    } else {
        speakCurrentQuote();
    }
}

function speakCurrentQuote() {
    if (!state.currentQuote || state.isSpeaking) return;
    const text = `${state.currentQuote.text} by ${state.currentQuote.author}`;
    const utterance = new SpeechSynthesisUtterance(text);

    elements.quoteText.style.color = "#007BFF";
    elements.quoteAuthor.style.fontWeight = "bold";

    utterance.onend = () => {
        state.isSpeaking = false;
        elements.speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> Speak';
        elements.quoteText.style.color = "";
        elements.quoteAuthor.style.fontWeight = "";
    };

    utterance.onerror = () => {
        state.isSpeaking = false;
        elements.speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> Speak';
    };

    window.speechSynthesis.speak(utterance);
    state.isSpeaking = true;
    elements.speakBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
}

function stopSpeech() {
    window.speechSynthesis.cancel();
    state.isSpeaking = false;
    elements.speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> Speak';
}

function showFeedback(button, message) {
    const originalHTML = button.innerHTML;
    button.innerHTML = `<i class="fas fa-check"></i> ${message}`;
    setTimeout(() => {
        button.innerHTML = originalHTML;
    }, 2000);
}

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        stopSpeech();
    }
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        stopSpeech();
    }
});

// Update init function
function init() {
    setupEventListeners();
    loadCategories(); // Load available categories
    displayQuote();
}
document.addEventListener("DOMContentLoaded", init);