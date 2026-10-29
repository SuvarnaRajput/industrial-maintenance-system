// ==========================================
// 1. Data Store (Single Source of Truth)
// ==========================================
// Starts empty for the current session.
// We use 'let' so we can update the list when deleting items.
let equipmentList = [];

// Tracks which equipment item is currently being edited.
// null = Add Mode (creating a new item)
// number (id) = Edit Mode (updating an existing item)
let editingId = null;

// ==========================================
// 2. Select HTML Elements
// ==========================================
// Dashboard counter elements
const totalEquipment = document.getElementById("total-equipment");
const openRequests = document.getElementById("open-requests");

// Form elements
const formTitle = document.getElementById("form-title");
const equipmentForm = document.getElementById("equipment-form");
const equipmentNameInput = document.getElementById("equipment-name");
const equipmentLocationInput = document.getElementById("equipment-location");
const formError = document.getElementById("form-error");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");

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
    // 1. Update the counter to always match the number of items
    totalEquipment.textContent = equipmentList.length;

    // 2. Check if the list is empty
    if (equipmentList.length === 0) {
        emptyEquipmentMsg.style.display = "block";
        equipmentListElement.innerHTML = "";
        return;
    }

    // 3. Hide the empty message if items exist
    emptyEquipmentMsg.style.display = "none";

    // 4. Clear the existing list before rebuilding it
    equipmentListElement.innerHTML = "";

    // 5. Loop through each item and create its HTML card with action buttons
    equipmentList.forEach((item) => {
        // Create the parent card container
        const li = document.createElement("li");
        li.className = "equipment-item";

        // Left side: Item information
        const infoDiv = document.createElement("div");
        infoDiv.className = "equipment-info";

        const nameElement = document.createElement("strong");
        nameElement.textContent = item.name;

        const locationElement = document.createElement("span");
        locationElement.textContent = `Location: ${item.location}`;

        infoDiv.appendChild(nameElement);
        infoDiv.appendChild(locationElement);

        // Right side: Action buttons (Edit & Delete)
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "equipment-actions";

        // Edit button
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "btn-edit";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => startEdit(item.id));

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn-delete";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteEquipment(item.id));

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        // Attach left info and right buttons to the list item
        li.appendChild(infoDiv);
        li.appendChild(actionsDiv);

        // Attach the list item to the <ul>
        equipmentListElement.appendChild(li);
    });
}

// ==========================================
// 4. Edit & Cancel Handlers
// ==========================================

// Pre-fills the form with an item's current details and enters "Edit Mode"
function startEdit(id) {
    // Find the item with the matching unique id
    const item = equipmentList.find((equipment) => equipment.id === id);
    if (!item) return;

    // Set edit mode to this item's id
    editingId = id;

    // Put current values into the input fields
    equipmentNameInput.value = item.name;
    equipmentLocationInput.value = item.location;

    // Clear any previous error messages
    formError.textContent = "";

    // Change form UI to indicate we are editing
    formTitle.textContent = "Edit Equipment";
    submitBtn.textContent = "Update Equipment";
    cancelBtn.style.display = "inline-block";

    // Focus the first input field for convenience
    equipmentNameInput.focus();
}

// Exits "Edit Mode" and resets the form back to "Add Mode"
function cancelEdit() {
    // Reset edit state
    editingId = null;

    // Clear input fields and errors
    equipmentForm.reset();
    formError.textContent = "";

    // Restore form UI back to Add Mode
    formTitle.textContent = "Register Equipment";
    submitBtn.textContent = "Add Equipment";
    cancelBtn.style.display = "none";
}

// Connect the Cancel button click to cancelEdit
cancelBtn.addEventListener("click", cancelEdit);

// ==========================================
// 5. Delete Handler
// ==========================================
function deleteEquipment(id) {
    // If we are currently editing the item being deleted, cancel edit mode
    if (editingId === id) {
        cancelEdit();
    }

    // Keep all equipment EXCEPT the one with this unique id
    equipmentList = equipmentList.filter((equipment) => equipment.id !== id);

    // Refresh the list and update the dashboard counter
    renderEquipment();
}

// ==========================================
// 6. Form Submission (Add or Update)
// ==========================================
equipmentForm.addEventListener("submit", function (event) {
    // Prevent page reload
    event.preventDefault();

    // Read values and remove extra whitespace
    const name = equipmentNameInput.value.trim();
    const location = equipmentLocationInput.value.trim();

    // Validation: both fields must be filled
    if (name === "" || location === "") {
        formError.textContent = "Please fill in both the equipment name and location.";
        return;
    }

    // Clear error message
    formError.textContent = "";

    if (editingId === null) {
        // --- ADD MODE ---
        equipmentList.push({
            id: Date.now(), // Unique identifier
            name: name,
            location: location
        });
    } else {
        // --- EDIT MODE ---
        const itemToUpdate = equipmentList.find((equipment) => equipment.id === editingId);
        if (itemToUpdate) {
            itemToUpdate.name = name;
            itemToUpdate.location = location;
        }

        // Return form state back to Add Mode
        editingId = null;
        formTitle.textContent = "Register Equipment";
        submitBtn.textContent = "Add Equipment";
        cancelBtn.style.display = "none";
    }

    // Clear the form inputs
    equipmentForm.reset();

    // Refresh the list and dashboard counter
    renderEquipment();
});

// Run once on initial page load
renderEquipment();
