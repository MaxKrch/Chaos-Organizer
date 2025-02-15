import BaseComponent from '../helpers/BaseComponent';
import moment from 'moment';
import { Subject, fromEvent, throttleTime, merge } from 'rxjs';

export default class MediaRecord extends BaseComponent {
	constructor(container, type, callback) {
		super(container);
		this.staticElements = {
			video: {
				container: null,
				backContainer: null,
				mainContainer: null,
			},
			controll: {
				container: null,
				timer: null,
				cancel: null,
				save: null,
			}
		}

		this.type = type;
		this.timer = {
			timeStartRecord: null,
			idInterval: null,
		}

		this.recordStopped = false;
		this.recordNeedSave = false;

		this.mediaDataChunks = null;
		this.mediaStream = null;
		this.mediaRecorder = null;

		this.#initElement(callback);
	}

	#initElement(callback) {
		this.#renderElement();
		this.#createStreams();
		this.#subscribeToStreams(callback);
		this.addElementToPage();
		this.#startMediaStream();
	}

	#renderElement() {
		this.element = document.createElement(`aside`);
		this.element.classList.add(`record-media__container`, `modal__overlay`);

		const body = document.createElement(`article`);
		body.classList.add(`record-media`);

		if(this.type === `video`) {
			this.staticElements.video.container = document.createElement(`div`);
			this.staticElements.video.container.classList.add(`record-media__show`);

			this.staticElements.video.backContainer = document.createElement(`div`);
			this.staticElements.video.backContainer.classList.add(`record-media__show-back`);

			this.staticElements.video.mainContainer = document.createElement(`div`);
			this.staticElements.video.mainContainer.classList.add(`record-media__show-main`);

			this.staticElements.video.container.append(
				this.staticElements.video.backContainer,
				this.staticElements.video.mainContainer
			);

			body.append(this.staticElements.video.container);
		}

		this.staticElements.controll.container = document.createElement(`div`);
		this.staticElements.controll.container.classList.add(`record-media__controll`);

		this.staticElements.controll.cancel = document.createElement(`div`);
		this.staticElements.controll.cancel.classList.add(`button-icon`, `figure-button`, `record-media__button`, `record-media__cancel`);
		this.staticElements.controll.cancel.dataset.targetAction = "cancelRecord";
		this.staticElements.controll.cancel.innerHTML = `
	 		<div class="figure-button__item figure-button__cross record-media__button-icon record-media__cancel-icon">
	 		</div>
		`

		this.staticElements.controll.timer = document.createElement(`div`);
		this.staticElements.controll.timer.classList.add(`record-media__time`);
		this.staticElements.controll.timer.textContent = `00:00`;

		this.staticElements.controll.save = document.createElement(`div`);
		this.staticElements.controll.save.classList.add(`button-icon`, `figure-button`, `record-media__button`, `record-media__save`);
		this.staticElements.controll.save.dataset.targetAction = `stopRecord`;
		this.staticElements.controll.save.innerHTML = `
			<div class="figure-button__item figure-button__chek record-media__button-icon record-media__save-icon">
			</div>
		`

		this.staticElements.controll.container.append(
			this.staticElements.controll.cancel,
			this.staticElements.controll.timer,
			this.staticElements.controll.save
		)		
		body.append(this.staticElements.controll.container);
		this.element.append(body)
	}

	startStreamMediaOnPage() {
		if(!this.mediaStream || this.type !== `video`) {
			return
		}

		this.#renderVideoBackElement();
		this.#renderVideoMainElement();
	}

	#renderVideoBackElement() {
		const videoElement = document.createElement(`video`);
		videoElement.classList.add(`record-media__show-video`, `record-media__show-back-video`);
		videoElement.setAttribute(`mute`, `mute`);
		videoElement.setAttribute(`autoplay`, `autoplay`);
		videoElement.srcObject = this.mediaStream;
		
		this.staticElements.video.backContainer.append(videoElement);
	}

	#renderVideoMainElement() {
		const videoElement = document.createElement(`video`);
		videoElement.classList.add(`record-media__show-video`, `record-media__show-main-video`);
		videoElement.setAttribute(`mute`, `mute`);
		videoElement.setAttribute(`autoplay`, `autoplay`);
		videoElement.srcObject = this.mediaStream;
		
		this.staticElements.video.mainContainer.append(videoElement);
	}

	#createStreams() {
		this.saveStream(`responseFromRecorder`, new Subject())

		const clicksOnControllButons = merge(
			fromEvent(this.staticElements.controll.cancel, `click`),
			fromEvent(this.staticElements.controll.save, `click`),
		).pipe(
			throttleTime(150)
		);

		this.saveStream(`clicksOnControllButons`, clicksOnControllButons)
	}

	#subscribeToStreams(callback) {
		this.subscribeToStream(`responseFromRecorder`, callback);
		this.subscribeToStream(`clicksOnControllButons`, this.#onClickByControllButtons.bind(this))
	}

	startTimerRecord() {
		this.timer.timeStartRecord = Date.now();
		const updateTimerBinded = this.updateTimer.bind(this);
		this.timer.idInterval = setInterval(updateTimerBinded , 1000);
	}

	updateTimer() {
		const timeRecord = Date.now() - this.timer.timeStartRecord;
		const formatedTimeRecord = moment(timeRecord).format('mm:ss');
		this.staticElements.controll.timer.textContent = formatedTimeRecord;
	}

	addMediaDataToArrayBinded(data) {
    this.mediaDataChunks.push(data);
	}

	#stopTimerRecord() {
		if(this.timer.idInterval) {
			clearInterval(this.timer.idInterval);
			this.timer.idInterval = null;
		}
	}

	async #startMediaStream() {
		const videoRec = this.type === `video` 
			?	true
			:	false

		try {
			this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
				audio: true,
				video: videoRec
			});

			this.#startMediaRecord()
	
		}	catch(err) {
			this.addDataToStream(`responseFromRecorder`, {
				action: `errorRecord`,
				error: err,
			})
			return;
		}
	}

	#startMediaRecord(data) {
		if(this.recordStopped) {
			this.#clearMediaStream();
			return;
		}

		if(!this.mediaStream) {
			return;
		}

		this.mediaRecorder = new MediaRecorder(this.mediaStream, {
			mimeType: `${this.type}/webm`
		});
		this.mediaDataChunks = [];
		
		const startStreamMediaOnPageBinded = this.startStreamMediaOnPage.bind(this);
		const startTimerRecordBinded = this.startTimerRecord.bind(this);
		const addMediaDataToArrayBinded = this.addMediaDataToArrayBinded.bind(this);
		const saveRecordedMediaBinded = this.saveRecordedMedia.bind(this);

    this.mediaRecorder.onstart = (event) => {
    	startStreamMediaOnPageBinded();
    	startTimerRecordBinded();
    }

    this.mediaRecorder.ondataavailable = (event) => {
    	addMediaDataToArrayBinded(event.data)
    }

    this.mediaRecorder.onstop = (event) => {
    	saveRecordedMediaBinded()
    }

    this.mediaRecorder.start();
	}

	saveRecordedMedia() {
		if(!this.recordNeedSave) {
			return;
		}

		const date = moment().format(`DDMMyyyy-HHmm`)
		const fileName = `record-${date}.webm`

		const media = this.mediaDataChunks?.length > 0
			?	new File(this.mediaDataChunks, fileName, { type: `${this.type}/webm` })
			: null  
		
		this.addDataToStream(`responseFromRecorder`, {
			action: `saveMedia`,
			media,
		});
	}

	cancelRecordMedia() {
		this.recordNeedSave = false;
		this.recordStopped = true;
		
		this.#stopTimerRecord();
		this.#clearMediaStream()

		if(this.mediaRecorder) {
			this.mediaRecorder.stop();
		}
		
		this.addDataToStream(`responseFromRecorder`, {
			action: `cancelRecord`
		})
	}

	stopRecordMedia() {		
		this.recordNeedSave = true;
		this.recordStopped = true;
		
		this.#stopTimerRecord();
		this.#clearMediaStream()

		if(this.mediaRecorder) {
			this.mediaRecorder.stop();

		} else {
			this.addDataToStream(`responseFromRecorder`, {
				action: `cancelRecord`
			})
		}
	}

	#clearMediaStream() {
		this.mediaStream?.getTracks().forEach((track) => {
		  track.stop()
		})
	}

	#onClickByControllButtons(event) {		
		const targetButton = event.target.closest(`[data-target-action]`)
		if(!targetButton) return;

		const targetAction = targetButton.dataset.targetAction;
		if(!targetAction) return;

		switch(targetAction) {
			case `stopRecord`:
				this.stopRecordMedia()
				break;
		
			case `cancelRecord`:
				this.cancelRecordMedia();
				break;
		}
	}
}		