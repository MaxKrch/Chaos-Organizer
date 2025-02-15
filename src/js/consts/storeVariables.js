const initialState = {
	user: {
		id: null,
		email: null,
		auth: false,
		remember: false,
	}, 
	location: {
		section: `notes`,
		category: `allNotes`,
		tag: null,
	},
	feedNotes: [],
	pinnedNote: null,
	waitingUploadNotes: {
		created: [],
		edited: [],
	},
	waitingChangeNotes: {
		unpinedNotes: [],
		pinnedNote: null,
		removedNotes: [],
	},
	tags: [],
	countNotes: [],
	tokens: {
		access: null,
		refresh: null,
	},
	network: `offline`
}

const orderedKeysInitialState = [
	`user`,
	`location`,
	`tags`,
	`countNotes`,
	`tokens`,
	`network`,
	`feedNotes`,
	`pinnedNote`,
	`waitingUploadNotes`,
	`waitingChangeNotes`,
]

const idbParams = {
	dbTitle: `state`,
	dbVersion: 1,
	objectStores: [
		`user`, 
		`location`,
		`pinnedNote`,
		`waitingChangeNotes`,
		`waitingUploadNotes`,
		`tags`,
		`countNotes`,
		`feedNotes`,
	]
}

export {
	initialState,
	orderedKeysInitialState,
	idbParams
}