let db;
const request = indexedDB.open('financial-tracker', 1);

request.onupgradeneeded = function(event) {
  const db = envent.atrget.result;
  db.createObjectStore('new_budget', { autoIncrement: true});
};

request.onsuccess = function(event) {
  //saves reference to db in colbal variable when db is created with object store
  db = event.target.result;
  //checks if app is online, then runs uploadBudget() to upload all local db data to api
  if (navigator.onLine) {
    uploadBudget();
  }
};

request.onerror = function(event) {
  //logs error here
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(['new_budget'], 'readwrite');
  const budgetObjectStore = transaction.objectStore('new_budget');
  //using add method, adds record to store
  budgetObjectStore.add(record);
}

function uploadBudget() {
  //open a transaction on your pending db
  const transaction = db.transaction(['new_budget'], 'readwrite');
  //access your pending object store
  const budgetObjectStore = transaction.objectStore('new_budget');
  // gets all records from store and set to a variable
  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function() {
    //sends data in the indexedDb's store to api server if there is data to be sent
    if (getAll.result.length > 0) {
      fetch('/api/budgets', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(['new_budget'], 'readwrite');
          const budgetObjectStore = transaction.objectStore('new_budget');
          //clear all items in your store
          budgetObjectStore.clear();
        })
        .catch(err => {
          // set reference to redirect back here
          console.log(err);
        });
    }
  };
}
// listen for app coming back online
window.addEventListener('online', uploadBudget);
