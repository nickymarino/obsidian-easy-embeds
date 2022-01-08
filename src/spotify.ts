import Embedder from "./embedder";


export default class SpotifyEmbedder implements Embedder {
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
        const height = embedURL.contains('/track/') ? '400' : '650'

        // https://developer.spotify.com/documentation/widgets/generate/embed/
        //
        // Format:
        // <iframe src="https://open.spotify.com/embed/album/1DFixLWuPkv3KT3TnV35m3" width="300" height="380" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>
        //
        const attributes = {
            src: embedURL,
            style: 'width:100%; max-width: 660px; margin-top: 10px;',
            height: height,
            frameborder: '0',
            allowtransparency: 'true',
            allow: 'encrypted-media'
        }
        const frame = parent.createEl('iframe') as HTMLIFrameElement
        Object.entries(attributes).forEach(([key, value]) => {
            frame.setAttribute(key, value)
        })
    }


    private createEmbedURL(url: string): string | undefined {
        // Link examples: https://community.spotify.com/t5/Desktop-Windows/URI-Codes/td-p/4479486
        // Regex: https://regex101.com/r/Qxn9yC/1
        const regex = /https?:\/\/(open\.)?spotify.com\/(album|artist|track|episode|user|playlist)\/\S+/

        const trimmedURL = url.trim()
        if (!regex.test(trimmedURL)) {
            return
        }
        return trimmedURL
    }
}