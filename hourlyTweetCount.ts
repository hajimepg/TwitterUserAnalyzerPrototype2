export default class HourlyTweetCount {
    public day: string;
    public hour: number;
    public count: number;

    constructor(day: string, hour: number) {
        this.day = day;
        this.hour = hour;
        this.count = 0;
    }
}
