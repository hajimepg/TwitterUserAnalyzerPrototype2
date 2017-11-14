#!/usr/bin/env node

import * as Commander from "commander";
import * as Twitter from "twitter";

Commander
    .option("--screen-name <screen-name>")
    .parse(process.argv);

const client = new Twitter({
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
});

/* tslint:disable:variable-name */
class GetUserTimeLineOptions {
    public count: number;
    public trim_user: boolean;
    public exclude_replies: boolean;
    public screen_name?: string;
}
/* tslint:enable:variable-name */

async function getTweets(screenName: string) {
    return new Promise<object[]>((resolve, reject) => {
        const options: GetUserTimeLineOptions = {
            count: 200,
            exclude_replies: false,
            trim_user: true,
        };
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
    console.log(tweets[0]);
})()
.catch(
    (error) => console.log(error)
);
