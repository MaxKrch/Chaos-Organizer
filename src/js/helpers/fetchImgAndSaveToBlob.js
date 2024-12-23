const fetchImgAndSaveToBlob = async (src) => {


const readFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      resolve(event.target.result);
    });
    reader.readAsText(file.data);
  });
}

self.addEventListener('message', async file => {

  // const content = await readFile(file);
  const fileCSV = new TextDecoder().decode(file.data);

  // const data = parse(content, {
  const data = parse(fileCSV, {

    columns: true,
    skip_empty_lines: true,
    skip_lines_with_empty_values: true,
  });

  self.postMessage(data.length);
});

// const readFile = (file) => {
//  return new Promise ((res, rej) => {
//    const reader = new FileReader();
//    reader.addEventListener('load', (event) => {
//      res(event.target.result);
//    })
//    reader.addEventListener('error', (error) => {
//      console.log(error);
//      rej(error)
//    })

//    reader.readAsText(file)
//  })
// }
	
}