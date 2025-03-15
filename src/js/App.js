import Streams from './helpers/Streams';
import { fromEvent } from 'rxjs';

import Store from './store/Store';
import Connection from './api/Connection';
import SSE from './api/SSE';
import Authorization from './api/Authorization';

import Login from './components/Login';
import MiniSidebar from './components/MiniSidebar';
import Sidebar from './components/Sidebar';
import Feed from './components/containers/Feed';

import chekCreatedNoteForAddingToFeed from './helpers/chekCreatedNoteForAddingToFeed';

import { routes, general, initialState } from './consts/index.js';

export default class App extends Streams {
  constructor(container) {
    super();

    if (!container) return;

    this.startLocation = null;

    this.container = this.#renderAppContainer(container);
    this.routes = routes;

    this.store = new Store();
    this.connection = new Connection();
    this.sse = new SSE();
    this.auth = new Authorization();

    this.login = new Login(this.container);
    this.miniSidebar = new MiniSidebar(this.container);
    this.sidebar = new Sidebar(this.container);
    this.feed = new Feed(this.container);
    this.liveLoadingRequest = false;
    this.requestAbortController = null;
    this.coolDownAppSynch = null;
  }

  async init() {
    // const startLocation = window.location.href;
    // Сравнивать стартовую локацию с сохраненным стейтом
    // При отличие после загрузки стейта отправлять запрос на получение новых записей
    // Добавлять в историю

    this.#initionRenderApp();
    this.feed.main.renderPreloadFeed(`notes`);

    await this.store.init();
    await this.sse.init();
    await this.connection.init();
    await this.auth.init();

    this.#createAppStreams();
    this.#subscribeAppToStreams();

    await this.#authenticationByToken();

    if (navigator.serviceWorker) {
      const onMessageFromSWBinded = this.#onMessageFromSW.bind(this);
      navigator.serviceWorker.addEventListener(
        'message',
        onMessageFromSWBinded,
      );
    }
  }

  #renderAppContainer(container) {
    const appContainer = document.createElement(`div`);
    appContainer.classList.add(`app`);
    appContainer.dataset.appId = general.appId;
    container.append(appContainer);

    return appContainer;
  }

  #initionRenderApp() {
    this.login.initionRender();
    this.miniSidebar.initionRender();
    this.sidebar.initionRender();
    this.feed.initionRender();
  }

  #createAppStreams() {
    const changeVisibleDocument = fromEvent(document, `visibilitychange`);

    this.saveStream(`changeVisibleDocument`, changeVisibleDocument);
  }

  #subscribeAppToStreams() {
    this.subscribeToStream(
      `changeVisibleDocument`,
      this.#onchangeVisibleDocument.bind(this),
    );

    this.login.subscribeToStream(
      `successLoginUser`,
      this.#onSuccessLoginUser.bind(this),
    );
    this.login.subscribeToStream(
      `errorLoginUser`,
      this.#onErrorLoginUser.bind(this),
    );
    this.login.subscribeToStream(
      `successLogoutUser`,
      this.#onSuccessLogoutUser.bind(this),
    );
    this.login.subscribeToStream(
      `successRegisterUser`,
      this.#onSuccessRegisterUser.bind(this),
    );

    this.auth.subscribeToStream(
      `successRefreshTokens`,
      this.#onSuccessRefreshTokens.bind(this),
    );
    this.auth.subscribeToStream(
      `errorRefreshTokens`,
      this.#onErrorRefreshTokens.bind(this),
    );

    this.sse.subscribeToStream(
      `commingMessage`,
      this.#onMessageFromSSE.bind(this),
    );

    this.miniSidebar.subscribeToStream(
      `showSidebar`,
      this.#showSidebar.bind(this),
    );

    this.sidebar.subscribeToStream(
      `modalInputTagChange`,
      this.#requestValidateTitleTag.bind(this),
    );
    this.sidebar.subscribeToStream(`changeTag`, this.#editeTag.bind(this));
    this.sidebar.subscribeToStream(`deleteTag`, this.#deleteTag.bind(this));
    this.sidebar.subscribeToStream(
      `requestNotes`,
      this.#requestNotesFromSidebar.bind(this),
    );

    this.feed.subscribeToStream(
      `requestLogin`,
      this.#onRequestLoginUser.bind(this),
    );
    this.feed.subscribeToStream(
      `requestLogout`,
      this.#onRequestLogoutUser.bind(this),
    );

    this.store.subscribeToStream(
      `user`,
      this.feed.header.setUser.bind(this.feed.header),
    );
    this.store.subscribeToStream(
      `user`,
      this.auth.switchRememberUser.bind(this.auth),
    );

    this.store.subscribeToStream(
      `network`,
      this.feed.header.setNetworkStatus.bind(this.feed.header),
    );
    this.store.subscribeToStream(
      `network`,
      this.#synchAppByConnected.bind(this),
    );

    this.store.subscribeToStream(`location`, this.#updateHistory.bind(this));
    this.store.subscribeToStream(
      `location`,
      this.feed.header.setCategory.bind(this.feed.header),
    );
    this.store.subscribeToStream(
      `location`,
      this.feed.main.setActiveLocation.bind(this.feed.main),
    );

    this.store.subscribeToStream(
      `tags`,
      this.sidebar.updateTagListInPage.bind(this.sidebar),
    );
    this.store.subscribeToStream(
      `tags`,
      this.feed.updateExistTags.bind(this.feed),
    );
    this.store.subscribeToStream(
      `tags`,
      this.sidebar.updateExistTags.bind(this.sidebar),
    );

    this.store.subscribeToStream(
      `notesCount`,
      this.sidebar.updateNotesCount.bind(this.sidebar),
    );
    this.store.subscribeToStream(
      `pinnedNote`,
      this.feed.updatePinnedNote.bind(this.feed),
    );
    this.store.subscribeToStream(
      `feedNotes`,
      this.feed.createNoteList.bind(this.feed),
    );

    this.feed.subscribeToStream(
      `requestNotes`,
      this.#requestNewFeedNotes.bind(this),
    );
    this.feed.subscribeToStream(
      `requestSynchFeed`,
      this.#synchFeedNotesFromServer.bind(this),
    );
    this.feed.subscribeToStream(
      `requestLiveLoading`,
      this.#liveLoadingNotes.bind(this),
    );

    this.feed.subscribeToStream(
      `getPinnedNote`,
      this.#getPinnedNote.bind(this),
    );
    this.feed.subscribeToStream(`pinNote`, this.#pinNote.bind(this));
    this.feed.subscribeToStream(`unpinNote`, this.#unpinNote.bind(this));
    this.feed.subscribeToStream(
      `addNoteToFavorites`,
      this.#addNoteToFavorites.bind(this),
    );
    this.feed.subscribeToStream(
      `removeNoteFromFavorites`,
      this.#removeNoteFromFavorites.bind(this),
    );

    this.feed.subscribeToStream(
      `saveEditedNote`,
      this.#saveEditedNote.bind(this),
    );
    this.feed.subscribeToStream(
      `saveCreatedNote`,
      this.#saveCreatedNote.bind(this),
    );
    this.feed.subscribeToStream(`removeNote`, this.#removeNote.bind(this));
    this.feed.subscribeToStream(`removeFile`, this.#removeFile.bind(this));
  }

  #onRequestLoginUser() {
    this.login.addElementToPage();
  }

  async #authenticationByToken() {
    const refreshToken = this.auth.getRefreshToken();
    const user = this.store.getStateValue('user');

    this.feed.header.addAwaitingStateAccount();
    this.store.upgradeStores({
      network: `connecting`,
    });

    await this.login.authenticationByToken({
      refreshToken,
      rememberUser: user.remember,
    });

    this.feed.header.removeAwaitingStateAccount();
  }

  async #synchAppByConnected(network) {
    if (network === `online`) this.#synchApp();
  }

  async #onchangeVisibleDocument() {
    if (document.visibilityState === `visible`) this.#synchApp();
  }

  async #synchApp() {
    if (this.coolDownAppSynch) return;

    const resetCoolDownAppSynchBind = this.#resetCoolDownAppSynch.bind(this);
    this.coolDownAppSynch = setTimeout(resetCoolDownAppSynchBind, 5000);

    await this.#synchFeedNotesFromServer();
    await this.#syncPinnedNoteFromServer();
    await this.#synchSidebarFromServer();
    await this.sse.connect();
    await this.#uploadWaitingNotes();
  }

  #resetCoolDownAppSynch() {
    this.coolDownAppSynch = null;
  }

  #onSuccessRegisterUser(data) {
    this.#onSuccessLoginUser(data);
  }

  #onSuccessLoginUser(data) {
    this.auth.startRefreshingTokensByTime();
    this.store.upgradeStores({
      user: data.user,
    });
    this.#onSuccessRefreshTokens(data.tokens);

    const feedNotes = this.store.getStateValue(`feedNotes`);
    this.feed.createNoteList(feedNotes);
  }

  #onSuccessRefreshTokens(tokens) {
    this.store.upgradeStores({ tokens });
    this.auth.saveRefreshToken(tokens);
    this.sse.setAccessToken(tokens);
    this.connection.setAccessToken(tokens);
    this.sse.reConnect();

    const oldStatusNetwork = this.store.getStateValue(`network`);
    if (oldStatusNetwork !== `online`) {
      this.store.upgradeStores({
        network: `online`,
      });
    }
  }

  #onErrorLoginUser() {
    this.store.upgradeStores({
      feedNotes: initialState.feedNotes,
      pinnedNote: initialState.pinnedNote,
    });
    this.#onErrorRefreshTokens();
  }

  #onErrorRefreshTokens() {
    this.store.upgradeStores({
      user: initialState.user,
      tokens: initialState.tokens,
      network: initialState.network,
      tags: initialState.tags,
      notesCount: initialState.notesCount,
    });
    this.login.addElementToPage();
    this.auth.removeRefreshToken();
    this.sse.removeAccessToken();
    this.connection.removeAccessToken();
  }

  async #onRequestLogoutUser() {
    if (this.requestAbortController) {
      this.requestAbortController.abort();
      this.requestAbortController = null;
      this.liveLoadingRequest = false;
    }
    
    this.feed.header.addAwaitingStateAccount();
    const tokens = this.store.getStateValue(`tokens`);

    await this.login.logoutUser(tokens);
    this.feed.header.removeAwaitingStateAccount();
  }

  #onSuccessLogoutUser() {
    this.store.upgradeStores({
      user: initialState.user,
      tokens: initialState.tokens,
      network: initialState.network,
      feedNotes: initialState.feedNotes,
      pinnedNote: initialState.pinnedNote,
      tags: initialState.tags,
      notesCount: initialState.notesCount,
    });
    this.auth.removeRefreshToken();
    this.auth.stopRefreshingTokensByTime();
    this.sse.removeAccessToken();
    this.connection.removeAccessToken();
    this.sse.disConnect();
  }

  #onMessageFromSW(message) {
    switch (message.type) {
      case `receivedFeedNotes`:
        this.#updateFeedNotesFromSW(message.data);
        break;
    }
  }

  #onMessageFromSSE(message) {
    switch (message.event) {
      case `noteCreated`:
        this.#onSSENoteCreated(message.data);
        break;

      case `noteEdited`:
        this.#onSSENoteEdited(message.data);
        break;

      case `noteRemoved`:
        this.#onSSENoteRemoved(message.data);
        break;

      case `fileRemoved`:
        this.#onSSEFileRemoved(message.data);
        break;

      case `tagEdited`:
        this.#onSSEtagEdited(message.data);
        break;

      case `tagRemoved`:
        this.#onSSEtagRemoved(message.data);
        break;

      case `synchStatistic`:
        this.#onSSESynchStatistic(message.data);
        break;

      case `noteAddedToFavorites`:
        this.#onSSENoteAddedToFavorites(message.data);
        break;

      case `noteRemovedFromFavorites`:
        this.#onSSENoteRemovedFromFavorites(message.data);
        break;

      case `notePinned`:
        this.#onSSENotePinned(message.data);
        break;

      case `noteUnpinned`:
        this.#onSSENoteUnpinned(message.data);
        break;
    }
  }

  async #onSSENoteCreated(data) {
    const location = this.store.getStateValue(`location`);
    const feedNotes = this.store.getStateValue(`feedNotes`);

    if (location.section === `files`) {
      const targetNewFiles = data.note.attachment[location.category];

      if (targetNewFiles.length > 0) {
        feedNotes.push(...targetNewFiles);
        this.store.upgradeStores({
          feedNotes,
        });
      }
      return;
    }

    const isNoteForAddingToFeed = chekCreatedNoteForAddingToFeed({
      location,
      feedNotes,
      note: data.note,
    });

    if (isNoteForAddingToFeed) {
      const indexNoteOnFeed = feedNotes.findIndex(
        (item) => item.id === data.createdId,
      );

      indexNoteOnFeed < 0
        ? feedNotes.push(data.note)
        : feedNotes.splice(indexNoteOnFeed, 1, data.note);

      this.store.upgradeStores({
        feedNotes,
      });
    }
  }

  async #onSSENoteEdited(data) {
    const location = this.store.getStateValue(`location`);

    if (location.section === `files`) {
      return;
    }

    const feedNotes = this.store.getStateValue(`feedNotes`);
    const indexTargetNote = feedNotes.findIndex(
      (note) => note.id === data.editedNote.id,
    );

    if (indexTargetNote > -1) {
      feedNotes.splice(indexTargetNote, 1, data.editedNote);
      this.store.upgradeStores({
        feedNotes,
      });
    }
  }

  async #onSSENoteRemoved(data) {
    this.#upgradeFeedNotesByRemovedNote(data.removedNote);
  }

  async #onSSEFileRemoved(data) {
    this.#upgradeFeedNotesByRemovedFile(data.removedFile);
  }

  async #onSSEtagEdited(data) {
    this.#updateStateByTagsChanged(data.editedTag, `edite`);
  }

  async #onSSEtagRemoved(data) {
    this.#updateStateByTagsChanged(data.removedTag, `remove`);
  }

  async #onSSESynchStatistic(data) {
    this.store.upgradeStores({
      notesCount: data.notesCount,
      tags: data.tags,
    });
  }

  async #onSSENoteAddedToFavorites(data) {
    const location = this.store.getStateValue(`location`);

    if (location.section === `files`) {
      return;
    }

    const feedNotes = this.store.getStateValue(`feedNotes`);
    const targetNote = feedNotes.find(
      (item) => item.id === data.addedToFavoritesNote.id,
    );

    if (targetNote) {
      targetNote.favorite = true;
      this.store.upgradeStores({
        feedNotes,
      });
    }

    if (location.section === `notes` && location.category === `favorites`) {
      this.#synchFavoritesNotesFromServer(feedNotes[0]);
    }
  }

  async #onSSENoteRemovedFromFavorites(data) {
    const location = this.store.getStateValue(`location`);

    if (location.section === `files`) {
      return;
    }

    const feedNotes = this.store.getStateValue(`feedNotes`);
    const indexTargetNote = feedNotes.findIndex(
      (item) => item.id === data.removedFromFavoritesNote.id,
    );

    if (indexTargetNote > -1) {
      if (location.section === `notes` && location.category === `favorites`) {
        feedNotes.splice(indexTargetNote, 1);
      } else {
        feedNotes[indexTargetNote].favorite = false;
      }

      this.store.upgradeStores({
        feedNotes,
      });
    }
  }

  #onSSENotePinned(data) {
    const oldFeedNotes = this.store.getStateValue(`feedNotes`);
    const feedNotes = oldFeedNotes.map((note) => {
      note.pinned = note.id === data.pinnedNote.id ? true : false;
      return note;
    });

    this.store.upgradeStores({
      feedNotes,
      pinnedNote: data.pinnedNote,
    });
  }

  async #onSSENoteUnpinned(data) {
    const oldFeedNotes = this.store.getStateValue(`feedNotes`);
    const feedNotes = oldFeedNotes.map((note) => {
      if (note.id === data.unpinnedNote.id) {
        note.pinned = false;
      }
      return note;
    });
    const dataForStoreUpgrade = {
      feedNotes,
    };
    const pinnedNote = this.store.getStateValue(`pinnedNote`);

    if (pinnedNote?.id === data.unpinnedNote.id) {
      dataForStoreUpgrade.pinnedNote = null;
    }

    this.store.upgradeStores(dataForStoreUpgrade);
  }

  async #updateFeedNotesFromSW(data) {
    const location = this.store.getStateValue(`location`);

    if (data.location.section !== location.section) return;
    if (
      data.location.section === `tag` &&
      data.location.tag.id !== location.tag.id
    )
      return;
    if (
      data.location.section !== `tag` &&
      data.location.category !== location.category
    )
      return;

    this.store.upgradeStores({
      feedNotes: data.feedNotes,
      network: `online`,
    });
  }

  async #synchFeedNotesFromServer() {
    const bodyRequest = {};
    const location = this.store.getStateValue(`location`);
    const feedNotes = this.store.getStateValue(`feedNotes`);

    bodyRequest.section = location.section;
    bodyRequest.section === `tag`
      ? (bodyRequest.tag = location.tag)
      : (bodyRequest.category = location.category);

    bodyRequest.start = feedNotes[0] ? feedNotes[0].id : null;

    bodyRequest.end = null;
    bodyRequest.count = bodyRequest.start ? null : 10;

    const downloadedNotesObj = await this.#requestNotes({
      bodyRequest,
      target: `getNotes`,
    });

    const newLocation = this.store.getStateValue(`location`);

    if (location.section !== newLocation.section) return;
    if (location.section === `tag` && location.tag.id !== newLocation.tag.id)
      return;
    if (
      location.section !== `tag` &&
      location.category !== newLocation.category
    )
      return;

    if (downloadedNotesObj.success) {
      this.store.upgradeStores({
        feedNotes: downloadedNotesObj.notes,
      });
      this.feed.main.scrollToDown();
    }
  }

  async #syncPinnedNoteFromServer() {
    const responseFromServer = await this.#requestFromServer({
      target: `getPinnedNote`,
      type: `json`,
      method: `POST`,
    });

    if (responseFromServer.success) {
      this.store.upgradeStores({
        pinnedNote: responseFromServer.data.pinnedNote,
      });
    }
  }

  async #uploadWaitingNotes() {
    const waitingUploadNotes = this.store.getStateValue(`waitingUploadNotes`);
    const waitingChangeNotes = this.store.getStateValue(`waitingChangeNotes`);
    const waitingRemoveFiles = this.store.getStateValue(`waitingRemoveFiles`);

    this.store.upgradeStores({
      waitingUploadNotes: initialState.waitingUploadNotes,
      waitingChangeNotes: initialState.waitingChangeNotes,
      waitingRemoveFiles: initialState.waitingRemoveFiles,
    });

    waitingUploadNotes.created.forEach((item) => this.#saveCreatedNote(item));
    waitingUploadNotes.edited.forEach((item) => this.#saveEditedNote(item));

    if (waitingChangeNotes.pinnedNote)
      this.#pinNote(waitingChangeNotes.pinnedNote);
    waitingChangeNotes.unpinnedNotes.forEach((item) => this.#unpinNote(item));
    waitingChangeNotes.addedToFavorites.forEach((item) =>
      this.#addNoteToFavorites(item),
    );
    waitingChangeNotes.removedFromFavorites.forEach((item) =>
      this.#removeNoteFromFavorites(item),
    );
    waitingChangeNotes.removedNotes.forEach((item) => this.#removeNote(item));

    waitingRemoveFiles.forEach((item) => this.#removeFile(item));
  }

  async #synchSidebarFromServer() {
    const statisticFromServer = await this.#requestFromServer({
      target: `synchStatistic`,
      type: `json`,
      method: `POST`,
    });

    if (statisticFromServer.success) {
      const { notesCount, tags } = statisticFromServer.data;
      this.store.upgradeStores({
        notesCount,
        tags,
      });
    }
  }

  async #requestNotesFromSidebar(bodyRequest) {
    this.#hideSidebar();
    await this.#requestNewFeedNotes(bodyRequest);
  }

  async #liveLoadingNotes() {
    if (this.liveLoadingRequest) {
      return;
    }
    this.liveLoadingRequest = true;

    const location = this.store.getStateValue(`location`);
    const feedNotes = this.store.getStateValue(`feedNotes`);
    const bodyRequest = {
      section: location.section,
      start: null,
      count: 10,
    };

    bodyRequest.section === `tag`
      ? (bodyRequest.tag = location.tag)
      : (bodyRequest.category = location.category);

    bodyRequest.end = feedNotes[0] ? feedNotes[0].id : null;

    const downloadedNotesObj = await this.#requestNotes({
      bodyRequest,
      target: `liveLoading`,
    });

    this.liveLoadingRequest = false;

    if (downloadedNotesObj.success && downloadedNotesObj.notes.length > 0) {
      const newLocation = this.store.getStateValue(`location`);
      if (location.section !== newLocation.section) return;
      if (location.section === `tag` && location.tag.id !== newLocation.tag.id)
        return;
      if (
        location.section !== `tag` &&
        location.category !== newLocation.category
      )
        return;

      feedNotes.unshift(...downloadedNotesObj.notes);
      this.store.upgradeStores({
        feedNotes,
      });
      const lastDownloadedNote =
        downloadedNotesObj.notes[downloadedNotesObj.notes.length - 1];
      this.feed.main.scrollToNote(lastDownloadedNote.id);
    }
  }

  async #requestNewFeedNotes(bodyRequest) {
    const user = this.store.getStateValue(`user`);
    if (!user.auth) return;
  
    const oldLocation = this.store.getStateValue(`location`);
    const oldFeedNotes = this.store.getStateValue(`feedNotes`);
    const newLocation = {
      section: bodyRequest.section,
    };
    newLocation.section === `tag`
      ? (newLocation.tag = bodyRequest.tag)
      : (newLocation.category = bodyRequest.category);

    this.feed.header.setCategory(newLocation);
    this.feed.main.renderPreloadFeed(newLocation.section);

    const downloadedNotesObj = await this.#requestNotes({
      bodyRequest,
      target: `getNotes`,
    });

    if (!downloadedNotesObj.success || !downloadedNotesObj.notes) {
      if (downloadedNotesObj.error !== `AbortError`) {
        this.store.upgradeStores({
          location: oldLocation,
          feedNotes: oldFeedNotes,
        });
      }
      return;
    }

    this.store.upgradeStores({
      location: newLocation,
      feedNotes: downloadedNotesObj.notes,
    });
    this.feed.main.scrollToDown();
  }

  async #saveCreatedNote(note) {
    const location = this.store.getStateValue(`location`);

    if (location.section === `notes` && location.category === `all`) {
      this.#addCreatedNoteToFeed(note);
    }

    if (location.section === `tag`) {
      const isTargetTagLocation = note.tags.find(
        (item) => item.id === location.tag.id,
      );

      if (isTargetTagLocation) {
        this.#addCreatedNoteToFeed(note);
      }
    }

    const noteFormData = this.#createFormDataFromNote(note);
    const responseFromServer = await this.#requestFromServer({
      target: `saveCreatedNote`,
      type: `form`,
      method: `POST`,
      body: noteFormData,
    });

    if (!responseFromServer.success) {
      const waitingUploadNotes = this.store.getStateValue(`waitingUploadNotes`);

      if (!waitingUploadNotes.created) {
        waitingUploadNotes.created = [];
      }
      waitingUploadNotes.created.push(note);

      this.store.upgradeStores({
        waitingUploadNotes,
      });
      return;
    }

    if (responseFromServer.data.messages) {
      this.feed.footer.showModalSavedNote(responseFromServer.data.messages);
    }
  }

  async #saveEditedNote(note) {
    this.#addEditedNoteToFeedState(note);

    const waitingUploadNotes = this.store.getStateValue(`waitingUploadNotes`);
    const targetNotes = note.savedOnServer
      ? waitingUploadNotes.edited
      : waitingUploadNotes.created;

    const indexTargetNoteOnAwaiting = targetNotes.findIndex(
      (item) => item.id === note.id,
    );

    if (indexTargetNoteOnAwaiting > -1) {
      targetNotes.splice(indexTargetNoteOnAwaiting, 1);
      this.store.upgradeStores({
        waitingUploadNotes,
      });
    }

    let target;
    let type;
    let body;

    if (note.savedOnServer) {
      target = `saveEditedNote`;
      type = `json`;
      const dataForBody = {
        note,
      };
      if (this.sse.clientId) dataForBody.clientId = this.sse.clientId;
      body = JSON.stringify(dataForBody);
    } else {
      target = `saveCreatedNote`;
      type = `form`;
      body = this.#createFormDataFromNote(note);
    }

    const responseFromServer = await this.#requestFromServer({
      target,
      type,
      method: `POST`,
      body,
    });

    if (!responseFromServer.success) {
      const newWaitingUploadNotes =
        this.store.getStateValue(`waitingUploadNotes`);
      const targetNotes = note.savedOnServer
        ? newWaitingUploadNotes.edited
        : newWaitingUploadNotes.created;
      targetNotes.push(note);

      this.store.upgradeStores({
        waitingUploadNotes: newWaitingUploadNotes,
      });
      return;
    }

    if (target === `saveEditedNote` && responseFromServer.data?.editedNote) {
      this.#addEditedNoteToFeedState(responseFromServer.data.editedNote);
    }

    if (responseFromServer.data?.messages) {
      this.feed.footer.showModalSavedNote(responseFromServer.data.messages);
    }
  }

  #addEditedNoteToFeedState(note) {
    const feedNotes = this.store.getStateValue(`feedNotes`);
    const targetNote = feedNotes.find((item) => item.id === note.id);

    if (!targetNote) return;
    if (targetNote.dates.edited > note.dates.edited) return;

    const indexTargetNote = feedNotes.indexOf(targetNote);
    feedNotes.splice(indexTargetNote, 1, note);

    this.store.upgradeStores({
      feedNotes,
    });
  }

  #addCreatedNoteToFeed(note) {
    const listNotes = this.store.getStateValue(`feedNotes`);

    listNotes.push(note);
    this.store.upgradeStores({
      feedNotes: listNotes,
    });
  }

  async #getPinnedNote(note) {
    const bodyRequest = {
      section: `notes`,
      category: `all`,
      start: note.id,
      count: null,
      end: null,
    };

    const downloadedNotesObj = await this.#requestNotes({
      bodyRequest,
      target: `getPinnedNote`,
    });

    if (downloadedNotesObj.success) {
      this.store.upgradeStores({
        feedNotes: downloadedNotesObj.notes,
      });
      this.feed.main.scrollToNote(note.id);
    }
  }

  async #pinNote(note) {
    const oldFeedNotes = this.store.getStateValue(`feedNotes`);
    const pinnedNote = oldFeedNotes.find((item) => item.id === note.id);

    const feedNotes = oldFeedNotes.map((item) => {
      item.pinned = item.id === note.id ? true : false;
      return item;
    });

    const dataForStoreUpgrade = {
      feedNotes,
    };

    if (pinnedNote) dataForStoreUpgrade.pinnedNote = pinnedNote;

    this.store.upgradeStores(dataForStoreUpgrade);

    const waitingChangeNotes = this.store.getStateValue(`waitingChangeNotes`);
    const indexWaitingNote = waitingChangeNotes.unpinnedNotes.findIndex(
      (item) => item.id === note.id,
    );

    if (indexWaitingNote > -1) {
      waitingChangeNotes.unpinnedNotes.splice(indexWaitingNote, 1);
      this.store.upgradeStores({
        waitingChangeNotes,
      });
    }

    const body = {
      note,
    };

    if (this.sse.clientId) {
      body.clientId = this.sse.clientId;
    }

    const responseFromServer = await this.#requestFromServer({
      target: `pinNote`,
      method: `POST`,
      type: `json`,
      body: JSON.stringify(body),
    });

    if (!responseFromServer.success) {
      waitingChangeNotes.pinnedNote = note;
      this.store.upgradeStores({
        waitingChangeNotes,
      });
    }

    if (
      responseFromServer.success &&
      !pinnedNote &&
      responseFromServer.data.pinnedNote
    ) {
      this.store.upgradeStores({
        pinnedNote: responseFromServer.data.pinnedNote,
      });
    }
  }

  async #unpinNote(note) {
    const oldFeedNotes = this.store.getStateValue(`feedNotes`);
    const feedNotes = oldFeedNotes.map((item) => {
      if (item.id === note.id) {
        item.pinned = false;
      }
      return item;
    });

    const dataForStoreUpgrade = {
      feedNotes,
    };
    const pinnedNote = this.store.getStateValue(`pinnedNote`);

    if (pinnedNote?.id === note.id) {
      dataForStoreUpgrade.pinnedNote = null;
    }

    this.store.upgradeStores(dataForStoreUpgrade);

    const waitingChangeNotes = this.store.getStateValue(`waitingChangeNotes`);

    if (waitingChangeNotes.pinnedNote.id === note.id) {
      waitingChangeNotes.pinnedNote = null;
      this.store.upgradeStores({
        waitingChangeNotes,
      });
    }

    const body = {
      note,
    };

    if (this.sse.clientId) {
      body.clientId = this.sse.clientId;
    }

    const responseFromServer = await this.#requestFromServer({
      target: `unpinNote`,
      method: `POST`,
      type: `json`,
      body: JSON.stringify(body),
    });

    if (!responseFromServer.success) {
      const newWaitingChangeNotes =
        this.store.getStateValue(`waitingChangeNotes`);
      newWaitingChangeNotes.unpinnedNotes.push(note);
      this.store.upgradeStores({
        waitingChangeNotes: newWaitingChangeNotes,
      });
    }
  }

  async #addNoteToFavorites(note) {
    const feedNotes = this.store.getStateValue(`feedNotes`);
    const targetNote = feedNotes.find((item) => item.id === note.id);
    targetNote.favorite = true;

    this.store.upgradeStores({
      feedNotes,
    });

    const waitingChangeNotes = this.store.getStateValue(`waitingChangeNotes`);
    const indexTargetNoteOnRemoved =
      waitingChangeNotes.removedFromFavorites.findIndex(
        (item) => item.id === note.id,
      );
    const indexTargetNoteOnAdded =
      waitingChangeNotes.addedToFavorites.findIndex(
        (item) => item.id === note.id,
      );

    if (indexTargetNoteOnRemoved > -1) {
      waitingChangeNotes.removedFromFavorites.splice(
        indexTargetNoteOnRemoved,
        1,
      );
      this.store.upgradeStores({
        waitingChangeNotes,
      });
    }

    if (indexTargetNoteOnAdded > -1) {
      waitingChangeNotes.addedToFavorites.splice(indexTargetNoteOnAdded, 1);
      this.store.upgradeStores({
        waitingChangeNotes,
      });
    }

    const body = {
      note,
    };

    if (this.sse.clientId) {
      body.clientId = this.sse.clientId;
    }

    const responseFromServer = await this.#requestFromServer({
      target: `addToFavorites`,
      method: `POST`,
      type: `json`,
      body: JSON.stringify(body),
    });

    if (!responseFromServer.success) {
      const newWaitingChangeNotes =
        this.store.getStateValue(`waitingChangeNotes`);
      newWaitingChangeNotes.addedToFavorites.push(note);
      this.store.upgradeStores({
        waitingChangeNotes: newWaitingChangeNotes,
      });
    }

    const location = this.store.getStateValue(`location`);
    if (location.section === `notes` && location.category === `favorites`) {
      this.#synchFavoritesNotesFromServer(feedNotes[0]);
    }
  }

  async #removeNoteFromFavorites(note) {
    const location = this.store.getStateValue(`location`);
    const feedNotes = this.store.getStateValue(`feedNotes`);
    const indexTargetNote = feedNotes.findIndex((item) => item.id === note.id);

    if (indexTargetNote > -1) {
      if (location.section === `notes` && location.category === `favorites`) {
        feedNotes.splice(indexTargetNote, 1);
      } else {
        feedNotes[indexTargetNote].favorite = false;
      }
    }

    this.store.upgradeStores({
      feedNotes,
    });

    const waitingChangeNotes = this.store.getStateValue(`waitingChangeNotes`);
    const indexTargetNoteOnRemoved =
      waitingChangeNotes.removedFromFavorites.findIndex(
        (item) => item.id === note.id,
      );
    const indexTargetNoteOnAdded =
      waitingChangeNotes.addedToFavorites.findIndex(
        (item) => item.id === note.id,
      );

    if (indexTargetNoteOnRemoved > -1) {
      waitingChangeNotes.removedFromFavorites.splice(
        indexTargetNoteOnRemoved,
        1,
      );
      this.store.upgradeStores({
        waitingChangeNotes,
      });
    }

    if (indexTargetNoteOnAdded > -1) {
      waitingChangeNotes.addedToFavorites.splice(indexTargetNoteOnAdded, 1);
      this.store.upgradeStores({
        waitingChangeNotes,
      });
    }

    const body = {
      note,
    };

    if (this.sse.clientId) {
      body.clientId = this.sse.clientId;
    }

    const responseFromServer = await this.#requestFromServer({
      target: `removeFromFavorites`,
      method: `POST`,
      type: `json`,
      body: JSON.stringify(body),
    });

    if (!responseFromServer.success) {
      const newWaitingChangeNotes =
        this.store.getStateValue(`waitingChangeNotes`);
      newWaitingChangeNotes.removedFromFavorites.push(note);
      this.store.upgradeStores({
        waitingChangeNotes: newWaitingChangeNotes,
      });
    }
  }

  async #synchFavoritesNotesFromServer(startNote) {
    const bodyRequest = {
      section: `notes`,
      category: `favorite`,
      start: startNote.id,
      count: null,
      end: null,
    };

    const downloadedNotesObj = await this.#requestNotes({
      bodyRequest,
      target: `getNotes`,
    });

    if (downloadedNotesObj.success) {
      this.store.upgradeStores({
        feedNotes: downloadedNotesObj.notes,
      });
    }
  }

  async #removeNote(note) {
    this.#upgradeFeedNotesByRemovedNote(note);

    const dataForStoreUpgrade = {};
    let stateChanged = false;

    const waitingChangeNotes = this.store.getStateValue(`waitingChangeNotes`);
    for (let key in waitingChangeNotes) {
      if (!Array.isArray(waitingChangeNotes[key])) continue;

      const indexTargetNote = waitingChangeNotes[key].findIndex(
        (item) => item.id === note.id,
      );
      if (indexTargetNote > -1) {
        waitingChangeNotes[key].splice(indexTargetNote, 1);
        dataForStoreUpgrade.waitingChangeNotes = waitingChangeNotes;
        stateChanged = true;
      }
    }

    const waitingUploadNotes = this.store.getStateValue(`waitingUploadNotes`);
    for (let key in waitingUploadNotes) {
      const indexTargetNote = waitingUploadNotes[key].findIndex(
        (item) => item.id === note.id,
      );
      if (indexTargetNote > -1) {
        waitingUploadNotes[key].splice(indexTargetNote, 1);
        dataForStoreUpgrade.waitingUploadNotes = waitingUploadNotes;
        stateChanged = true;
      }
    }

    if (stateChanged) this.store.upgradeStores(dataForStoreUpgrade);

    const body = {
      note,
    };

    if (this.sse.clientId) {
      body.clientId = this.sse.clientId;
    }

    const responseFromServer = await this.#requestFromServer({
      target: `removeNote`,
      method: `POST`,
      type: `json`,
      body: JSON.stringify(body),
    });

    if (!responseFromServer.success) {
      const newWaitingChangeNotes = this.getStateValue(`waitingChangeNotes`);
      newWaitingChangeNotes.removedNotes.push(note);
      this.store.upgradeStores({
        waitingChangeNotes: newWaitingChangeNotes,
      });
    }
  }

  #upgradeFeedNotesByRemovedNote(note) {
    const dataForStoreUpgrade = {};
    let stateChanged = false;

    const pinnedNote = this.store.getStateValue(`pinnedNote`);
    const location = this.store.getStateValue(`location`);
    const feedNotes = this.store.getStateValue(`feedNotes`);

    if (pinnedNote?.id === note.id) {
      dataForStoreUpgrade.pinnedNote = null;
      stateChanged = true;
    }

    if (
      location.section === `files` &&
      note.removeAttachment &&
      note.attachment[location.category].length > 0
    ) {
      const clearFeedNotes = feedNotes.filter((file) => {
        const index = note.attachment[location.category].findIndex(
          (item) => item.id === file.id,
        );
        if (index < 0) {
          return true;
        }
        return false;
      });

      if (clearFeedNotes.length < feedNotes.length) {
        dataForStoreUpgrade.feedNotes = feedNotes;
        stateChanged = true;
      }
    }

    if (location.section !== `files`) {
      const indexTargetNote = feedNotes.findIndex(
        (item) => item.id === note.id,
      );
      if (indexTargetNote > -1) {
        feedNotes.splice(indexTargetNote, 1);
        dataForStoreUpgrade.feedNotes = feedNotes;
        stateChanged = true;
      }
    }

    if (stateChanged) this.store.upgradeStores(dataForStoreUpgrade);
  }

  async #removeFile(file) {
    this.#upgradeFeedNotesByRemovedFile(file);

    const dataForStoreUpgrade = {};
    let stateChanged = false;

    const waitingRemoveFiles = this.store.getStateValue(`waitingRemoveFiles`);
    const indexAwaitingRemoveFile = waitingRemoveFiles.findIndex(
      (item) => item.id === file.id,
    );
    if (indexAwaitingRemoveFile > -1) {
      waitingRemoveFiles.splice(indexAwaitingRemoveFile, 1);
      dataForStoreUpgrade.waitingRemoveFiles = waitingRemoveFiles;
      stateChanged = true;
    }

    const waitingChangeNotes = this.store.getStateValue(`waitingChangeNotes`);
    for (let key in waitingChangeNotes) {
      if (!Array.isArray(waitingChangeNotes[key])) continue;

      const indexTargetNote = waitingChangeNotes[key].findIndex(
        (item) => item.id === file.note.id,
      );

      if (indexTargetNote > -1) {
        const targetNote = waitingChangeNotes[key][indexTargetNote];
        const targetNoteAttachment = targetNote.attachment[file.type];
        const indexTargetFile = targetNoteAttachment.findIndex(
          (item) => item.id === file.id,
        );

        if (indexTargetFile > -1) {
          targetNoteAttachment.splice(indexTargetFile, 1);
          targetNote.dates.edited = file.note.dates.edited;
          dataForStoreUpgrade.waitingChangeNotes = waitingChangeNotes;
          stateChanged = true;
        }
      }
    }

    const waitingUploadNotes = this.store.getStateValue(`waitingUploadNotes`);
    for (let key in waitingUploadNotes) {
      if (!Array.isArray(waitingUploadNotes[key])) continue;

      const indexTargetNote = waitingUploadNotes[key].findIndex(
        (item) => item.id === file.note.id,
      );

      if (indexTargetNote > -1) {
        const targetNote = waitingUploadNotes[key][indexTargetNote];
        const targetNoteAttachment = targetNote.attachment[file.type];
        const indexTargetFile = targetNoteAttachment.findIndex(
          (item) => item.id === file.id,
        );

        if (indexTargetFile > -1) {
          targetNoteAttachment.splice(indexTargetFile, 1);
          targetNote.dates.edited = file.note.dates.edited;
          dataForStoreUpgrade.waitingUploadNotes = waitingUploadNotes;
          stateChanged = true;
        }
      }
    }

    if (stateChanged) this.store.upgradeStores(dataForStoreUpgrade);

    const body = {
      file,
    };

    if (this.sse.clientId) {
      body.clientId = this.sse.clientId;
    }

    const responseFromServer = await this.#requestFromServer({
      target: `removeFile`,
      method: `POST`,
      type: `json`,
      body: JSON.stringify(body),
    });

    if (!responseFromServer.success) {
      const newWaitingRemoveFiles =
        this.store.getStateValue(`waitingRemoveFiles`);
      newWaitingRemoveFiles.push(file);
      this.store.upgradeStores({
        waitingRemoveFiles: newWaitingRemoveFiles,
      });
    }
  }

  #upgradeFeedNotesByRemovedFile(file) {
    const dataForStoreUpgrade = {};
    let stateChanged = false;

    if (file.type === `image`) {
      const pinnedNote = this.store.getStateValue(`pinnedNote`);

      if (pinnedNote?.id === file.note.id) {
        const indexTargetImg = pinnedNote.attachment.image.findIndex(
          (img) => img.id === file.id,
        );

        if (indexTargetImg > -1) {
          pinnedNote.attachment.image.splice(indexTargetImg, 1);
          pinnedNote.dates.edited = file.note.dates.edited;
          dataForStoreUpgrade.pinnedNote = pinnedNote;
          stateChanged = true;
        }
      }
    }

    const location = this.store.getStateValue(`location`);
    const feedNotes = this.store.getStateValue(`feedNotes`);

    if (location.section === `files` && location.category === file.type) {
      const indexTargetFile = feedNotes.findIndex(
        (item) => item.id === file.id,
      );
      if (indexTargetFile > -1) {
        feedNotes.splice(indexTargetFile, 1);
        dataForStoreUpgrade.feedNotes = feedNotes;
        stateChanged = true;
      }
    }

    if (location.section !== `files`) {
      const indexTargetNote = feedNotes.findIndex(
        (item) => item.id === file.note.id,
      );

      if (indexTargetNote > -1) {
        const targetNote = feedNotes[indexTargetNote];
        const targetNoteAttachment = targetNote.attachment[file.type];
        const indexTargetFile = targetNoteAttachment.findIndex(
          (item) => item.id === file.id,
        );

        if (indexTargetFile > -1) {
          targetNoteAttachment.splice(indexTargetFile, 1);
          targetNote.dates.edited = file.note.dates.edited;
          dataForStoreUpgrade.feedNotes = feedNotes;
          stateChanged = true;
        }
      }
    }

    if (stateChanged) this.store.upgradeStores(dataForStoreUpgrade);
  }

  async #requestNotes(data) {
    if (this.requestAbortController) {
      this.requestAbortController.abort();
      this.requestAbortController = null;
      this.liveLoadingRequest = false;
    }

    const response = {
      success: false,
      error: null,
      notes: null,
    };   

    try {
      this.feed.header.addAwaitingStatusSection();
      this.requestAbortController = new AbortController();

      const urlOptions =
        data.bodyRequest.section === `tag`
          ? `/${data.bodyRequest.tag.id}`
          : `/${data.bodyRequest.category}`;

      const responseFromServer = await this.#requestFromServer({
        target: data.target,
        type: `json`,
        signal: this.requestAbortController.signal,
        method: `POST`,
        body: JSON.stringify(data.bodyRequest),
        urlOptions,
      });

      if (!responseFromServer.success) {
        if (responseFromServer.error === `AbortError`) {
          response.error = `AbortError`;
          return response;
        }

        this.requestAbortController = null;
        this.feed.header.removeAwaitingStatusSection();
        response.error = `Server error`;

        return response;
      }

      this.requestAbortController = null;
      this.feed.header.removeAwaitingStatusSection();

      response.notes = responseFromServer.data.notes;
      response.success = true;

      return response;
    } catch (err) {
      console.log(err);
      response.error = `Unknown error`;

      return response;
    }
  }

  #requestValidateTitleTag() {
    const tokens = this.store.getStateValue(`tokens`);
    const accessToken = tokens.access;

    if (!accessToken) {
      return;
    }

    this.sidebar.validateChangingTagTitle(accessToken);
  }

  async #editeTag(tag) {
    const request = {
      body: tag,
      target: `saveEditedTag`,
    };
    const responseFromServer = await this.#sendTagsDataOnServer(request);

    if (responseFromServer.success) {
      this.#updateStateByTagsChanged(
        responseFromServer.data.editedTag,
        `edite`,
      );
    }

    this.#hideSidebar();
  }

  async #deleteTag(tag) {
    const request = {
      body: tag,
      target: `removeTag`,
    };
    const responseFromServer = await this.#sendTagsDataOnServer(request);

    if (responseFromServer.success) {
      this.#updateStateByTagsChanged(
        responseFromServer.data.removedTag,
        `remove`,
      );
    }

    this.#hideSidebar();
  }

  async #sendTagsDataOnServer(request) {
    const { body, target } = request;

    if (this.sse.clientId) {
      body.clientId = this.sse.clientId;
    }

    return await this.#requestFromServer({
      target,
      method: `POST`,
      type: `json`,
      body: JSON.stringify(body),
    });
  }

  async #updateStateByTagsChanged(changedTag, action) {
    const tags = this.store.getStateValue(`tags`);
    const location = this.store.getStateValue(`location`);
    const indexChangedTag = tags.findIndex((tag) => tag.id === changedTag.id);

    if (indexChangedTag < 0) return;

    action === `edite`
      ? tags.splice(indexChangedTag, 1, changedTag)
      : tags.splice(indexChangedTag, 1);

    const dataForStoreUpgrade = {
      tags,
    };

    if (location.section !== `files`) {
      let tagFound = false;
      const oldFeedNotes = this.store.getStateValue(`feedNotes`);
      const feedNotes = oldFeedNotes.map((note) => {
        const indexTargetTag = note.tags.findIndex(
          (noteTag) => noteTag.id === changedTag.id,
        );
        if (indexTargetTag > -1) {
          tagFound = true;
          action === `edite`
            ? note.tags.splice(indexTargetTag, 1, changedTag)
            : note.tags.splice(indexTargetTag, 1);
        }
        return note;
      });

      if (tagFound) {
        dataForStoreUpgrade.feedNotes = feedNotes;
      }
    }

    if (location.section === `tag` && location.tag.id === changedTag.id) {
      location.tag.title = action === `edite` ? changedTag.title : `REMOVED`;

      dataForStoreUpgrade.location = location;
    }

    this.store.upgradeStores(dataForStoreUpgrade);
  }

  async #requestFromServer(data) {
    const response = {
      success: false,
      error: null,
      data: null,
    };

    try {
      const network = this.store.getStateValue(`network`);
      if(network === `offline`) this.store.upgradeStores({
        network: `connecting`
      });

      const firstResponseFromServer =
        await this.connection.requestToServer(data);
      const oldStatusNetwork = this.store.getStateValue(`network`);

      if (firstResponseFromServer.success) {
        response.data = firstResponseFromServer.data;
        response.success = true;

        if (oldStatusNetwork !== `online` && !data.fromCache) {
          this.store.upgradeStores({
            network: `online`,
          });
        }

        if (oldStatusNetwork !== `offline` && data.fromCache) {
          this.store.upgradeStores({
            network: `offline`,
          });
        }
        return response;
      }

      if (firstResponseFromServer.error === `Authorization error`) {
        if (await this.auth.requestRefreshTokens()) {
          const secondResponseFromServer =
            await this.connection.requestToServer(data);

          if (secondResponseFromServer.success) {
            response.data = secondResponseFromServer.data;
            response.success = true;

            if (oldStatusNetwork !== `online` && !data.fromCache) {
              this.store.upgradeStores({
                network: `online`,
              });
            }

            if (oldStatusNetwork !== `offline` && data.fromCache) {
              this.store.upgradeStores({
                network: `offline`,
              });
            }

            return response;
          }

          if (secondResponseFromServer.error === `Authorization error`) {
            this.#onErrorRefreshTokens();
          } else {
            this.store.upgradeStores({
              network: `offline`,
            });
          }

          response.error = secondResponseFromServer.error;
          return response;
        }
      }

      this.store.upgradeStores({
        network: `offline`,
      });

      response.error = firstResponseFromServer.error;

      return response;
    } catch (err) {
      console.log(err);
      response.error = `Unknown error`;

      return response;
    }
  }

  #createFormDataFromNote(note) {
    const noteFormData = new FormData();

    for (let key in note) {
      if (key === `attachment` && !note.savedOnServer) continue;
      const value =
        typeof note[key] === `object` ? JSON.stringify(note[key]) : note[key];

      noteFormData.append(key, value);
    }

    if (!note.savedOnServer) {
      for (let key in note.attachment) {
        note.attachment[key].forEach((item, index) => {
          noteFormData.append(`${key}/${index}`, item.file, item.title);
        });
      }
    }

    return noteFormData;
  }

  #updateHistory(location) {
    const path =
      location.section === `tag`
        ? `tag-${location.tag.id}`
        : this.routes.categories[location.section][location.category].path;

    const fullPath = `${this.routes.site}${path}`

    window.history.pushState({}, '', fullPath);
  }

  #showSidebar() {
    this.sidebar.showElement();
    this.miniSidebar.addOverlay();
    this.feed.addOverlay();
    this.feed.shiftContent();
    this.feed.createStreamClickOnSectionOverlay();
    this.feed.subscribeToStream(
      `clickOnSectionOverlay`,
      this.#hideSidebar.bind(this),
    );
  }

  #hideSidebar() {
    this.sidebar.hideElement();
    this.miniSidebar.removeOverlay();
    this.feed.removeOverlay();
    this.feed.unShiftContent();
    this.feed.clearSubscriptionsStream(`clickOnSectionOverlay`);
  }

  pingServer() {}
}
