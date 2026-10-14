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

## Entrega integrada — Fases 2, 3 e 4

Esta versão reúne o pedido de acelerar as próximas fases em uma entrega funcional:

1. **Fase 2 — cidades e economia:** seleção de cidade, redes com características próprias e caixa de carreira separado.
2. **Fase 3 — decisão operacional:** manutenção, falha de sinal, orientação de passageiros, trem reserva e expansão urbana orçada.
3. **Fase 4 — ciclo de carreira:** fechamento de turno, nota, recompensa, XP, reputação, avanço de dia, salvamento local e testes do motor.

Evoluções futuras podem ampliar o conteúdo com novas linhas por cidade, equipes, frota, políticas, áudio, acessibilidade avançada, PWA e uma campanha de longo prazo.

As imagens conceituais são empregadas apenas como identidade e ambientação. A operação no mapa é produzida pela simulação do jogo.
