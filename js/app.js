import { PontoRepository } from './repositories/PontoRepository.js';
import { PontoService } from './services/PontoService.js';
import { PontoController } from './controllers/PontoController.js';

document.addEventListener('DOMContentLoaded', () => {
    const repository = new PontoRepository();
    const service = new PontoService(repository);
    const controller = new PontoController(service);
});
