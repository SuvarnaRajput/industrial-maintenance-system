// ==========================================
// 1. Data Store (Single Source of Truth)
// ==========================================
// Starts empty for the current session.
// All registered equipment in this session will be stored here.
const equipmentList = [];

// ==========================================
// 2. Select HTML Elements
// ==========================================
// Dashboard counter elements
const totalEquipment = document.getElementById("total-equipment");
const openRequests = document.getElementById("open-requests");

// Form elements
const equipmentForm = document.getElementById("equipment-form");
const equipmentNameInput = document.getElementById("equipment-name");
const equipmentLocationInput = document.getElementById("equipment-location");
const formError = document.getElementById("form-error");

// List elements
const equipmentListElement = document.getElementById("equipment-list");
const emptyEquipmentMsg = document.getElementById("empty-equipment-msg");

// Initial counter values
totalEquipment.textContent = 0;
openRequests.textContent = 0;

// ==========================================
// 3. Render Function
// ==========================================
// Keeps the UI in sync with the equipmentList array.
function renderEquipment() {
    // Update the counter to always match the number of items in our array
    totalEquipment.textContent = equipmentList.length;

    // Check if there are no items
    if (equipmentList.length === 0) {
        emptyEquipmentMsg.style.display = "block";
        equipmentListElement.innerHTML = "";
        return;
    }

    // If there are items, hide the empty message
    emptyEquipmentMsg.style.display = "none";

    // Clear existing list before rebuilding it
    equipmentListElement.innerHTML = "";

    // Loop through each piece of equipment and create its HTML card
    equipmentList.forEach((item) => {
        const li = document.createElement("li");
        li.className = "equipment-item";

        const nameElement = document.createElement("strong");
        nameElement.textContent = item.name;

        const locationElement = document.createElement("span");
        locationElement.textContent = `Location: ${item.location}`;

        li.appendChild(nameElement);
        li.appendChild(locationElement);

        equipmentListElement.appendChild(li);
    });
}

// ==========================================
// 4. Form Event Listener
// ==========================================
equipmentForm.addEventListener("submit", function (event) {
    // Prevent the default browser behavior (which is reloading the page)
    event.preventDefault();

    // Read the values and remove leading/trailing whitespace
    const name = equipmentNameInput.value.trim();
    const location = equipmentLocationInput.value.trim();

    // Validation: make sure both fields contain text
    if (name === "" || location === "") {
        formError.textContent = "Please fill in both the equipment name and location.";
        return;
    }

    // Clear any previous error message if validation passed
    formError.textContent = "";

    // Add the new equipment item to our array
    equipmentList.push({
        name: name,
        location: location
    });

    // Reset the form fields so they are empty for the next entry
    equipmentForm.reset();

    // Refresh the list and update the counter
    renderEquipment();
});

// Run renderEquipment once when the page loads
renderEquipment();
