export default function chekCreatedNoteForAddingToFeed(data) {
  const { location, note } = data;

  if (location.section === `files`) {
    return false;
  }

  if (location.section === `notes` && location.category === `all`) {
    return true;
  }

  if (
    location.section === `tag` &&
    note.tags.find((item) => item.id === location.tag.id)
  ) {
    return true;
  }

  return false;
}
