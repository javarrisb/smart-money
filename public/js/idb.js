const { ServerResponse } = require("http");

// variable that holds the db connection 
let db;
// connect to IndexedDB database called 'budget' and set it to version 1
const request = indexedDB.open('budget', 1);

// this event will take place if the database version changes
request.onupgradeneeded = function(event) {
    const db = event.target.result;

    db.createObjectStore('new_budget_ticket', { autoIncrement: true });
};

// when request successful
request.onsuccess = function(event) {

    db = event.target.result;

    if (navigator.online) {
        uploadBudgetTicket();
    }
};

// informs us if anything is wrong with database 
request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// if a new transaction is submitted with no internet connection this function will execute
function savePayment(payment) {
    const transaction = db.transaction(['new_budget_ticket'], 'readwrite');

    const budgetObjectStore = transaction.ObjectStore('new_budget_ticket');

    // add record to the object store
    budgetObjectStore.add(payment);
}

function uploadBudgetTicket() {
    const transaction = db.transaction(['new_budget_ticket'], 'readwrite');

    // access to the object store
    const budgetObjectStore = transaction.objectStore('new_budget_ticket');

    const getAll = budgetObjectStore.getAll();

    // when successful with getAll() this function should be executed
    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: POST,
                body: JSON.stringify(getAll.results),
                headers: {
                    Accept: 'application/json, text/plaim, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                const transaction = db.transaction(['new_budget_ticket', 'readwrite']);
                
                const budgetObjectStore = transaction.objectStore('new_budget_ticket');

                budgetObjectStore.clear();

                alert('All saved budget tickets have been submitted');
            })
            .catch(err => {
                console.log(err);
            });
        }

    }


};

window.addEventListener('online', uploadBudgetTicket);