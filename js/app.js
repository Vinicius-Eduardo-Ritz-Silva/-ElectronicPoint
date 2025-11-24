import { PontoRepository } from './repositories/PontoRepository.js';
import { PontoService } from './services/PontoService.js';
import { PontoController } from './controllers/PontoController.js';

document.addEventListener('DOMContentLoaded', () => {
    const repository = new PontoRepository();
    const service = new PontoService(repository);
    const controller = new PontoController(service);

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('Service Worker registrado com sucesso:', registration.scope);
            })
            .catch(error => {
                console.log('Falha ao registrar o Service Worker:', error);
            });
    }
});
