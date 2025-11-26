#!/bin/bash

# Script para converter todos os arquivos para UTF-8
# Uso: bash scripts/fix-encoding.sh

echo "🔍 Procurando arquivos com encoding incorreto..."

# Encontra todos os arquivos TypeScript/JavaScript não UTF-8
FILES=$(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec file {} \; | grep -E "ISO-8859|Non-ISO" | cut -d: -f1)

if [ -z "$FILES" ]; then
    echo "✅ Todos os arquivos já estão em UTF-8!"
    exit 0
fi

echo "📝 Arquivos encontrados com encoding incorreto:"
echo "$FILES"
echo ""

# Converte cada arquivo
echo "$FILES" | while read -r file; do
    echo "🔄 Convertendo: $file"
    iconv -f ISO-8859-1 -t UTF-8 "$file" > "$file.tmp" && mv "$file.tmp" "$file"

    if [ $? -eq 0 ]; then
        echo "✅ Convertido: $file"
    else
        echo "❌ Erro ao converter: $file"
    fi
done

echo ""
echo "✨ Conversão concluída!"
