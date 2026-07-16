# Política de Segurança

Este repositório contém o site institucional da **Correa & Laia Advocacia**
(https://www.correaelaiaadvocacia.com) e o painel interno de leads.

## Como reportar uma vulnerabilidade

Envie um e-mail para **contato@correalaiadvocacia.com.br** com o assunto
`[Segurança]`, descrevendo:

- o que foi encontrado e onde (URL ou arquivo);
- os passos para reproduzir;
- o impacto que você acredita que a falha tenha.

**Por favor, não abra uma issue pública** para relatar falhas de segurança: as
issues deste repositório são visíveis a qualquer pessoa, e um relato aberto
expõe o problema antes que ele possa ser corrigido.

Este é o repositório de um escritório de advocacia pequeno, sem equipe de
segurança dedicada e sem programa de recompensas. Não garantimos prazo de
resposta, mas lemos todos os relatos e priorizamos o que afeta dados de
clientes.

## Escopo

Interessa o código deste repositório e o site publicado a partir dele — em
especial qualquer coisa que exponha dados de leads (nome, telefone, mensagens)
ou que permita acesso ao painel em `/dashboard`.

Serviços de terceiros usados pelo projeto (Vercel, Typebot, Google Tag Manager)
têm canais próprios de reporte e devem ser acionados diretamente.

## Versões suportadas

O projeto não é distribuído em versões: existe apenas o que está publicado em
produção, a partir da branch `main`. É nela que as correções são aplicadas.
