import { test, expect, Page } from "@playwright/test";

interface ConsoleError {
    type: string;
    message: string;
    url?: string;
    lineNumber?: number;
    columnNumber?: number;
    timestamp: string;
}

interface NetworkError {
    url: string;
    status: number;
    statusText: string;
    method: string;
    timestamp: string;
    responseHeaders?: Record<string, string>;
    requestHeaders?: Record<string, string>;
}

class ErrorCollector {
    private consoleErrors: ConsoleError[] = [];
    private networkErrors: NetworkError[] = [];
    private page: Page;

    constructor(page: Page) {
        this.page = page;
        this.setupConsoleListener();
        this.setupNetworkListener();
    }

    private setupConsoleListener() {
        this.page.on("console", (msg) => {
            if (msg.type() === "error" || msg.type() === "warning") {
                const error: ConsoleError = {
                    type: msg.type(),
                    message: msg.text(),
                    timestamp: new Date().toISOString(),
                };

                // Tentar extrair informações de localização do erro
                const location = msg.location();
                if (location) {
                    error.url = location.url;
                    error.lineNumber = location.lineNumber;
                    error.columnNumber = location.columnNumber;
                }

                this.consoleErrors.push(error);
                console.log(`[CONSOLE ${error.type.toUpperCase()}]`, error);
            }
        });

        // Capturar erros JavaScript não tratados
        this.page.on("pageerror", (error) => {
            const consoleError: ConsoleError = {
                type: "error",
                message: error.message,
                timestamp: new Date().toISOString(),
            };
            this.consoleErrors.push(consoleError);
            console.log("[PAGE ERROR]", consoleError);
        });
    }

    private setupNetworkListener() {
        this.page.on("response", (response) => {
            // Capturar respostas com erro (4xx, 5xx)
            if (response.status() >= 400) {
                const networkError: NetworkError = {
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText(),
                    method: response.request().method(),
                    timestamp: new Date().toISOString(),
                };

                // Adicionar headers se disponíveis
                try {
                    networkError.responseHeaders = response.headers();
                    networkError.requestHeaders = response.request().headers();
                } catch (e) {
                    // Headers podem não estar disponíveis em alguns casos
                }

                this.networkErrors.push(networkError);
                console.log("[NETWORK ERROR]", networkError);
            }
        });

        // Capturar falhas de requisição
        this.page.on("requestfailed", (request) => {
            const networkError: NetworkError = {
                url: request.url(),
                status: 0,
                statusText: request.failure()?.errorText || "Request Failed",
                method: request.method(),
                timestamp: new Date().toISOString(),
                requestHeaders: request.headers(),
            };

            this.networkErrors.push(networkError);
            console.log("[REQUEST FAILED]", networkError);
        });
    }

    getConsoleErrors(): ConsoleError[] {
        return [...this.consoleErrors];
    }

    getNetworkErrors(): NetworkError[] {
        return [...this.networkErrors];
    }

    getAllErrors() {
        return {
            console: this.getConsoleErrors(),
            network: this.getNetworkErrors(),
            summary: {
                totalConsoleErrors: this.consoleErrors.length,
                totalNetworkErrors: this.networkErrors.length,
                hasErrors: this.consoleErrors.length > 0 || this.networkErrors.length > 0,
            },
        };
    }

    clearErrors() {
        this.consoleErrors = [];
        this.networkErrors = [];
    }
}

test.describe("Detecção de Erros - Dashboard", () => {
    let errorCollector: ErrorCollector;

    test.beforeEach(async ({ page }) => {
        errorCollector = new ErrorCollector(page);
    });

    test("deve detectar erros na página de login", async ({ page }) => {
        console.log("🔍 Testando página de login...");
        
        await page.goto("/login");
        await page.waitForLoadState("networkidle");
        
        // Aguardar um pouco para capturar erros assíncronos
        await page.waitForTimeout(2000);

        const errors = errorCollector.getAllErrors();
        
        console.log("📊 Resumo de erros na página de login:");
        console.log(`- Console: ${errors.summary.totalConsoleErrors} erros`);
        console.log(`- Network: ${errors.summary.totalNetworkErrors} erros`);
        
        if (errors.console.length > 0) {
            console.log("\n🚨 Erros de Console:");
            errors.console.forEach((error, index) => {
                console.log(`${index + 1}. [${error.type}] ${error.message}`);
                if (error.url) console.log(`   📍 ${error.url}:${error.lineNumber}:${error.columnNumber}`);
            });
        }

        if (errors.network.length > 0) {
            console.log("\n🌐 Erros de Network:");
            errors.network.forEach((error, index) => {
                console.log(`${index + 1}. ${error.method} ${error.url} - ${error.status} ${error.statusText}`);
            });
        }

        // O teste não falha automaticamente, apenas reporta os erros
        if (errors.summary.hasErrors) {
            console.log("\n⚠️  Erros detectados na página de login");
        } else {
            console.log("\n✅ Nenhum erro detectado na página de login");
        }
    });

    test("deve detectar erros na página do dashboard", async ({ page }) => {
        console.log("🔍 Testando página do dashboard...");
        
        // Simular login (assumindo que existe uma rota direta ou mock)
        await page.goto("/dashboard");
        await page.waitForLoadState("networkidle");
        
        // Aguardar carregamento de componentes assíncronos
        await page.waitForTimeout(5000);

        const errors = errorCollector.getAllErrors();
        
        console.log("📊 Resumo de erros na página do dashboard:");
        console.log(`- Console: ${errors.summary.totalConsoleErrors} erros`);
        console.log(`- Network: ${errors.summary.totalNetworkErrors} erros`);
        
        if (errors.console.length > 0) {
            console.log("\n🚨 Erros de Console:");
            errors.console.forEach((error, index) => {
                console.log(`${index + 1}. [${error.type}] ${error.message}`);
                if (error.url) console.log(`   📍 ${error.url}:${error.lineNumber}:${error.columnNumber}`);
            });
        }

        if (errors.network.length > 0) {
            console.log("\n🌐 Erros de Network:");
            errors.network.forEach((error, index) => {
                console.log(`${index + 1}. ${error.method} ${error.url} - ${error.status} ${error.statusText}`);
            });
        }

        if (errors.summary.hasErrors) {
            console.log("\n⚠️  Erros detectados na página do dashboard");
        } else {
            console.log("\n✅ Nenhum erro detectado na página do dashboard");
        }
    });

    test("deve testar navegação e detectar erros em múltiplas páginas", async ({ page }) => {
        console.log("🔍 Testando navegação entre páginas...");
        
        const pagesToTest = [
            { name: "Home", url: "/" },
            { name: "Login", url: "/login" },
            { name: "Dashboard", url: "/dashboard" },
            { name: "Containers", url: "/containers" },
            { name: "Averbações", url: "/averbacoes" },
            { name: "Clientes", url: "/clientes" },
            { name: "Seguradoras", url: "/seguradoras" },
        ];

        const pageErrors: Record<string, any> = {};

        for (const pageInfo of pagesToTest) {
            console.log(`\n📄 Testando página: ${pageInfo.name} (${pageInfo.url})`);
            
            errorCollector.clearErrors();
            
            try {
                await page.goto(pageInfo.url);
                await page.waitForLoadState("networkidle");
                await page.waitForTimeout(3000);

                const errors = errorCollector.getAllErrors();
                pageErrors[pageInfo.name] = errors;

                console.log(`   Console: ${errors.summary.totalConsoleErrors} | Network: ${errors.summary.totalNetworkErrors}`);
                
                if (errors.summary.hasErrors) {
                    console.log(`   ⚠️  Erros detectados em ${pageInfo.name}`);
                } else {
                    console.log(`   ✅ ${pageInfo.name} sem erros`);
                }
            } catch (error) {
                console.log(`   ❌ Erro ao carregar ${pageInfo.name}: ${error}`);
                pageErrors[pageInfo.name] = { error: String(error) };
            }
        }

        // Relatório final
        console.log("\n📋 RELATÓRIO FINAL DE ERROS:");
        console.log("=" .repeat(50));
        
        let totalConsoleErrors = 0;
        let totalNetworkErrors = 0;
        
        Object.entries(pageErrors).forEach(([pageName, errors]) => {
            if (errors.error) {
                console.log(`❌ ${pageName}: Falha ao carregar`);
                return;
            }
            
            const { summary } = errors;
            totalConsoleErrors += summary.totalConsoleErrors;
            totalNetworkErrors += summary.totalNetworkErrors;
            
            if (summary.hasErrors) {
                console.log(`⚠️  ${pageName}: ${summary.totalConsoleErrors} console, ${summary.totalNetworkErrors} network`);
            } else {
                console.log(`✅ ${pageName}: Sem erros`);
            }
        });
        
        console.log("=" .repeat(50));
        console.log(`📊 TOTAL: ${totalConsoleErrors} erros de console, ${totalNetworkErrors} erros de network`);
        
        // Salvar relatório detalhado em arquivo JSON
        await page.evaluate((report) => {
            console.log("DETAILED_ERROR_REPORT:", JSON.stringify(report, null, 2));
        }, pageErrors);
    });
});