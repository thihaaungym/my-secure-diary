// --- ဒီ function တစ်ခုလုံးကို အသစ်နဲ့ အစားထိုးပါ ---
async function loadNotes() {
    const password = document.getElementById('password').value;
    if (!password) {
        document.getElementById('notes-container').innerHTML = '<p>Please enter your password to see notes.</p>';
        return;
    }

    try {
        const response = await fetch(`/api/notes?password=${password}`);

        // --- DEBUGGING CODE START ---
        if (!response.ok) {
            if (response.status === 401) {
                alert('DEBUG: Loading failed! The password was incorrect (Error 401).');
            } else {
                alert(`DEBUG: Loading failed! Server returned an error: ${response.status}`);
            }
            throw new Error('Failed to fetch notes.');
        }
        // --- DEBUGGING CODE END ---

        const notes = await response.json();
        const container = document.getElementById('notes-container');
        container.innerHTML = ''; 

        if(notes.length === 0) {
            container.innerHTML = '<p>No notes found. Create one!</p>';
        }

        notes.sort((a, b) => b.id.localeCompare(a.id)); 

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
        document.getElementById('notes-container').innerHTML = `<p style="color:red;">Error loading notes. Check console for details.</p>`;
        console.error(error);
    }
}
