import { Notice } from "obsidian"
import Embedder from "./embedder"

declare global {
    interface Window {
        Dropbox: DropboxAPI
    }
}

interface DropboxAPI {
    embed?: (options: Record<string, unknown>, el: HTMLElement) => void
}


export default class DropboxEmbedder implements Embedder {
    private dropboxJSIdentifier = 'dropboxjs'
    private appKey: string

    constructor(appKey: string) {
        this.appKey = appKey
        this.loadDropboxJS(true)
    }

    canAddEmbed(url: string): boolean {
        return url.contains('dropbox.com')
    }

    addEmbed(parent: HTMLElement, url: string) {
        // Add a basic image if the Dropbox URL is "easy", because that loads
        // much faster than Dropbox's iframe
        //
        // Regex: https://regex101.com/r/MB2WRa/1
        const isImageRegex = new RegExp(/https?:\/\/(www\.)?dropbox.com\/(?<slug>s\/[\w\d]+\/\S+\.(png|jpeg|gif|jpg))(\?dl=0)?/, 'i')
        const imageSlug = url.trim().match(isImageRegex)?.groups?.slug

        if (imageSlug) {
            const embedUrl = `https://www.dropbox.com/${imageSlug}?raw=1`

            const img = parent.createEl('img') as HTMLImageElement
            img.setAttribute('style', 'margin-top: 10px;')
            img.alt = 'Dropbox embedded image'
            img.src = embedUrl
        } else {
            // Otherwise, use the Dropbox JS
            parent.setAttribute('style', 'height: 450px; margin-top: 10px;')
            this.ready(() => {
                window.Dropbox.embed({ link: url }, parent)
            })
        }
    }

    ready(callback: () => void) {
        (async () => {
            while (!window.hasOwnProperty('Dropbox')
                    || !window.Dropbox.hasOwnProperty('embed')
                    || !window.Dropbox.embed) {
                await new Promise(resolve => setTimeout(resolve, 500))
            }
            callback()
        })()
    }

    setAppKey(newKey: string) {
        if (newKey == this.appKey) {
            return
        }
        this.appKey = newKey
        this.loadDropboxJS(true)
    }

    loadDropboxJS(force = false) {
        const existingDropbox = document.getElementById(this.dropboxJSIdentifier)
        if (!force && existingDropbox) {
            return
        }

        const alert = () => {
            const message = 'Easy Embeds error: Failed to load Dropbox JS'
            console.error(message)
            new Notice(message)
        }

        window.Dropbox = (function (d, s, id, secret) {
            // eslint-disable-next-line prefer-const
            let script, fjs = d.getElementsByTagName(s)[0],
                // eslint-disable-next-line prefer-const
                t = window.Dropbox || {};
            if (d.getElementById(id)) return t;

            // <script type="text/javascript" src="https://www.dropbox.com/static/api/2/dropins.js" id="dropboxjs" data-app-key="YOUR_APP_KEY"></script>

            // eslint-disable-next-line prefer-const
            script = d.createElement(s) as HTMLScriptElement
            script.id = 'dropboxjs'
            script.src = 'https://www.dropbox.com/static/api/2/dropins.js'
            script.type = 'text/javascript'
            script.setAttribute('data-app-key', secret)
            // script.async = true
            script.onerror = alert
            fjs.parentNode.insertBefore(script, fjs);

            return t;
        }(document, "script", this.dropboxJSIdentifier, this.appKey));
    }
}