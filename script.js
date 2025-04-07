// Select elements
const noteArea = document.getElementById("note");
const noteTitle = document.getElementById("noteTitle");
const themeToggle = document.getElementById("themeToggle");
const saveBtn = document.getElementById("saveBtn");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");
const speechBtn = document.getElementById("speechBtn");
const backupBtn = document.getElementById("backupBtn");
const zenModeBtn = document.getElementById("zenMode");
const newNoteBtn = document.getElementById("newNoteBtn");
const pinBtn = document.getElementById("pinBtn");
const deleteBtn = document.getElementById("deleteBtn");

const sidebarToggle = document.getElementById("sidebarToggle");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const sidebarSearch = document.getElementById("sidebarSearch");
const sidebarContent = document.getElementById("sidebarContent");
const sidebarTabs = document.querySelectorAll(".sidebar-tab");

const wordCountSpan = document.getElementById("wordCount");
const charCountSpan = document.getElementById("charCount");
const lastSavedSpan = document.getElementById("lastSaved");

let notesData = JSON.parse(localStorage.getItem("notesData")) || [];
let backupNote = localStorage.getItem("backupNote") || "";
let currentNoteIndex = -1; // -1 means no note selected
let currentTab = "history"; // default tab

// Update word & character count on input
noteArea.addEventListener("input", () => {
  const words = noteArea.value.split(/\s+/).filter(Boolean).length;
  wordCountSpan.textContent = `Words: ${words}`;
  charCountSpan.textContent = `Characters: ${noteArea.value.length}`;
});

// Save note (with title, content, timestamp, pinned, deleted)
saveBtn.addEventListener("click", () => {
  const title = noteTitle.value.trim() || "Untitled Note";
  const content = noteArea.value;
  const timestamp = new Date().toLocaleTimeString();
  let noteObj = { title, content, timestamp, pinned: false, deleted: false };

  if (currentNoteIndex === -1) {
    // New note
    notesData.push(noteObj);
    currentNoteIndex = notesData.length - 1;
  } else {
    // Update existing note while preserving pinned/deleted state
    noteObj.pinned = notesData[currentNoteIndex].pinned;
    noteObj.deleted = notesData[currentNoteIndex].deleted;
    notesData[currentNoteIndex] = noteObj;
  }
  localStorage.setItem("notesData", JSON.stringify(notesData));
  localStorage.setItem("backupNote", content);
  lastSavedSpan.textContent = `Last saved: ${timestamp}`;
  updateSidebarContent();
  alert("Note saved!");
});

// Export note as text file
exportBtn.addEventListener("click", () => {
  const title = noteTitle.value.trim() || "note";
  const blob = new Blob([noteArea.value], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${title}.txt`;
  a.click();
});

// Clear editor and title
clearBtn.addEventListener("click", () => {
  noteTitle.value = "";
  noteArea.value = "";
  currentNoteIndex = -1;
  localStorage.removeItem("backupNote");
  lastSavedSpan.textContent = `Last saved: --`;
});

// Dark/Light mode toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  themeToggle.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
});

// Speech-to-text feature
speechBtn.addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.start();
  recognition.onresult = (event) => {
    noteArea.value += " " + event.results[0][0].transcript;
    noteArea.dispatchEvent(new Event("input"));
  };
});

// Restore backup note
backupBtn.addEventListener("click", () => {
  if (backupNote) {
    noteArea.value = backupNote;
    noteArea.dispatchEvent(new Event("input"));
    alert("Restored from backup!");
  } else {
    alert("No backup found.");
  }
});

// Zen mode toggle
zenModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("zen-mode");
});

// New Note button clears current note
newNoteBtn.addEventListener("click", () => {
  noteTitle.value = "";
  noteArea.value = "";
  currentNoteIndex = -1;
  lastSavedSpan.textContent = `Last saved: --`;
});

// Pin/Unpin current note
pinBtn.addEventListener("click", () => {
  if (currentNoteIndex === -1) {
    alert("Save the note first to pin it.");
    return;
  }
  notesData[currentNoteIndex].pinned = !notesData[currentNoteIndex].pinned;
  localStorage.setItem("notesData", JSON.stringify(notesData));
  updateSidebarContent();
  alert(notesData[currentNoteIndex].pinned ? "Note pinned!" : "Note unpinned!");
});

// Delete note (move to trash)
deleteBtn.addEventListener("click", () => {
  if (currentNoteIndex === -1) {
    alert("No note selected.");
    return;
  }
  notesData[currentNoteIndex].deleted = true;
  localStorage.setItem("notesData", JSON.stringify(notesData));
  updateSidebarContent();
  alert("Note moved to trash!");
});

// Restore note from trash (set deleted to false)
function restoreNote(note) {
  const idx = notesData.findIndex(n => n.timestamp === note.timestamp && n.title === note.title);
  if (idx !== -1) {
    notesData[idx].deleted = false;
    localStorage.setItem("notesData", JSON.stringify(notesData));
    updateSidebarContent();
    alert("Note restored!");
  }
}

// Sidebar toggle
sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("active");
  overlay.classList.toggle("active");
});

// Close sidebar when clicking overlay
overlay.addEventListener("click", () => {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
});

// Sidebar tab button event listeners
sidebarTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    currentTab = tab.dataset.tab;
    sidebarTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    updateSidebarContent();
  });
});

// Update sidebar content based on currentTab and search filter
function updateSidebarContent() {
  sidebarContent.innerHTML = "";
  const searchTerm = sidebarSearch.value.toLowerCase();
  let filteredNotes = [];
  
  if (currentTab === "pinned") {
    filteredNotes = notesData.filter(note => note.pinned && !note.deleted);
  } else if (currentTab === "trash") {
    filteredNotes = notesData.filter(note => note.deleted);
  } else {
    filteredNotes = notesData.filter(note => !note.deleted);
  }
  // Filter by search term
  filteredNotes = filteredNotes.filter(note =>
    note.title.toLowerCase().includes(searchTerm) ||
    note.content.toLowerCase().includes(searchTerm)
  );
  
  filteredNotes.forEach(note => {
    const noteDiv = document.createElement("div");
    noteDiv.classList.add("note-item");
    
    const titleSpan = document.createElement("span");
    titleSpan.textContent = note.title;
    noteDiv.appendChild(titleSpan);
    
    // In Trash tab, add a restore button
    if (currentTab === "trash") {
      const restoreBtn = document.createElement("button");
      restoreBtn.textContent = "♻️";
      restoreBtn.classList.add("restore-btn");
      restoreBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        restoreNote(note);
      });
      noteDiv.appendChild(restoreBtn);
    }
    
    noteDiv.addEventListener("click", () => loadNote(note));
    sidebarContent.appendChild(noteDiv);
  });
}

// Load a note from sidebar selection
function loadNote(note) {
  currentNoteIndex = notesData.findIndex(n => n.timestamp === note.timestamp && n.title === note.title);
  if (currentNoteIndex !== -1) {
    noteTitle.value = notesData[currentNoteIndex].title;
    noteArea.value = notesData[currentNoteIndex].content;
    lastSavedSpan.textContent = `Last saved: ${notesData[currentNoteIndex].timestamp}`;
    noteArea.dispatchEvent(new Event("input"));
    // Close sidebar after selecting
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  }
}

// Sidebar search functionality
sidebarSearch.addEventListener("input", updateSidebarContent);

// On page load, update sidebar and load last note if exists
document.addEventListener("DOMContentLoaded", () => {
  updateSidebarContent();
  if (notesData.length > 0 && currentNoteIndex === -1) {
    currentNoteIndex = notesData.length - 1;
    const note = notesData[currentNoteIndex];
    noteTitle.value = note.title;
    noteArea.value = note.content;
    lastSavedSpan.textContent = `Last saved: ${note.timestamp}`;
    noteArea.dispatchEvent(new Event("input"));
  }
});
