/**
 * Exemplo de teste de integração com validação de contrato
 * Este teste faz chamadas reais à API e valida se as respostas estão de acordo com o contrato
 *
 * NOTA: Para rodar este teste, o backend deve estar rodando
 */

import { contractValidator } from './contract-validator';
import { apiService } from '@/lib/api';

describe('Integration Tests with Contract Validation', () => {
  // Este teste está desabilitado por padrão pois precisa do backend rodando
  // Para habilitar, remova o .skip
  describe.skip('Auth API Integration', () => {
    it('deve fazer login e validar resposta contra o contrato', async () => {
      // Arrange
      const credentials = {
        email: 'admin@exemplo.com',
        senha: '123456',
      };

      // Act - Valida request
      const requestValidation = contractValidator.validateRequestBody(
        '/api/auth/login',
        'POST',
        credentials
      );

      expect(requestValidation.valid).toBe(true);

      // Act - Faz chamada real
      const response = await apiService.login(
        credentials.email,
        credentials.senha
      );

      // Assert - Valida response
      const responseValidation = contractValidator.validateResponse(
        '/api/auth/login',
        'POST',
        200,
        response
      );

      expect(responseValidation.valid).toBe(true);
      expect(response.success).toBe(true);
      expect(response.data?.token).toBeDefined();
    });

    it('deve rejeitar login com credenciais inválidas', async () => {
      // Arrange
      const credentials = {
        email: 'invalid@exemplo.com',
        senha: 'wrongpassword',
      };

      // Act & Assert
      try {
        await apiService.login(credentials.email, credentials.senha);
        fail('Deveria ter lançado erro');
      } catch (error: any) {
        // Valida que o erro está de acordo com o contrato de erro
        expect(error.message).toBeDefined();
      }
    });
  });

  describe.skip('Users API Integration', () => {
    it('deve listar usuários e validar resposta contra o contrato', async () => {
      // Act
      const response = await apiService.getUsuarios({ page: 1, limit: 10 });

      // Assert - Valida contra o contrato
      const validation = contractValidator.validateResponse(
        '/api/usuarios',
        'GET',
        200,
        response
      );

      expect(validation.valid).toBe(true);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data.usuarios)).toBe(true);
    });
  });

  describe.skip('Containers API Integration', () => {
    it('deve listar containers e validar resposta', async () => {
      // Act
      const response = await apiService.getContainers({ page: 1, limit: 10 });

      // Assert
      const validation = contractValidator.validateResponse(
        '/api/containers',
        'GET',
        200,
        response
      );

      if (!validation.valid) {
        console.error('Erros de validação:', validation.errors);
      }

      expect(validation.valid).toBe(true);
    });

    it('deve criar container com dados válidos', async () => {
      // Arrange
      const newContainer = {
        numeroContainer: `CONT-${Date.now()}`,
        tipoContainer: 'DRY',
        capacidade: 20,
        peso: 2000,
      };

      // Valida request
      const requestValidation = contractValidator.validateRequestBody(
        '/api/containers',
        'POST',
        newContainer
      );

      expect(requestValidation.valid).toBe(true);

      // Act
      const response = await apiService.createContainer(newContainer);

      // Assert
      const responseValidation = contractValidator.validateResponse(
        '/api/containers',
        'POST',
        201,
        response
      );

      expect(responseValidation.valid).toBe(true);
    });
  });
});

/**
 * COMO USAR ESTE TESTE:
 *
 * 1. Certifique-se de que o backend está rodando em http://localhost:8000
 *
 * 2. Configure as credenciais corretas no teste
 *
 * 3. Remova o .skip dos testes que deseja executar
 *
 * 4. Execute:
 *    npm run test:contract
 *
 * OU para rodar apenas este arquivo:
 *    npx jest src/tests/contract/integration-example.test.ts
 *
 * BENEFÍCIOS:
 * - Valida que a API real está de acordo com o contrato
 * - Detecta breaking changes imediatamente
 * - Combina testes de integração com validação de contrato
 */
