// js/worker.js
let timerId = null;
let targetTime = 0;

self.onmessage = function(e) {
    if (e.data.command === 'start') {
        targetTime = Date.now() + e.data.duration * 1000;
        if (timerId) clearInterval(timerId);
        timerId = setInterval(() => {
            let remaining = Math.round((targetTime - Date.now()) / 1000);
            if (remaining <= 0) {
                clearInterval(timerId);
                self.postMessage({ status: 'done' });
            } else {
                self.postMessage({ status: 'tick', remaining: remaining });
            }
        }, 1000);
    } else if (e.data.command === 'stop') {
        if (timerId) clearInterval(timerId);
    }
};
