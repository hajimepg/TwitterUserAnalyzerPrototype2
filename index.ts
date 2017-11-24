#!/usr/bin/env node

import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";

import * as Commander from "commander";
import * as DateFns from "date-fns";
import * as lodash from "lodash";
import * as Nunjucks from "nunjucks";
import * as Twitter from "twitter";

import DailyTweetCount from "./dailyTweetCount";
import DailyHourlyTweetCount from "./daylyHourlyTweetCount";
import { downloadProfileImage } from "./downloadProfileImage";
import GetUserTimeLineOptions from "./getUserTimeLineOptions";
import Profile from "./profile";
import * as Summarize from "./summarize";
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

async function getProfile(screenName?: string) {
    let endpoint: string;
    let options: object;

    if (screenName === undefined) {
        endpoint = "account/verify_credentials";
        options = {};
    }
    else {
        endpoint = "users/show";
        options = { screen_name: screenName };
    }

    return new Promise<Profile>((resolve, reject) => {
        client.get(endpoint, options, (error, response) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(response);
        });
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

function createFileName(screenName: string): string {
    const currentDate: string = DateFns.format(new Date(), "YYYY-MM-DD");
    let filename: string;

    for (let i: number = 0; ; i++) {
        if (i === 0) {
            filename = `./${screenName}-${currentDate}.json`;
        }
        else {
            filename = `./${screenName}-${currentDate}_${i}.json`;
        }

        if (fs.existsSync(filename) === false) {
            break;
        }
    }

    return filename;
}

function createDirName(screenName: string): string {
    const currentDate: string = DateFns.format(new Date(), "YYYY-MM-DD");
    let filename: string;

    for (let i: number = 0; ; i++) {
        if (i === 0) {
            filename = `./${screenName}-${currentDate}`;
        }
        else {
            filename = `./${screenName}-${currentDate}_${i}`;
        }

        if (fs.existsSync(filename) === false) {
            break;
        }
    }

    return filename;
}

function convertDailyTweetCountToHtmlOutput(dailyTweetCount: DailyTweetCount[]) {
    const JSTOffsetHours = 9;
    const maxDate = lodash.last(dailyTweetCount).date;
    const minDate = DateFns.format(DateFns.addHours(DateFns.subDays(maxDate, 30), JSTOffsetHours), "YYYY-MM-DD");

    const result: Array<{ label: string, count: number, height?: number }> = [];
    for (const day of DateFns.eachDay(minDate, maxDate)) {
        const date = DateFns.format(DateFns.addHours(day, JSTOffsetHours), "YYYY-MM-DD");

        const record = dailyTweetCount.find((r) => r.date === date);
        if (record === undefined) {
            result.push({ label: date.substr(-2), count: 0 });
        }
        else {
            result.push({ label: record.date.substr(-2), count: record.count });
        }
    }

    const maxCount: number = lodash.maxBy(result, "count").count;
    const halfCount: number = Math.round(maxCount / 2);

    const maxHeight: number = 185;
    for (const data of result) {
        data.height = Math.round(maxHeight * data.count / maxCount);
    }

    return {
        data: result,
        verticalLabels: [0, halfCount, maxCount]
    };
}

function convertDayHourTweetCountToHtmlOutput(dayHourTweetCount: DailyHourlyTweetCount[]) {
    const result = lodash.cloneDeep(dayHourTweetCount);

    for (const outer of result) {
        for (const inner of outer.hours) {
            let color: string = "";
            if (inner.count >= 30) {
                color = "#196127";
            }
            else if (inner.count >= 20) {
                color = "#239a3b";
            }
            else if (inner.color >= 10) {
                color = "#7bc96f";
            }
            else if (inner.count >= 1) {
                color = "#c6e48b";
            }
            else {
                color = "#ebedf0";
            }

            inner.color = color;
        }
    }

    return result;
}

(async () => {
    const profile = await getProfile(Commander.screenName);
    const tweets = await getTweets(Commander.screenName);

    if (Commander.createStub) {
        fs.writeFileSync("./stubProfile.json", JSON.stringify(profile, null, 4));
        fs.writeFileSync("./stubTweets.json", JSON.stringify(tweets, null, 4));
    }

    const daysFromCreateAccount = DateFns.differenceInCalendarDays(new Date(), profile.created_at);
    const tweetsPerDay = Math.round(profile.statuses_count / daysFromCreateAccount);

    /* tslint:disable:object-literal-sort-keys */
    const output = {
        profile: {
            screenName: profile.screen_name,
            name: profile.name,
            statusesCount: profile.statuses_count,
            tweetsPerDay,
            friendsCount: profile.friends_count,
            followersCount: profile.followers_count,
            createdAt: profile.created_at,
            description: profile.description,
        },
        dailyTweetCount: Summarize.summarizeDailyTweetCount(tweets),
        dayHourTweetCount: Summarize.summarizeDayHourTweetCount(
            tweets,
            DateFns.startOfDay(DateFns.subDays(new Date(), 8)),
            DateFns.endOfDay(DateFns.subDays(new Date(), 1))
        ),
        replyTweetCount: Summarize.summarizeReplyCount(tweets),
        hashtagTweetCount: Summarize.summarizeHashtagCount(tweets),
    };
    /* tslint:enable:object-literal-sort-keys */

    if (format === "json") {
        const fileName: string = createFileName(output.profile.screenName);
        fs.writeFileSync(fileName, JSON.stringify(output, null, 4));
    }
    else if (format === "html") {
        const dirName = createDirName(output.profile.screenName);
        fs.mkdirSync(dirName);

        for (const staticFileName of ["normalize.css", "styles.css"]) {
            const src = path.join("./templates", staticFileName);
            const dest = path.join(dirName, staticFileName);

            fs.copyFileSync(src, dest);
        }

        const iconFileName = await downloadProfileImage(profile.profile_image_url, dirName, "icon");

        /* tslint:disable:object-literal-sort-keys */
        const data = {
            profile: output.profile,
            iconFileName,
            dailyTweetCount: convertDailyTweetCountToHtmlOutput(output.dailyTweetCount),
            dayHourTweetCount: convertDayHourTweetCountToHtmlOutput(output.dayHourTweetCount),
            replyTweetCount: output.replyTweetCount.slice(0, 10),
            hashtagTweetCount: output.hashtagTweetCount.slice(0, 10),
        };
        /* tslint:enable:object-literal-sort-keys */

        const env = Nunjucks.configure("templates");
        env.addFilter("numberFormat", (num: number) => num.toLocaleString());
        env.addFilter("dateFormat", (date: Date) => DateFns.format(date, "YYYY-MM-DD"));
        const indexFileName = path.join(dirName, "index.html");
        fs.writeFileSync(indexFileName, env.render("index.njk", data));
    }
    else {
        assert.fail(`Unsupported output format: "${format}"`);
    }
})()
.catch(
    (error) => console.log(error)
);
