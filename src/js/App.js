import Store from './store/Store'; 
import Connection from './api/Connection'
import SSE from './api/SSE'
import Authorization from './api/Authorization'

import Login from './components/Login';
import MiniSidebar from './components/MiniSidebar'
import Sidebar from './components/Sidebar'
import Feed from './components/containers/Feed';

import { routes, general, initialState } from './consts/index.js';

export default class App {
	constructor(container) {
		if(!container) {
			return;
		}
	
		this.startLocation = null;

		this.container = this.#renderAppContainer(container);
		this.routes = routes;
		
		this.store = new Store();
		this.connection = new Connection();
		this.sse = new SSE();
		this.auth = new Authorization();

		this.login = new Login(this.container)
		this.miniSidebar = new MiniSidebar(this.container);
		this.sidebar = new Sidebar(this.container);
		this.feed = new Feed(this.container);
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
	}

	#renderAppContainer(container) {
		const appContainer = document.createElement(`div`)
		appContainer.classList.add(`app`)
		appContainer.dataset.appId = general.appId;
		container.append(appContainer);

		return appContainer;
	}

	#initionRenderApp() {
		this.login.initionRender()
		this.miniSidebar.initionRender();
		this.sidebar.initionRender();
		this.feed.initionRender();		
	}

	#createAppStreams() {}

	#subscribeAppToStreams() {	
		this.login.subscribeToStream(`successLoginUser`, this.#onSuccessLoginUser.bind(this));
		this.login.subscribeToStream(`errorLoginUser`, this.#onErrorLoginUser.bind(this));
		this.login.subscribeToStream(`successLogoutUser`, this.#onSuccessLogoutUser.bind(this));
		this.login.subscribeToStream(`successRegisterUser`, this.#onSuccessRegisterUser.bind(this));

		this.auth.subscribeToStream(`successRefreshTokens`, this.#onSuccessRefreshTokens.bind(this));
		this.auth.subscribeToStream(`errorRefreshTokens`, this.#onErrorRefreshTokens.bind(this));
		
		this.sse.subscribeToStream(`commingMessage`, this.#onMessageFromSSE.bind(this));

		this.miniSidebar.subscribeToStream(`showSidebar`, this.#showSidebar.bind(this));
	
		this.sidebar.subscribeToStream(`modalInputTagChange`, this.#requestValidateTitleTag.bind(this));
		this.sidebar.subscribeToStream(`changeTag`, this.#changeTag.bind(this));
		this.sidebar.subscribeToStream(`deleteTag`, this.#deleteTag.bind(this));
		this.sidebar.subscribeToStream(`requestNotes`, this.#requestNotesFromSidebar.bind(this));

		this.feed.subscribeToStream(`requestLogin`, this.#onRequestLoginUser.bind(this));
		this.feed.subscribeToStream(`requestLogout`, this.#onRequestLogoutUser.bind(this));


		this.store.subscribeToStream(`user`, this.feed.header.setUser.bind(this.feed.header));  
		this.store.subscribeToStream(`user`, this.auth.switchRememberUser.bind(this.auth));  
		

		this.store.subscribeToStream(`network`, this.feed.header.setNetworkStatus.bind(this.feed.header));
		// this.store.subscribeToStream(`network`, this.auth.switchRefreshingTokensByStatus.bind(this.auth));
		this.store.subscribeToStream(`network`, this.#synchAppByConnected.bind(this));

	
		this.store.subscribeToStream(`location`, this.#updateHistory.bind(this)); 
		this.store.subscribeToStream(`location`, this.feed.header.setCategory.bind(this.feed.header));
		this.store.subscribeToStream(`location`, this.feed.main.setActiveLocation.bind(this.feed.main));

		this.store.subscribeToStream(`tags`, this.sidebar.updateTagListInPage.bind(this.sidebar));
		this.store.subscribeToStream(`tags`, this.feed.updateExistTags.bind(this.feed));

		this.store.subscribeToStream(`countNotes`, this.sidebar.updateCountNotesInCategory.bind(this.sidebar));
		this.store.subscribeToStream(`pinnedNote`, this.feed.createPinnedNote.bind(this.feed));
		this.store.subscribeToStream(`feedNotes`, this.feed.createNoteList.bind(this.feed));

		this.feed.subscribeToStream(`requestNotes`, this.#requestNotesFromFeedByTag.bind(this));
		this.feed.subscribeToStream(`requestSynchFeed`, this.#synchFeedFromServer.bind(this));
		this.feed.subscribeToStream(`requestLiveLoading`, this.#liveLoadingNotes.bind(this));
	
		this.feed.subscribeToStream(`getPinnedNote`, this.#getNotesWithPinned.bind(this));
		this.feed.subscribeToStream(`pinNote`, this.#pinNote.bind(this));
		this.feed.subscribeToStream(`unpinNote`, this.#unpinNote.bind(this));

		this.feed.subscribeToStream(`saveEditedNote`, this.#saveEditedNote.bind(this));
		this.feed.subscribeToStream(`saveCreatedNote`, this.#saveCreatedNote.bind(this));
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
		})

		await this.login.authenticationByToken({
			refreshToken,
			rememberUser: user.remember
		})

		this.feed.header.removeAwaitingStateAccount();
	}

	async #synchAppByConnected(network) {
		if(network !== `online`) return;

		await this.#synchFeedFromServer();
		await this.#uploadAwaitingNotes();	
		await this.#updateSidebar();
		await this.sse.connect()
	}

	#onSuccessRegisterUser(data) {
		this.#onSuccessLoginUser(data);
	}

	#onSuccessLoginUser(data) {
		this.store.upgradeStores({
			user: data.user,
			network: `online`,
		})
		this.#onSuccessRefreshTokens(data.tokens)
	}

	#onSuccessRefreshTokens(tokens) {
		this.store.upgradeStores({tokens});
		this.auth.saveRefreshToken(tokens);
		this.sse.setAccessToken(tokens);
		this.connection.setAccessToken(tokens);
		this.sse.reConnect()
	}

	#onErrorLoginUser() {
		this.#onErrorRefreshTokens()
	}

	#onErrorRefreshTokens() {
		this.store.upgradeStores({
			user: initialState.user,
			tokens: initialState.tokens,
			network: initialState.network,
		})
		this.login.addElementToPage();
		this.auth.removeRefreshToken();
		this.sse.removeAccessToken();
		this.connection.removeAccessToken();
	}

	async #onRequestLogoutUser() {
		this.feed.header.addAwaitingStateAccount()	
		const tokens = this.store.getStateValue(`tokens`);
	
		await this.login.logoutUser(tokens);
		this.feed.header.removeAwaitingStateAccount()
	}


	#onSuccessLogoutUser() {
		this.store.upgradeStores({
			user: initialState.user,
			tokens: initialState.tokens,
			network: initialState.network,
		})
		this.auth.removeRefreshToken();
		this.sse.removeAccessToken();
		this.connection.removeAccessToken();
		this.sse.disConnect()
	}

	async #saveCreatedNote(data) {
		await this.store.upgradeStores({
			waitingUploadNotes: {
				created: data
			},
			feedNotes: [data]
		})	
		this.feed.footer.creatingNote.clearBlobsLinksAttacment()
		const temp = this.store.getStateValue(`waitingUploadNotes`)
console.log(temp)
		// this.feed.footer.creatingNote.clearDataCreatingNote()
	

//если авторизован, то
		//	this.feed.footer.clearCreatingNote()
		//	this.feed.main.addCreatedNoteToFeed(data));
//если не авторизован, то вывести панель авторизаии регистраци, и выйти 

	}









	#updateSidebar() {		

console.log(`update state app`)

		const tokens = this.store.getStateValue(`tokens`);



//делать запос, при ошибке токена - проверять, тот ли токен был отправлен, если да - разлогин, если нет - попытка с новым токеном

		// делать отменку, что сделан зарпрос лоад лайв, отклонять





	

	
	//this.synchState()
	//Обновляем категори и теги, ве

	// this.requestNotes(start, end);
	// Запрос сообщений

	// this.connection.sendAwaitingNotes();
	// Отправа измененнызх сообщение, установка таймера если оффлайн.. Плюс при каждом коннекте запускается этот метод... А при каждом лог ауте - клер стэйт и ДБ
	}

	#uploadAwaitingNotes() {
		console.log(`upload Awaiting notes`)
		//
	}

	#onMessageFromSSE(message) {
		console.log(message)
	// newNote: {}, - пришла запись, есои ее айдиКреатед сопадает с айлди запис в ожидающих сохраения - сравнивается дата обновления. Если не свпадает - нужно обновить айдишки, после чего уже локальную версию добавть в лентук на смену и отправить на обновление this.feed.updateLocalCreatedNoteOnSavedNode(note)
	// createdNode: {},
	// editedNote: {},
	// removedNote: {},
	// removedFile: {},
	// createdTag: {},
	// removedTag: {},
	// pinedNote: {},
	// unpinedNote: {},
	}


	#updateHistory(location) {
		const path = location.section === `tag` ?
			`tag-${location.tag.id}` :
			this.routes.categories[location.category].path

		window.history.pushState({}, '', path)
	}

	#unpinNote(idNote) {
		console.log(idNote)
	}

	#getNotesWithPinned(idNote) {
		console.log(idNote)
	}

	#pinNote(idNote) {
		console.log(idNote)
	}



	#updateTokens(data) {
console.log(data)
	}

	#onChangeStateStatus(data) {
console.log(data)
	}




	#requestFeed() {
//меняет локацию, отправлчем запрос - стет не меняем... Стейт локацию меняем только при успешной загрузке
		// в будущем можно добавить вметод - сперва читаем локацию
	}



	#saveEditedNote(data) {

		// this.feed.main.changeNote(note, typeNote)
console.log(data)
	}
	
	#removeNote(note)  {
console.log(note)
	}

	#removeFile(id) {
	console.log(id)	
	}

	#synchNote() {
console.log(`synch`)
	}


	#showSidebar() {
		this.sidebar.showElement();
		this.miniSidebar.addOverlay();
		this.feed.addOverlay();
		this.feed.shiftContent();
		this.feed.createStreamClickOnSectionOverlay();
		this.feed.subscribeToStream(`clickOnSectionOverlay`, this.#hideSidebar.bind(this))
	}

	#hideSidebar() {
		this.sidebar.hideElement();
		this.miniSidebar.removeOverlay();
		this.feed.removeOverlay();
		this.feed.unShiftContent();
		this.feed.clearSubscriptionsStream(`clickOnSectionOverlay`)
	}

	#requestValidateTitleTag() {
		const tokens = this.store.getStateValue(`tokens`);
		const accessToken = tokens.access;

		if(!accessToken) {
			console.log(`empty token`);
			return
		};

		this.sidebar.validateChangingTagTitle(accessToken);
	}

	#changeTag(tag) {
console.log(`ch`, tag)
	}

	#deleteTag(tag) {
console.log(`del`, tag)
	}

	#synchFeedFromServer() {
		const target = {}

		const location = this.store.getStateValue(`location`);
		target.section = location.section;

		location.section === `tag` ?
			target.tag = location.tag :
			target.category = location.category

		const feedNotes = this.store.getStateValue(`feedNotes`);

		target.start = feedNotes[0] ?
			feedNotes[0].id :
			null;

		target.end = null;

		this.#requestNotes(target)
	}

	#requestNotesFromFeedByTag(data) {
		console.log(data)
	}

	#requestNotesFromSidebar(data) {
		this.#hideSidebar();
		this.#requestNotes(data)
	}

	#requestNotes(data) {
console.log(data)
	}

	#liveLoadingNotes(data) {
		console.log(data)
	}

	




	createRequestToServer(options) {
		this.connection.requestData(options)
	}



	pingServer() {}
}