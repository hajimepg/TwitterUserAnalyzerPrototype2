#!/usr/bin/env node

import * as Twitter from "twitter";

const client = new Twitter({
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
});

async function getTweets() {
    return new Promise<object[]>((resolve, reject) => {
        client.get("statuses/user_timeline", (error, response) => {
            resolve(response);
        });
    });
}

(async () => {
    const tweets = await getTweets();
    console.log(tweets);
})()
.catch(
    (error) => console.log(error)
);
