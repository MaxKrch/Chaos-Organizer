self.addEventListener(`message`, async (event) => {
  try {
    const { url, title } = event.data;
    const responseFromServer = await fetch(url);

    const fileBlob = await responseFromServer.blob();
    const fileLink = URL.createObjectURL(fileBlob);

    self.postMessage(fileLink);
  } catch (err) {
    console.log(`Не получилось загрузить файл: ${err}`);

    return null;
  }
});
