export function init() {
    // https://developer.twitter.com/en/docs/twitter-for-websites/javascript-api/guides/set-up-twitter-for-websites
    let source = `window.twttr = (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0],
          t = window.twttr || {};
        if (d.getElementById(id)) return t;
        js = d.createElement(s);
        js.id = id;
        js.src = "https://platform.twitter.com/widgets.js";
        fjs.parentNode.insertBefore(js, fjs);

        t._e = [];
        t.ready = function(f) {
          t._e.push(f);
        };

        console.log("hello, I'm loading the widget")

        return t;
      }(document, "script", "twitter-wjs"));`;

    console.log("about to add the script");
    let script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.text = source;
    script.onload = () => {
        console.log("i'm loaded!");
        twttr.widgets.load();
    };
    document.getElementsByTagName('head')[0].appendChild(script);
    console.log("done adding the script");

}


export const loadWidgets = () => {
    twttr.widgets.load()
}