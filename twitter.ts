import { App, MarkdownPostProcessorContext, Notice } from "obsidian";

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
        window.twttr.widgets.load()
    }

    embedFromCodeBlock(source: string, el: HTMLElement) {
        console.log('parsing')
        const s = this._stripWhitespace(source)
        const yaml = require('js-yaml')
        const t = yaml.load(s)

        const filteredSource = this._stripWhitespace(source)
        const status = this._parseStatusIDFromUrl(filteredSource)
        const con = new Config(status, t.conversation, t.cards, t.width, t.align, t.theme)
        console.log(t)

        window.twttr.widgets.createTweet(
            con.status,
            el,
            con.options()
        )

        // console.log()
        // const simpleConfig = this._parseSimpleUrlConfig(source)
        // if (simpleConfig.didParse) {
        //     window.twttr.widgets.createTweet(
        //         simpleConfig.config.status,
        //         el,
        //         { align: 'center' }
        //     )
        //     return
        // }


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

    // private _parseSimpleUrlConfig(source: string): ParseResult {

    //     const filteredSource = this._stripWhitespace(source)
    //     const status_id = this._parseStatusIDFromUrl


    //     return {didParse: true, config: {status: status_id}} as ParseResult
    // }

    private _stripWhitespace(source: string): string {
        const sourceLines = source.split('\n')
        const linesWithValues = sourceLines.filter(line => line.length > 0)
        const filteredSource = linesWithValues.join('\n')
        return filteredSource
    }

}

interface UserConfig {
    url: string
}

interface ParseResult {
    didParse: boolean
    config?: Config
    errorMessage?: string
}

class Config {
    status: string
    conversation: "all" | "none"
    cards: "visible" | "hidden"
    width: BigInteger | string
    align: "left" | "center" | "right"
    theme: "dark" | "light"

    constructor(
        status: string,
        conversation?: "all" | "none",
        cards?: "visible" | "hidden",
        width?: BigInteger | string,
        align?: "left" | "center" | "right",
        theme?: "dark" | "light"
    ) {
        this.status = status
        this.conversation = conversation ?? "all"
        this.cards = cards ?? "visible"
        this.width = width ?? "auto"
        this.align = align ?? "center"
        this.theme = theme ?? "light"
    }

    options() {
        return {
            conversation: this.conversation,
            cards: this.cards,
            width: this.width,
            align: this.align,
            theme: this.theme,
        }
    }
}