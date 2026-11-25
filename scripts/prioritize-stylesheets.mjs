import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Preserve stylesheet cascade order and every tag; move only stylesheet links
 * before the first JS modulepreload in React Router's generated document head.
 * No font preload, runtime JS, CSS splitting, or request removal is involved.
 */
export function prioritizeStylesheets(html) {
  return html.replace(/<head>([\s\S]*?)<\/head>/, (_, original) => {
    const styles = [...original.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)].map((match) => match[0]);
    if (!styles.length || !original.includes('rel="modulepreload"')) return `<head>${original}</head>`;
    let head = original;
    for (const tag of styles) head = head.replace(tag, "");
    head = head.replace(/<link\b[^>]*\brel="modulepreload"[^>]*>/, (tag) => styles.join("") + tag);
    return `<head>${head}</head>`;
  });
}

export async function prioritizePrerenderedStylesheets(root = "build/client") {
  const directory = path.resolve(root);
  const files = (await fs.readdir(directory, { recursive: true })).filter((file) => file.endsWith(".html"));
  let changed = 0;
  for (const file of files) {
    const filename = path.join(directory, file);
    const before = await fs.readFile(filename, "utf8");
    const after = prioritizeStylesheets(before);
    if (after !== before) {
      await fs.writeFile(filename, after);
      changed++;
    }
  }
  console.log(`Stylesheet priority: updated ${changed}/${files.length} prerendered HTML files`);
  return { changed, total: files.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await prioritizePrerenderedStylesheets(process.argv[2]);
}
