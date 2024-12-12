const initialState = {
	user: {
		email: null,
	}, 
	location: {
		path: `/`, 
		category: `allNotes`,
		section: `notes`,

	},
	feed: {
		notesOrFiles: new Set(),
		pinnedNote: null,
		editingNote: null,
	},
	waitingUploadNotes: {
		created: new Set(),
		edited: new Set(),
	},
	sidebarData: {
		countNotes: new Set(),
		tags: new Set(),
	},	
	tokens: {
		access: null,
		refresh: null,
	},
	status: `connecting`
}

const idbParams = {
	dbName: `state`,
	dbVersion: 1,
	objectStores: [
		`user`, 
		`location`,
		`feed`,
		`waitingUploadNotes`,
		`sidebarData`
	]
}

export {
	initialState,
	idbParams
}