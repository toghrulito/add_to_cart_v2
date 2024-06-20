import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

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

let userId = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        userId = user.uid;
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
            setupShoppingList();
        })
        .catch((error) => {
            console.error("Error signing up:", error);
        });
}

// Function to handle user login
function logIn(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            userId = user.uid;
            setupShoppingList();
        })
        .catch((error) => {
            console.error("Error logging in:", error);
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

    addButtonEl.addEventListener("click", function() {
        addItem(shoppingListInDB);
    });

    inputFieldEl.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            addItem(shoppingListInDB);
        }
    });

    function addItem(shoppingListRef) {
        let inputValue = inputFieldEl.value.trim();
        if (inputValue !== "") {
            push(shoppingListRef, inputValue).then(() => {
                console.log(`Added item: ${inputValue}`);
                clearInputFieldEl();
            }).catch((error) => {
                console.error("Error adding item:", error);
            });
        } else {
            console.log("Ignored empty input");
        }
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
document.getElementById('signup-button').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signUp(email, password);
});

document.getElementById('login-button').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    logIn(email, password);
});
