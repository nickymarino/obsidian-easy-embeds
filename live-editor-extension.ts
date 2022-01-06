import { syntaxTree } from "@codemirror/language";
import { Range, RangeSetBuilder } from "@codemirror/rangeset";
import { tokenClassNodeProp } from "@codemirror/stream-parser";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { randomInt } from "crypto";


class CheckboxWidget extends WidgetType {
    constructor(readonly checked: boolean) { super() }

    eq(other: CheckboxWidget) { return other.checked == this.checked }

    toDOM(view: EditorView): HTMLElement {
        const wrap = document.createElement('span')
        wrap.setAttribute('aria-hidden', 'true')
        wrap.className = 'cm-boolean-toggle'
        const box = wrap.appendChild(document.createElement('input'))
        box.type = 'checkbox'
        box.checked = this.checked
        return wrap
    }

    // TODO: create updateDOM() to return whether this widget should get updated?
    // https://codemirror.net/6/docs/ref/#view.WidgetType.updateDOM

    ignoreEvent(_event: Event): boolean {
        // TODO: possibly check settings to see if this should be loaded?
        return false
    }
}


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
                    console.log(`Link @ line ${line.number} (from=${from}, to=${to}): ${linkText}`)

                    const deco = Decoration.widget({
                        widget: new CheckboxWidget(randomInt(2) == 0 ? true : false),
                        side: 1,
                        block: true
                    })

                    // Add the widget to the end of the line
                    const lineEnd = line.to
                    widgets.push(deco.range(lineEnd))
                }
            })
        }
        return Decoration.set(widgets)

        // return builder.finish()
    }

}

export function buildEmbedderExtension(): ViewPlugin<EmbedderViewPlugin> {
    return ViewPlugin.fromClass(EmbedderViewPlugin, {
        decorations: v => v.decorations,
        eventHandlers: {
            mousedown: (e, view) => {
                const target = e.target as HTMLElement
                if (target.nodeName == "INPUT" &&
                    target.parentElement?.classList.contains('cm-boolean-toggle')) {
                    return toggleBoolean(view, view.posAtDOM(target))
                }
            }
        }
    })
}

function toggleBoolean(view: EditorView, pos: number): boolean {
    const before = view.state.doc.sliceString(Math.max(0, pos - 5), pos)
    let change
    if (before == "false") {
        change = { from: pos - 5, to: pos, insert: "true" }
    } else if (before.endsWith("true")) {
        change = { from: pos - 4, to: pos, insert: "false" }
    } else {
        return false
    }
    view.dispatch({ changes: change })
    return true
}