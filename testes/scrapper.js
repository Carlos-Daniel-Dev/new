const puppeteer = require('puppeteer');

async function extrairDados() {
    const browser = await puppeteer.launch({
        headless: false, // false se quiser ver o navegador abrindo
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Navegar para a página
        await page.goto('http://192.168.12.34:3000/d/vtCqU2RMzn/dash-confresa?orgId=1&refresh=30s', {
            waitUntil: 'networkidle2', // Espera a página carregar completamente
            timeout: 30000
        });

        // Aguardar os elementos aparecerem na página
        await page.waitForSelector('div.panel-wrapper', { timeout: 10000 });

        // Executar o código de extração
        const resultado = await page.evaluate(() => {
            const contagem = document.querySelectorAll('div.panel-wrapper');
            
            if (!contagem[5]) {
                return { erro: 'Elemento contagem[5] não encontrado' };
            }
            
            const spans = contagem[5].querySelectorAll('span');
            
            if (!spans[1]) {
                return { erro: 'Span[1] não encontrado' };
            }
            
            return {
                valor: spans[1].textContent,
                timestamp: new Date().toISOString()
            };
        });

        console.log('Dados extraídos:', resultado);
        return resultado;

    } catch (error) {
        console.error('Erro ao extrair dados:', error);
        return { erro: error.message };
    } finally {
        await browser.close();
    }
}

// Função para executar periodicamente
async function monitorar(intervalo = 30000) { // 30 segundos por padrão
    console.log('Iniciando monitoramento...');
    
    // Executar uma vez imediatamente
    await extrairDados();
    
    // Depois executar a cada intervalo
    setInterval(async () => {
        await extrairDados();
    }, intervalo);
}

// Executar uma única vez
// extrairDados();

// Ou monitorar continuamente (descomente a linha abaixo)
// monitorar(30000); // a cada 30 segundos

module.exports = { extrairDados, monitorar };