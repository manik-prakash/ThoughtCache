function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderMarkdown(text: string): string {
  let html = escapeHtml(text);

  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mb-2 mt-4">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mb-2 mt-4">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-3 mt-4">$1</h1>');

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    (_match, label: string, url: string) =>
      /^https?:\/\//i.test(url)
        ? `<a href="${url}" class="text-[#0acffe] hover:underline" target="_blank" rel="noopener noreferrer">${label}</a>`
        : label
  );

  html = html.replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>');
  html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-disc mb-2">$1</ul>');

  html = html.replace(/\n/g, '<br>');

  return html;
}
