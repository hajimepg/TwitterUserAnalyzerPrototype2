import HourlyTweetCount from "./hourlyTweetCount";

export default class DailyHourlyTweetCount {
    public day: string;
    public hours: HourlyTweetCount[];

    constructor(day: string) {
        this.day = day;

        this.hours = [];
        for (const hour of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]) {
            this.hours.push(new HourlyTweetCount(day, hour));
        }
    }
}
