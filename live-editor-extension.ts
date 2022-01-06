import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/rangeset";
import { tokenClassNodeProp } from "@codemirror/stream-parser";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";



class EmbedderViewPlugin {
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

    destroy() {}

    buildDecorations(view: EditorView) {
        let builder = new RangeSetBuilder<Decoration>()
        for (let {from, to} of view.visibleRanges) {
            // TODO: Wrap this in a try/except, then log and throw (bleh)
            // so that you get a log for why everything crashed after the excention
            // is unloaded

            const tree = syntaxTree(view.state)
            tree.iterate({
                from,
                to,
                enter: (type, from, to) => {
                    // `type` here is a NodeType
                    const tokenProps = type.prop(tokenClassNodeProp)
                    if (!tokenProps) {
                        return
                    }

                    const props = new Set(tokenProps.split(' '))

                    const isExternalLink = props.has('url')
                    const linkText = view.state.doc.sliceString(from, to)
                    if (!(isExternalLink && linkText.contains('://'))) {
                        return
                    }

                    const line = view.state.doc.lineAt(from)
                    console.log(`Link @ line ${line.number}: ${linkText}`)
                }
            })
        }

        return builder.finish()
    }

}

export function buildEmbedderExtension(): ViewPlugin<EmbedderViewPlugin> {
    return ViewPlugin.fromClass(EmbedderViewPlugin)
}