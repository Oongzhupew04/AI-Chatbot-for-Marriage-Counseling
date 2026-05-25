self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

    let title = 'New Notification';
    let options = {
        body: 'You have a new message.'
    };

    if (event.data) {
        try {
            const data = event.data.json();
            title = data.title || title;
            options.body = data.body || options.body;
        } catch (e) {
            console.error('[Service Worker] Failed to parse push payload', e);
        }
    }

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    // Open the home page to do the check-in
    event.waitUntil(
        clients.openWindow('/')
    );
});
