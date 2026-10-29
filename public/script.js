// ==========================================
// 1. Backend API Configuration
// ==========================================
// Automatically connects to the Express backend.
// If the user opens index.html directly from file://, it connects to http://localhost:3000
const API_BASE_URL = (window.location.protocol === "file:" || window.location.origin === "null")
    ? "http://localhost:3000/api/equipment"
    : "/api/equipment";

// ==========================================
// 2. Data Store (Single Source of Truth)
// ==========================================
// Loaded directly from Microsoft SQL Server.
let equipmentList = [];

// Tracks which equipment item is currently being edited.
// null = Add Mode (creating a new record)
// number (id) = Edit Mode (updating an existing record)
let editingId = null;

// Guard against duplicate submissions from fast double-clicks
let isSubmitting = false;

// ==========================================
// 3. Select HTML Elements
// ==========================================
// Dashboard counter elements
const totalEquipment = document.getElementById("total-equipment");
const openRequests = document.getElementById("open-requests");

// System notification banner
const systemBanner = document.getElementById("system-banner");

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
// 4. Banner Helper Functions
// ==========================================
function showSystemBanner(message, type = "error") {
    if (!systemBanner) return;
    systemBanner.textContent = message;
    systemBanner.className = `system-banner ${type}`;
    systemBanner.style.display = "block";
}

function clearSystemBanner() {
    if (!systemBanner) return;
    systemBanner.textContent = "";
    systemBanner.style.display = "none";
}

// ==========================================
// 5. Render Function
// ==========================================
// Keeps the UI in sync with the equipmentList array.
function renderEquipment() {
    // 1. Update the counter to always match database count
    totalEquipment.textContent = equipmentList.length;

    // 2. Check if the database has no records
    if (equipmentList.length === 0) {
        emptyEquipmentMsg.style.display = "block";
        equipmentListElement.innerHTML = "";
        return;
    }

    // 3. Hide empty message if records exist
    emptyEquipmentMsg.style.display = "none";

    // 4. Clear list before rebuilding it
    equipmentListElement.innerHTML = "";

    // 5. Loop through each item and render its card
    equipmentList.forEach((item) => {
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

        // Right side: Action buttons
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
        deleteBtn.addEventListener("click", () => deleteEquipment(item.id, item.name));

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        li.appendChild(infoDiv);
        li.appendChild(actionsDiv);

        equipmentListElement.appendChild(li);
    });
}

// ==========================================
// 6. Backend API Operations (Automatic Sync)
// ==========================================

/**
 * Automatically loads all existing equipment from SQL Server.
 */
async function loadEquipment() {
    try {
        formError.textContent = "";
        clearSystemBanner();

        const response = await fetch(API_BASE_URL);

        if (!response.ok) {
            throw new Error(`Server returned error status: ${response.status}`);
        }

        equipmentList = await response.json();
        renderEquipment();
    } catch (error) {
        console.error("Error connecting to server:", error);
        showSystemBanner(
            "⚠️ Cannot connect to backend server. Please run 'npm start' in your project terminal and visit http://localhost:3000",
            "error"
        );
        formError.textContent = "Server is offline or unreachable.";
    }
}

/**
 * Pre-fills the form with an item's details and switches to Edit Mode.
 */
function startEdit(id) {
    const item = equipmentList.find((equipment) => equipment.id === id);
    if (!item) return;

    editingId = id;
    equipmentNameInput.value = item.name;
    equipmentLocationInput.value = item.location;
    formError.textContent = "";
    clearSystemBanner();

    formTitle.textContent = "Edit Equipment";
    submitBtn.textContent = "Update Equipment";
    cancelBtn.style.display = "inline-block";
    equipmentNameInput.focus();
}

/**
 * Exits Edit Mode and restores the form to Add Mode.
 */
function cancelEdit() {
    editingId = null;
    equipmentForm.reset();
    formError.textContent = "";

    formTitle.textContent = "Register Equipment";
    submitBtn.textContent = "Add Equipment";
    cancelBtn.style.display = "none";
}

cancelBtn.addEventListener("click", cancelEdit);

/**
 * Deletes an equipment record from SQL Server.
 */
async function deleteEquipment(id, name) {
    // Confirmation dialog prevents accidental deletion of real equipment
    const confirmed = confirm(`Are you sure you want to delete "${name || 'this item'}"?`);
    if (!confirmed) return;

    try {
        formError.textContent = "";
        clearSystemBanner();

        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || "Failed to delete equipment.");
        }

        // If we were currently editing this item, exit edit mode
        if (editingId === id) {
            cancelEdit();
        }

        // Reload fresh list from SQL Server to keep counter perfectly synchronized
        await loadEquipment();
    } catch (error) {
        console.error("Error deleting equipment:", error);
        formError.textContent = error.message;
        showSystemBanner(`Failed to delete equipment: ${error.message}`, "error");
    }
}

// ==========================================
// 7. Form Submission (Add or Update via API)
// ==========================================
equipmentForm.addEventListener("submit", async function (event) {
    // Prevent browser page reload
    event.preventDefault();

    // Prevent duplicate submission from rapid clicks
    if (isSubmitting) return;

    const name = equipmentNameInput.value.trim();
    const location = equipmentLocationInput.value.trim();

    // Input validation
    if (name === "" || location === "") {
        formError.textContent = "Please fill in both the equipment name and location.";
        return;
    }

    formError.textContent = "";
    clearSystemBanner();

    // Lock submission state
    isSubmitting = true;
    submitBtn.disabled = true;
    const isEditing = editingId !== null;
    submitBtn.textContent = isEditing ? "Updating..." : "Adding...";

    try {
        if (!isEditing) {
            // --- ADD MODE: POST to SQL Server ---
            const response = await fetch(API_BASE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, location })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || "Failed to add equipment.");
            }
        } else {
            // --- EDIT MODE: PUT to SQL Server ---
            const response = await fetch(`${API_BASE_URL}/${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, location })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || "Failed to update equipment.");
            }

            // Restore form back to Add Mode
            cancelEdit();
        }

        // Reset inputs and reload fresh data from SQL Server
        equipmentForm.reset();
        await loadEquipment();
    } catch (error) {
        console.error("Error saving equipment:", error);
        formError.textContent = error.message;
        showSystemBanner(`Operation failed: ${error.message}`, "error");
    } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.textContent = editingId === null ? "Add Equipment" : "Update Equipment";
    }
});

// ==========================================
// 8. Automatic Initial Load
// ==========================================
// Runs as soon as script loads or DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadEquipment);
} else {
    loadEquipment();
}
