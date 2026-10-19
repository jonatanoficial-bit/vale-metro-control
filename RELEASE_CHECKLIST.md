# Vale Metro Control — Checklist de lançamento

## Antes de publicar

- Execute `npm test` e `npm run check` sem falhas.
- Abra a aplicação por HTTP e faça um turno em cada cidade, incluindo uma ação de despacho, manutenção e encerramento de turno.
- Verifique a instalação PWA e a retomada offline depois da primeira abertura.
- Confirme os três modos de acessibilidade: alto contraste, redução de movimento e texto ampliado. Os sinais sonoros e a resposta tátil devem permanecer opcionais.

## Privacidade e dados

- O relatório operacional é salvo apenas no navegador do jogador, junto ao save local.
- Não há telemetria remota, conta obrigatória, rastreador ou envio de dados pessoais.
- A opção **Apagar relatório local** zera os indicadores de uso sem alterar saldo, carreira ou missões.

## Critérios de qualidade

- Carreira: as três cidades precisam iniciar, salvar e avançar de dia.
- Economia: o retorno de turno é ajustado ao perfil da cidade; o fundo de continuidade só pode ser usado uma vez por carreira e aparece no relatório de turno.
- Mobile: retrato e paisagem devem manter todos os comandos acionáveis, sem exigir rotação.
- Offline: os arquivos do aplicativo são atualizados pelo service worker versionado.

## Escopo desta versão

Este repositório entrega um simulador web/PWA autônomo. Publicação em uma loja, conta de desenvolvedor, classificação indicativa e ativos licenciados são etapas externas e exigem credenciais do responsável pelo projeto.
