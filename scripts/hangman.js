
// Specify Maximum Guesses Allowed
const maxGuesses = 6;

// DOM constants
const hintEl = document.getElementById("hint");
const imgEl = document.getElementById("hangman-img");
const wordWrap = document.getElementById("word-wrap");
const guessForm = document.getElementById("guess-form");
const letterInput = document.getElementById("letter");
const keyboard = document.getElementById("keyboard");
const statusEl = document.getElementById("status");
const playAgainBtn = document.getElementById("play-again");

// Game state object 
const game = {
  word: "",
  hint: "",
  // letters guessed correctly
  correct: new Set(),
  // letters guessed incorrectly
  wrong: new Set(),
  over: false,

getMaskedWord() {
  return this.word
    // Split the string from json into individual characters
    .split("")
    .map((ch) => {
      // display non-letter characters automatically (e.g spaces)
      if (!/[A-Z]/.test(ch)) return ch;

      // Has the user guessed this letter already, reveal if guessed, maintain _ if not
      return this.correct.has(ch) ? ch : " _ ";
    })
    .join("");
  },

  // Has the user won?  
  isWin() {
    return this.word
      .split("")
      // filter only letters
      .filter((ch) => /[A-Z]/.test(ch)) 
      // check every character is guessed (including the spaces if applicable to the randomly selected word from the json)
      .every((ch) => this.correct.has(ch));
  },

  // Has the user made too many wrong guesses?
  isLose() {
    return this.wrong.size >= maxGuesses;
  }
};

// Math.random to randomly select a word for the user to solve
function getRandomWord(w) {
  return w[Math.floor(Math.random() * w.length)];
}

// Set the image to correspond with the current number of incorrect guesses
function setImage(maxGuesses) {
  if (maxGuesses <= 0){
    imgEl.src = "../images/hangman-0.jpg";
  }
  else if (maxGuesses === 1){
    imgEl.src = "../images/hangman-1.jpg";
  }
  else if (maxGuesses === 2){
    imgEl.src = "../images/hangman-2.jpg";
  }
  else if (maxGuesses === 3){
    imgEl.src = "../images/hangman-3.jpg";
  }
  else if (maxGuesses === 4){
    imgEl.src = "../images/hangman-4.jpg";
  }
  else if (maxGuesses === 5){
    imgEl.src = "../images/hangman-5.jpg";
  }
  else{
    imgEl.src = "../images/hangman-6.jpg";
  }
}

// Update text with number of wrong guesses
function updateUI() {
  wordWrap.textContent = game.getMaskedWord();
  // Animation - trigger css
  wordWrap.classList.remove("fade-in")
  void wordWrap.offsetWidth; /* https://css-tricks.com/restart-css-animation/ */
  wordWrap.classList.add("fade-in")
  setImage(game.wrong.size);
  statusEl.textContent = `Wrong guesses: ${game.wrong.size}/${maxGuesses}`;
}

/* 
Prevent guesses after the game is over or while word is loading
Re-enable inputs when starting new game
*/ 
function setDisabledAllInputs(disabled) {
  letterInput.disabled = disabled;
  guessForm.querySelector('input[type="submit"]').disabled = disabled;
  keyboard.querySelectorAll("button").forEach((btn) => {
    btn.disabled = disabled || btn.dataset.used === "true";
  });
}

// Present end of game message and display the play again button
function endGame(message) {
  game.over = true;
  statusEl.textContent = message;
  setDisabledAllInputs(true);
  playAgainBtn.hidden = false;
}

// For each single guess by the user
function guessLetter(ch) {
  if (game.over) return;

  // All user inputs are standardized to upper case
  const letter = ch.toUpperCase();

  // Only letters A-Z permitted
  if (!/^[A-Z]$/.test(letter)) return;

  // Ignore if already used
  if (game.correct.has(letter) || game.wrong.has(letter)) return;

  // Mark onscreen key as used
  const keyBtn = keyboard.querySelector(`button[data-letter="${letter}"]`);
  if (keyBtn) {
    keyBtn.dataset.used = "true";
    keyBtn.disabled = true;
    keyBtn.classList.add("used");
  }

  // Update if word contains the letter
  if (game.word.includes(letter)) {
    game.correct.add(letter);
  } 
  // Update if the wrong letter was guessed
  else {
    game.wrong.add(letter);
  }

  updateUI();

  // If the user won the game, return the word and say they won
  if (game.isWin()) {
    endGame(`You WIN! The word was "${game.word}".`);
  } 
  // If the user lost the game, return the word advising they were unsuccessful
  else if (game.isLose()) {
    endGame(`Sorry. The word was "${game.word}".`);
  }
}

/* 
Creating keyboard buttons
and adding event listeners
https://www.geeksforgeeks.org/javascript/build-a-hangman-game-using-javascript/
*/
function buildKeyboard() {
  keyboard.innerHTML = "";
  const A = "A".charCodeAt(0);
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(A + i);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = letter;
    btn.setAttribute("aria-label", `Letter ${letter}`);
    btn.dataset.letter = letter;
    btn.addEventListener("click", () => guessLetter(letter));
    keyboard.appendChild(btn);
  }
}

/*
Fetch the words from the json file...
https://www.w3schools.com/Js/js_json.asp
https://www.geeksforgeeks.org/javascript/read-json-file-using-javascript/
*/
function loadWords() {
  return fetch("../scripts/words.json")
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load words.json: ${response.status}`);
      }
      return response.json();
    })
    .then(data => data.items || [])
    .catch(error => {
      console.error("Error fetching JSON:", error);
      throw error; 
    });
}

// Reset Game State
function resetGameState(game){
  game.word = "";
  game.hint = "";
  game.correct = new Set();
  game.wrong = new Set();
  game.over = false;  
}

// Reset User Interface
function resetUI(){
  statusEl.textContent = "";
  playAgainBtn.hidden = true;
  buildKeyboard();
  // Mark keys unused
  keyboard.querySelectorAll("button").forEach((b) => {
    b.dataset.used = "false";
    b.disabled = false;
    b.classList.remove("used");
  });
  setDisabledAllInputs(false);
  letterInput.value = "";
  letterInput.focus();  
}

// Get a word for the game
function getGameWord() {
  // Load and pick word
  return loadWords()
    .then((items) => {
      const chosen = getRandomWord(items);

      return {
        word: (chosen.word || "JAVASCRIPT").toUpperCase(),
        hint: chosen.hint || "No hint available"
      };
    })
    .catch((err) => {
      console.error(err);

      // Fallback if fetch fails (e.g., file not served)
      return {
        word: "JAVASCRIPT",
        hint: "Language that powers the web"
      };
    });
}

// Prepare a new game
function newGame() {
  resetGameState(game);
  resetUI();

  getGameWord().then((data) => {
    game.word = data.word;
    game.hint = data.hint;

    hintEl.textContent = game.hint;

    updateUI();
  });
}


// Listen for user input (guesses)
guessForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const val = (letterInput.value || "").trim();
  if (val) {
    guessLetter(val[0]);
    letterInput.value = "";
    letterInput.focus();
  }
});

// Add event for the user to be presented with the play again button 
playAgainBtn.addEventListener("click", () => {
  newGame();
});

// Start
document.addEventListener("DOMContentLoaded", () => {
  newGame();
});
