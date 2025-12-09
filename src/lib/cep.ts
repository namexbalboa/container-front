export interface CepResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  location?: {
    type: string;
    coordinates: {
      longitude: string;
      latitude: string;
    };
  };
}

export interface CepError {
  message: string;
  type: 'CEP_NOT_FOUND' | 'INVALID_CEP' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
}

/**
 * Busca informações de endereço pelo CEP usando a BrasilAPI v2
 * @param cep - CEP com ou sem formatação (ex: "01310930" ou "01310-930")
 * @returns Promise com os dados do endereço
 * @throws CepError em caso de erro
 */
export async function buscarCep(cep: string): Promise<CepResponse> {
  // Remove formatação do CEP
  const cepLimpo = cep.replace(/\D/g, '');

  // Valida se tem 8 dígitos
  if (cepLimpo.length !== 8) {
    throw {
      message: 'CEP deve conter 8 dígitos',
      type: 'INVALID_CEP'
    } as CepError;
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepLimpo}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw {
          message: 'CEP não encontrado',
          type: 'CEP_NOT_FOUND'
        } as CepError;
      }

      throw {
        message: `Erro na busca do CEP: ${response.statusText}`,
        type: 'NETWORK_ERROR'
      } as CepError;
    }

    const data: CepResponse = await response.json();
    return data;
  } catch (error) {
    // Se já é um CepError, re-lança
    if (error && typeof error === 'object' && 'type' in error) {
      throw error;
    }

    // Outros erros (rede, parse, etc)
    throw {
      message: error instanceof Error ? error.message : 'Erro desconhecido ao buscar CEP',
      type: 'NETWORK_ERROR'
    } as CepError;
  }
}
