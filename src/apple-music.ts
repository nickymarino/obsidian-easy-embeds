import Embedder from "./embedder";




export default class AppleMusicEmbedder implements Embedder {
    canAddEmbed(url: string): boolean {
        return this.createEmbedURL(url) != undefined
    }

    addEmbed(parent: HTMLElement, url: string): void {
        const embedURL = this.createEmbedURL(url)
        if (!embedURL) {
            return
        }
        console.log('printing ' + embedURL)

        // Make the container shorter if it's just one song
        const height = embedURL.contains('?i=') ? '150' : '450'

        const attributes = {
            allow: 'autoplay *; encrypted-media *; fullscreen *',
            frameborder: '0',
            height: height,
            style: 'width:100%; max-width:660px; overflow:hidden; background:transparent; margin-top: 10px;',
            sandbox: 'allow-forms allow-popups allow-same-origin allow-scripts  allow-top-navigation-by-user-activation',
            src: embedURL
        }
        const frame = parent.createEl('iframe') as HTMLIFrameElement
        Object.entries(attributes).forEach(([key, value]) => {
            frame.setAttribute(key, value)
        })
    }


    private createEmbedURL(url: string): string | undefined {
        // https://regex101.com/r/Vdgrnm/2
        const regex = /https?:\/\/(embed\.)?music.apple.com\/(?<slug>\S+\/(album|station|playlist)\/\S+)/

        const slug = url.trim().match(regex)?.groups?.slug
        if (!slug) {
            return
        }

        console.log('found ' + slug)
        return 'https://embed.music.apple.com/' + slug
    }
}