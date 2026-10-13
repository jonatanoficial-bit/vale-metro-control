# Vale Metro Control

Protótipo jogável do simulador operacional de metrôs **Vale Metro Control**. Esta base inicia a primeira das três entregas definidas para o projeto: uma rede pequena, viva e controlável no navegador.

## O que já funciona neste build

- Mapa 2D renderizado em canvas com cinco estações e trens selecionáveis.
- Simulação determinística de movimento, capacidade, embarque, filas e receita.
- Pausa e velocidades 1×, 2× e 4×.
- Ordem validada de retenção/liberação de trem e despacho de reserva com custo real.
- Alerta dinâmico de lotação, registro de eventos e tutorial inicial por objetivos.
- Pontualidade, fila crítica, saldo e XP calculados a partir do estado da sessão.
- Salvamento local com IndexedDB e fallback de navegador.
- Interface responsiva para desktop e orientação horizontal em celular.

## Executar localmente

O projeto é estático: basta servi-lo por HTTP. Por exemplo, com Python 3:

```bash
python -m http.server 4173
```

Depois abra `http://localhost:4173`.

## Verificação

```bash
npm test
npm run check
```

## Plano do produto

O projeto tem exatamente três entregas principais:

1. **Núcleo jogável e identidade AAA** — a entrega em andamento: rede inicial, operações, carreira e sandbox básicos, saves e testes.
2. **Sistemas profundos, cidades e emergências** — expansão, frota, equipes, economia, cenários, cidades e carreira completa.
3. **Polimento, desempenho e lançamento** — acessibilidade refinada, áudio, balanceamento, PWA, testes de longa duração e preparação de lançamento.

As imagens conceituais são empregadas apenas como identidade e ambientação. A operação no mapa é produzida pela simulação do jogo.
