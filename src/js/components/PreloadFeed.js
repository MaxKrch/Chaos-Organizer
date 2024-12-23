import BaseComponent from '../helpers/BaseComponent';

export default class PreloadFeed extends BaseComponent {
	constructor(container, type) {
		super(container);
		this.pinnedNote = false;
		this.#renderElement(type)
	}

	#renderElement(type) {
		if(type === `notes`) {
			this.pinnedNote = document.createElement(`section`);						
			this.pinnedNote.classList.add(`feed-pinned`);
			this.pinnedNote.innerHTML = `
				<div class="active-background-gradient feed-pinned__item feed-pinned__img">
				</div>
					
				<div class="feed-pinned__item feed-pinned__text" data-id="feedPinnedNoteText">
					<p class="active-background-gradient preload-feed__pinned-text preload-feed__pinned-text-str1">
					</p>
	
					<p class="active-background-gradient preload-feed__pinned-text preload-feed__pinned-text-str2">
					</p>
				</div>
			`
		}
		
		this.element = document.createElement(`section`);
		this.element.classList.add(`feed-content`);

		if(type === `files`) {
			this.element.classList.add(`feed-files`);
			this.element.innerHTML = `
				<ul class="feed-content__list feed-files__list">
					<li class="feed-content__item active-background-gradient-light preload-feed-file preload-feed-file-1">
					</li>

					<li class="feed-content__item active-background-gradient-light preload-feed-file preload-feed-file-2">
					</li>

					<li class="feed-content__item active-background-gradient-light preload-feed-file preload-feed-file-3">
					</li>
				</ul>
			</section>	
			`
			return;
		}

		this.element.classList.add(`feed-notes`);
		this.element.innerHTML = `
			<ul class="feed-content__list">
				<li class="feed-content__item preload-feed-note" data-note="121544">
					<header class="feed-note__header active-background-gradient">
					</header>
								
					<main class="feed-note__content">
						<div class="feed-note__attachment-inline image-mosaic image-mosaic-horizontal-media-muptiple-three preload-feed-note__inline-file-container">
								<div class="image-mosaic__item feed-content-inline-file active-background-gradient preload-feed-note__inline-file preload-feed-note__inline-file-big">
								</div>

								<div class="image-mosaic__item feed-content-inline-file active-background-gradient preload-feed-note__inline-file preload-feed-note__inline-file-medium">
								</div>
										
								<div class="image-mosaic__item feed-content-inline-file active-background-gradient preload-feed-note__inline-file preload-feed-note__inline-file-medium">
								</div>
							</div>

							<div class="feed-note__text">
								<div class="preload-feed-note__text">
									<p class="active-background-gradient preload-feed-note__text-str preload-feed-note__text-str-1">
									</p>
		
									<p class="active-background-gradient preload-feed-note__text-str preload-feed-note__text-str-1">
									</p>
		
									<p class="active-background-gradient feed-note__text-str preload-feed-note__text-str preload-feed-note__text-str-3">
									</p>
								</div>

								<div class="preload-feed-note__text">
									<p class="active-background-gradient preload-feed-note__text-str preload-feed-note__text-str-2">
									</p>
								</div>
							</div>
						</main> 

						<footer class="feed-note__footer active-background-gradient-light preload-feed-note__footer">
						</footer>		
					</li>

					<li class="feed-content__item preload-feed-note" data-note="121544">
						<header class="feed-note__header active-background-gradient">
						</header>
								
						<main class="feed-note__content">
							<div class="feed-note__attachment-inline image-mosaic image-mosaic-horizontal-media-muptiple-three preload-feed-note__inline-file-container">
								<div class="image-mosaic__item feed-content-inline-file active-background-gradient preload-feed-note__inline-file preload-feed-note__inline-file-big">
								</div>

								<div class="image-mosaic__item feed-content-inline-file active-background-gradient preload-feed-note__inline-file preload-feed-note__inline-file-medium">
								</div>
										
								<div class="image-mosaic__item feed-content-inline-file active-background-gradient preload-feed-note__inline-file preload-feed-note__inline-file-medium">
								</div>
							</div>

							<div class="feed-note__text">
								<div class="preload-feed-note__text">
									<p class="active-background-gradient feed-note__text-p preload-feed-note__text-str preload-feed-note__text-str-1">
									</p>
		
									<p class="active-background-gradient feed-note__text-p preload-feed-note__text-str preload-feed-note__text-str-3">
									</p>
								</div>
							</div>
						</main> 

						<footer class="feed-note__footer active-background-gradient-light preload-feed-note__footer">
						</footer>			
					</li>
				</ul>
			`
	}

	addElementToPage() {
		if(this.pinnedNote) {
			this.container.append(this.pinnedNote);
		}
		super.addElementToPage()
	}

	deleteElement() {
		if(this.pinnedNote) {
			this.pinnedNote.remove()
		}
		super.deleteElement()
	}
}
