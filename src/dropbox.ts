import { Notice } from "obsidian"
import Embedder from "./embedder"


export default class DropboxEmbedder implements Embedder{
    private appKey: string

    constructor(appKey: string) {
        this.appKey = appKey
        this.loadDropboxJS(true)
    }

    canAddEmbed(url: string): boolean {
        return url.contains('dropbox.com')
    }

    addEmbed(div: HTMLDivElement, link: string): void {
        setTimeout(() => {
            console.debug('doing the timeout')
            window.Dropbox.embed({link: link}, div)
        }, 5000)
    }


    setAppKey(newKey: string) {
        if (newKey == this.appKey) {
            return
        }
        this.appKey = newKey
        this.loadDropboxJS(true)
    }

    loadDropboxJS(force = false) {
        const existingDropbox = document.getElementById("dropboxjs")
        if (!force && existingDropbox) {
            return
        }

        const alert = () => {
            const message = 'Twitter Embeds error: Failed to load Twitter JS'
            console.error(message)
            new Notice(message)
        }

        console.debug('adding dbjs')
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
        }(document, "script", "dropboxjs", this.appKey));
    }

    canCreateEmbed(img: HTMLImageElement): boolean {
        return img.src.contains('dropbox.com')
    }

}