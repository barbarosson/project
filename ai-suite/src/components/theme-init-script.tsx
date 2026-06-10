/** Ensures the document root stays on the light theme (no dark mode). */
export function ThemeInitScript() {
  const snippet = `
(function(){
  try {
    var r=document.documentElement;
    r.classList.remove("light","dark");
    r.classList.add("light");
    localStorage.setItem("ai-suite:theme","light");
  } catch(e) {}
})();
`.trim();

  return <script dangerouslySetInnerHTML={{ __html: snippet }} />;
}
