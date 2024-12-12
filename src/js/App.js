import Store from './store/Store'; 
import Connection from './api/Connection'
import SSE from './api/SSE'
import Auth from './api/Auth'

import Login from './components/Login';
import MiniSidebar from './components/MiniSidebar'
import Sidebar from './components/Sidebar'
import Feed from './components/containers/Feed';

export default class App {
	constructor(container) {
		if(!container) {
			return;
		}
		
		this.container = this.#renderAppContainer(container);
		
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
		this.#initionRenderApp();		
		this.feed.main.renderPreloadFeed(`notes`);

		await this.store.init();
		await this.sse.init();
		await this.connection.init()
		await this.auth.init()
console.log(this)
	// this.#createAppStreams();
	// создание стримов 
	
	this.#subscribeAppToStreams();
	// подписка между компонентами, в том числе - рендер странпицы из стейта

	// this.sse.connectingWithServer()
	
	//this.synchState()
	//Обновляем категори и теги, ве

	// this.requestNotes(start, end);
	// Запрос сообщений

	// this.connection.sendAwaitingNotes();
	// Отправа измененнызх сообщение, установка таймера если оффлайн.. Плюс при каждом коннекте запускается этот метод... А при каждом лог ауте - клер стэйт и ДБ

	}

	#renderAppContainer(container) {
		const appContainer = document.createElement(`div`)
		appContainer.classList.add(`app`)
		container.append(appContainer);

		return appContainer;
	}

	#initionRenderApp() {
		this.miniSidebar.initionRender();
		this.sidebar.initionRender();
		this.feed.initionRender();		





	}

	#createStreams() {

	}

	#subscribeAppToStreams() {
		// sidebar.isubscri
		//streamMiniSidebarClick
		//streamSidebarChangeTags
		//streamSidebarSelectCategory




		//streamChangeNote
		//streamRequestNotes
		//streamSaveNewNote

		//streamDownloadFile
		//

		//stream

		this.miniSidebar.subscribeToStream(`showSidebar`, this.#showSidebar.bind(this));

		this.sidebar.subscribeToStream(`modalInputTagChange`, this.#chekModalChangeTag.bind(this));
		this.sidebar.subscribeToStream(`changeTag`, this.#changeTag.bind(this));
		this.sidebar.subscribeToStream(`deleteTag`, this.#deleteTag.bind(this));
		this.sidebar.subscribeToStream(`selectCategory`, this.#selectCategory.bind(this));


		this.feed.subscribeToStream(`login`, this.#loginUser.bind(this));
		this.feed.subscribeToStream(`logout`, this.#logoutUser.bind(this));





		this.connection.subscribeToStream(`successRequestData`, this.#parsingResponse.bind(this));
		this.connection.subscribeToStream(`errorRequestData`, this.#parsingResponseError.bind(this));
		this.connection.subscribeToStream(`errorAccessToken`, this.#refreshTokens.bind(this));
	}

	#getLocation() {

	}

	#setLocation(path) {

	}

	#requestFeed() {

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

	#chekModalChangeTag(event) {

		console.log(`Проверяю допустимость тега ${event}`);
		if(true) {
			this.sidebar.enableModalTagChangeButton()
		}
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
console.log(`login`)
	}

	#logoutUser() {
		console.log(`logout`)
	}

	#parsingResponse(data) {
console.log(`incoming data`)
	}

	#refreshTokens() {
console.log(`upgrade tokens`)
	}

	#parsingResponseError(error) {
	console.log(`error response`)	
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