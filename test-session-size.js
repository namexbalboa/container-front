// Script temporário para testar o tamanho da sessão após otimizações
import { chromium } from 'playwright';

async function testSessionSize() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Ir para a página de login
        await page.goto('http://localhost:3000/login');
        
        // Fazer login
        await page.fill('input[placeholder="Email"]', 'admin@exemplo.com');
        await page.fill('input[placeholder="Senha"]', '123456');
        await page.click('button[type="submit"]');
        
        // Aguardar redirecionamento
        await page.waitForURL('**/dashboard');
        
        // Aguardar um pouco para a sessão ser estabelecida
        await page.waitForTimeout(2000);
        
        console.log('Login realizado com sucesso!');
        console.log('Verifique os logs do servidor para o novo tamanho da sessão.');
        
        // Manter o navegador aberto por 10 segundos
        await page.waitForTimeout(10000);
        
    } catch (error) {
        console.error('Erro durante o teste:', error);
    } finally {
        await browser.close();
    }
}

testSessionSize();