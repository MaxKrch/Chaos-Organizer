import createBlobUrl from './createBlobUrl.web-worker.js';

// export default async function (url, title) {
// 	try {
// 		const responseFromServer = await fetch(url);
// 		const fileBlob = await responseFromServer.blob();

// 		const fileLink = URL.createObjectURL(fileBlob)

// 		const fileElement = document.createElement(`a`);
// 		fileElement.setAttribute(`href`, fileLink);
// 		fileElement.setAttribute(`download`, title);
// 		fileElement.dispatchEvent(new MouseEvent(`click`))

// 		setTimeout(() => URL.revokeObjectURL(fileLink), 0);

// 	} catch(err) {
// 		console.log(`Не получилось загрузить файл: ${err}`)
// 	}
// }

export default async function (url, title) {
  return new Promise((res, rej) => {
    try {
      const fileLoader = new createBlobUrl();
      fileLoader.addEventListener(`message`, (event) => {
        const fileLink = event.data;
        const fileElement = document.createElement(`a`);
        fileElement.setAttribute(`href`, fileLink);
        fileElement.setAttribute(`download`, title);
        fileElement.dispatchEvent(new MouseEvent(`click`));
        fileLoader.terminate();

        setTimeout(() => URL.revokeObjectURL(fileLink), 0);

        res();
      });

      fileLoader.postMessage({ url, title });
    } catch (err) {
      console.log(`Не получилось загрузить файл: ${err}`);
      rej();
    }
  });
}
