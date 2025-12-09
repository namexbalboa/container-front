// Tipos para o sistema de autenticação e API v2

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    errors?: string[];
}

// Nova estrutura de paginação conforme documentação
export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

// Resposta paginada conforme nova documentação
export interface PaginatedResponse<T> {
    items: T[];
    pagination: PaginationInfo;
}

// Sistema de Permissões v2
export interface Permissao {
    idPermissao: number;
    nomePermissao: string;
    descricao: string;
    modulo: ModuloSistema;
    acao: AcaoPermissao;
    ativo?: boolean;
    dataCriacao?: string;
}

export interface PerfilPermissao {
    idPerfilPermissao: number;
    idPerfil: number;
    idPermissao: number;
    permissao: Permissao;
}

export interface Perfil {
    idPerfil: number;
    nomePerfil: string;
    descricao: string;
    nivelAcesso: number | null;
    ativo: boolean;
    dataCriacao: string;
    perfilPermissoes: PerfilPermissao[];
}

// Usuário v2 com novos campos
export interface Usuario {
    idUsuario: number;
    nomeCompleto: string;
    email: string;
    cpf?: string;
    telefone?: string;
    celular?: string;
    status: "ativo" | "inativo" | "suspenso";
    ultimoAcesso?: string;
    dataCriacao?: string;
    dataAtualizacao?: string;
    perfil: Perfil;
}

// Interface para o usuário retornado pela API de autenticação
export interface UsuarioAuth {
    id: number;
    nome: string;
    email: string;
    cpf?: string;
    telefone?: string;
    status: "ativo" | "inativo" | "suspenso";
    perfil: Perfil;
}

// Autenticação v2 com refresh token
export interface AuthResponse {
    usuario: UsuarioAuth;
    token: string;
    refreshToken: string;
}

export interface RefreshTokenResponse {
    token: string;
    refreshToken: string;
}

export interface LoginCredentials {
    email: string;
    senha: string;
}

// Tipos para paginação
export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
}

export interface PaginationResponse {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

// Tipos para containers
export type ContainerStatus = "ativo" | "em_transito" | "entregue" | "inativo";

export interface ContainerTipo {
    idTipoContainer: number;
    tipoContainer: string;
    descricao?: string;
    pesoMaximoKg?: number;
    ativo?: boolean;
}

export interface Container {
    idContainerRegistro: number;
    nrContainer: string;
    idTipoContainer: number;
    statusContainer: ContainerStatus;
    proprietario?: string;
    anoFabricacao?: number;
    valorContainer?: number;
    dataRegistro: string;
    dataAtualizacao?: string;
    observacoes?: string;
    tipoContainer?: ContainerTipo;

    /**
     * Campos derivados para compatibilidade com componentes antigos.
     * `numero` replica `nrContainer` e `status` replica `statusContainer`.
     */
    numero?: string;
    status?: ContainerStatus;
}

export interface ContainerFilters extends PaginationParams {
    statusContainer?: ContainerStatus;
    nrContainer?: string;
    proprietario?: string;
    idTipoContainer?: number;
    search?: string;
    dataInicio?: string;
    dataFim?: string;
}

export interface ContainerCreate {
    nrContainer: string;
    idTipoContainer: number;
    proprietario?: string;
    anoFabricacao?: number;
    valorContainer?: number;
    statusContainer?: ContainerStatus;
    observacoes?: string;
}

export interface ContainerUpdate {
    idTipoContainer?: number;
    proprietario?: string;
    anoFabricacao?: number;
    valorContainer?: number;
    statusContainer?: ContainerStatus;
    observacoes?: string;
}

// Tipos específicos de Container Trip
export type StatusViagem =
    | "planejada"
    | "em_transito"
    | "chegada"
    | "descarregado"
    | "finalizada"
    | "cancelada";

export type Modal = "M" | "T" | "A"; // M=Marítimo, T=Terrestre, A=Aéreo

export type OrigemDados = "SISCOMEX" | "MANUAL" | "API";

// Porto
export interface Porto {
    idPorto?: number;
    nomePorto?: string;
    codigo?: string;
    pais?: string;
    estado?: string;
    cidade?: string;
}

// Container vinculado a uma viagem (CeContainer) - relação N:N entre ContainerTrip e ContainerRegistro
export interface CeContainer {
    idCeContainer: number;
    idContainerRegistro: number;
    nrContainer: string;
    sequencia: number;
    ativo: boolean;
    tipoContainer?: {
        idTipoContainer: number;
        tipoContainer: string;
        medida: string;
        pesoMaximoKg: string;
        volumeM3: string;
        descricao?: string;
        ativo?: boolean;
    };
    statusContainer?: string;
    observacoes?: string | null;
    // Inclui o containerRegistro completo quando retornado pelo backend
    containerRegistro?: {
        idContainerRegistro: number;
        nrContainer: string;
        valorContainer?: number;
        proprietario?: string;
        anoFabricacao?: number;
        statusContainer?: string;
        tipoContainer?: {
            idTipoContainer: number;
            tipoContainer: string;
            medida: string;
            pesoMaximoKg: string;
            volumeM3: string;
            descricao?: string;
            ativo?: boolean;
        };
    };
}

// Container Trips - viagens de containers
export interface ContainerTrip {
    idContainerTrip: number;
    idContainerRegistro: number;
    idCliente: number;

    // Campos SISCOMEX / CE Mercante
    numeroCE?: string | null;
    numeroCEMaster?: string | null;
    numeroConhecimento?: string | null;
    tipoConhecimento?: string | null;
    origemDados: OrigemDados;

    // Campos de viagem
    statusViagem: StatusViagem;
    modal: Modal;
    nomeNavio?: string | null;
    numeroViagem?: string | null;
    navioImo?: string | null;
    armador?: string | null;
    booking?: string | null;
    blNumber?: string | null;

    // Datas
    dataEmbarque: string;
    horaEmbarque?: string | null;
    dataChegadaPrevista?: string | null;
    dataChegada?: string | null;
    horaChegada?: string | null;
    dataDescarregamento?: string | null;
    dataEmissaoBl?: string | null;

    // Portos e Terminais
    idPortoOrigem: number;
    idPortoDestino: number;
    portoOrigemCodigo?: string | null;
    portoDestinoCodigo?: string | null;
    portoOrigem?: Porto | null;
    portoDestino?: Porto | null;
    paisOrigem?: string | null;
    estadoDestinoUrf?: string | null;
    terminalCarregamento?: string | null;
    terminalDescarga?: string | null;

    // Transbordo
    houveTransbordo?: boolean;
    blOriginalData?: string | null;
    blOriginalNumero?: string | null;
    navioOriginal?: string | null;
    portoTransbordo?: string | null;
    navioTransbordo?: string | null;

    // Carga
    descricaoMercadoria?: string | null;
    mercadoria?: string | null;
    quantidadeVolumes?: number | null;
    cubagem?: number | null;
    pesoBrutoKg?: number | null;
    valorMercadoria?: number | null;
    moedaMercadoria?: string | null;
    categoriaCarga?: string | null;

    // Partes Envolvidas
    embarcadorCNPJ?: string | null;
    embarcadorNome?: string | null;
    consignatarioCNPJ?: string | null;
    consignatarioNome?: string | null;
    consignatarioInfo?: string | null;
    notifyPartyCNPJ?: string | null;
    notifyPartyNome?: string | null;

    // Frete e Taxas
    valorFrete?: number | null;
    moedaFrete?: string | null;
    modalidadeFrete?: string | null;
    tipoPagamentoFrete?: string | null;
    taxasAdicionais?: any[];
    freeTime?: number | null;

    // Documentos
    notasFiscais?: any[];

    // Observações
    observacoes?: string | null;

    // SISCOMEX
    siscomexSyncAt?: string | null;
    siscomexSyncData?: any;
    siscomexErros?: any;

    // Campos legados/complementares
    numeroContainer?: string;
    tipoContainer?: string;
    navio?: string | null;
    viagem?: string | null;
    status?: string;

    // Containers vinculados (relação 1:N via CeContainer)
    containers?: CeContainer[];
    containerRegistro?: {
        idContainerRegistro: number;
        nrContainer: string;
        tipoContainer?: {
            tipoContainer: string;
            medida: string;
        };
    };

    // Auditoria
    dataCriacao: string;
    dataAtualizacao?: string;
    criadoPor?: number | null;
    atualizadoPor?: number | null;
}

export interface ContainerTripFilters extends PaginationParams {
    idCliente?: number;
    idContainerRegistro?: number;
    statusViagem?: StatusViagem;
    modal?: Modal;
    origemDados?: OrigemDados;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
}

// Filtros específicos para buscar viagens por cliente e período (wizard Step 2)
export interface TripsByClientFilters extends PaginationParams {
    clientId: number;
    startDate: string;  // ISO format YYYY-MM-DD
    endDate: string;    // ISO format YYYY-MM-DD
    status?: string;
    modal?: Modal;
    numeroCE?: string;
    portoOrigemId?: number;
    portoDestinoId?: number;
}

export interface ContainerTripUpdate {
    idCliente?: number;
    idPortoOrigem?: number;
    idPortoDestino?: number;
    numeroCE?: string | null;
    numeroConhecimento?: string | null;
    dataEmbarque?: string;
    dataChegada?: string | null;
    dataChegadaPrevista?: string | null;
    nomeNavio?: string | null;
    numeroViagem?: string | null;
    booking?: string | null;
    armador?: string | null;
    valorMercadoria?: number | null;
    observacoes?: string | null;
}

// Averbações - consolidação por empresa/período
export interface AverbacaoContainerResumo {
    idRelacao?: number;
    containerId: number;
    containerNumero: string;
    containerTipo?: string;
    viagem?: string;
    navio?: string;
    portoOrigem?: string;
    portoDestino?: string;
    dataEmbarque?: string;
    dataChegadaPrevista?: string;
    valorMercadoria?: number;
    valorPremio?: number;
}

export type AverbacaoStatus =
    | "pendente"
    | "aprovada"
    | "rejeitada"
    | "cancelada";

export interface Averbacao {
    idAverbacao: number;
    numero?: string;
    numeroAverbacao?: string;
    codigoInterno?: string;
    clienteId: number;
    seguradoraId?: number;
    periodoInicio?: string;
    periodoFim?: string;
    valorMercadoriaTotal?: number;
    valorPremioTotal?: number;
    importanciaSegurada?: number | string;
    status: AverbacaoStatus;
    observacoes?: string;
    dataAverbacao?: string;
    dataAprovacao?: string;
    usuarioAprovacao?: number;

    // Valores calculados e salvos
    premioLiquido?: number;
    premioComercial?: number;
    premioComercialLiquido?: number;
    premio?: number;
    iof?: number;
    taxa?: number;
    adicionalFracionamento?: number;
    custoApolice?: number;
    quantidadeAverbacoes?: number;

    // Relacionamentos
    cliente?: Cliente;
    seguradora?: Seguradora;
    apolice?: {
        idApolice?: number;
        numeroApolice?: string;
        premioMinimo?: number;
        seguradora?: {
            idSeguradora?: number;
            nomeSeguradora?: string;
            corretor?: {
                nome?: string;
                cpfCnpj?: string;
                comissaoPercentual?: number;
            };
        };
        filial?: {
            idFilial?: number;
            nomeFilial?: string;
            cnpjFilial?: string;
        };
    };
    containers?: Array<{
        idContainerTrip?: number;
        valorPremio?: number;
        valorContainer?: number;
        containerTipo?: string;
        containerTrip?: ContainerTrip;
    }> | AverbacaoContainerResumo[];
    containerTrips?: AverbacaoContainerResumo[];
    criador?: {
        idUsuario?: number;
        nomeCompleto?: string;
        email?: string;
    };
    aprovador?: {
        idUsuario?: number;
        nomeCompleto?: string;
        email?: string;
    };

    // Auditoria
    dataCriacao?: string;
    dataAtualizacao?: string;

    // Campos calculados do backend
    nomeSeguradora?: string;
    nomeFilial?: string;
    quantidadeContainers?: number;
    criadoEm?: string;
    atualizadoEm?: string;

    // Campo legado (manter compatibilidade enquanto backend migra)
    numeroContainer?: string;
    valorMercadoria?: number;
    container?: Container;
}

export interface AverbacaoCreate {
    clienteId: number;
    seguradoraId?: number;
    apoliceId?: number;
    periodoInicio: string;
    periodoFim: string;
    containerTripIds?: number[];
    ceContainerIds?: number[];
    observacoes?: string;
    numero?: string;
    valorMercadoriaTotal?: number;
    valorPremioTotal?: number;
    // Campo legado opcional (manter compatibilidade)
    numeroContainer?: string;
}

export interface AverbacaoUpdate {
    seguradoraId?: number;
    periodoInicio?: string;
    periodoFim?: string;
    containerTripIds?: number[];
    observacoes?: string;
    valorMercadoriaTotal?: number;
    valorPremioTotal?: number;
    numero?: string;
}

export interface AverbacaoFilters extends PaginationParams {
    status?: AverbacaoStatus;
    clienteId?: number;
    seguradoraId?: number;
    numero?: string;
    numeroContainer?: string;
    dataInicio?: string;
    dataFim?: string;
    periodoInicio?: string;
    periodoFim?: string;
}

export interface AverbacaoApproval {
    observacoes?: string;
}

// Tipos para o relatório de averbação
export interface AverbacaoEmbarque {
    numeroAverbacao: string;
    nrContainer: string;
    tipoContainer: string;
    descricaoTipo?: string;
    medida?: string;
    dataEmbarque: string;
    portoOrigem?: string;
    portoDestino?: string;
    modal?: 'T' | 'M' | 'A';
    nomeNavio?: string;
    dataChegada?: string;
    freeTime?: number;
    valorContainer?: number;
    taxaSeguro?: number;
    statusViagem?: string;
    premio?: number;
}

export interface AverbacaoRelatorioTotalizadores {
    valorTotalMercadorias: number;
    premioTotal: number;
}

export interface AverbacaoRelatorio {
    // CABEÇALHO
    apolice: string;
    filial: string;
    cnpjFilial: string;
    mesReferencia: string;
    corretor: string;
    cpfCnpjCorretor: string;
    comissaoCorretor: number;
    segurado: string;
    nomeFantasia?: string;
    cnpj: string;
    seguradora: string;

    // DADOS DA AVERBAÇÃO
    numeroAverbacao: string;
    dataAverbacao: string;
    periodoInicio: string;
    periodoFim: string;
    status: AverbacaoStatus;

    // VALORES CONSOLIDADOS
    importanciaSegurada: number;
    quantidadeAverbacoes: number;
    quantidadeContainers: number;
    premioComercial: number;
    premioComercialLiquido: number;
    premioMinimo: number;
    premioLiquido: number;
    taxa: number;
    premio: number;
    iof: number;
    adicionalFracionamento: number;
    custoApolice: number;

    // TABELA DE EMBARQUES
    embarques: AverbacaoEmbarque[];

    // TOTALIZADORES
    totalizadores: AverbacaoRelatorioTotalizadores;
}

// Tipos para documentos de averbações
export interface DocumentoAverbacao {
    idDocumento: number;
    idAverbacao: number;
    nomeArquivo: string;
    nomeOriginal: string;
    tipoArquivo: string;
    tamanho: number;
    caminhoArquivo: string;
    uploadedBy: number;
    usuario?: Usuario;
    dataCriacao: string;
}

export interface DocumentoUpload {
    arquivo: File;
    tipo?: string;
    descricao?: string;
}

// Tipos para recálculo de averbação
export interface ValoresAverbacao {
    importanciaSegurada: number;
    premio: number;
    premioLiquido: number;
    iof: number;
}

export interface DetalhesCalculoPorTipo {
    tipoContainer: string;
    quantidade: number;
    valorMedio: number;
    taxaSeguro: number;
    valorSeguro: number;
}

export interface DetalhesCalculo {
    quantidadeContainers: number;
    containersCalculados: number;
    containersComErro: number;
    porTipo: DetalhesCalculoPorTipo[];
}

export interface RecalculoAverbacaoResponse {
    averbacao: Averbacao;
    valoresAntigos: ValoresAverbacao;
    valoresNovos: ValoresAverbacao;
    detalhesCalculo: DetalhesCalculo;
    alterado: boolean;
    mensagem: string;
}

// Tipos para clientes
// Cliente v2
export interface Cliente {
    idCliente: number;
    razaoSocial: string;
    cnpj: string;
    email: string;
    telefone?: string;
    endereco?: string;
    status: "ativo" | "inativo" | "suspenso";
    dataCriacao: string;
    dataAtualizacao?: string;
    filiais?: Cliente[];
}

export interface ClienteCreate {
    razaoSocial: string;
    cnpj: string;
    email: string;
    telefone?: string;
    endereco?: string;
}

export interface ClienteUpdate {
    razaoSocial?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    status?: Cliente["status"];
}

export interface ClienteFilters extends PaginationParams {
    status?: Cliente["status"];
}

// Tipos para parâmetros de seguro (ClienteContainerSeguro)
export interface ClienteContainerSeguro {
    idCliente: number;
    idTipoContainer: number;
    versao: number;
    taxaSeguro: number;
    valorContainerDecimal: number;
    vigenciaInicio: string;
    vigenciaFim: string | null;
    ativo: boolean;
    dataCriacao: string;
    dataAtualizacao: string;
    criadoPor: number | null;
    atualizadoPor: number | null;
    deletadoEm: string | null;
    // Relacionamentos
    cliente?: Cliente;
    tipoContainer?: {
        idTipoContainer: number;
        tipoContainer: string;
        descricao?: string;
        ativo: boolean;
    };
}

export interface ClienteContainerSeguroCreate {
    idCliente: number;
    idTipoContainer: number;
    taxaSeguro: number;
    valorContainerDecimal: number;
    vigenciaInicio: string;
    vigenciaFim?: string | null;
}

export interface ClienteContainerSeguroUpdate {
    taxaSeguro?: number;
    valorContainerDecimal?: number;
    vigenciaInicio?: string;
    vigenciaFim?: string | null;
}

// Tipos para seguradoras
export interface Seguradora {
    idSeguradora: number;
    nomeSeguradora: string;
    cnpj: string;
    email: string;
    telefone: string;
    celular?: string;
    endereco?: SeguradoraEndereco | string;
    cidade?: string;
    estado?: string;
    cep?: string;
    contatos?: SeguradoraContato[];
    documentos?: SeguradoraDocumento[];
    status: "ativa" | "inativa" | "suspensa";
    observacoes?: string;
    dataCriacao: string;
    dataAtualizacao?: string;
    totalAverbacoes?: number;
    valorTotalAverbado?: number;
    mediaTempoAprovacao?: number;
}

export interface SeguradoraEndereco {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    pais: string;
}

export interface SeguradoraContato {
    idContato: number;
    nome: string;
    cargo: string;
    email: string;
    telefone: string;
    celular?: string;
    departamento?: string;
    principal: boolean;
    ativo: boolean;
    dataCriacao: string;
}

export interface SeguradoraDocumento {
    idDocumento: number;
    tipoDocumento: "CONTRATO" | "APOLICE" | "CERTIFICADO" | "OUTROS";
    nomeArquivo: string;
    nomeOriginal: string;
    tamanho: number;
    caminhoArquivo: string;
    dataVencimento?: string;
    observacoes?: string;
    uploadedBy: number;
    usuario?: Usuario;
    dataCriacao: string;
}

export interface SeguradoraCreate {
    razaoSocial: string;
    cnpj: string;
    email: string;
    telefone: string;
    susep?: string;
    site?: string;
    endereco?: {
        logradouro: string;
        numero: string;
        complemento?: string;
        bairro: string;
        cidade: string;
        estado: string;
        cep: string;
    };
    idCorretor?: number;
}

export interface SeguradoraUpdate {
    nomeSeguradora?: string;
    email?: string;
    telefone?: string;
    celular?: string;
    endereco?: Partial<SeguradoraEndereco>;
    status?: Seguradora["status"];
    observacoes?: string;
}

export interface SeguradoraFilters extends PaginationParams {
    nomeSeguradora?: string;
    cnpj?: string;
    status?: Seguradora["status"];
    cidade?: string;
    uf?: string;
    estado?: string;
    dataInicio?: string;
    dataFim?: string;
    dataInicioAtualizacao?: string;
    dataFimAtualizacao?: string;
    temAverbacoes?: boolean;
    valorMinimo?: number;
    valorMaximo?: number;
}

export interface SeguradoraContatoCreate {
    nome: string;
    cargo: string;
    email: string;
    telefone: string;
    celular?: string;
    departamento?: string;
    principal?: boolean;
}

export interface SeguradoraContatoUpdate {
    nome?: string;
    cargo?: string;
    email?: string;
    telefone?: string;
    celular?: string;
    departamento?: string;
    principal?: boolean;
    ativo?: boolean;
}

export interface SeguradoraStats {
    totalSeguradoras: number;
    seguradorasAtivas: number;
    seguradorasInativas: number;
    totalAverbacoes: number;
    valorTotalAverbado: number;
    mediaTempoAprovacao: number;
    topSeguradoras: Array<{
        idSeguradora: number;
        nomeSeguradora: string;
        totalAverbacoes: number;
        valorTotal: number;
    }>;
}

// Tipos para usuários (CRUD)
export interface UsuarioCreate {
    nomeCompleto: string;
    email: string;
    senha: string;
    idPerfil: number;
    cpf?: string;
    telefone?: string;
    celular?: string;
}

export interface UsuarioUpdate {
    nomeCompleto?: string;
    email?: string;
    idPerfil?: number;
    cpf?: string;
    telefone?: string;
    celular?: string;
    status?: "ativo" | "inativo" | "suspenso";
}

export interface UsuarioFilters extends PaginationParams {
    status?: "ativo" | "inativo" | "suspenso";
    perfil?: "admin" | "usuario" | "operador";
}

// Módulos do sistema para permissões
// Dashboard v2
export interface DashboardStats {
    resumo: {
        totalContainers: number;
        containersAtivos: number;
        totalAverbacoes: number;
        averbacoesPendentes: number;
        totalUsuarios: number;
        usuariosAtivos: number;
    };
    graficos: {
        averbacoesPorMes: Array<{
            mes: string;
            total: number;
            aprovadas: number;
            rejeitadas: number;
            pendentes: number;
        }>;
        containersPorStatus: Array<{
            status: string;
            quantidade: number;
            percentual: number;
        }>;
        atividadeUsuarios: Array<{
            data: string;
            logins: number;
            operacoes: number;
        }>;
    };
    alertas: Array<{
        tipo: "warning" | "error" | "info";
        titulo: string;
        descricao: string;
        prioridade: "baixa" | "media" | "alta" | "critica";
        dataDeteccao: string;
    }>;
    performance: {
        tempoMedioProcessamento: number;
        taxaSucesso: number;
        picos: Array<{
            horario: string;
            operacoes: number;
        }>;
    };
}

export interface DashboardMetrica {
    nome: string;
    valor: string | number;
    icone: string;
    cor: string;
    descricao: string;
    tendencia?: {
        valor: number;
        tipo: "up" | "down" | "stable";
        periodo: string;
    };
    meta?: {
        valor: number;
        progresso: number;
    };
}

export interface DashboardGrafico {
    tipo: "line" | "bar" | "pie" | "area";
    titulo: string;
    dados: Array<{
        label: string;
        valor: number;
        cor?: string;
        data?: string;
    }>;
    periodo: "7d" | "30d" | "90d" | "1y";
}

export interface DashboardOperation {
    id: number;
    tipo: "container" | "averbacao" | "cliente" | "usuario";
    descricao: string;
    usuario: string;
    data: string;
    status: "sucesso" | "erro" | "pendente";
}

export interface DashboardAction {
    id: number;
    tipo: "aprovacao" | "revisao" | "vencimento" | "alerta";
    titulo: string;
    descricao: string;
    prioridade: "alta" | "media" | "baixa";
    data: string;
    link?: string;
}

export interface DashboardData {
    stats: DashboardStats;
    metricas: DashboardMetrica[];
    graficos: DashboardGrafico[];
    operations: DashboardOperation[];
    actions: DashboardAction[];
    ultimaAtualizacao: string;
}

// Sistema de Permissões v2 - Módulos atualizados
export type ModuloSistema =
    | "USER"
    | "CLIENT"
    | "CONTAINER"
    | "CONTAINERS"
    | "CONTAINER_TRIP"
    | "TRIP"
    | "AVERBACAO"
    | "AVERBACOES"
    | "SEGURADORA"
    | "SEGURADORAS"
    | "CLIENTES"
    | "USUARIOS"
    | "RELATORIOS"
    | "SISTEMA"
    | "PERMISSION"
    | "DASHBOARD";

export type AcaoPermissao =
    | "READ"
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "APPROVE"
    | "EXPORT"
    | "ALL";

// Busca avançada
export interface SearchParams {
    termo: string;
    modulos?: ModuloSistema[];
    filtros?: SearchFilters;
    ordenacao?: SearchOrdenacao;
    page?: number;
    limit?: number;
}

export interface SearchFilters {
    dataInicio?: string;
    dataFim?: string;
    status?: string[];
    prioridade?: string[];
    usuario?: number;
    cliente?: number;
    seguradora?: number;
    tags?: string[];
}

export interface SearchOrdenacao {
    campo: "relevancia" | "data" | "titulo" | "status";
    direcao: "asc" | "desc";
}

export interface SearchResult {
    id: number;
    tipo: string;
    titulo: string;
    descricao: string;
    modulo: ModuloSistema;
    data: string;
    relevancia: number;
    status?: string;
    usuario?: string;
    cliente?: string;
    seguradora?: string;
    tags?: string[];
    url?: string;
    icone?: string;
    cor?: string;
    metadados?: Record<string, any>;
}

export interface SearchResponse {
    resultados: SearchResult[];
    total: number;
    tempo: number;
    sugestoes?: string[];
    filtrosDisponiveis?: {
        modulos: { valor: ModuloSistema; label: string; count: number }[];
        status: { valor: string; label: string; count: number }[];
        usuarios: { valor: number; label: string; count: number }[];
        clientes: { valor: number; label: string; count: number }[];
        seguradoras: { valor: number; label: string; count: number }[];
        tags: { valor: string; label: string; count: number }[];
    };
}

export interface SearchHistorico {
    id: string;
    termo: string;
    filtros?: SearchFilters;
    timestamp: string;
    resultados: number;
}

export interface SearchSugestao {
    termo: string;
    tipo: "historico" | "popular" | "sugestao";
    count?: number;
}

// Tipos para histórico de alterações
export interface HistoricoAlteracao {
    idHistorico: number;
    idAverbacao: number;
    tipoAlteracao: "CRIACAO" | "EDICAO" | "APROVACAO" | "REJEICAO" | "CANCELAMENTO" | "DOCUMENTO_ADICIONADO" | "DOCUMENTO_REMOVIDO";
    campoAlterado?: string;
    valorAnterior?: string;
    valorNovo?: string;
    observacoes?: string;
    usuarioId: number;
    usuario?: Usuario;
    dataAlteracao: string;
    detalhes?: Record<string, any>;
}

// Novo tipo para histórico do sistema conforme documentação
export interface HistoricoItem {
    idAuditoria: number;
    tabela: string;
    idRegistro: number;
    operacao: "CREATE" | "UPDATE" | "DELETE";
    dadosAnteriores: any;
    dadosNovos: any;
    usuario: {
        idUsuario: number;
        nomeCompleto: string;
        email: string;
    };
    dataOperacao: string;
    ipOrigem: string;
    userAgent: string;
    alteracoes: {
        campos_alterados: string[];
        resumo: string;
    };
}

// Resposta do histórico com paginação
export interface HistoricoResponse {
    historico: HistoricoItem[];
    pagination: PaginationInfo;
    filtros: {
        tabela?: string;
        operacao?: string;
        usuario?: number;
        dataInicio?: string;
        dataFim?: string;
    };
}

// Estatísticas do histórico
export interface HistoricoStats {
    resumo: {
        totalOperacoes: number;
        periodo: number;
    };
    distribuicao: {
        porTipo: {
            CREATE: number;
            UPDATE: number;
            DELETE: number;
        };
        porTabela: Array<{
            tabela: string;
            total: number;
        }>;
        usuariosAtivos: Array<{
            usuario: {
                idUsuario: number;
                nomeCompleto: string;
                email: string;
            };
            totalOperacoes: number;
        }>;
    };
    atividade: Array<{
        data: string;
        total: number;
    }>;
    periodo: {
        dias: number;
        dataInicio: string;
        dataFim: string;
    };
}

export interface HistoricoFilters extends PaginationParams {
    idAverbacao?: number;
    tipoAlteracao?: HistoricoAlteracao["tipoAlteracao"];
    usuarioId?: number;
    dataInicio?: string;
    dataFim?: string;
}

// Sistema de Notificações
export interface Notificacao {
    idNotificacao: number;
    titulo: string;
    mensagem: string;
    tipo: "info" | "alerta" | "erro" | "sucesso";
    prioridade: "baixa" | "media" | "alta" | "critica";
    lida: boolean;
    dataEnvio: string;
    dadosAdicionais?: {
        averbacaoId?: number;
        numeroContainer?: string;
        [key: string]: any;
    };
}

export interface NotificacaoCreate {
    titulo: string;
    mensagem: string;
    tipo: Notificacao["tipo"];
    prioridade: Notificacao["prioridade"];
    dadosAdicionais?: {
        averbacaoId?: number;
        numeroContainer?: string;
    };
}

export interface NotificacaoFilters {
    tipo?: Notificacao["tipo"];
    prioridade?: Notificacao["prioridade"];
    status?: "LIDA" | "NAO_LIDA";
    dataInicio?: string;
    dataFim?: string;
    page?: number;
    limit?: number;
}

export interface NotificacaoStats {
    resumo: {
        total: number;
        naoLidas: number;
        lidas: number;
        periodo: number;
    };
    distribuicao: {
        porTipo: {
            info: number;
            alerta: number;
            erro: number;
            sucesso: number;
        };
        porPrioridade: {
            baixa: number;
            media: number;
            alta: number;
            critica: number;
        };
    };
    ultimasSemanas: Array<{
        semana: string;
        total: number;
        naoLidas: number;
    }>;
    tempoMedioLeitura: string;
    taxaLeitura: number;
}
