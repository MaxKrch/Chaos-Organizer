const initialState = {
	user: {
		email: null,
		auth: false,
	}, 
	location: {
		section: `notes`,
		category: `allNotes`,
		tag: null,
	},
	feed: {
		section: `notes`,
		listNotes: [
			{
				id: `123-546-fd5`,
				favorite: false,
				pinned: false,
				text: `<p>
					Lorem ipsum, dolor. Lorem ipsum dolor sit amet consectetur adipisicing elit. Exercitationem doloremque ipsam, explicabo adipisci maiores in, quas velit, aliquid accusantium iste beatae dolores doloribus aperiam. Ex quae quaerat ut id quisquam!
					</p>`,
				tags: null,
				geolocation: [`154445`, `154455`],
				attachment: {
					images: [
						{
							id: `1555-554-fdf`, 
							name: `img file`, 
							src: `http://192.168.1.110:7070/image-1.png`
						},
						{
							id: `155ds5-554-fdf`, 
							name: `img2 file`, 
							src: `http://192.168.1.110:7070/image-2.jpg`
						}
					],
					videos: [
						{
							id: `55445-1-dssd`,
							name: `test video`,
							src: `http://192.168.1.110:7070/video-1.mp4`
						}
					],
					audios: [],
					others: []
				},
				dates: {
					created: Date.now(),
					edited: Date.now(),
				}
			},
			{
				id: `123-546-fd5`,
				favorite: false,
				pinned: false,
				text: `Lorem, ipsum dolor sit amet.`,
				tags: [
					{
						id: `5464ffd`,
						title: `Hello`
					},
					{
						id: `546`,
						title: `Test tag`
					}
				],
				geolocation: [`154445`, `154455`],
				attachment: {
					images: [
						{
							id: `1555-554-fdf`, 
							name: `img file`, 
							src: `http://192.168.1.110:7070/image-1.png`
						},
						{
							id: `155ds5-554-fdf`, 
							name: `img2 file`, 
							src: `http://192.168.1.110:7070/image-2.jpg`
						}
					],
					videos: [
						{
							id: `55445-1-dssd`,
							name: `test video`,
							src: `http://192.168.1.110:7070/video-1.mp4`
						}
					],
					audios: [	
						{
							id: `55445-1-dssd`,
							name: `test audio`,
							src: `http://192.168.1.110:7070/audio-1.mp3`
						},
						{
							id: `55445-1-dssd`,
							name: `test audio`,
							src: `http://192.168.1.110:7070/audio-1.mp3`
						},
					],
					others: [
						{
							id: `55445-1-dssd`,
							name: `test other files`,
							src: `http://192.168.1.110:7070/other-1.txt`
						}
					]
				},
				dates: {
					created: Date.now(),
					edited: null,
				}
			},
			{
				id: `123-546-fd5`,
				favorite: false,
				pinned: false,
				text: `Lorem, ipsum dolor sit amet.`,
				tags: null,
				geolocation: [`154445`, `154455`],
				attachment: {
					images: [
						{
							id: `1555-554-fdf`, 
							name: `img file`, 
							src: `http://192.168.1.110:7070/image-1.png`
						},
						{
							id: `155ds5-554-fdf`, 
							name: `img2 file`, 
							src: `http://192.168.1.110:7070/image-2.jpg`
						}
					],
					videos: [
						{
							id: `55445-1-dssd`,
							name: `test video`,
							src: `http://192.168.1.110:7070/video-1.mp4`
						}
					],
					audios: [],
					others: []
				},
				dates: {
					created: Date.now(),
					edited: null,
				}
			},
			// {
			// 	id: `55445-1-dssd`,
			// 	name: `test video`,
			// 	style: `inline`,
			// 	type: `video`,
			// 	src: `http://192.168.1.110:7070/video-1.mp4`
			// },
			// {
			// 	id: `55445-1-dssd`,
			// 	name: `test IMG`,
			// 	style: `block`,
			// 	type: `other`,
			// 	src: `http://192.168.1.110:7070/image-2.jpg`
			// }
		],
		pinnedNote: {
			id: `55445-1-dssd`,
			text: `Lorem, ipsum dolor sit amet.`,
			img: {
				id: `155ds5-554-fdf`, 
				name: `img2 file`, 
				src: `http://192.168.1.110:7070/image-2.jpg`
			}
		},
	},
	waitingUploadNotes: {
		created: new Set(),
		edited: new Set(),
	},
	sidebarData: {
		countNotes: new Set(),
		tags: new Set(),
	},	
	tokens: {
		access: null,
		refresh: null,
	},
	status: `connecting`
}

const idbParams = {
	dbName: `state`,
	dbVersion: 1,
	objectStores: [
		`user`, 
		`location`,
		`feed`,
		`waitingUploadNotes`,
		`sidebarData`
	]
}

export {
	initialState,
	idbParams
}