function createRange(range, start, step) {
    cron = start;
    val = start;
    range = range.split("-");
    limit = parseInt(range[1]) + 1;
    while (val <= parseInt(range[1])) {
        val += step;
        if (val == limit) {
            val = 0;
        }
        if (val == start) {
            break;
        }
        if (val >= limit) {
            val = (val) - limit;
        }
        cron += "," + val;
    }
    return cron;
}
module.exports = {createRange}