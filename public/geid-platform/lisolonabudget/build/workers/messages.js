const MAX_ARRAY_LENGTH = 20;

let db;
self.addEventListener('message', event => {
    const { dbConfig, userId, offset, target } = event.data;
    const request = indexedDB.open(`${dbConfig.name}-${userId}`);
    request.onsuccess = event => {
        db = event.target.result;
        const objectStore = db.transaction('messages')
        .objectStore('messages');
        objectStore.getAll().onsuccess = event => {
            let messages = event.target.result
            ?.filter(({targetId}) => targetId === target?.id)
            messages.sort((a, b) => 
                (new Date(b?.createdAt)).getTime() - 
                (new Date(a?.createdAt)).getTime()
            );
            messages = messages.slice(offset, offset + MAX_ARRAY_LENGTH);
            postMessage(messages);
        }
    }
});