// Controlled experiment: transform only resource hints in the generated head.
// No JS, CSS, font, content, dependency or compression changes between variants.
export function transformHead(html, variant, fonts) {
  if (variant === 'baseline') return html;
  if (!['css-first', 'font-bold', 'font-all'].includes(variant)) throw new Error(`Unknown variant ${variant}`);
  return html.replace(/<head>([\s\S]*?)<\/head>/, (_, original) => {
    const styles = [...original.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)].map(m => m[0]);
    if (!styles.length || !original.includes('rel="modulepreload"')) throw new Error('Expected stylesheet and modulepreload links');
    let head = original;
    for (const tag of styles) head = head.replace(tag, '');
    const selected = variant === 'font-bold' ? ['Bold'] : variant === 'font-all' ? ['Regular', 'Bold', 'Black'] : [];
    const preloads = selected.map(weight => {
      if (!fonts[weight]) throw new Error(`Missing font: ${weight}`);
      return `<link rel="preload" href="${fonts[weight]}" as="font" type="font/woff2" crossorigin="anonymous"/>`;
    }).join('');
    head = head.replace(/<link\b[^>]*\brel="modulepreload"[^>]*>/, tag => styles.join('') + preloads + tag);
    return `<head>${head}</head>`;
  });
}
