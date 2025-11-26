import { Modal } from './api';

export interface ContainerTipo {
  idTipoContainer: number;
  tipoContainer: string;
  medida?: string | null;
  pesoMaximoKg?: number | null;
  volumeM3?: number | null;
  descricao?: string | null;
  ativo: boolean;
}

export interface ParametroSeguro {
  idParametro: number;
  idTipoContainer?: number | null;
  nome: string;
  descricao?: string | null;
  taxaSeguro: number; // Porcentagem
  taxaPremio: number; // Porcentagem
  taxaIof: number; // Porcentagem (padrão 7.38%)
  adicionalFracionamento?: number | null;
  custoApolice: number;
  valorMinimoSeguro?: number | null;
  valorMaximoSeguro?: number | null;
  modalTransporte?: Modal | null;
  vigenciaInicio?: string | null;
  vigenciaFim?: string | null;
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
  tipoContainer?: ContainerTipo | null;
}

export interface CreateParametroSeguroData {
  nome: string;
  descricao?: string;
  idTipoContainer?: number;
  taxaSeguro: number;
  taxaPremio: number;
  taxaIof?: number;
  adicionalFracionamento?: number;
  custoApolice?: number;
  valorMinimoSeguro?: number;
  valorMaximoSeguro?: number;
  modalTransporte?: Modal;
  vigenciaInicio?: string;
  vigenciaFim?: string;
  ativo?: boolean;
}

export interface UpdateParametroSeguroData extends Partial<CreateParametroSeguroData> {}

export interface CalculoSeguroRequest {
  valorMercadoria: number;
  idTipoContainer?: number;
  modal?: Modal;
}

export interface CalculoSeguroResponse {
  parametro: {
    id: number;
    nome: string;
    taxaSeguro: number;
    taxaPremio: number;
    taxaIof: number;
  };
  calculo: {
    importanciaSegurada: number;
    premioBase: number;
    iof: number;
    adicionalFracionamento: number;
    custoApolice: number;
    premioTotal: number;
  };
}

export interface ParametroSeguroFilters {
  page?: number;
  limit?: number;
  ativo?: boolean;
  idTipoContainer?: number;
  modalTransporte?: Modal;
}

export interface ParametroSeguroListResponse {
  data: ParametroSeguro[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
