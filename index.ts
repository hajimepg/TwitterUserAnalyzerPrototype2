#!/usr/bin/env node

import * as Commander from "commander";
import * as Twitter from "twitter";

Commander
    .option("--screen-name <screen-name>")
    .parse(process.argv);

console.log(Commander.screenName);

const client = new Twitter({
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
});

async function getTweets(screenName: string) {
    return new Promise<object[]>((resolve, reject) => {
        const options: { screen_name?: string } = {};
        if (screenName !== undefined) {
            options.screen_name = screenName;
        }
        client.get("statuses/user_timeline", options, (error, response) => {
            resolve(response);
        });
    });
}

(async () => {
    const tweets = await getTweets(Commander.screenName);
    console.log(tweets);
})()
.catch(
    (error) => console.log(error)
);
