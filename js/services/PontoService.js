import { Registro } from '../models/Registro.js';

export class PontoService {
    constructor(repository) {
        this.repository = repository;
        this.registros = this.repository.carregar();
    }

    adicionarRegistro(tipo = null, descricao = '') {
        const proximoTipo = tipo || this.determinarProximoTipo();
        const agora = new Date();

        // Se for o primeiro registro do dia (lista vazia), garante que está limpo
        // (Embora o repository carregue do dia, se mudou o dia o repository gerou chave nova e retornou vazio)

        const registro = new Registro(agora, proximoTipo, descricao || proximoTipo);
        this.registros.push(registro);
        this.salvar();
        return registro;
    }

    editarRegistro(index, novaDataHora, novaDescricao) {
        if (index < 0 || index >= this.registros.length) return;

        const registroAtual = this.registros[index];
        this.registros[index] = new Registro(novaDataHora, registroAtual.tipo, novaDescricao);

        // Reatribui os tipos de forma sequencial
        this._recalcularTipos();
        this.salvar();
    }

    excluirRegistro(index) {
        if (index < 0 || index >= this.registros.length) return;
        this.registros.splice(index, 1);
        this._recalcularTipos();
        this.salvar();
    }

    salvar() {
        this.repository.salvar(this.registros);
    }

    determinarProximoTipo() {
        if (this.registros.length === 0) return 'Primeira Entrada';

        const ultimoRegistro = this.registros[this.registros.length - 1].tipo;

        switch (ultimoRegistro) {
            case 'Primeira Entrada': return 'Primeira Saída';
            case 'Primeira Saída': return 'Segunda Entrada';
            case 'Segunda Entrada': return 'Segunda Saída';
            case 'Segunda Saída': return 'Primeira Entrada';
            default: return 'Primeira Entrada';
        }
    }

    _recalcularTipos() {
        const tiposSequenciais = ['Primeira Entrada', 'Primeira Saída', 'Segunda Entrada', 'Segunda Saída'];
        this.registros.forEach((reg, i) => {
            reg.tipo = tiposSequenciais[i % tiposSequenciais.length];
        });
    }

    calcularDadosHoras() {
        let tempoTrabalhadoMs = 0;
        let ultimoTipo = '';
        let ultimoHorario = null;

        // Ordena os registros por data/hora para cálculo
        const registrosOrdenados = [...this.registros].sort((a, b) => a.dataHora - b.dataHora);

        const registrosPonto = registrosOrdenados.filter(reg =>
            ['Primeira Entrada', 'Primeira Saída', 'Segunda Entrada', 'Segunda Saída'].includes(reg.tipo)
        );

        registrosPonto.forEach(registro => {
            if (registro.tipo === 'Primeira Entrada' || registro.tipo === 'Segunda Entrada') {
                ultimoHorario = registro.dataHora;
                ultimoTipo = 'entrada';
            } else if ((registro.tipo === 'Primeira Saída' || registro.tipo === 'Segunda Saída') && ultimoTipo === 'entrada') {
                if (ultimoHorario) {
                    const periodo = registro.dataHora - ultimoHorario;
                    tempoTrabalhadoMs += periodo;
                    ultimoHorario = null;
                    ultimoTipo = 'saida';
                }
            }
        });

        // Se está em um período de trabalho ativo
        if (ultimoHorario && ultimoTipo === 'entrada') {
            const agora = new Date();
            const periodoAtual = agora - ultimoHorario;
            tempoTrabalhadoMs += periodoAtual;
        }

        const oitoHorasMs = 8 * 60 * 60 * 1000;
        const saldoMs = tempoTrabalhadoMs - oitoHorasMs;

        return {
            tempoTrabalhadoMs,
            saldoMs,
            ultimoHorario,
            ultimoTipo
        };
    }

    gerarConteudoExportacao() {
        if (this.registros.length === 0) return null;

        let conteudo = 'Registros de Ponto Eletrônico\n';
        conteudo += 'Data: ' + new Date().toLocaleDateString('pt-BR') + '\n\n';

        this.registros.forEach(registro => {
            conteudo += `${registro.dataHora.toLocaleString('pt-BR')} - ${registro.descricao}\n`;
        });

        const { tempoTrabalhadoMs } = this.calcularDadosHoras();
        const horasTrabalhadas = Math.floor(tempoTrabalhadoMs / (1000 * 60 * 60));
        const minutosTrabalhados = Math.floor((tempoTrabalhadoMs % (1000 * 60 * 60)) / (1000 * 60));
        const totalFormatado = `${horasTrabalhadas.toString().padStart(2, '0')}:${minutosTrabalhados.toString().padStart(2, '0')}`;

        conteudo += `\nTotal de horas: ${totalFormatado}\n`;

        const oitoHorasMs = 8 * 60 * 60 * 1000;
        if (tempoTrabalhadoMs > oitoHorasMs) {
            conteudo += 'Status: Acima de 8 horas diárias';
        } else if (tempoTrabalhadoMs < oitoHorasMs) {
            conteudo += 'Status: Abaixo de 8 horas diárias';
        } else {
            conteudo += 'Status: Exatamente 8 horas diárias';
        }

        return conteudo;
    }

    obterRegistros() {
        return this.registros;
    }

    obterHistorico() {
        return this.repository.listarDias();
    }

    excluirDias(datas) {
        datas.forEach(data => this.repository.excluirDia(data));

        // Se o dia atual foi excluído, recarrega (limpa) a lista atual
        const hoje = new Date().toISOString().split('T')[0];
        if (datas.includes(hoje)) {
            this.registros = [];
        }
    }

    exportarDia(data) {
        const registrosDia = this.repository.carregarDia(data);
        if (registrosDia.length === 0) return null;

        // Reutiliza a lógica de geração de conteúdo, mas temporariamente com outros registros
        // Uma abordagem melhor seria extrair a lógica de formatação para um método estático ou utilitário
        // Mas para manter simples, vamos instanciar um service temporário ou ajustar o método

        let conteudo = 'Registros de Ponto Eletrônico\n';
        // Formata a data do dia solicitado (YYYY-MM-DD -> DD/MM/YYYY)
        const [ano, mes, dia] = data.split('-');
        conteudo += `Data: ${dia}/${mes}/${ano}\n\n`;

        registrosDia.forEach(registro => {
            conteudo += `${registro.dataHora.toLocaleString('pt-BR')} - ${registro.descricao}\n`;
        });

        // Calcula horas para esse dia específico
        // Precisamos usar a lógica de cálculo. Vamos criar uma instância temporária ou extrair o cálculo.
        // Como o método calcularDadosHoras usa this.registros, vamos fazer um swap temporário ou passar argumento

        // Refatoração rápida: calcularDadosHoras poderia aceitar registros opcionais
        const dados = this._calcularDadosHorasParaRegistros(registrosDia);

        const { tempoTrabalhadoMs } = dados;
        const horasTrabalhadas = Math.floor(tempoTrabalhadoMs / (1000 * 60 * 60));
        const minutosTrabalhados = Math.floor((tempoTrabalhadoMs % (1000 * 60 * 60)) / (1000 * 60));
        const totalFormatado = `${horasTrabalhadas.toString().padStart(2, '0')}:${minutosTrabalhados.toString().padStart(2, '0')}`;

        conteudo += `\nTotal de horas: ${totalFormatado}\n`;

        const oitoHorasMs = 8 * 60 * 60 * 1000;
        if (tempoTrabalhadoMs > oitoHorasMs) {
            conteudo += 'Status: Acima de 8 horas diárias';
        } else if (tempoTrabalhadoMs < oitoHorasMs) {
            conteudo += 'Status: Abaixo de 8 horas diárias';
        } else {
            conteudo += 'Status: Exatamente 8 horas diárias';
        }

        return conteudo;
    }

    // Método privado duplicado/adaptado para evitar refatoração profunda agora
    _calcularDadosHorasParaRegistros(listaRegistros) {
        let tempoTrabalhadoMs = 0;
        let ultimoTipo = '';
        let ultimoHorario = null;

        const registrosOrdenados = [...listaRegistros].sort((a, b) => a.dataHora - b.dataHora);

        const registrosPonto = registrosOrdenados.filter(reg =>
            ['Primeira Entrada', 'Primeira Saída', 'Segunda Entrada', 'Segunda Saída'].includes(reg.tipo)
        );

        registrosPonto.forEach(registro => {
            if (registro.tipo === 'Primeira Entrada' || registro.tipo === 'Segunda Entrada') {
                ultimoHorario = registro.dataHora;
                ultimoTipo = 'entrada';
            } else if ((registro.tipo === 'Primeira Saída' || registro.tipo === 'Segunda Saída') && ultimoTipo === 'entrada') {
                if (ultimoHorario) {
                    const periodo = registro.dataHora - ultimoHorario;
                    tempoTrabalhadoMs += periodo;
                    ultimoHorario = null;
                    ultimoTipo = 'saida';
                }
            }
        });

        // Nota: Para dias passados, se ficou "em aberto" (entrada sem saída), 
        // o cálculo vai ignorar o último período ou contar até o final do dia?
        // A lógica original conta "até agora". Para histórico, "agora" não faz sentido se for dia passado.
        // Assumiremos que histórico incompleto não soma o tempo aberto ou soma até 23:59?
        // Por simplicidade e consistência com o bug original: se não fechou, não conta o último período.

        return { tempoTrabalhadoMs };
    }
}
