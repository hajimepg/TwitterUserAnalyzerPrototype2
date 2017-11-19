#!/usr/bin/env node

import * as assert from "assert";
import * as fs from "fs";

import * as Commander from "commander";
import * as DateFns from "date-fns";
import * as lodash from "lodash";
import * as Twitter from "twitter";

import DailyTweetCount from "./dailyTweetCount";
import DailyHourlyTweetCount from "./daylyHourlyTweetCount";
import GetUserTimeLineOptions from "./getUserTimeLineOptions";
import Tweet from "./tweet";

import Stub from "./stub";

Commander
    .option("--format <format>")
    .option("--screen-name <screen-name>")
    .option("--create-stub")
    .option("--use-stub")
    .parse(process.argv);

const format = Commander.format || "html";
if (format !== "json" && format !== "html") {
    console.error(`Invalid format: ${format}`);
    process.exit(1);
}

let client: { get };

if (Commander.useStub) {
    client = Stub;
}
else {
    client = new Twitter({
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    });
}

async function getTweets(screenName: string) {
    return new Promise<Tweet[]>((resolve, reject) => {
        const result: Tweet[] = [];

        function getTweetsInternal(maxId?: number) {
            const options: GetUserTimeLineOptions = {
                count: 200,
                exclude_replies: false,
                include_rts: false,
                trim_user: true,
            };
            if (screenName !== undefined) {
                options.screen_name = screenName;
            }
            if (maxId !== undefined) {
                options.max_id = maxId;
            }

            client.get("statuses/user_timeline", options, (error, response: Tweet[]) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (response.length === 0) {
                    resolve(result);
                    return;
                }

                const lastTweetId = lodash.last(response).id;
                console.log(`count=${response.length} lastTweetId=${lastTweetId}` );

                if (response.length === 1 && maxId === lastTweetId) {
                    resolve(result);
                }
                else {
                    for (const tweet of response) {
                        if (result.findIndex((t) => t.id === tweet.id) === -1) {
                            result.push(tweet);
                        }
                    }

                    getTweetsInternal(lastTweetId);
                }
            });
        }

        getTweetsInternal();
    });
}

function summarizeDailyTweetCount(tweets: Tweet[]): DailyTweetCount[] {
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

function summarizeDayHourTweetCount(tweets: Tweet[]): DailyHourlyTweetCount[] {
    const tweetsCreatedAtJst: Date[] = [];

    const JSTOffsetHours = 9;
    for (const tweet of tweets) {
        tweetsCreatedAtJst.push(DateFns.addHours(DateFns.parse(tweet.created_at), JSTOffsetHours));
    }

    const result: DailyHourlyTweetCount[] = [];
    for (const day of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) {
        result.push(new DailyHourlyTweetCount(day));
    }

    for (const createdAt of tweetsCreatedAtJst) {
        result[createdAt.getDay()].hours[createdAt.getHours()].count++;
    }

    return result;
}

function summarizeReplyCount(tweets: Tweet[]): Array<{screen_name: string, count: number}> {
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

function summarizeHashtagCount(tweets: Tweet[]) {
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

function createFileName(): string {
    const currentDate: string = DateFns.format(new Date(), "YYYY-MM-DD");
    let filename: string;

    for (let i: number = 0; ; i++) {
        if (i === 0) {
            filename = `./output-${currentDate}.json`;
        }
        else {
            filename = `./output-${currentDate}_${i}.json`;
        }

        if (fs.existsSync(filename) === false) {
            break;
        }
    }

    return filename;
}

(async () => {
    const tweets = await getTweets(Commander.screenName);

    if (Commander.createStub) {
        fs.writeFileSync("./stub.json", JSON.stringify(tweets, null, 4));
    }

    /* tslint:disable:object-literal-sort-keys */
    const output = {
        dailyTweetCount: summarizeDailyTweetCount(tweets),
        dayHourTweetCount: summarizeDayHourTweetCount(tweets),
        replyTweetCount: summarizeReplyCount(tweets),
        hashtagTweetCount: summarizeHashtagCount(tweets),
    };
    /* tslint:enable:object-literal-sort-keys */

    if (format === "json") {
        const fileName: string = createFileName();
        fs.writeFileSync(fileName, JSON.stringify(output, null, 4));
    }
    else {
        assert.fail(`Unsupported output format: "${format}"`);
    }
})()
.catch(
    (error) => console.log(error)
);
