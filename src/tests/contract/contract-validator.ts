/**
 * Validador de contratos da API usando Ajv (JSON Schema validator)
 */

import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import swaggerSchema from './schemas/swagger.json';

export class ContractValidator {
  private ajv: Ajv;
  private validators: Map<string, ValidateFunction> = new Map();

  constructor() {
    this.ajv = new Ajv({
      strict: false,
      allErrors: true,
      verbose: true,
    });
    addFormats(this.ajv);

    // Adiciona os schemas do swagger
    if (swaggerSchema.components?.schemas) {
      Object.entries(swaggerSchema.components.schemas).forEach(([name, schema]) => {
        this.ajv.addSchema(schema, `#/components/schemas/${name}`);
      });
    }
  }

  /**
   * Valida se uma resposta corresponde ao schema esperado
   */
  validateResponse<T = any>(
    path: string,
    method: string,
    statusCode: number,
    data: any
  ): { valid: boolean; errors?: string[] } {
    const schema = this.getResponseSchema(path, method, statusCode);

    if (!schema) {
      return {
        valid: false,
        errors: [`Schema não encontrado para ${method.toUpperCase()} ${path} (${statusCode})`],
      };
    }

    const validate = this.ajv.compile(schema);
    const valid = validate(data);

    if (!valid && validate.errors) {
      return {
        valid: false,
        errors: validate.errors.map(err =>
          `${err.instancePath} ${err.message}: ${JSON.stringify(err.params)}`
        ),
      };
    }

    return { valid: true };
  }

  /**
   * Valida se um request body corresponde ao schema esperado
   */
  validateRequestBody(
    path: string,
    method: string,
    data: any
  ): { valid: boolean; errors?: string[] } {
    const schema = this.getRequestBodySchema(path, method);

    if (!schema) {
      return {
        valid: false,
        errors: [`Schema de request não encontrado para ${method.toUpperCase()} ${path}`],
      };
    }

    const validate = this.ajv.compile(schema);
    const valid = validate(data);

    if (!valid && validate.errors) {
      return {
        valid: false,
        errors: validate.errors.map(err =>
          `${err.instancePath} ${err.message}: ${JSON.stringify(err.params)}`
        ),
      };
    }

    return { valid: true };
  }

  /**
   * Obtém o schema de resposta do swagger
   */
  private getResponseSchema(path: string, method: string, statusCode: number): any {
    const pathItem = (swaggerSchema.paths as any)[path];
    if (!pathItem) return null;

    const operation = pathItem[method.toLowerCase()];
    if (!operation) return null;

    const response = operation.responses?.[statusCode.toString()];
    if (!response) return null;

    const content = response.content?.['application/json'];
    if (!content) return null;

    return this.resolveSchema(content.schema);
  }

  /**
   * Obtém o schema de request body do swagger
   */
  private getRequestBodySchema(path: string, method: string): any {
    const pathItem = (swaggerSchema.paths as any)[path];
    if (!pathItem) return null;

    const operation = pathItem[method.toLowerCase()];
    if (!operation) return null;

    const requestBody = operation.requestBody;
    if (!requestBody) return null;

    const content = requestBody.content?.['application/json'];
    if (!content) return null;

    return this.resolveSchema(content.schema);
  }

  /**
   * Resolve referências do schema
   */
  private resolveSchema(schema: any): any {
    if (!schema) return null;

    // Se é uma referência, busca o schema referenciado
    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/components/schemas/', '');
      const resolvedSchema = (swaggerSchema.components?.schemas as any)?.[refPath];
      return resolvedSchema || schema;
    }

    return schema;
  }

  /**
   * Lista todos os endpoints disponíveis
   */
  listEndpoints(): Array<{ path: string; method: string; summary?: string }> {
    const endpoints: Array<{ path: string; method: string; summary?: string }> = [];

    Object.entries(swaggerSchema.paths || {}).forEach(([path, pathItem]: [string, any]) => {
      ['get', 'post', 'put', 'delete', 'patch'].forEach(method => {
        if (pathItem[method]) {
          endpoints.push({
            path,
            method: method.toUpperCase(),
            summary: pathItem[method].summary,
          });
        }
      });
    });

    return endpoints;
  }
}

export const contractValidator = new ContractValidator();
