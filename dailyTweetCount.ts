export default class DailyTweetCount {
    public date: string;
    public count: number;

    constructor(date: string) {
        this.date = date;
        this.count = 0;
    }
}
