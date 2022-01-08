import { syntaxTree } from "@codemirror/language";
import { Range } from "@codemirror/rangeset";
import { tokenClassNodeProp } from "@codemirror/stream-parser";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { NodeType, SyntaxNode } from "@lezer/common";
import Embedder from "src/embeds/embedder";



class EmbedWidget extends WidgetType {
    readonly url: string
    readonly embedder: Embedder

    constructor(url: string, embedder: Embedder) {
        super()
        this.url = url
        this.embedder = embedder
    }

    eq(other: EmbedWidget) {
        return other.url == this.url
    }

    toDOM(view: EditorView): HTMLElement {
        const wrap = document.createElement('div')
        wrap.className = 'embed-container'
        this.embedder.addEmbed(wrap, this.url)
        return wrap
    }

    get estimatedHeight(): number {
        return 400
    }

    ignoreEvent(_event: Event): boolean {
        return false
    }
}


export function buildEmbedderExtension(embedders: Embedder[]) {
    return ViewPlugin.fromClass(
        class {
            decorations: DecorationSet
            embedders: Embedder[] = embedders

            constructor(view: EditorView) {
                this.decorations = this.buildDecorations(view)
            }

            update(update: ViewUpdate) {
                if (update.docChanged || update.viewportChanged) {
                    this.decorations = this.buildDecorations(update.view)
                }
            }

            destroy() { }

            buildDecorations(view: EditorView) {
                const widgets: Range<Decoration>[] = []
                for (const { from, to } of view.visibleRanges) {
                    // Watch for decoration build issues *before* an error
                    // forces the extension to unload
                    try {
                        const tree = syntaxTree(view.state)
                        tree.iterate({
                            from,
                            to,
                            enter: (nodeType: NodeType, from: number, to: number) => {
                                // Using a TreeCursor here might be slightly more efficient,
                                // but the real bottleneck is the embeds loading anyway
                                const currentNode = tree.resolve(from, 1) as SyntaxNode
                                const text = view.state.doc.sliceString(from, to).replace(' ', '')

                                // Back out if this token isn't something we can embed
                                if (!this.tokenIsEmbeddableURL(currentNode, nodeType, text)) {
                                    return
                                }

                                for (const embedder of this.embedders) {
                                    if (!embedder.canAddEmbed(text)) {
                                        continue
                                    }

                                    const deco = Decoration.widget({
                                        widget: new EmbedWidget(text, embedder),
                                        side: 1,
                                    })

                                    // Add the widget to the end of the line
                                    const line = view.state.doc.lineAt(from)
                                    const lineEnd = line.to
                                    widgets.push(deco.range(lineEnd))
                                }

                            }
                        })
                    } catch (error) {
                        // Log and throw here so that you can read the exception
                        // before codemirror unloads your plugin (throw so that
                        // you don't crash the editor)
                        console.error('Fatal live view embed error: ' + error)
                    }

                }
                return Decoration.set(widgets)

            }

            tokenIsEmbeddableURL(node: SyntaxNode, nodeType: NodeType, text: string): boolean {
                const tokenProps = nodeType.prop(tokenClassNodeProp)
                if (!tokenProps) {
                    return false
                }

                // First, exit on any token that isn't an external URL inside a formatting link
                const props = new Set(tokenProps.split(' '))
                const isURLToken = props.has('url') && !props.has('formatting')
                const isExternalURL = text.contains('://')
                if (!isURLToken || !isExternalURL) {
                    return false
                }

                // Then, exit if the URL text is invalid
                try {
                    new URL(text)
                } catch (err) {
                    console.error('Invalid URL: ' + text)
                    return false
                }

                // Check whether the sibling node two steps to the left is an image
                // and we shouldn't add decorations
                const leftLeftSibling = node?.prevSibling?.prevSibling
                if (!leftLeftSibling) {
                    return false
                }

                const siblingPropString = leftLeftSibling.type.prop(tokenClassNodeProp) ?? ''
                const siblingProps = new Set(siblingPropString.split(' '))
                if (siblingProps.has('image')) {
                    return
                }

                return true
            }


        }, {
        decorations: v => v.decorations,
    })
}

