"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TruckIcon,
  DocumentArrowUpIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";

const averbacaoSchema = z.object({
  numeroContainer: z.string().min(11, "Número do container inválido").max(11),
  tipoContainer: z.enum(["20DC", "40DC", "40HC", "20RF", "40RF"]),
  valorMercadoria: z.string().min(1, "Valor da mercadoria é obrigatório"),
  moeda: z.enum(["USD", "EUR", "BRL"]),
  tipoMercadoria: z.string().min(1, "Tipo da mercadoria é obrigatório"),
  pesoBruto: z.string().min(1, "Peso bruto é obrigatório"),
  dataEmbarque: z.string().min(1, "Data de embarque é obrigatória"),
  portoOrigem: z.string().min(1, "Porto de origem é obrigatório"),
  portoDestino: z.string().min(1, "Porto de destino é obrigatório"),
  seguradora: z.string().min(1, "Seguradora é obrigatória"),
  numeroApolice: z.string().min(1, "Número da apólice é obrigatório"),
  valorSegurado: z.string().min(1, "Valor segurado é obrigatório"),
  documentos: z.array(z.instanceof(File)).min(1, "Pelo menos um documento é obrigatório")
});

type AverbacaoFormData = z.infer<typeof averbacaoSchema>;

type Averbacao = {
  id: number;
  containerId: number;
  container: {
    id: number;
    numero: string;
    tipo: string;
    status: string;
    data: string;
    origem: string;
    destino: string;
    valor: string;
  };
  tipoContainer: string;
  valorMercadoria: string;
  moeda: string;
  tipoMercadoria: string;
  pesoBruto: string;
  dataEmbarque: string;
  portoOrigem: string;
  portoDestino: string;
  seguradora: string;
  numeroApolice: string;
  valorSegurado: string;
  status: string;
  documentos: {
    id: number;
    url: string;
    nome: string;
  }[];
};

export default function AverbacaoManualPage() {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [averbacoes, setAverbacoes] = useState<Averbacao[]>([]);
  const [mounted, setMounted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<AverbacaoFormData>({
    resolver: zodResolver(averbacaoSchema),
    defaultValues: {
      tipoContainer: "20DC",
      moeda: "USD"
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    setValue("documentos", [...uploadedFiles, ...files]);
  };

  const onSubmit = async (data: AverbacaoFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'documentos' && Array.isArray(value)) {
          value.forEach((file: File) => {
            formData.append('documentos', file);
          });
        } else if (typeof value === 'string') {
          formData.append(key, value);
        }
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/averbacoes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao registrar averbação');
      }

      alert('Averbação registrada com sucesso!');
      // Recarregar a lista de averbações
      fetchAverbacoes();
    } catch (error) {
      console.error('Erro ao registrar averbação:', error);
      alert('Erro ao registrar averbação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchAverbacoes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/averbacoes`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Erro ao buscar averbações');
      }
      const data = await response.json();
      console.log('Dados carregados:', data);
      // Acessar a propriedade averbacoes do resultado
      const averbacoesArray = data.averbacoes || [];
      console.log('Averbações processadas:', averbacoesArray);
      setAverbacoes(averbacoesArray);
    } catch (error) {
      console.error('Erro ao carregar averbações:', error);
      setAverbacoes([]); // Em caso de erro, definir como array vazio
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session?.accessToken && mounted) {
      fetchAverbacoes();
    }
  }, [session, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6">
          {/* Filtros de Busca */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <FunnelIcon className="h-6 w-6 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Filtros de Busca</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número do Container
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="ABCD1234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número da Apólice
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="APL-2024-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Todos</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Em Análise">Em Análise</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Rejeitado">Rejeitado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Data
                  </label>
                  <input
                    type="date"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                  Buscar
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Averbações */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-medium text-gray-900">Averbações</h3>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nova Averbação
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Container
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Apólice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ABCD1234567
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        APL-2024-001
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Em Análise
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        2024-03-15
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        USD 500,000
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Detalhes
                        </button>
                      </td>
                    </tr>
                    {/* Adicione mais linhas conforme necessário */}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <TruckIcon className="h-6 w-6 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Informações do Container</h3>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número do Container
                  </label>
                  <input
                    type="text"
                    {...register("numeroContainer")}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm border ${
                      errors.numeroContainer ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="ABCD1234567"
                  />
                  {errors.numeroContainer && (
                    <p className="mt-1 text-sm text-red-600">{errors.numeroContainer.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tipo de Container
                  </label>
                  <select
                    {...register("tipoContainer")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="20DC">20' Dry Container</option>
                    <option value="40DC">40' Dry Container</option>
                    <option value="40HC">40' High Cube</option>
                    <option value="20RF">20' Reefer</option>
                    <option value="40RF">40' Reefer</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Informações da Mercadoria */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Informações da Mercadoria</h3>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Valor da Mercadoria
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <select
                      {...register("moeda")}
                      className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="BRL">BRL</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      {...register("valorMercadoria")}
                      className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm border ${
                        errors.valorMercadoria ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.valorMercadoria && (
                    <p className="mt-1 text-sm text-red-600">{errors.valorMercadoria.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tipo da Mercadoria
                  </label>
                  <input
                    type="text"
                    {...register("tipoMercadoria")}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm border ${
                      errors.tipoMercadoria ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.tipoMercadoria && (
                    <p className="mt-1 text-sm text-red-600">{errors.tipoMercadoria.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Peso Bruto (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("pesoBruto")}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm border ${
                      errors.pesoBruto ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.pesoBruto && (
                    <p className="mt-1 text-sm text-red-600">{errors.pesoBruto.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Informações do Transporte */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <CalendarIcon className="h-6 w-6 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Informações do Transporte</h3>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Data de Embarque
                  </label>
                  <input
                    type="date"
                    {...register("dataEmbarque")}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm border ${
                      errors.dataEmbarque ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.dataEmbarque && (
                    <p className="mt-1 text-sm text-red-600">{errors.dataEmbarque.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Porto de Origem
                  </label>
                  <input
                    type="text"
                    {...register("portoOrigem")}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm border ${
                      errors.portoOrigem ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.portoOrigem && (
                    <p className="mt-1 text-sm text-red-600">{errors.portoOrigem.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Porto de Destino
                  </label>
                  <input
                    type="text"
                    {...register("portoDestino")}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm border ${
                      errors.portoDestino ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.portoDestino && (
                    <p className="mt-1 text-sm text-red-600">{errors.portoDestino.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Informações do Seguro */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Informações do Seguro</h3>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Seguradora
                  </label>
                  <input
                    type="text"
                    {...register("seguradora")}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm border ${
                      errors.seguradora ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.seguradora && (
                    <p className="mt-1 text-sm text-red-600">{errors.seguradora.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número da Apólice
                  </label>
                  <input
                    type="text"
                    {...register("numeroApolice")}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm border ${
                      errors.numeroApolice ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.numeroApolice && (
                    <p className="mt-1 text-sm text-red-600">{errors.numeroApolice.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Valor Segurado
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("valorSegurado")}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm border ${
                      errors.valorSegurado ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.valorSegurado && (
                    <p className="mt-1 text-sm text-red-600">{errors.valorSegurado.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Upload de Documentos */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <DocumentArrowUpIcon className="h-6 w-6 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Upload de Documentos</h3>
              </div>
              <div className="mt-6">
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Upload de arquivos</span>
                        <input
                          id="file-upload"
                          type="file"
                          multiple
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">ou arraste e solte</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, JPG, PNG até 10MB
                    </p>
                  </div>
                </div>
                {errors.documentos && (
                  <p className="mt-2 text-sm text-red-600">{errors.documentos.message}</p>
                )}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900">Arquivos selecionados:</h4>
                    <ul className="mt-2 divide-y divide-gray-200">
                      {uploadedFiles.map((file, index) => (
                        <li key={index} className="py-2 flex items-center justify-between">
                          <span className="text-sm text-gray-500">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                              setValue("documentos", uploadedFiles.filter((_, i) => i !== index));
                            }}
                            className="text-sm text-red-600 hover:text-red-500"
                          >
                            Remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Registrando...' : 'Registrar Averbação'}
            </button>
          </div>
        </div>
        <div className="h-4" /> {/* Padding inferior */}
      </div>
    </div>
  );
} 