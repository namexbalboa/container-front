"use client";

import { useState } from "react";
import { XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface DeleteConfirmationModalProps {
  empresa: {
    idCliente: number;
    razaoSocial: string;
  } | null;
  onClose: () => void;
  onConfirm: (idCliente: number) => Promise<void>;
}

export function DeleteConfirmationModal({
  empresa,
  onClose,
  onConfirm,
}: DeleteConfirmationModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  if (!empresa) return null;

  // Extrair o primeiro nome da razão social
  const primeiroNome = empresa.razaoSocial.split(" ")[0];

  const isConfirmValid = confirmText.trim().toLowerCase() === primeiroNome.toLowerCase();

  const handleConfirm = async () => {
    if (!isConfirmValid) return;

    try {
      setLoading(true);
      await onConfirm(empresa.idCliente);
      onClose();
    } catch (error) {
      // O erro já é tratado no componente pai
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Confirmar Exclusão
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todos os dados
              relacionados a esta empresa serão permanentemente excluídos.
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-700 mb-2">
              Você está prestes a excluir a empresa:
            </p>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="font-medium text-gray-900">{empresa.razaoSocial}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Para confirmar, digite <span className="font-bold text-red-600">{primeiroNome}</span> abaixo:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={loading}
              placeholder={`Digite "${primeiroNome}"`}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-100"
              autoFocus
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isConfirmValid || loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Excluindo..." : "Excluir Empresa"}
          </button>
        </div>
      </div>
    </div>
  );
}
