
export default interface Embedder {
    canAddEmbed(url: string): boolean
    addEmbed(parent: HTMLElement, url: string): void
}