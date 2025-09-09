const puppeteer = require('puppeteer');
const path = require('path');
const player = require('play-sound')();

let tocando = null; // guarda o processo do player

// Função para tocar o áudio
function tocarAudio() {
    if (tocando) return; // já está tocando, não inicia outro
    const audioPath = path.join(__dirname, 'audio.mp3');

    tocando = player.play(audioPath, (err) => {
        if (err) console.log('⚠️ Erro ao tentar reproduzir o áudio:', err.message);
        tocando = null; // libera quando terminar
    });

    console.log('🔊 Áudio de alerta iniciado.');
}

// Função para parar o áudio
function pararAudio() {
    if (tocando && tocando.kill) {
        tocando.kill();
        tocando = null;
        console.log('🔇 Áudio de alerta interrompido.');
    }
}

async function monitorar() {
    console.log('🚀 Iniciando monitoramento...');
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('Navegando para a página...');
        await page.goto('http://192.168.12.34:3000/d/vtCqU2RMzn/dash-confresa?orgId=1&refresh=30s', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        console.log('Aguardando 15 segundos...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        while (true) {
            try {
                console.log('\n=== Verificação:', new Date().toLocaleString(), '===');
                
                const resultado = await page.evaluate(() => {
                    const contagem = document.querySelectorAll('div.panel-wrapper');
                    
                    if (!contagem[5]) {
                        return { erro: `Painel 5 não encontrado. Total: ${contagem.length}` };
                    }
                    
                    const spans = contagem[5].querySelectorAll('span');
                    
                    if (!spans[1]) {
                        return { erro: `Span[1] não encontrado. Total spans: ${spans.length}` };
                    }
                    
                    return {
                        sucesso: true,
                        valor: spans[1].textContent.trim()
                    };
                });
                
                if (resultado.sucesso) {
                    const valorNumerico = parseFloat(resultado.valor);
                    
                    console.log('📊 Ping atual:', resultado.valor + 'ms');
                    
                    if (!isNaN(valorNumerico)) {
                        if (valorNumerico > 70) {
                            console.log('🚨 PING MUITO ALTO! TOCANDO ALERTA!');
                            tocarAudio();
                        } else {
                            pararAudio(); // se normalizou, corta o som
                            if (valorNumerico >= 40 && valorNumerico <= 65) {
                                console.log('⚠️  Ping aceitável (' + resultado.valor + 'ms)');
                            } else if (valorNumerico < 40) {
                                console.log('✅ PING ESTÁ BOM! (' + resultado.valor + 'ms)');
                            } else if (valorNumerico > 65 && valorNumerico <= 70) {
                                console.log('🟠 Ping alto (' + resultado.valor + 'ms)');
                            }
                        }
                    } else {
                        console.log('⚠️  Valor não é numérico:', resultado.valor);
                    }
                } else {
                    console.log('❌', resultado.erro);
                }
                
            } catch (error) {
                console.error('❌ Erro:', error.message);
            }
            
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

console.log('🚀 Iniciando monitoramento de PING...');
console.log('📊 Configurações:');
console.log('   🟢 < 40ms: Ping BOM');
console.log('   🟡 40-65ms: Ping ACEITÁVEL'); 
console.log('   🟠 66-70ms: Ping ALTO');
console.log('   🔴 > 70ms: Ping MUITO ALTO (com áudio)');
console.log('   📁 Áudio: audio.mp3');
console.log('-----------------------------------');

monitorar();
