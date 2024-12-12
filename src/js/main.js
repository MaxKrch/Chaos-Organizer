import fixViewportHeightMobile from './utils/fixViewportHeightMobile';
import updateServiceWorker from './utils/updateServiceWorker';
import App from './App';

fixViewportHeightMobile()
updateServiceWorker()

const container = document.querySelector('#app-container')
const app = new App(container);

app.init()


