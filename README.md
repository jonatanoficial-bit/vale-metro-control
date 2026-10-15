# Vale Metro Control

Vertical slice jogável do simulador operacional de metrôs **Vale Metro Control**. O foco desta versão é transformar a operação em uma carreira: escolher uma cidade, administrar uma rede com parâmetros próprios, responder às ocorrências e avançar seus dias de trabalho.

## O que já funciona neste build

- Mapa 2D renderizado em canvas com cinco estações e trens selecionáveis.
- Simulação determinística de movimento, capacidade, embarque, filas e receita.
- Pausa e velocidades 1×, 2× e 4×.
- Ordem validada de retenção/liberação de trem e despacho de reserva com custo real.
- Ocorrência leve de porta com manutenção, custo, tempo de resposta e consequências no turno.
- Emergência de sinal no corredor Central–Riverside, com bloqueio visual e operacional do trecho, isolamento técnico e direcionamento de passageiros.
- Projeto urbano de expansão das plataformas de Riverside, com aprovação orçamentária, cronograma de obra e ganho permanente de capacidade.
- Seleção de carreira entre **Vale Central**, **Porto Dourado** e **Serra Clara**; cada cidade altera nomes, linha, corredor, caixa inicial, demanda, capacidade e pressão das filas.
- Perfil de carreira salvo por cidade, com dia, saldo, reputação, XP e total de turnos concluídos.
- Turno de carreira com duração mínima, avaliação operacional, nota, recompensa, XP e relatório de encerramento antes do próximo dia.
- Linha complementar ativável por turno, com VM-201 em rota expressa própria e impacto na avaliação estratégica.
- Condição individual da frota, desgaste operacional e manutenção preventiva com janela de serviço, custo e retorno de condição.
- Conselho metropolitano com reforço de pico, energia eficiente e tarifa social; cada política altera custo, receita, demanda ou reputação e as escolhas permanentes seguem na carreira.
- Campanha municipal por cidade, com três cenários rotativos, pressão de demanda localizada, contratos verificáveis e recompensas que avançam a carreira.
- Equipes de estação mobilizáveis, com custo, redução imediata de fila e efeito temporário sobre a demanda local.
- Preferências de acessibilidade persistentes: alto contraste, redução de movimento, texto ampliado e sinais sonoros opcionais.
- Manifesto PWA e cache de aplicativo para instalação e uso offline após a primeira abertura.
- Interface mobile sem bloqueio por orientação: carreira, sandbox, mapa e comandos funcionam em retrato e paisagem.
- Mapa esquemático metropolitano original, com malha colorida, ramais, intercâmbios, estações de contexto e trens orientados pelo traçado da linha ativa.
- Ritmo de simulação reequilibrado: 1× corresponde a um segundo de simulação por segundo real; 2× e 4× aceleram a operação de modo previsível.
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

## Plano de lotes — 9 no total

1. **Lote 1 — núcleo operacional:** mapa, trens, filas, tempo e comandos básicos. Entregue.
2. **Lote 2 — cidades e economia:** escolha de cidade, caixa e rede próprias. Entregue.
3. **Lote 3 — incidentes e expansão:** manutenção corretiva, sinal, passageiros e obra urbana. Entregue.
4. **Lote 4 — ciclo de carreira:** nota, recompensas, avanço de dia e persistência. Entregue.
5. **Lote 5 — rede ampliada:** linha complementar ativável e nova rota expressa. Entregue.
6. **Lote 6 — gestão de frota:** condição, desgaste e manutenção preventiva. Entregue.
7. **Lote 7 — políticas urbanas:** pico, energia e tarifa com consequências na operação. Entregue.
8. **Lote 8 — campanha e conteúdo:** cenários por cidade, equipes, contratos e objetivos de longo prazo. Entregue.
9. **Lote 9 — acabamento e lançamento:** acessibilidade refinada, áudio, balanceamento, PWA, desempenho e preparação de lançamento. Entregue.

Os **9 de 9 lotes** previstos foram concluídos neste escopo.

As imagens conceituais são empregadas apenas como identidade e ambientação. A operação no mapa é produzida pela simulação do jogo.
