// calculates the time difference between the given time + minimum interval (in minutes), and current time and express as string
module.exports = function calcTimeDifference(startTime, interval) {
    let result = '';

    const endTime = new Date(startTime).getTime() + interval * 60 * 1000;
    const now = Date.now();

    const timeRemaining = endTime - now;

    const seconds = timeRemaining / 1000;

    if (seconds < 60) {
        const intSeconds = Math.floor(seconds);
        result = `${intSeconds} second${intSeconds == 1 ? 's' : ''}`;
    }
    else {
        const minutes = seconds / 60;
        
        if (minutes < 60) {
            const intMinutes = Math.floor(minutes);
            result = `${intMinutes} minute${intMinutes > 1 ? 's' : ''}`;
        }
        else {
            const hours = minutes / 60;

            if (hours < 24) {
                const intHours = Math.floor(hours);
                result = `${intHours} hour${intHours > 1 ? 's' : ''}`;
            }
        }
    }

    return result;
}