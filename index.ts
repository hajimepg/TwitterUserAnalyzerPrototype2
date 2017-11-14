#!/usr/bin/env node

import * as Commander from "commander";
import * as lodash from "lodash";
import * as Twitter from "twitter";

import GetUserTimeLineOptions from "./getUserTimeLineOptions";
import Tweet from "./tweet";

Commander
    .option("--screen-name <screen-name>")
    .parse(process.argv);

const client = new Twitter({
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
});

async function getTweets(screenName: string) {
    return new Promise<Tweet[]>((resolve, reject) => {
        let result: Tweet[] = [];

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

                const lastTweetId = lodash.last(response).id;
                console.log(`count=${response.length} lastTweetId=${lastTweetId}` );

                result = result.concat(response);

                if (response.length === 0 || (response.length === 1 && maxId === lastTweetId)) {
                    resolve(result);
                }
                else {
                    getTweetsInternal(lastTweetId);
                }
            });
        }

        getTweetsInternal();
    });
}

(async () => {
    const tweets = await getTweets(Commander.screenName);
    console.log(tweets.length);
})()
.catch(
    (error) => console.log(error)
);
