import * as DateFns from "date-fns";
import * as lodash from "lodash";

import DailyTweetCount from "./dailyTweetCount";
import DailyHourlyTweetCount from "./daylyHourlyTweetCount";
import Tweet from "./tweet";

export function summarizeDailyTweetCount(tweets: Tweet[]): DailyTweetCount[] {
    const tweetsCreatedAtJst: Date[] = [];

    const JSTOffsetHours = 9;
    for (const tweet of tweets) {
        tweetsCreatedAtJst.push(DateFns.addHours(DateFns.parse(tweet.created_at), JSTOffsetHours));
    }

    const tweetsDate: string[] = tweetsCreatedAtJst.map((createdAt) => DateFns.format(createdAt, "YYYY-MM-DD"));
    const minDate: string = lodash.min(tweetsDate);
    const maxDate: string = lodash.max(tweetsDate);

    const result: DailyTweetCount[] = [];
    for (const day of DateFns.eachDay(minDate, maxDate)) {
        const key = DateFns.format(DateFns.addHours(day, JSTOffsetHours), "YYYY-MM-DD");
        result.push(new DailyTweetCount(key));
    }

    for (const tweetDate of tweetsDate) {
        const target = result.find((r) => r.date === tweetDate);
        if (target === undefined) {
            console.warn(`${tweetDate} is not in result`);
            continue;
        }

        target.count++;
    }

    return result;
}

export function summarizeDayHourTweetCount(tweets: Tweet[], fromDate: Date, toDate: Date): DailyHourlyTweetCount[] {
    const tweetsCreated: Date[] = [];
    for (const tweet of tweets) {
        const date = DateFns.parse(tweet.created_at);
        if (date < fromDate || date > toDate) {
            continue;
        }
        tweetsCreated.push(date);
    }

    const result: DailyHourlyTweetCount[] = [];
    for (const day of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) {
        result.push(new DailyHourlyTweetCount(day));
    }

    for (const createdAt of tweetsCreated) {
        result[createdAt.getDay()].hours[createdAt.getHours()].count++;
    }

    return result;
}

export function summarizeReplyCount(tweets: Tweet[]): Array<{screen_name: string, count: number}> {
    const result: Array<{screen_name: string, count: number}> = [];

    for (const tweet of tweets) {
        if (tweet.in_reply_to_screen_name === null) {
            continue;
        }

        let target = result.find((r) => r.screen_name === tweet.in_reply_to_screen_name);
        if (target === undefined) {
            target = { screen_name: tweet.in_reply_to_screen_name, count: 0};
            result.push(target);
        }

        target.count++;
    }

    result.sort(
        (a, b) => {
            const countDiff = b.count - a.count;
            if (countDiff !== 0) {
                return countDiff;
            }

            if (a.screen_name < b.screen_name) {
                return -1;
            }
            else if (a.screen_name > b.screen_name) {
                return 1;
            }
            else {
                return 0;
            }
        }
    );

    return result;
}

export function summarizeHashtagCount(tweets: Tweet[]) {
    const result: Array<{hashtag: string, count: number}> = [];

    for (const tweet of tweets) {
        for (const hashtag of tweet.entities.hashtags) {
            let target = result.find((r) => r.hashtag === hashtag.text);
            if (target === undefined) {
                target = { hashtag: hashtag.text, count: 0 };
                result.push(target);
            }

            target.count++;
        }
    }

    result.sort(
        (a, b) => {
            const countDiff = b.count - a.count;
            if (countDiff !== 0) {
                return countDiff;
            }

            if (a.hashtag < b.hashtag) {
                return -1;
            }
            else if (a.hashtag > b.hashtag) {
                return 1;
            }
            else {
                return 0;
            }
        }
    );

    return result;
}
