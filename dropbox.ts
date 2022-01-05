import { logging } from "logging"
import { Notice } from "obsidian"

const logger = logging.getLogger('obsidian-twitter-embeds.' + __filename)

interface Embedder {
    canCreateEmbed(el: HTMLElement): boolean
    createEmbed(el: HTMLElement): HTMLElement
}

export default class DropboxEmbedder implements Embedder {
    private currentAppKey = 'none'

    load(appKey: string) {
        // <script type="text/javascript" src="https://www.dropbox.com/static/api/2/dropins.js" id="dropboxjs" data-app-key="YOUR_APP_KEY"></script>
        if (!document.getElementById("dropboxjs")) {
            const alert = () => {
                const message = 'Twitter Embeds error: Failed to load Twitter JS'
                logger.error(message)
                new Notice(message)
            }

            logger.debug('adding dbjs')
            window.Dropbox = (function (d, s, id, secret) {
                // eslint-disable-next-line prefer-const
                let script, fjs = d.getElementsByTagName(s)[0],
                    // eslint-disable-next-line prefer-const
                    t = window.Dropbox || {};
                if (d.getElementById(id)) return t;
                // eslint-disable-next-line prefer-const
                script = d.createElement(s);
                script.id = 'dropboxjs'
                script.src = 'https://www.dropbox.com/static/api/2/dropins.js'
                script.type = 'text/javascript'
                script.setAttribute('data-app-key', secret)
                // script.async = true
                script.onerror = alert
                fjs.parentNode.insertBefore(script, fjs);

                return t;
            }(document, "script", "dropboxjs", appKey));
        }
    }

    canCreateEmbed(img: HTMLImageElement): boolean {
        return img.src.contains('dropbox.com')
    }

    addEmbed(div: HTMLDivElement, link: string): void {
        setTimeout(() => {
            logger.debug('doing the timeout')
            window.Dropbox.embed({ link: link}, div)
        }, 1000)
    }
}