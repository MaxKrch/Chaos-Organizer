export default function addActiveLinks(text) {
  const regex = /https?:(\/\/)?(www\.)?\S+\.\S+/gi;
  const textWithActiveLinkd = text.replace(regex, (match) => {
    const linkText = match.replace(/https?:(\/\/)?(www\.)?/gi, '');
    const linkElement = `<a href="${match}" class="feed-note__text-active-link">${linkText}</a>`;

    return linkElement;
  });
  return textWithActiveLinkd;
}
