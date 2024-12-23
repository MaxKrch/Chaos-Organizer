import FingerprintJS from '@fingerprintjs/fingerprintjs';

export default async function getFingerPrint () {
	const fp = await FingerprintJS.load();
	const result = await fp.get()
  
  return result;
}


