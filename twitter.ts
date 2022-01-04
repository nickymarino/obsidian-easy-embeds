import { App, MarkdownPostProcessorContext, Notice } from "obsidian";

import * as yaml from 'js-yaml';


interface TwitterAPIEmbedOptions {

}

interface TwitterAPI {
    _e?: (() => void)[]
    ready?: (f: () => void) => void
    widgets?: {
        load?: () => void,
        createTweet?: (id: string, container: HTMLElement, options?: TwitterAPIEmbedOptions) => Promise<HTMLElement>
    };
}

declare global {
    interface Window {
        twttr?: TwitterAPI
    }
}


export default class TwitterEmbed {

    load() {
        const alert = () => {
            const message = 'Twitter Embeds error: Failed to load Twitter JS'
            console.error(message)
            new Notice(message)
        }

        // https://developer.twitter.com/en/docs/twitter-for-websites/javascript-api/guides/set-up-twitter-for-websites
        window.twttr = (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0],
                t = window.twttr || {};
            if (d.getElementById(id)) return t;
            js = d.createElement(s);
            js.id = id;
            js.src = "https://platform.twitter.com/widgets.js";
            js.onerror = alert
            js.async = true
            fjs.parentNode.insertBefore(js, fjs);

            t._e = [];
            t.ready = function (f) {
                t._e.push(f);
            };

            return t;
        }(document, "script", "twitter-wjs"));
    }

    render() {
        window.twttr.ready(() => {
            window.twttr.widgets.load()
        })
    }

    embedFromCodeBlock(source: string, el: HTMLElement) {
        //TODO: this should return a pass/fail, plus either the config or the error message
        // for testing, then the caller (plugin) should handle creating the el
        let contents: any
        try {
            contents = yaml.load(source)
        } catch (err) {
            const errorBlock = el.createEl('pre')
            errorBlock.textContent = `Twitter Embeds ERROR\n\ncould not parse options from code block due to the following error:\n\n${err.message}`
            return
        }

        if ((contents == null) || (contents == undefined)) {
            const errorBlock = el.createEl('pre')
            errorBlock.textContent = 'Twitter Embeds ERROR\n\ncode block is blank'
            return
        }

        if (!contents.hasOwnProperty("url")) {
            const errorBlock = el.createEl('pre')
            errorBlock.textContent = 'Twitter Embeds ERROR\n\nmissing required key "url"'
            return
        }

        const url = contents["url"]
        if ((url == null) || (url == undefined) || (url.length < 1)) {
            const errorBlock = el.createEl('pre')
            errorBlock.textContent = `Twitter Embeds ERROR\n\nrequired key "url" cannot be blank`
            return
        }

        const status = this._parseStatusIDFromUrl(url)
        if ((status == undefined) || (status == null)) {
            const errorBlock = el.createEl('pre')
            errorBlock.textContent = `Twitter Embeds ERROR\n\ncould not parse status ID from url: "${url}"`
            return
        }

        // Remove the url from the object so that it can be converted into config options
        delete contents["url"]
        let config: Config
        try {
            config = JSON.parse(JSON.stringify(contents))

        } catch (err) {
            const errorBlock = el.createEl('pre')
            errorBlock.textContent = `Twitter Embeds ERROR\n\ncould not load Twitter embed options: "${err.message}"`
            return
        }

        const { ...options } = config
        window.twttr.ready(() => {
            window.twttr.widgets.createTweet(
                status,
                el,
                options
            )
        })


    }

    private _parseStatusIDFromUrl(url: string): string | undefined {
        // This regex captures the status ID of a tweet in the form:
        // http(s)://(mobile.)twitter.com/<USERNAME>/status/<ID>(/whatever/and/or?with=parms)
        //
        // See the regex live https://regex101.com/r/nlo35z/5
        // Modified from https://stackoverflow.com/a/49753932/2597913
        const tweetRegex = /https?:\/\/(?:mobile\.)?twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(?<status_id>\d+)/
        return url.match(tweetRegex)?.groups?.status_id
    }

}



class Config {
    conversation: "all" | "none"
    cards: "visible" | "hidden"
    width: BigInteger | string
    align: "left" | "center" | "right"
    theme: "dark" | "light"

    constructor(
        conversation?: "all" | "none",
        cards?: "visible" | "hidden",
        width?: BigInteger | string,
        align?: "left" | "center" | "right",
        theme?: "dark" | "light"
    ) {
        this.conversation = conversation ?? "all"
        this.cards = cards ?? "visible"
        this.width = width ?? "auto"
        this.align = align ?? "center"
        this.theme = theme ?? "light"
    }
}