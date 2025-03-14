const routes = {
  // server: `http://192.168.1.103:7070`,
  site: `maxkrch.github.io/Chaos-Organizer`,
  server: `https://chaos-organizer-backend-4g9o.onrender.com`,
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

export { routes, SSEMessageEvents, connectionOptions };
