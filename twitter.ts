import { App, Notice } from "obsidian";


declare global {
	interface Window {
		twttr: any
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
            fjs.parentNode.insertBefore(js, fjs);

            t._e = [];
            t.ready = function (f) {
                t._e.push(f);
            };

            console.log("hello, I'm loading the widget")

            return t;
        }(document, "script", "twitter-wjs"));
    }

    render() {
        window.twttr.widgets.load()
    }

}