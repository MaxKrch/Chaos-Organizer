import Store from './store/Store'; 
import Connection from './api/Connection'
import SSE from './api/SSE'
import Auth from './api/Auth'

import Login from './components/Login';
import MiniSidebar from './components/MiniSidebar'
import Sidebar from './components/Sidebar'
import Feed from './components/containers/Feed';

import { routes } from './consts/index.js';

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
		this.auth = new Auth();

		this.login = new Login(this.container)
		this.miniSidebar = new MiniSidebar(this.container);
		this.sidebar = new Sidebar(this.container);
		this.feed = new Feed(this.container);
	}

	async init() {
// const startLocation = window.location.href;
// Сравнивать стартовую локацию с сохраненным стейтом
// При отличие после загрузки стета отправлять запрос на получение новых записей
// Добавлять в историю

		this.#initionRenderApp();		
		this.feed.main.renderPreloadFeed(`notes`);

		await this.store.init();
		await this.sse.init();
		await this.connection.init();
		await this.auth.init();

		this.#createAppStreams();
		this.#subscribeAppToStreams();
		this.#initionStateLoad();

		await this.#authentification();
		
		this.#updateStateApp();
	}

	#renderAppContainer(container) {
		const appContainer = document.createElement(`div`)
		appContainer.classList.add(`app`)
		container.append(appContainer);

		return appContainer;
	}

	#initionRenderApp() {
		this.login.initionRender()
		this.miniSidebar.initionRender();
		this.sidebar.initionRender();
		this.feed.initionRender();		
	}

	#createAppStreams() {
	}

	#subscribeAppToStreams() {
		this.connection.subscribeToStream(`successRequestData`, this.#onSuccessResponse.bind(this));
		this.connection.subscribeToStream(`errorRequestData`, this.#onErrorResponse.bind(this));
		this.connection.subscribeToStream(`errorAccessToken`, this.#onErrorAccessToken.bind(this));		
	
		this.login.subscribeToStream(`successLoginUser`, this.#onSuccessLoginUser.bind(this));
		this.login.subscribeToStream(`successLogoutUser`, this.#onSuccessLogoutUser.bind(this));
		this.login.subscribeToStream(`successRegisterUser`, this.#onSuccessRegisterUser.bind(this));

		this.auth.subscribeToStream(`successRefreshTokens`, this.#onSuccessRefreshTokens.bind(this));
		this.auth.subscribeToStream(`errorRefreshTokens`, this.#onErrorRefreshtokens.bind(this));

		this.sse.subscribeToStream(`commingMessage`, this.#onMessageFromSSE.bind(this));

		this.store.subscribeToStream(`status`, this.#synchState.bind(this));

		this.miniSidebar.subscribeToStream(`showSidebar`, this.#showSidebar.bind(this));

		this.sidebar.subscribeToStream(`errorAccessToken`, this.#onErrorAccessToken.bind(this));		
		this.sidebar.subscribeToStream(`modalInputTagChange`, this.#onModalChangeTag.bind(this));
		this.sidebar.subscribeToStream(`changeTag`, this.#changeTag.bind(this));
		this.sidebar.subscribeToStream(`deleteTag`, this.#deleteTag.bind(this));
		this.sidebar.subscribeToStream(`selectCategory`, this.#selectCategory.bind(this));

		this.feed.subscribeToStream(`requestLogin`, this.#loginUser.bind(this));
		this.feed.subscribeToStream(`requestLogout`, this.#logoutUser.bind(this));
		
		this.feed.subscribeToStream(`editNote`, this.#editNote.bind(this))
		this.feed.subscribeToStream(`saveNewNote`, this.#saveNewNote.bind(this))
		this.feed.subscribeToStream(`removeNote`, this.#removeNote.bind(this))
		this.feed.subscribeToStream(`requestNotes`, this.#requestNotes.bind(this))
	}
	
	#initionStateLoad() {
		const user = this.store.getStateValue(`user`);
		this.feed.header.setUser(user)
			
		const location = this.store.getStateValue(`location`);
		this.#updateLocation(location); 
		
		const sidebarData = this.store.getStateValue(`sidebarData`);
		this.sidebar.updateSidebar(sidebarData);
		
		const feed = this.store.getStateValue(`feed`);
		this.feed.createPinnedNote(feed.pinnedNote);
		this.feed.createNewNoteList(feed.listNotes, location.section);

		this.feed.initionCreatingNote();		
	}

	async #authentification() {
		console.log(`authentification`)
	}

	#updateStateApp() {		
		const tokens = this.store.getStateValue(`tokens`);
		if(tokens) {
			this.sse.connection(this.store.getStateValue(`tokens`))
		}
//делать запос, при ошибке токена - проверять, тот ли токен был отправлен, если да - разлогин, если нет - попытка с новым токеном

		// делать отменку, что сделан зарпрос лоад лайв, отклонять





	

	
	//this.synchState()
	//Обновляем категори и теги, ве

	// this.requestNotes(start, end);
	// Запрос сообщений

	// this.connection.sendAwaitingNotes();
	// Отправа измененнызх сообщение, установка таймера если оффлайн.. Плюс при каждом коннекте запускается этот метод... А при каждом лог ауте - клер стэйт и ДБ
	}
	#onMessageFromSSE(message) {
	// newNote: {},
	// removeNote: {},
	// removeFile: {},
	// editNote: {},
	// createdTag: {},
	// removeTag: {},
	// pinNote: {},
	// unpinNote: {},
	}


	#updateLocation(location) {
		this.feed.header.setCategory(location);
		
		const path = location.section === `tag` ?
			`tag-${location.tag.id}` :
			this.routes.categories[location.category].path

		window.history.pushState({}, '', path)
	}



	#updateWaitingUploadNotes(data) {
console.log(data)
	}



	#synchState() {

	}



	#updateTokens(data) {
console.log(data)
	}

	#onChangeStateStatus(data) {
console.log(data)
	}

	#onSuccessLoginUser(data) {
console.log(data)
	}

	#onSuccessLogoutUser(data) {
console.log(data)
	}

	#onSuccessRegisterUser(data) {
console.log(data)
	}

	#onSuccessResponse(data) {
console.log(data)
	}

	#onErrorAccessToken() {
console.log(`upgrade tokens`)
	}

	#onErrorResponse(error) {
	console.log(`error response`)	
	}

	#onSuccessRefreshTokens(data) {
		console.log(`tokens refresh`)
	}

	#onErrorRefreshtokens(data) {
		console.log(`token refresh fail`)
	}



	#requestFeed() {
//меняет локацию, отправлчем запрос - стет не меняем... Стейт локацию меняем только при успешной загрузке
		// в будущем можно добавить вметод - сперва читаем локацию
	}

	#saveNote(note) {

	}

	#editNote(note) {

	}
	
	#removeNote(id)  {

	}

	#synchNote() {

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

	#onModalChangeTag() {
		const tokens = this.store.getStateValue(`tokens`);
		const accessToken = tokens?.access;

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

	#selectCategory(category) {
		this.#hideSidebar()

console.log(category)
	}

	#loginUser() {
		this.login.addElementToPage();
	}

	async #logoutUser() {
		this.feed.header.addAwaitingStateAccount()
		const tokens = this.store.getStateValue(`tokens`);
		const isLogouted = await this.login.logoutUser(tokens);

		console.log(`logout`)
				this.feed.header.removeAwaitingStateAccount()
	}

	

	#connected() {
		this.feed.header.setNetwork(`online`)
		this.#sendAwaitingNotes();
	}

	#disconnected() {
		this.feed.header.setNetwork(`offline`)
	}

	#changeNote() {

	}
	
	#saveNewNote() {

	}



	#requestNotes() {
	}

	#sendAwaitingNotes() {

	}

	createRequestToServer(options) {
		this.connection.requestData(options)
	}

	upgradeStore(data) {
		const stores = {
			location: {},
			user: {}
		} 
		this.store.upgradeStore(stores)
	}
}