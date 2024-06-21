import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

const appSettings = {
    databaseURL: "https://shoppinglist-f3431-default-rtdb.firebaseio.com/",
    apiKey: "AIzaSyBUqXdJ-z9YtBIPk9a-0G1z-qbTypx_IJQ",
    authDomain: "shoppinglist-f3431.firebaseapp.com",
    projectId: "shoppinglist-f3431",
    storageBucket: "gs://shoppinglist-f3431.appspot.com",
    messagingSenderId: "5416398529",
    appId: "1:5416398529:web:cdc897e9913a0db73eae40"
};

const app = initializeApp(appSettings);
const database = getDatabase(app);
const auth = getAuth(app);

const inputFieldEl = document.getElementById("input-field");
const addButtonEl = document.getElementById("add-button");
const shoppingListEl = document.getElementById("shopping-list");
const errorMessageEl = document.getElementById("error-message");
const usernameEl = document.getElementById("username");
const logoutButtonEl = document.getElementById("logout-button");

let userId = null;
let isAdding = false; // Adding debounce flag

onAuthStateChanged(auth, (user) => {
    if (user) {
        userId = user.uid;
        usernameEl.textContent = user.email;  // Display the user's email
        setupShoppingList();
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('shopping-container').style.display = 'block';
    } else {
        userId = null;
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('shopping-container').style.display = 'none';
    }
});

// Function to handle user sign up
function signUp(email, password) {
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            userId = user.uid;
            usernameEl.textContent = user.email;  // Display the user's email
            setupShoppingList();
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('shopping-container').style.display = 'block';
            errorMessageEl.style.display = 'none';  // Hide error message on successful sign-up
        })
        .catch((error) => {
            console.error("Error signing up:", error);
            let errorMessage = "Error signing up. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "This email is already in use. Please try logging in.";
            }
            errorMessageEl.textContent = errorMessage;  // Display the error message
            errorMessageEl.style.display = 'block';  // Show error message
        });
}

// Function to handle user login
function logIn(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            userId = user.uid;
            usernameEl.textContent = user.email;  // Display the user's email
            setupShoppingList();
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('shopping-container').style.display = 'block';
            errorMessageEl.style.display = 'none';  // Hide error message on successful login
        })
        .catch((error) => {
            console.error("Error logging in:", error);
            errorMessageEl.textContent = "Incorrect username or password. Please try again.";
            errorMessageEl.style.display = 'block';  // Show error message on login failure
        });
}

// Function to handle user logout
function logOut() {
    signOut(auth).then(() => {
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('shopping-container').style.display = 'none';
        console.log("User logged out successfully");
    }).catch((error) => {
        console.error("Error logging out:", error);
    });
}

// Function to set up the shopping list for the logged-in user
function setupShoppingList() {
    const shoppingListInDB = ref(database, `shoppingLists/${userId}`);

    onValue(shoppingListInDB, function(snapshot) {
        if (snapshot.exists()) {
            let itemsArray = Object.entries(snapshot.val());
        
            clearShoppingListEl();
            
            let fragment = document.createDocumentFragment();
            for (let i = 0; i < itemsArray.length; i++) {
                let currentItem = itemsArray[i];
                appendItemToShoppingListEl(currentItem, fragment);
            }
            shoppingListEl.appendChild(fragment);
        } else {
            shoppingListEl.innerHTML = "Your cart is empty. Let's fill it up!";
        }
    });

    // Add event listeners only once
    addButtonEl.removeEventListener("click", handleAddItem);
    addButtonEl.addEventListener("click", handleAddItem);

    inputFieldEl.removeEventListener("keydown", handleKeyDown);
    inputFieldEl.addEventListener("keydown", handleKeyDown);
}

function handleAddItem() {
    if (isAdding) return; // Debounce check
    isAdding = true;

    const shoppingListInDB = ref(database, `shoppingLists/${userId}`);
    let inputValue = inputFieldEl.value.trim();
    if (inputValue !== "") {
        push(shoppingListInDB, inputValue).then(() => {
            console.log(`Added item: ${inputValue}`);
            clearInputFieldEl();
        }).catch((error) => {
            console.error("Error adding item:", error);
        }).finally(() => {
            isAdding = false; // Reset debounce flag
        });
    } else {
        console.log("Ignored empty input");
        isAdding = false; // Reset debounce flag
    }
}

function handleKeyDown(event) {
    if (event.key === "Enter") {
        handleAddItem();
    }
}

// Helper functions
function clearShoppingListEl() {
    shoppingListEl.innerHTML = "";
}

function clearInputFieldEl() {
    inputFieldEl.value = "";
}

function appendItemToShoppingListEl(item, fragment) {
    let itemID = item[0];
    let itemValue = item[1];
    
    let newEl = document.createElement("li");
    newEl.textContent = itemValue;
    newEl.setAttribute("data-id", itemID);
    
    newEl.addEventListener("click", function() {
        let exactLocationOfItemInDB = ref(database, `shoppingLists/${userId}/${itemID}`);
        
        remove(exactLocationOfItemInDB).catch((error) => {
            console.error("Error removing item:", error);
        });
    });

    fragment.appendChild(newEl);
}

// Event listener for sign-up and login buttons
document.getElementById('signup-button').addEventListener('click', (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signUp(email, password);
});

document.getElementById('login-button').addEventListener('click', (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    logIn(email, password);
});

logoutButtonEl.addEventListener('click', logOut);
