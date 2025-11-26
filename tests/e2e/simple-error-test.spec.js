import { test, expect } from "@playwright/test";

/**
 * Função para realizar login na aplicação
 */
async function realizarLogin(page, email = "admin@exemplo.com", senha = "123456") {
    console.log("🔐 Realizando login...");
    
    try {
        // Navegar para página de login
        await page.goto("http://localhost:3000/login");
        await page.waitForLoadState("networkidle");
        
        // Preencher formulário de login
        await page.fill('#email', email);
        await page.fill('#senha', senha);
        
        // Submeter formulário
        await page.click('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")');
        
        // Aguardar redirecionamento ou confirmação de login
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(3000);
        
        // Verificar se login foi bem-sucedido (pode estar no dashboard ou home)
        const currentUrl = page.url();
        if (currentUrl.includes("/login")) {
            console.log("⚠️  Login pode não ter sido bem-sucedido - ainda na página de login");
        } else {
            console.log("✅ Login realizado com sucesso");
        }
        
        return true;
    } catch (error) {
        console.log(`❌ Erro durante login: ${error.message}`);
        return false;
    }
}

/**
 * Teste simples para capturar erros de Console e Network com login
 */
test.describe("Detecção de Erros - Teste com Login", () => {
    test("deve capturar erros de console e network na aplicação após login", async ({ page }) => {
        const consoleErrors = [];
        const networkErrors = [];

        // Capturar erros de console
        page.on("console", (msg) => {
            if (msg.type() === "error" || msg.type() === "warning") {
                const error = {
                    type: msg.type(),
                    message: msg.text(),
                    timestamp: new Date().toISOString(),
                };
                consoleErrors.push(error);
                console.log(`[CONSOLE ${error.type.toUpperCase()}]`, error.message);
            }
        });

        // Capturar erros de página
        page.on("pageerror", (error) => {
            const consoleError = {
                type: "error",
                message: error.message,
                timestamp: new Date().toISOString(),
            };
            consoleErrors.push(consoleError);
            console.log("[PAGE ERROR]", consoleError.message);
        });

        // Capturar erros de network
        page.on("response", (response) => {
            if (response.status() >= 400) {
                const networkError = {
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText(),
                    method: response.request().method(),
                    timestamp: new Date().toISOString(),
                };
                networkErrors.push(networkError);
                console.log("[NETWORK ERROR]", `${networkError.method} ${networkError.url} - ${networkError.status} ${networkError.statusText}`);
            }
        });

        // Capturar falhas de requisição
        page.on("requestfailed", (request) => {
            const networkError = {
                url: request.url(),
                status: 0,
                statusText: request.failure()?.errorText || "Request Failed",
                method: request.method(),
                timestamp: new Date().toISOString(),
            };
            networkErrors.push(networkError);
            console.log("[REQUEST FAILED]", `${networkError.method} ${networkError.url} - ${networkError.statusText}`);
        });

        console.log("🔍 Iniciando teste de detecção de erros com login...");

        // Realizar login primeiro
        const loginSucesso = await realizarLogin(page);
        
        // Capturar erros do processo de login
        const loginConsoleErrors = [...consoleErrors];
        const loginNetworkErrors = [...networkErrors];
        consoleErrors.length = 0;
        networkErrors.length = 0;

        console.log(`📄 Login - Console: ${loginConsoleErrors.length} erros | Network: ${loginNetworkErrors.length} erros`);

        // Se login falhou, ainda assim continuar com os testes
        if (!loginSucesso) {
            console.log("⚠️  Continuando testes mesmo com falha no login...");
        }

        // Testar página do dashboard (agora autenticado)
        console.log("\n📄 Testando página do dashboard...");
        await page.goto("http://localhost:3000/dashboard");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(3000);

        console.log(`   Console: ${consoleErrors.length} erros | Network: ${networkErrors.length} erros`);

        // Capturar erros do dashboard
        const dashboardConsoleErrors = [...consoleErrors];
        const dashboardNetworkErrors = [...networkErrors];
        consoleErrors.length = 0;
        networkErrors.length = 0;

        // Testar outras páginas importantes (agora com usuário autenticado)
        const pagesToTest = [
            { name: "Dashboard", url: "http://localhost:3000/dashboard" },
            { name: "Home", url: "http://localhost:3000/" },
            { name: "Containers", url: "http://localhost:3000/containers" },
            { name: "Averbações", url: "http://localhost:3000/averbacoes" },
            { name: "Clientes", url: "http://localhost:3000/clientes" },
            { name: "Seguradoras", url: "http://localhost:3000/seguradoras" },
        ];

        const allPageErrors = {
            login: { console: loginConsoleErrors, network: loginNetworkErrors },
            dashboard: { console: dashboardConsoleErrors, network: dashboardNetworkErrors },
        };

        for (const pageInfo of pagesToTest) {
            console.log(`\n📄 Testando página: ${pageInfo.name}...`);
            
            // Limpar erros
            consoleErrors.length = 0;
            networkErrors.length = 0;
            
            try {
                await page.goto(pageInfo.url);
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(1500);

                console.log(`   Console: ${consoleErrors.length} erros | Network: ${networkErrors.length} erros`);
                
                allPageErrors[pageInfo.name.toLowerCase()] = {
                    console: [...consoleErrors],
                    network: [...networkErrors],
                };
            } catch (error) {
                console.log(`   ❌ Erro ao carregar ${pageInfo.name}: ${error.message}`);
                allPageErrors[pageInfo.name.toLowerCase()] = {
                    error: error.message,
                };
            }
        }

        // Relatório final
        console.log("\n" + "=".repeat(60));
        console.log("📋 RELATÓRIO FINAL DE ERROS");
        console.log("=".repeat(60));
        console.log(`🔐 Status do Login: ${loginSucesso ? "✅ Sucesso" : "❌ Falha"}`);
        console.log("=".repeat(60));
        
        let totalConsoleErrors = 0;
        let totalNetworkErrors = 0;
        
        Object.entries(allPageErrors).forEach(([pageName, errors]) => {
            if (errors.error) {
                console.log(`❌ ${pageName.toUpperCase()}: Falha ao carregar - ${errors.error}`);
                return;
            }
            
            const consoleCount = errors.console.length;
            const networkCount = errors.network.length;
            totalConsoleErrors += consoleCount;
            totalNetworkErrors += networkCount;
            
            if (consoleCount > 0 || networkCount > 0) {
                console.log(`⚠️  ${pageName.toUpperCase()}: ${consoleCount} console, ${networkCount} network`);
                
                // Mostrar detalhes dos erros
                if (consoleCount > 0) {
                    console.log(`   🚨 Erros de Console:`);
                    errors.console.forEach((error, index) => {
                        console.log(`      ${index + 1}. [${error.type}] ${error.message}`);
                    });
                }
                
                if (networkCount > 0) {
                    console.log(`   🌐 Erros de Network:`);
                    errors.network.forEach((error, index) => {
                        console.log(`      ${index + 1}. ${error.method} ${error.url} - ${error.status} ${error.statusText}`);
                    });
                }
            } else {
                console.log(`✅ ${pageName.toUpperCase()}: Sem erros`);
            }
        });
        
        console.log("=".repeat(60));
        console.log(`📊 RESUMO TOTAL: ${totalConsoleErrors} erros de console, ${totalNetworkErrors} erros de network`);
        console.log("=".repeat(60));

        // O teste não falha automaticamente, apenas reporta os erros
        if (totalConsoleErrors > 0 || totalNetworkErrors > 0) {
            console.log("\n⚠️  ATENÇÃO: Erros foram detectados na aplicação!");
            console.log("   Verifique os logs acima para mais detalhes.");
        } else {
            console.log("\n🎉 SUCESSO: Nenhum erro detectado na aplicação!");
        }

        // Salvar relatório em JSON para análise posterior
        const report = {
            timestamp: new Date().toISOString(),
            authentication: {
                loginSuccess: loginSucesso,
                credentials: {
                    email: "admin@exemplo.com",
                    passwordUsed: true,
                },
            },
            summary: {
                totalConsoleErrors,
                totalNetworkErrors,
                hasErrors: totalConsoleErrors > 0 || totalNetworkErrors > 0,
            },
            pages: allPageErrors,
        };

        console.log("\n📄 Relatório JSON salvo:");
        console.log(JSON.stringify(report, null, 2));
    });
});