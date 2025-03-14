const routes = {
  server: `http://192.168.1.103:7070`,
  // server: `http://192.168.1.102:7070`,
  sse: `/user/sse`,
  auth: {
    chekEmail: '/account/validateemail',
    register: `/account/register`,
    login: `/account/login`,
    logout: `/user/logout`,
    refreshTokens: `/account/refreshtokens`,
  },
  categories: {
    notes: {
      all: {
        path: `/`,
        title: `Все записи`,
      },
      favorites: {
        path: `/favorites`,
        title: `Избранное`,
      },
    },
    files: {
      video: {
        path: `/videos`,
        title: `Видео`,
      },
      audio: {
        path: `/audios`,
        title: `Аудио`,
      },
      image: {
        path: `/images`,
        title: `Изображения`,
      },
      other: {
        path: `/files`,
        title: `Файлы`,
      },
    },
    tag: {
      path: `/tag-[tag.id]`,
      title: `#[tag.title]`,
    },
  },
  serverPaths: {
    synchStatistic: `/user/statistic`,

    validateTag: `/user/tag/validate`,

    getNotes: `/user/feed/notes`,
    getPinnedNote: `/user/feed/pinnednote`,
    liveLoading: `/user/feed/liveloading`,

    pinNote: `/user/note/pin`,
    unpinNote: `/user/note/unpin`,

    addToFavorites: `/user/note/addtofavorites`,
    removeFromFavorites: `/user/note/removefromfavorites`,

    saveCreatedNote: `/user/note/create`,
    saveEditedNote: `/user/note/edit`,
    saveEditedTag: `/user/tag/edit`,

    removeNote: `/user/note/remove`,
    removeFile: `/user/file/remove`,
    removeTag: `/user/tag/remove`,
  },
};

const SSEMessageEvents = {
  noteCreated: {},
  noteEdited: {},
  noteRemoved: {},
  fileRemoved: {},
  tagCreated: {},
  tagEdited: {},
  tagRemoved: {},
  synchFilesCount: {},
  noteAddedToFavorites: {},
  noteRemovedFromFavorites: {},
  notePinned: {},
  noteUnpinned: {},
};

const connectionOptions = {
  method: {
    create: `POST`,
    upgrad: `PUT`,
    delete: `DELETE`,
    get: `POST`,
  },
};

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
        },
      ],
      geolocation: `000, 000`,
      attachment: {
        images: [
          {
            id: `000`,
            name: `img`,
            src: `link`,
          },
        ],
        videos: [],
        audios: [],
        others: [],
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
      files: 3,
    },
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
      files: 3,
    },
  },

  removeFile: {
    file: {
      type: `video`,
      id: `000`,
      parentNoteId: `000`,
    },
    stats: {
      videos: 5,
    },
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
            src: `link`,
          },
        ],
        videos: [],
        audios: [],
        others: [],
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
      files: 3,
    },
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
  },
};

export { routes, SSEMessageEvents, connectionOptions };
