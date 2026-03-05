---
name: create-composable
description: Cria composable tipado e reutilizável com padrão do projeto
argument-hint: "Informe nome do composable e responsabilidade"
agent: agent
---

Implemente um composable para este projeto seguindo:

- [Copilot Instructions](../copilot-instructions.md)
- [Composables Standards](../instructions/composables.instructions.md)
- [TypeScript Rules](../instructions/typescript.instructions.md)
- [Directus SDK Rules](../instructions/directus-sdk.instructions.md)

Checklist obrigatório:

- Nome com prefixo `use`
- Tipagem estrita e sem `any`
- DRY (reutilizar composables existentes)
- Estado `loading`/`error` quando houver async
- Usar cliente Directus correto (`useDirectusClient` ou `useAuth().getAuthClient`)
- Entregar sem erro de lint/typecheck

Contexto do pedido:
${input:task:Descreva o composable desejado}
