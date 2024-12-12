const createNoteStaticElements = {
	placeholder: `My text`,
	buttons: {
		geolocation: `Моя геолокация`,
		tag: `Добавить тег`,
		voice: `Записать войс`,
		video: `Записать видео`,
		files:	`Добавить файлы`
	},
	error: {
		title: `Не все файлы были загружены:`,
		description: {
			size: `Слишком большие файлы`,
			count: `Слишком много файлов`,
		}
	}
}

export {
	createNoteStaticElements
}