const initialState = {
  user: {
    id: null,
    email: null,
    auth: false,
    remember: false,
  },
  location: {
    section: `notes`,
    category: `all`,
    tag: null,
  },
  feedNotes: [],
  pinnedNote: null,
  waitingUploadNotes: {
    created: [],
    edited: [],
  },
  waitingChangeNotes: {
    pinnedNote: null,
    unpinnedNotes: [],
    addedToFavorites: [],
    removedFromFavorites: [],
    removedNotes: [],
  },
  waitingRemoveFiles: [],
  tags: [],
  notesCount: {
    files: {
      image: 0,
      video: 0,
      audio: 0,
      other: 0,
    },
  },
  tokens: {
    access: null,
    refresh: null,
  },
  network: `offline`,
};

const orderedKeysInitialState = [
  `user`,
  `location`,
  `tags`,
  `notesCount`,
  `tokens`,
  `network`,
  `feedNotes`,
  `pinnedNote`,
  `waitingUploadNotes`,
  `waitingChangeNotes`,
  `waitingRemoveFiles`,
];

const idbParams = {
  dbTitle: `state`,
  dbVersion: 7,
  objectStores: [
    `user`,
    `location`,
    `pinnedNote`,
    `waitingChangeNotes`,
    `waitingUploadNotes`,
    `waitingRemoveFiles`,
    `tags`,
    `notesCount`,
    `feedNotes`,
  ],
};

export { initialState, orderedKeysInitialState, idbParams };
