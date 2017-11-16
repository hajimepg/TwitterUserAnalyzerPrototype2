#!/usr/bin/env node

import * as fs from "fs";

import * as Commander from "commander";
import * as DateFns from "date-fns";
import * as lodash from "lodash";
import * as Twitter from "twitter";

import GetUserTimeLineOptions from "./getUserTimeLineOptions";
import Tweet from "./tweet";

import Stub from "./stub";

Commander
    .option("--screen-name <screen-name>")
    .option("--create-stub")
    .option("--use-stub")
    .parse(process.argv);

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

(async () => {
    const tweets = await getTweets(Commander.screenName);

    if (Commander.createStub) {
        fs.writeFileSync("./stub.json", JSON.stringify(tweets, null, 4));
    }

    const JSTOffsetHours = 9;
    for (const tweet of tweets) {
        tweet.created_at_jst = DateFns.addHours(DateFns.parse(tweet.created_at), JSTOffsetHours);
    }

    const groupByDate: object = lodash.groupBy(tweets,
        (tweet) => DateFns.format(tweet.created_at_jst, "YYYY-MM-DD")
    );
    for (const prop in groupByDate) {
        if (groupByDate.hasOwnProperty(prop) === false) {
            continue;
        }

        console.log(`${prop}: ${groupByDate[prop].length}`);
    }
})()
.catch(
    (error) => console.log(error)
);
