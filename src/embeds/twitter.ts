import { Notice } from "obsidian";

import * as yaml from 'js-yaml';
import { Align, Cards, Conversation, Settings, Theme, Width } from "../settings";
import { UITheme } from "../main";
import Embedder from "src/embeds/embedder";


interface TwitterAPI {
    _e?: (() => void)[]
    ready?: (f: () => void) => void
    widgets?: {
        load?: () => void,
        createTweet?: (id: string, container: HTMLElement, options?: CodeBlockOptions) => Promise<HTMLElement>
    };
}

declare global {
    interface Window {
        twttr: TwitterAPI
    }
}


export default class TwitterEmbedder implements Embedder {
    constructor() {
        this.loadTwitterJS()
    }

    canAddEmbed(url: string): boolean {
        const status = this.parseStatusIDFromUrl(url)
        return ((status != null) && (status !== undefined) && (status.length > 0))
    }

    addEmbed(parent: HTMLElement, url: string, uiTheme?: UITheme, settings?: Settings): void{
        const status = this.parseStatusIDFromUrl(url.trim())
        if (!status) {
            console.log(`Error: No status could be parsed from Twitter URL: ${url}`)
            return
        }

        let options = {}
        if (settings) {
            options = this.overrideOptions(settings, {}, uiTheme)
        }

        window.twttr.ready(() => {
            window.twttr.widgets.createTweet(
                status,
                parent,
                options
            )
        })
    }

    addEmbedToCodeBlock(parent: HTMLElement, url: string, options: CodeBlockOptions): void{
        const status = this.parseStatusIDFromUrl(url)
        window.twttr.ready(() => {
            window.twttr.widgets.createTweet(
                status,
                parent,
                options
            )
        })
    }

    parseCodeBlock(filteredSource: string, defaults: Settings, uiTheme: UITheme): ParsedTweetCodeBlock {
        let contents: unknown
        try {
            contents = yaml.load(filteredSource)
        } catch (err) {
            const error = `Could not parse options from code block due to the following error:\n\n${err.message}`
            return { parseSuccessful: false, errorMessage: error } as ParsedTweetCodeBlock
        }

        if ((contents == null) || (contents == undefined)) {
            const error = 'Code block is blank'
            return { parseSuccessful: false, errorMessage: error } as ParsedTweetCodeBlock
        }

        if (!contents.hasOwnProperty("url")) {
            const error = 'Missing required key "url"'
            return { parseSuccessful: false, errorMessage: error } as ParsedTweetCodeBlock
        }

        const url = contents["url"]
        if ((url == null) || (url == undefined) || (url.length < 1)) {
            const error = 'Required key "url" cannot be blank'
            return { parseSuccessful: false, errorMessage: error } as ParsedTweetCodeBlock
        }

        const status = this.parseStatusIDFromUrl(url)
        if ((status == undefined) || (status == null)) {
            const error = `Could not parse status ID from url: "${url}"`
            return { parseSuccessful: false, errorMessage: error } as ParsedTweetCodeBlock
        }

        // Remove the url from the object so that the object can be converted into options
        delete contents["url"]
        let optionsFromCodeBlock: CodeBlockOptions
        try {
            optionsFromCodeBlock = JSON.parse(JSON.stringify(contents))

        } catch (err) {
            const error = `Could not load Twitter embed options: "${err.message}"`
            return { parseSuccessful: false, errorMessage: error } as ParsedTweetCodeBlock
        }

        const finalOptions = this.overrideOptions(defaults, optionsFromCodeBlock, uiTheme)
        console.log('theme: ' + finalOptions.theme)
        return { parseSuccessful: true, status: status, options: finalOptions } as ParsedTweetCodeBlock
    }

    parseStatusIDFromUrl(url: string): string | undefined {
        // This regex captures the status ID of a tweet in the form:
        // http(s)://(mobile.)twitter.com/<USERNAME>/status/<ID>(/whatever/and/or?with=parms)
        //
        // See the regex live https://regex101.com/r/nlo35z/5
        // Modified from https://stackoverflow.com/a/49753932/2597913
        const tweetRegex = /https?:\/\/(?:mobile\.)?twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(?<status_id>\d+)/
        return url.trim().match(tweetRegex)?.groups?.status_id
    }

    overrideOptions(defaults: Settings, overrides: CodeBlockOptions, uiTheme: UITheme): CodeBlockOptions {
        // Use the Ui theme if overrides theme is set to auto, or overrides theme is missing
        // and defaults theme is auto
        let finalTheme: Theme
        if ((overrides.theme == null) || (overrides == undefined)) {
            finalTheme = (defaults.theme == 'auto' ? uiTheme : defaults.theme)
        } else {
            finalTheme = (overrides.theme == 'auto' ? uiTheme : overrides.theme)
        }

        return new CodeBlockOptions(
            overrides.conversation ?? defaults.conversation,
            overrides.cards ?? defaults.cards,
            overrides.width ?? defaults.width,
            overrides.align ?? defaults.align,
            overrides.theme ?? finalTheme
        )
    }

    loadTwitterJS() {
        const alert = () => {
            const message = 'Twitter Embeds error: Failed to load Twitter JS'
            console.error(message)
            new Notice(message)
        }

        // https://developer.twitter.com/en/docs/twitter-for-websites/javascript-api/guides/set-up-twitter-for-websites
        window.twttr = (function (d, s, id) {
            // eslint-disable-next-line prefer-const
            let js, fjs = d.getElementsByTagName(s)[0],
                // eslint-disable-next-line prefer-const
                t = window.twttr || {};
            if (d.getElementById(id)) return t;
            // eslint-disable-next-line prefer-const
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

    refreshTwitterJS() {
        window.twttr.ready(() => {
            window.twttr.widgets.load()
        })
    }

}

interface ParsedTweetCodeBlock {
    parseSuccessful: boolean
    options?: CodeBlockOptions
    status?: string
    errorMessage?: string
}

class CodeBlockOptions {
    conversation?: Conversation
    cards?: Cards
    width?: Width
    align?: Align
    theme?: Theme

    constructor(
        conversation?: Conversation,
        cards?: Cards,
        width?: Width,
        align?: Align,
        theme?: Theme,
    ) {
        this.conversation = conversation
        this.cards = cards
        this.width = width
        this.align = align
        this.theme = theme
    }
}