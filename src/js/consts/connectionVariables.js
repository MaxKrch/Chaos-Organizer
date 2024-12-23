const routes = {
	server: `http://192.168.1.110:7070`,
	sse: `/sse`,
	tag: {
		validate: `/tag/validate`
	},
	auth: {
		chekEmail: '/account/validate',
		register: `/account/register`,
		login: `/account/login`,
		logout: `/account/logout`,
		refreshTokens: `/account/refresh`,
	},
	categories: {
		allNotes: {
			path: `/`, 
			title: `Все записи`,
		},
		favorites: {
			path: `/favorites`,
			title: `Избранное`,
		},
		videos: {
			path: `/videos`,
			title: `Видео`,
		},
		audios: {
			path: `/audios`,
			itle: `Аудио`,
		},
		images: {
			path: `/images`,
			title: `Изображения`,
		},
		otherFiles: {
			path: `/files`,
			title: `Файлы`,
		},
		tag: {
			path: `/tag-[tag.id]`,
			title: `#[tag.title]`,
		}
	},
	serverPaths: {
		target: {
			notes: `/feed/notes`,
			files: `/feed/files`,
			tagNotes: `/feed/tag`,
			note: `/note`,  
			file: `/file`,
			tag: `/tag`,
		},
		action: {
			loading: ``,
			liveLoading: ``,
			synch: ``,
			create: `/create`,
			remove: '/remove',
			edit: `/edit`,
		}
	}
}

const actionSSEMessages = {
	newNote: {},
	removeNote: {},
	removeFile: {},
	editNote: {},
	createdTag: {},
	removeTag: {},
	pinNote: {},
	unpinNote: {},
}

const connectionOptions = {
	method: {
		create: `POST`,
		upgrad: `PUT`,
		delete: `DELETE`,
		get: `POST`
	}
}

const sampleSSEMessages = {
	newNote: {
		note: {
			id: `000`,
			favorite: false,
			pinned: false,
			text: `Lorem`,
			tags: [
				{
					id: `000`,
					title: `Lorem`,
				}
			],
			geolocation: `000, 000`,
			attachment: {
				images: [
					{
						id: `000`,
						name: `img`, 
						src: `link`
					}
				],
				videos: [],
				audios: [],
				others: []
			},
			created: 114457445,
			edited: null,
		},
		stats: {
			allNotes: 3,
			favorites: 3,
			images: 3,
			videos: 3,
			audios: 3,
			files: 3
		}
	},

	removeNote: {
		note: {
			id: `000`,
			favorite: false,
			pinned: false,
		},
		stats: {
			allNotes: 3,
			favorites: 3,
			images: 3,
			videos: 3,
			audios: 3,
			files: 3
		}
	},

	removeFile: {
		file: {
			type: `video`,
			id: `000`,
			parentNoteId: `000`
		},
		stats: {
			videos: 5,
		}
	},

	editNote: {
		note: {
			id: `000`,
			favorite: false,
			pinned: false,
			text: `Lorem`,
			tags: [],
			geolocation: `000, 000`,
			attachment: {
				images: [
					{
						id: `000`, 
						name: `img`,
						src: `link`
					}
				],
				videos: [],
				audios: [],
				others: []
			},
			created: 114457445,
			edited: null,
		},
		stats: {
			allNotes: 3,
			favorites: 3,
			images: 3,
			videos: 3,
			audios: 3,
			files: 3
		}
	},

	createdTag: {
		tags: [],
	},

	removeTag: {
		id: `000`,
		relatedNotes: [],
	},

	pinNote: {
		id: `000`,
		image: `link`,
		text: `Lorem`,
	},

	unpinNote: {
		id: `000`,
	}
}

export {
	routes,
	actionSSEMessages,
	connectionOptions
}