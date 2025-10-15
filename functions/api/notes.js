async function handleRequest(context) {
    const { request, env } = context;

    switch (request.method) {
        case 'GET':
            return handleGet(request, env);
        case 'POST':
            return handlePost(request, env);
        case 'DELETE':
            return handleDelete(request, env);
        default:
            return new Response('Method Not Allowed', { status: 405 });
    }
}

async function handleGet(request, env) {
    const url = new URL(request.url);
    const password = url.searchParams.get('password');

    if (password !== env.DIARY_PASSWORD) {
        return new Response('Unauthorized', { status: 401 });
    }

    const kvList = await env.NOTES_KV.list();
    const notes = [];
    for (const key of kvList.keys) {
        const value = await env.NOTES_KV.get(key.name);
        if (value) {
            try {
                // Parse the JSON string from KV
                const noteData = JSON.parse(value);
                notes.push({ 
                    id: key.name, 
                    title: noteData.title, 
                    content: noteData.content 
                });
            } catch (e) { /* Ignore malformed data */ }
        }
    }
    return new Response(JSON.stringify(notes), { headers: { 'Content-Type': 'application/json' } });
}

async function handlePost(request, env) {
    const { password, title, content } = await request.json();

    if (password !== env.DIARY_PASSWORD) {
        return new Response('Unauthorized', { status: 401 });
    }
    if (!title || !content) {
        return new Response('Title and content are required', { status: 400 });
    }

    const noteId = new Date().toISOString() + '_' + Math.random().toString(36).substr(2, 9);
    const noteValue = JSON.stringify({ title, content });
    
    await env.NOTES_KV.put(noteId, noteValue);
    return new Response('Note saved!', { status: 200 });
}

async function handleDelete(request, env) {
    const { id, password } = await request.json();

    if (password !== env.DIARY_PASSWORD) {
        return new Response('Unauthorized', { status: 401 });
    }
    if (!id) {
        return new Response('Note ID is required', { status: 400 });
    }

    await env.NOTES_KV.delete(id);
    return new Response('Note deleted', { status: 200 });
}

export const onRequest = handleRequest;

