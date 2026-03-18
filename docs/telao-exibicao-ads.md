# Estratégia de Exibição do Telão de Anúncios (Novenário)

Este documento explica as decisões técnicas por trás da ordem de exibição dos anúncios no letreiro digital (Telão) da Capela São José.

## O Desafio
O objetivo do telão é entregar visualizações **justas e igualitárias** para todos os anunciantes, garantindo que nenhum patrocinador tenha vantagem (ex: aparecendo muito mais vezes que os outros).

## A Solução Final: Embaralhamento Contínuo (Shuffle)
A estratégia que escolhemos foi a **Opção 3**: Embaralhamento (Shuffle) Contínuo na camada de visualização (Front-end).

### Como funciona?
1. **Carga Inicial:** A aplicação consulta a API e carrega a lista mestre (Master Playlist) dos anúncios aprovados.
2. **Setup da Playlist:** Antes de começar a rodar, ela clona essa lista e **embaralha todas as posições** aleatoriamente.
3. **Exibição Ponderada:** Os anúncios começam a passar na tela (index 0 até o final), um a um. Isso garante matematicamente que *todo anunciante aparecerá exatamente 1 vez por ciclo completo*.
4. **Reciclagem Infinita:** Quando o último anúncio termina, o sistema:
   - Recarrega a base (se houver cache atualizado).
   - Embaralha *tudo* de novo para a próxima rodada no telão.
   - Aplica uma trava anti-repetição: Se o primeiro anúncio sorteado na *nova lista* for igual ao último que *acabou* de sair de cena, ele inverte a posição com o segundo colocado, para que não haja repetição consecutiva para quem está olhando a tela.

### Sensação para o público
Quem assiste não consegue perceber um padrão repetitivo rígido ("Ah, depois da Loja A sempre vem a Padaria B"), criando um visual dinâmico e sempre renovado para o painel de LED, enquanto mantém a garantia estatística de exibições justas.

---

## Por que a API ainda ordena por `-date_created`?
Apesar da apresentação final (no frontend do telão) embaralhar cegamente a ordem, nós alteramos a instrução de `/server/api/ads-novenario.ts` para buscar no banco de dados (Directus) os registros ordenados por data de criação (`sort: ['-date_created']`), ao invés da ordenação manual (`sort: ['sort']`).

Isso foi mantido por **três vantagens sistêmicas**:

### 1. Previsibilidade do Payload e Inspeção (Debug)
Se um suporte técnico precisar verificar a resposta JSON crua da API pela aba Network do navegador, os anunciantes que entraram mais recentemente no sistema sempre estarão no topo da lista. Isso facilita validar se o "anúncio que acabou de ser pago" já caiu no sistema e está habilitado para rodar no próximo ciclo.

### 2. Controle de Sobrecarga (Edge Cases de Memória/Rede)
Se, futuramente, a Capela atingir milhares de anunciantes e a carga simultânea de vídeos explodir a memória do totem do telão, será necessário aplicar um limite estrito na API (ex: `limit: 50`).
Ao preestabelecermos a ordenação por `-date_created`, a API passaria a servir apenas os "X anúncios mais recentes" daquele ciclo, protegendo o sistema contra interrupções totais. Sem essa ordenação temporal atrelada, a API poderia cortar os anúncios recentes (e válidos) a favor de registros bem antigos por conta do ID ou do index numérico.

### 3. Falha de Sistema (Graceful Fallback)
Toda comunicação visual offline carrega seu backup no `localStorage`.
Se o componente de embaralhamento aleatório (o método de Shuffle no Vue.js) sofrer uma quebra catastrófica de Javascript por qualquer bug inesperado no navegador integrado da SmartTV/Totem, o software consegue continuar exibindo a lista crua de fallback como foi cacheada pelo Directus.
Caso isso ocorra, os anunciantes que terão o privilégio do topo dessa lista reserva serão justamente aqueles com inserção mais recente (os que mais importam para faturamentos nas últimas horas), e não uma ordem alfabética ou arbitrária antiga.
