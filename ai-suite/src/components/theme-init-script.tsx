import { THEME_COOKIE } from "@/lib/theme";

/** Runs before paint to avoid theme flash (pairs with ThemeProvider). */
export function ThemeInitScript() {
  const snippet = `
(function(){
  try {
    var key=${JSON.stringify(THEME_COOKIE)};
    var stored=localStorage.getItem("ai-suite:theme");
    var m=document.cookie.match(new RegExp("(?:^|; )"+key+"=(light|dark)"));
    var t=(m&&m[1])||(stored==="light"||stored==="dark"?stored:null)||"dark";
    var r=document.documentElement;
    r.classList.remove("light","dark");
    r.classList.add(t);
  } catch(e) {}
})();
`.trim();

  return (
    <script
      dangerouslySetInnerHTML={{ __html: snippet }}
    />
  );
}
