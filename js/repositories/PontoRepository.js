import { Registro } from '../models/Registro.js';

export class PontoRepository {
    constructor() {
        this.storageKey = this._gerarChaveStorage();
    }

    _gerarChaveStorage() {
        const hoje = new Date().toISOString().split('T')[0];
        return `ponto_eletronico_${hoje}`;
    }

    salvar(registros) {
        localStorage.setItem(this.storageKey, JSON.stringify(registros));
    }

    carregar() {
        const registrosSalvos = localStorage.getItem(this.storageKey);
        if (!registrosSalvos) return [];

        return JSON.parse(registrosSalvos).map(reg =>
            new Registro(reg.dataHora, reg.tipo, reg.descricao)
        );
    }

    limpar() {
        localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
}
