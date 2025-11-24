export class Registro {
    constructor(dataHora, tipo, descricao) {
        this.dataHora = new Date(dataHora);
        this.tipo = tipo;
        this.descricao = descricao;
    }

    toJSON() {
        return {
            dataHora: this.dataHora,
            tipo: this.tipo,
            descricao: this.descricao
        };
    }
}
