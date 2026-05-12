(function initDomUtils(global) {
    'use strict';

    function getBusIcon(type) {
        switch(type) {
            case 'source': return '⚡';
            case 'distribution': return '🔌';
            case 'branch': return '📍';
            default: return '🔌';
        }
    }

    function updateSessionTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        const sessionDate = document.getElementById('sessionDate');
        if (sessionDate) {
            sessionDate.textContent = formattedDateTime;
        }
    }

    global.getBusIcon = getBusIcon;
    global.updateSessionTime = updateSessionTime;

    console.log('✅ domUtils loaded');
})(window);