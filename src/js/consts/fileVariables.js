const fileLimits = [
	{
		TYPE: 'video',
		MAX_SIZE_MB: 10,
		MAX_COUNT: 3,
	},
	{
		TYPE: 'audio',
		MAX_SIZE_MB: 7,
		MAX_COUNT: 5,
	},
	{
		TYPE: 'other',
		MAX_SIZE_MB: 5,
		MAX_COUNT: 5,
	},		
	{
		TYPE: 'image',
		MAX_SIZE_MB: 4,
		MAX_COUNT: 5,
	}		
]

const knownTypes = [
	`image`,
	`video`,
	`audio`
]

export {
	fileLimits,
	knownTypes
}