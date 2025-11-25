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

    listarDias() {
        const dias = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('ponto_eletronico_')) {
                const data = key.replace('ponto_eletronico_', '');
                dias.push(data);
            }
        }
        return dias.sort().reverse(); // Mais recentes primeiro
    }

    carregarDia(data) {
        const chave = `ponto_eletronico_${data}`;
        const registrosSalvos = localStorage.getItem(chave);
        if (!registrosSalvos) return [];

        return JSON.parse(registrosSalvos).map(reg => 
            new Registro(reg.dataHora, reg.tipo, reg.descricao)
        );
    }

    excluirDia(data) {
        const chave = `ponto_eletronico_${data}`;
        localStorage.removeItem(chave);
    }

    limparTudo() {
        const dias = this.listarDias();
        dias.forEach(dia => this.excluirDia(dia));
    }
}
