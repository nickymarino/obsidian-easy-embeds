import { syntaxTree } from "@codemirror/language";
import { Range } from "@codemirror/rangeset";
import { tokenClassNodeProp } from "@codemirror/stream-parser";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { NodeType, SyntaxNode } from "@lezer/common";
import { text } from "stream/consumers";
import TwitterEmbedder from "twitter";



class EmbedWidget extends WidgetType {
    constructor(readonly url: string) { super() }

    eq(other: EmbedWidget) { return other.url == this.url }

    toDOM(view: EditorView): HTMLElement {
        const wrap = document.createElement('span')
        wrap.setAttribute('aria-hidden', 'true')
        wrap.className = 'cm-boolean-toggle'
        const box = wrap.appendChild(document.createElement('p'))
        box.textContent = this.url
        box.setAttribute('style', 'color: red;')
        return wrap
    }

    // TODO: create updateDOM() to return whether this widget should get updated?
    // https://codemirror.net/6/docs/ref/#view.WidgetType.updateDOM

    ignoreEvent(_event: Event): boolean {
        // TODO: possibly check settings to see if this should be loaded?
        return false
    }
}


export function buildEmbedderExtension() {
    return ViewPlugin.fromClass(
        class {
            decorations: DecorationSet

            // TODO: some sort of cache for known (exact) links

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
                // const builder = new RangeSetBuilder<Decoration>()
                for (const { from, to } of view.visibleRanges) {
                    // TODO: Wrap this in a try/except, then log and throw (bleh)
                    // so that you get a log for why everything crashed after the excention
                    // is unloaded

                    const tree = syntaxTree(view.state)
                    tree.iterate({
                        from,
                        to,
                        enter: (type: NodeType, from: number, to: number) => {
                            const tokenProps = type.prop(tokenClassNodeProp)
                            if (!tokenProps) {
                                return
                            }

                            // First, exit on any token that isn't an external URL inside a formatting link
                            const props = new Set(tokenProps.split(' '))
                            const tokenText = view.state.doc.sliceString(from, to).replace(' ', '')
                            const isURLToken = props.has('url') && !props.has('formatting')
                            const isExternalURL = tokenText.contains('://')

                            if (!isURLToken || !isExternalURL) {
                                return
                            }

                            // Then, exit if the URL text is invalid
                            try {
                                new URL(tokenText)
                            } catch (err) {
                                console.error('Invalid URL: ' + tokenText)
                                return
                            }


                            // Check whether the sibling node two steps to the left is an image
                            // and we shouldn't add decorations
                            const currentNode = tree.resolve(from, 1) as SyntaxNode
                            const leftLeftSibling = currentNode?.prevSibling?.prevSibling
                            if (!leftLeftSibling) {
                                return
                            }

                            const siblingPropString = leftLeftSibling.type.prop(tokenClassNodeProp)
                            const siblingProps = new Set(siblingPropString.split(' ') ?? [])
                            for (const s of siblingProps) {
                                console.log('item: ' + s)
                            }
                            if (siblingProps.has('image')) {
                                return
                            }

                            const deco = Decoration.widget({
                                widget: new EmbedWidget(tokenText),
                                side: 1,
                                block: true
                            })

                            // Add the widget to the end of the line
                            const line = view.state.doc.lineAt(from)
                            const lineEnd = line.to
                            widgets.push(deco.range(lineEnd))
                        }
                    })
                }
                return Decoration.set(widgets)

            }


        }, {
        decorations: v => v.decorations,
    })
}

