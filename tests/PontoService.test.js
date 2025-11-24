import { PontoService } from '../js/services/PontoService.js';
import { Registro } from '../js/models/Registro.js';

// Mock do Repository
class MockRepository {
    constructor() {
        this.registros = [];
    }
    carregar() { return this.registros; }
    salvar(registros) { this.registros = registros; }
}

describe('PontoService', () => {
    let service;
    let repository;

    beforeEach(() => {
        repository = new MockRepository();
        service = new PontoService(repository);
    });

    test('deve adicionar um registro corretamente', () => {
        const registro = service.adicionarRegistro('Primeira Entrada');
        expect(service.obterRegistros()).toHaveLength(1);
        expect(registro.tipo).toBe('Primeira Entrada');
    });

    test('deve determinar o próximo tipo corretamente', () => {
        expect(service.determinarProximoTipo()).toBe('Primeira Entrada');
        service.adicionarRegistro('Primeira Entrada');
        expect(service.determinarProximoTipo()).toBe('Primeira Saída');
        service.adicionarRegistro('Primeira Saída');
        expect(service.determinarProximoTipo()).toBe('Segunda Entrada');
    });

    test('deve calcular horas trabalhadas corretamente (8h)', () => {
        // 08:00
        const d1 = new Date(); d1.setHours(8, 0, 0, 0);
        service.registros.push(new Registro(d1, 'Primeira Entrada', ''));

        // 12:00
        const d2 = new Date(); d2.setHours(12, 0, 0, 0);
        service.registros.push(new Registro(d2, 'Primeira Saída', ''));

        // 13:00
        const d3 = new Date(); d3.setHours(13, 0, 0, 0);
        service.registros.push(new Registro(d3, 'Segunda Entrada', ''));

        // 17:00
        const d4 = new Date(); d4.setHours(17, 0, 0, 0);
        service.registros.push(new Registro(d4, 'Segunda Saída', ''));

        const dados = service.calcularDadosHoras();

        // 4h + 4h = 8h = 28800000ms
        expect(dados.tempoTrabalhadoMs).toBe(28800000);
        expect(dados.saldoMs).toBe(0);
    });

    test('deve calcular saldo negativo corretamente', () => {
        // 08:00 - 12:00 (4h)
        const d1 = new Date(); d1.setHours(8, 0, 0, 0);
        service.registros.push(new Registro(d1, 'Primeira Entrada', ''));
        const d2 = new Date(); d2.setHours(12, 0, 0, 0);
        service.registros.push(new Registro(d2, 'Primeira Saída', ''));

        const dados = service.calcularDadosHoras();

        // 4h trabalhadas. Saldo deve ser -4h (-14400000ms)
        expect(dados.tempoTrabalhadoMs).toBe(14400000);
        expect(dados.saldoMs).toBe(-14400000);
    });

    test('deve calcular saldo positivo corretamente', () => {
        // 08:00 - 12:00 (4h)
        const d1 = new Date(); d1.setHours(8, 0, 0, 0);
        service.registros.push(new Registro(d1, 'Primeira Entrada', ''));
        const d2 = new Date(); d2.setHours(12, 0, 0, 0);
        service.registros.push(new Registro(d2, 'Primeira Saída', ''));

        // 13:00 - 18:00 (5h)
        const d3 = new Date(); d3.setHours(13, 0, 0, 0);
        service.registros.push(new Registro(d3, 'Segunda Entrada', ''));
        const d4 = new Date(); d4.setHours(18, 0, 0, 0);
        service.registros.push(new Registro(d4, 'Segunda Saída', ''));

        const dados = service.calcularDadosHoras();

        // 9h trabalhadas. Saldo deve ser +1h (3600000ms)
        expect(dados.tempoTrabalhadoMs).toBe(32400000);
        expect(dados.saldoMs).toBe(3600000);
    });
});
