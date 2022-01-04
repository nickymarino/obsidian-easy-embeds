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

    embed(codeBlockSource: string, el: HTMLElement) {
        const filteredSource = this._stripWhitespace(codeBlockSource)

        // This regex captures the status ID of a tweet in the form:
        // http(s)://(mobile.)twitter.com/<USERNAME>/status/<ID>(/whatever/and/or?with=parms)
        //
        // See the regex live https://regex101.com/r/nlo35z/5
        // Modified from https://stackoverflow.com/a/49753932/2597913
        const tweetRegex = /https?:\/\/(?:mobile\.)?twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(?<status_id>\d+)/
        const match = filteredSource.match(tweetRegex)


        if (match == null) {
            const message = 'Error: Could not parse tweet ID from URL below\n\n"' + filteredSource + '"'
            let pre = el.createEl('pre')
            pre.textContent = message
            el.appendChild(pre)
            return
        }

        const status_id = match.groups?.status_id

        window.twttr.widgets.createTweet(
            status_id,
            el,
            { align: 'center' }
        )

    }

    private _stripWhitespace(source: string): string {
        const sourceLines = source.split('\n')
        const linesWithValues = sourceLines.filter(line => line.length > 0)
        const filteredSource = linesWithValues.join('\n')
        return filteredSource
    }

}

