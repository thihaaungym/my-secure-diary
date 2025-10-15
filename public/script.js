document.addEventListener('DOMContentLoaded', loadNotes);

async function loadNotes() {
    const password = document.getElementById('password').value;
    if (!password) {
        document.getElementById('notes-container').innerHTML = '<p>Please enter your password to see notes.</p>';
        return;
    }

    try {
        const response = await fetch(`/api/notes?password=${password}`);
        if (!response.ok) {
            throw new Error('Incorrect password or network error.');
        }
        const notes = await response.json();
        const container = document.getElementById('notes-container');
        container.innerHTML = ''; // Clear previous notes

        if(notes.length === 0) {
            container.innerHTML = '<p>No notes found. Create one!</p>';
        }

        notes.sort((a, b) => b.id.localeCompare(a.id)); // Show newest first

        notes.forEach(note => {
            const card = document.createElement('div');
            card.className = 'note-card';
            card.innerHTML = `
                <h3>${escapeHTML(note.title)}</h3>
                <div class="note-card-content">${escapeHTML(note.content)}</div>
                <div class="note-actions">
                    <button onclick="copyNoteContent('${btoa(unescape(encodeURIComponent(note.content)))}')">Copy</button>
                    <button class="danger-button" onclick="openDeleteModal('${note.id}', '${escapeHTML(note.title)}')">Delete</button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        document.getElementById('notes-container').innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    }
}

async function saveNote() {
    const password = document.getElementById('password').value;
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteEditor').value;

    if (!password || !title || !content) {
        alert('Password, title, and content are required.');
        return;
    }

    const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, title, content }),
    });

    if (response.ok) {
        alert('Note saved successfully!');
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteEditor').value = '';
        loadNotes(); // Refresh notes list
    } else {
        alert('Error: Incorrect password or failed to save.');
    }
}

function copyNoteContent(base64Content) {
    const content = decodeURIComponent(escape(atob(base64Content)));
    navigator.clipboard.writeText(content).then(() => {
        alert('Note content copied to clipboard!');
    }, (err) => {
        alert('Failed to copy text.');
    });
}

// --- Delete Modal Logic ---
const modal = document.getElementById('deleteModal');

function openDeleteModal(noteId, noteTitle) {
    document.getElementById('note-title-to-delete').textContent = noteTitle;
    document.getElementById('deletePassword').value = '';
    
    const confirmBtn = document.getElementById('confirmDeleteButton');
    // Clone and replace the button to remove old event listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.addEventListener('click', () => confirmDelete(noteId));
    
    modal.style.display = "block";
}

function closeModal() {
    modal.style.display = "none";
}

async function confirmDelete(noteId) {
    const password = document.getElementById('deletePassword').value;
    if (!password) {
        alert('Please enter your password to confirm deletion.');
        return;
    }

    const response = await fetch('/api/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noteId, password: password }),
    });

    if (response.ok) {
        alert('Note deleted successfully.');
        closeModal();
        loadNotes(); // Refresh notes list
    } else {
        alert('Error: Incorrect password or failed to delete.');
    }
}

// Helper to prevent XSS attacks
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function(match) {
        return {
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[match];
    });
}

// Close modal if user clicks outside of it
window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}

// Reload notes when password is changed
document.getElementById('password').addEventListener('input', loadNotes);
