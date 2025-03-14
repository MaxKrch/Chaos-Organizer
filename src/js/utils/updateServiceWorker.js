import Notice from '../components/popups/Notice';

export default function updateServiceWorker() {
  window.addEventListener('load', async () => {
    if (navigator.serviceWorker) {
      const registrationWorker = await navigator.serviceWorker.register(
        new URL(
          /* webpackChunkName: 'service-worker' */
          '../../service-worker.js',
          import.meta.url,
        ),
      );

      if (registrationWorker.waiting) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
        renderNoticeWorkerUpdate(registrationWorker.waiting);
      }
    }
  });
}

function renderNoticeWorkerUpdate(worker) {
  new Promise((res, rej) => {
    new Notice({
      title: `Доступна новая версия приложения`,
      description: `Обновите страницу, чтобы продолжить работу`,
      confirm: {
        title: `Обновить`,
        callback: res,
      },
      cancel: {
        title: `Позже`,
        callback: rej,
      },
    });
  })
    .then(() => {
      worker.postMessage('skipWaiting');
    })
    .catch(() => {
      worker.postMessage('waiting');
    });
}
