/**
 * Testes de contrato da API
 * Valida se as respostas da API estão de acordo com o contrato OpenAPI/Swagger
 */

import { contractValidator } from './contract-validator';

describe('API Contract Tests', () => {
  describe('Contract Validator', () => {
    it('deve listar todos os endpoints disponíveis', () => {
      const endpoints = contractValidator.listEndpoints();

      expect(endpoints.length).toBeGreaterThan(0);
      expect(endpoints).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: '/api/auth/login',
            method: 'POST',
          }),
        ])
      );
    });
  });

  describe('Autenticação', () => {
    describe('POST /api/auth/login', () => {
      it('deve validar request body correto', () => {
        const requestBody = {
          email: 'admin@exemplo.com',
          senha: '123456',
        };

        const result = contractValidator.validateRequestBody(
          '/api/auth/login',
          'POST',
          requestBody
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      });

      it('deve rejeitar request body sem email', () => {
        const requestBody = {
          senha: '123456',
        };

        const result = contractValidator.validateRequestBody(
          '/api/auth/login',
          'POST',
          requestBody
        );

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
      });

      it('deve rejeitar request body sem senha', () => {
        const requestBody = {
          email: 'admin@exemplo.com',
        };

        const result = contractValidator.validateRequestBody(
          '/api/auth/login',
          'POST',
          requestBody
        );

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
      });

      it('deve validar response 200 com sucesso', () => {
        const responseData = {
          success: true,
          message: 'Login realizado com sucesso',
          data: {
            user: {
              idUsuario: 1,
              nomeCompleto: 'Admin',
              email: 'admin@exemplo.com',
              status: 'ativo',
            },
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        };

        const result = contractValidator.validateResponse(
          '/api/auth/login',
          'POST',
          200,
          responseData
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      });

      it('deve validar response 401 de erro', () => {
        const responseData = {
          success: false,
          message: 'Credenciais inválidas',
          errors: ['Email ou senha incorretos'],
        };

        const result = contractValidator.validateResponse(
          '/api/auth/login',
          'POST',
          401,
          responseData
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      });
    });
  });

  describe('Usuários', () => {
    describe('GET /api/usuarios', () => {
      it('deve validar response 200 com lista de usuários', () => {
        const responseData = {
          success: true,
          data: [
            {
              idUsuario: 1,
              nomeCompleto: 'Admin User',
              email: 'admin@example.com',
              cpf: '12345678900',
              status: 'ativo',
              perfil: {
                idPerfil: 1,
                nomePerfil: 'Administrador',
                descricao: 'Acesso total',
                nivelAcesso: 1,
              },
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            pages: 1,
          },
        };

        const result = contractValidator.validateResponse(
          '/api/usuarios',
          'GET',
          200,
          responseData
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      });
    });

    describe('POST /api/usuarios', () => {
      it('deve validar request body correto', () => {
        const requestBody = {
          nomeCompleto: 'Novo Usuário',
          email: 'novo@example.com',
          senha: '123456',
          idPerfil: 2,
          cpf: '12345678900',
          telefone: '11999999999',
        };

        const result = contractValidator.validateRequestBody(
          '/api/usuarios',
          'POST',
          requestBody
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      });

      it('deve rejeitar request body sem campos obrigatórios', () => {
        const requestBody = {
          nomeCompleto: 'Novo Usuário',
          // faltando email, senha, idPerfil
        };

        const result = contractValidator.validateRequestBody(
          '/api/usuarios',
          'POST',
          requestBody
        );

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });
  });

  describe('Containers', () => {
    describe('GET /api/containers', () => {
      it('deve validar response 200 com lista de containers', () => {
        const responseData = {
          success: true,
          data: [
            {
              idContainer: 1,
              numeroContainer: 'CONT-001',
              tipoContainer: 'DRY',
              status: 'disponivel',
              capacidade: 20,
              peso: 2000,
              dataCriacao: '2025-01-01T00:00:00Z',
            },
          ],
        };

        const result = contractValidator.validateResponse(
          '/api/containers',
          'GET',
          200,
          responseData
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      });
    });

    describe('POST /api/containers', () => {
      it('deve validar request body correto', () => {
        const requestBody = {
          numeroContainer: 'CONT-002',
          tipoContainer: 'REEFER',
          capacidade: 40,
          peso: 4000,
        };

        const result = contractValidator.validateRequestBody(
          '/api/containers',
          'POST',
          requestBody
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      });
    });
  });

  describe('Averbações', () => {
    describe('GET /api/averbacoes', () => {
      it('deve validar response 200 com lista de averbações', () => {
        const responseData = {
          success: true,
          data: {
            items: [
              {
                idAverbacao: 1,
                numero: 'AVB-2025-001',
                clienteId: 1,
                seguradoraId: 2,
                periodoInicio: '2025-01-01T00:00:00Z',
                periodoFim: '2025-01-31T23:59:59Z',
                valorMercadoriaTotal: 150000.5,
                valorPremioTotal: 4200.75,
                status: 'PENDENTE',
                observacoes: 'Averbação do mês de janeiro',
                dataCriacao: '2025-02-01T10:00:00Z',
                dataAtualizacao: '2025-02-01T10:00:00Z',
                containers: [
                  {
                    containerId: 101,
                    containerNumero: 'CONT-XYZ123',
                    containerTipo: '40HC',
                    navio: 'Evergreen Star',
                    viagem: 'EVG-2025-01',
                    dataEmbarque: '2025-01-05T12:00:00Z',
                    dataChegadaPrevista: '2025-01-20T18:00:00Z',
                    valorMercadoria: 50000.25,
                    valorPremio: 1400.3,
                  },
                ],
              },
            ],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: 1,
              itemsPerPage: 10,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
        };

        const result = contractValidator.validateResponse(
          '/api/averbacoes',
          'GET',
          200,
          responseData
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      });
    });

    describe('POST /api/averbacoes', () => {
      it('deve validar request body correto', () => {
        const requestBody = {
          clienteId: 1,
          periodoInicio: '2025-01-01T00:00:00Z',
          periodoFim: '2025-01-31T23:59:59Z',
          seguradoraId: 2,
          numero: 'AVB-2025-001',
          observacoes: 'Averbação consolidada de janeiro',
          containerTripIds: [101, 102],
          valorMercadoriaTotal: 150000.5,
          valorPremioTotal: 4200.75,
        };

        const result = contractValidator.validateRequestBody(
          '/api/averbacoes',
          'POST',
          requestBody
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      });

      it('deve rejeitar request body sem campos obrigatórios', () => {
        const requestBody = {
          clienteId: 1,
          periodoInicio: '2025-01-01T00:00:00Z',
          // faltando periodoFim
        };

        const result = contractValidator.validateRequestBody(
          '/api/averbacoes',
          'POST',
          requestBody
        );

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });
  });

  describe('Clientes', () => {
    describe('GET /api/clientes', () => {
      it('deve validar response 200 com lista de clientes', () => {
        const responseData = {
          success: true,
          data: [
            {
              idCliente: 1,
              nomeEmpresa: 'Empresa Teste',
              cnpj: '12345678000190',
              email: 'contato@empresa.com',
              telefone: '11999999999',
              endereco: 'Rua Teste, 123',
              status: 'ativo',
            },
          ],
        };

        const result = contractValidator.validateResponse(
          '/api/clientes',
          'GET',
          200,
          responseData
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      });
    });
  });

  describe('Seguradoras', () => {
    describe('GET /api/seguradoras', () => {
      it('deve validar response 200 com lista de seguradoras', () => {
        const responseData = {
          success: true,
          data: [
            {
              idSeguradora: 1,
              nomeSeguradora: 'Seguradora Teste',
              cnpj: '12345678000190',
              email: 'contato@seguradora.com',
              telefone: '11999999999',
              status: 'ativa',
            },
          ],
        };

        const result = contractValidator.validateResponse(
          '/api/seguradoras',
          'GET',
          200,
          responseData
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      });
    });
  });

  describe('Histórico', () => {
    describe('GET /api/historico', () => {
      it('deve validar response 200 com histórico de alterações', () => {
        const responseData = {
          success: true,
          data: {
            historico: [
              {
                idHistorico: 1,
                tabela: 'containers',
                operacao: 'CREATE',
                registroId: 1,
                dadosAnteriores: {},
                dadosNovos: { numeroContainer: 'CONT-001' },
                usuarioId: 1,
                usuario: {
                  nomeCompleto: 'Admin',
                  email: 'admin@example.com',
                },
                dataAlteracao: '2025-01-01T00:00:00Z',
                ip: '127.0.0.1',
                userAgent: 'Mozilla/5.0',
              },
            ],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: 1,
              itemsPerPage: 10,
              hasNextPage: false,
              hasPreviousPage: false,
            },
            filtros: {},
          },
        };

        const result = contractValidator.validateResponse(
          '/api/historico',
          'GET',
          200,
          responseData
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      });
    });
  });
});
