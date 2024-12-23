import Notice from '../components/popups/Notice';
import Streams from '../helpers/Streams';

import { Subject, scan, BehaviorSubject, shareReplay } from 'rxjs';
import { initialState, idbParams } from '../consts/index.js';

export default class Store extends Streams {
	constructor() {
		super();
		this.idb = null;
		this.createdObjectStores = null;
	}

	async init() {			
		try {
			await this.#connectingWithIDB();

			if(this.createdObjectStores) {
				await this.#saveInitialStateToIDB();
			}
		
		} catch(err) {
			console.log(`Fail connection with database: ${err}`)

		} finally {		
			await this.#creatingStreams();
			this.#subscribeToStreams();
		}
	}

	async #creatingStreams() {	
		let loadedStoreFromIdb = null;

		try	{
			loadedStoreFromIdb = await this.#loadStoreFromIdb();
			
			} catch(err) {
			console.log(`Fail load store from idb: ${err}`)
		}

		for(let key in initialState) {
			let state;

			if(loadedStoreFromIdb && loadedStoreFromIdb[key]) {
				state = loadedStoreFromIdb[key]
	
			}	else {
				state = initialState[key]
			}	

			this.saveStream(key, new BehaviorSubject(state));
		}
	}

	#subscribeToStreams() {}

	getStateValue(store) {
		try {
			const currentStore = this.streams[store].stream$;
			const value = currentStore.getValue();

			return value;
		} catch (err) {
			console.log(`Ошибка запроса: ${err}`);
			return false;
		}		
	}

	async #connectingWithIDB() {
		return new Promise((res, rej) => {
			const requestOpen = window.indexedDB.open(idbParams.dbName, idbParams.dbVersion);

			requestOpen.onupgradeneeded = (event) => {
				this.idb = requestOpen.result;

				switch(event.oldVersion) {
					case 0:
						this.#initStoreIDB()
						break;

					default:
						this.#upgradeStoreIDB()
				}
			}

			requestOpen.onerror = (event) => {
				console.log(`Fail connection with database: ${requestOpen.error}`);
				rej(requestOpen.error);
			}

			requestOpen.onsuccess = () => {
				this.idb = requestOpen.result;
				this.idb.onversionchange = () => {
					this.idb.close();
					this.#renderPopupErrorDB(`Приложение обновилось`);
				}
				res();
			}

			requestOpen.onblocked = () => {
				console.log(`Database failed to open: ${requestOpen.error}`);
					
				rej(requestOpen.error);
			}	
		})
	}

	#initStoreIDB() {
		this.createdObjectStores = [];
		
		idbParams.objectStores.forEach(key => {
			this.idb.createObjectStore(key);
			this.createdObjectStores.push(key);
		});
	}
	
	#upgradeStoreIDB() {
		const oldObjectStoreNames = Array.from(this.idb.objectStoreNames);

		oldObjectStoreNames.forEach(key => {
			if(key in idbParams.objectStores) {
				return;
			}
			this.idb.deleteObjectStore(key)
		});
		

		idbParams.objectStores.forEach(key => {
			if(!this.idb.objectStoreNames.contains(key)) {
				this.idb.createObjectStore(key);

				if(!this.createdObjectStores) {
					this.createdObjectStores = []
				}
				
				this.createdObjectStores.push(key);
			}
		})
	}

	async #saveInitialStateToIDB() {
		const trans = this.idb.transaction(this.createdObjectStores, `readwrite`);

		this.createdObjectStores.forEach(store => {
			const currentStore = trans.objectStore(store);
			const initValueStore = initialState[store];
			
			if (typeof initValueStore !== `object`) {
				currentStore.add(initValueStore, 0);
				return;
			}
			for(let key in initValueStore) {
				currentStore.add(initValueStore[key], key)
			}
		})
	}

	async #loadStoreFromIdb() {
		return new Promise(async (res, rej) => {
			try {
				if(!this.idb) {
					await this.#connectingWithIDB();

					if(this.createdObjectStores) {
						await this.#saveInitialStateToIDB();
					}
				}

				const objectStoreNames = Array.from(this.idb.objectStoreNames);
				const trans = this.idb.transaction(objectStoreNames, `readonly`);
				const storeFromIdb = {}

				for(let store of objectStoreNames) {
					const currentStore = trans.objectStore(store);
					const getKeys = currentStore.getAllKeys();

					getKeys.onsuccess = async () => {
						const keysStore = getKeys.result;
						storeFromIdb[store] = {}

						for(let key of keysStore) {
							const getValueByKey = currentStore.get(key)
	
							getValueByKey.onsuccess = () => {
								const value = getValueByKey.result;
								storeFromIdb[store][key] = value;
							}

							getValueByKey.onerror = () => {
								storeFromIdb[store][key] = null;
							}
						}
					}

					getKeys.onerror = () => {
						storeFromIdb[store] = null;
					}
				} 
				trans.oncomplete = () => res(storeFromIdb);

			} catch (err) {
				rej(err)
			}
		})
	}

	async #saveStoreToIDB(store, state) {
		try {
			if(!this.idb) {
				await this.#connectingWithIDB()
			}

			const trans = this.idb.transaction(store, `readwrite`);
			const currentStore = trans.objectStore(store)

			for(let key in state) {	
				currentStore.put(state[key], key)
			}

		} catch(err) {
			console.log(`Fail save store to IDB: ${err}`)
		}
	}
	
	upgradeStores(stores) {
		for(let store in stores) {
			try {
				const oldState = this.getStateValue(store);
				
				if(!oldState) {
					return;
				}

				const changeStore = stores[store];

				if(!changeStore) {
					return oldState;
				}
			
				const newState = JSON.parse(JSON.stringify(oldState))
			
				for(let key in changeStore) {
					newState[key] = changeStore[key];
				}
		
				const isSavingToIDB = idbParams.objectStores.includes(store);
			
				if(isSavingToIDB) {
					this.#saveStoreToIDB(store, newState)
				}
			
				this.addDataToStream(store, newState);

			} catch(err) {
				console.log(`Error upgrade store: ${err}`);
			}
		}
	}

	#renderPopupErrorDB(title) {
		new Promise((res, rej) => {
			new Notice({
				title: title,
				description: `Обновите страницу, чтобы продолжить работу`,
				confirm: {
					title: `Обновить`,
					callback: res
				},
				cancel: {
					title: `Позже`,
					callback: rej
				}
			})
		}).then(() => {
			window.location.reload()
		}).catch(() => {
			console.log(`Connecting with database closed`)
		})
	}
}