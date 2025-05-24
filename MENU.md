# Menu Lateral – Análise e Implementação com Vuetify 3.8

## 1. Comportamento Responsivo do Menu

&#x20;**Menu lateral em tela grande (colapsado em ícones):** No site , o menu de categorias aparece como uma barra lateral vertical. Em telas desktop largas, ele é apresentado inicialmente de forma **colapsada**, exibindo apenas ícones para cada categoria, sem os rótulos de texto. Essa barra de ícones fica fixa na lateral (comportamento *sticky*), mantendo-se visível mesmo ao rolar a página. Cada ícone representa uma categoria do mercado (por exemplo, um ícone de cenoura para "Vegetables & Fruits", peixe para "Seafood", etc.), permitindo que o usuário identifique as seções visualmente. Essa forma compacta economiza espaço na tela e mantém o menu sempre acessível.

&#x20;**Menu expandido e transição para off-canvas:** Quando o usuário interage com a barra lateral (por hover ou clique no botão de menu no topo da barra de ícones), o menu **expande-se em um painel lateral** mostrando os nomes completos das categorias. Observa-se uma animação suave de deslize (off-canvas) ao aparecer esse painel, e o restante da página é escurecido em segundo plano (overlay) para dar foco ao menu. No estado expandido, a primeira linha do menu mostra um cabeçalho verde rotulado "Menu" com o ícone de “hambúrguer” à esquerda, indicando que aquele painel corresponde à navegação de menu (no caso, as categorias de produtos). A lista completa de categorias é então exibida verticalmente com seus ícones e textos correspondentes, como “Vegetables & Fruits”, “Vegan Meat”, “Seafood”, “Dairy”, etc., cada item possivelmente clicável para navegar ou revelar subcategorias.

* **Breakpoint de colapso/conversão:** Há um ponto de corte específico em que o comportamento do menu muda. Pelas informações do tema, a transição para o modo móvel (menu hamburger) acontece em torno de **1024px** de largura. Ou seja, abaixo dessa largura o menu lateral deixa de ser visível fixamente na interface e é convertido em um menu móvel (drawer) que aparece/disaparece sob comando do usuário. Em tamanhos acima de \~1024px, o menu de categorias permanece acessível na lateral (no formato de barra de ícones ou painel expandido). Já em telas menores (tablets em modo retrato e celulares), a barra lateral de ícones é ocultada e as categorias passam a integrar o menu móvel geral do site. Por exemplo, no tema Woodmart, ao clicar no botão **“All Categories”** ou no ícone de menu em dispositivos móveis, abre-se um menu off-canvas ocupando a tela toda listando as categorias de produto. Nesse menu móvel, o usuário pode tocar em uma categoria principal para ver suas subcategorias em um segundo nível (com um efeito de *drill-down* onde a lista de categorias dá lugar à lista de subitens e um botão “Back” para voltar). Em resumo, o menu lateral se comporta de forma adaptativa: **fixo/colapsado no desktop** e **off-canvas no mobile**, garantindo acesso fácil em qualquer resolução.

## 2. Animações, Ícones e Acessibilidade

* **Transições e Animações:** O menu lateral do Woodmart utiliza animações sutis para melhorar a experiência. A expansão do menu (ao passar de ícones para o painel aberto) ocorre com uma transição suave de deslizar a partir da lateral, em vez de aparecer abruptamente. Isso fica evidente na forma “fluida” como se navega das categorias principais para subcategorias – ao selecionar uma categoria no menu móvel, a interface faz a transição para a lista de subitens de forma elegante (provavelmente com um deslize horizontal ou fade). Quando o menu off-canvas é fechado, ele recolhe com a mesma fluidez. Esses efeitos de transição ajudam o usuário a entender o que está acontecendo (qual menu está entrando ou saindo) sem se perder.

* **Ícones e Indicadores Visuais:** O sistema de ícones é um componente importante desse menu. Cada categoria tem um ícone ilustrativo ao lado do nome (como visto na barra colapsada de ícones). Pelo estilo do tema, esses ícones parecem ser gráficos SVG ou uma fonte de ícones personalizada do Woodmart – são ícones lineares simples, alinhados à esquerda de cada item de menu. Além dos ícones de categoria, o menu utiliza setas/indicadores para denotar hierarquia: por exemplo, uma categoria com subcategorias pode mostrar uma **seta** ou **chevron** indicando que é expansível. No Woodmart, essas setas são implementadas como ícones (possivelmente SVGs inline ou pequenas imagens). De fato, o código HTML do tema revela uso de imagens para ícones de seta, por exemplo um ícone de *chevron-down* para indicar conteúdo expansível. No menu móvel, ao entrar em uma subcategoria, um botão “Back” aparece no topo da lista de itens – esse botão vem acompanhado de uma seta para esquerda (indicando voltar), ou às vezes apenas a palavra “Back” com essa função. O ícone de “hambúrguer” (três linhas) é utilizado tanto no cabeçalho verde do menu expandido no desktop quanto no botão “All Categories” do cabeçalho principal, reforçando o entendimento de que aquele botão abre a navegação de categorias.

* **Acessibilidade:** O menu lateral demonstra preocupação com acessibilidade em alguns aspectos. Por ser construído em HTML semântico (listas de navegação), ele provavelmente utiliza uma marcação de lista dentro de um elemento `<nav>` ou `<aside>` com ARIA roles apropriados (por exemplo, `role="navigation"` para o container do menu). Os itens do menu são links que podem ser navegados via teclado – espera-se que, ao abrir o menu (especialmente no modo móvel off-canvas), o foco de teclado seja movido para o primeiro item do menu para que usuários de teclado ou leitores de tela possam interagir imediatamente. O overlay escurecido que surge ao abrir o menu não só destaca visualmente o menu mas também serve para **travar o foco** dentro do menu aberto (o clique nesse fundo ou a tecla Esc normalmente fecham o menu). Em relação a contrastes, o design utiliza fundo branco para o menu com texto em preto ou cinza escuro, garantindo boa legibilidade. No cabeçalho verde do menu, o texto “Menu” e o ícone de hambúrguer estão em branco sobre verde, também com contraste adequado. Estados de foco/hover são visíveis: ao passar o mouse sobre um item (ou focá-lo via teclado), provavelmente o item muda de cor de fundo ou exibe um destaque indicando qual item está selecionado. Quanto às setas de expandir/voltar, elas devem ter rótulos acessíveis (por exemplo, o botão “Back” deve ter `aria-label="Voltar"` caso seja só um ícone). Embora não tenhamos todo o código, é esperado que o tema siga boas práticas, como não depender apenas de cor para indicar estado ativo, ter tamanhos de fonte legíveis e áreas clicáveis adequadas. Resumindo, o menu lateral combina recursos visuais (animações e ícones) com práticas de acessibilidade (HTML semântico, foco gerenciado e contraste) para atender a diversos usuários.

## 3. Estrutura HTML e CSS do Menu

* **HTML e Hierarquia:** A estrutura do menu lateral é baseada em listas hierárquicas. No HTML, deve existir um contêiner para o menu – possivelmente uma `<nav class="woodmart-categories-menu">` ou similar – contendo um `<ul>` para as categorias de topo. Cada categoria principal é um `<li>` dentro dessa lista, geralmente com a classe indicativa de ter submenu, por exemplo `.menu-item-has-children` se há subcategorias. Dentro de cada `<li>`, há um link `<a>` para a categoria (ou um botão, dependendo do comportamento). Se a categoria tem subníveis, um segundo `<ul class="sub-menu">` aninhado conterá os `<li>` de subcategorias. Essa estrutura em árvore permite tanto exibir em modo accordion no desktop quanto realizar o “drill-down” no mobile (mostrando e ocultando os `<ul>` conforme necessário). No trecho de código textual extraído do site, podemos ver partes dessa hierarquia: por exemplo, existe uma entrada para "*Vegetables & Fruits*" seguida de uma lista de subitens "*Leafies & Herbs*, *Frozen Veg*, ...", o que confirma esse aninhamento típico.

* **CSS e Layout:** O CSS do Woodmart estiliza essa estrutura para os diferentes modos:

  * Em telas grandes, a classe do menu lateral pode definir largura fixa para a barra de ícones (quando colapsada, algo em torno de \~56px de largura, suficiente para os ícones) e uma largura maior para o painel expandido (talvez \~250px a 300px). Quando colapsado, provavelmente só os ícones ficam visíveis, escondendo os textos dos itens (podendo usar `overflow: hidden` ou definindo explicitamente `display: none` para os rótulos). Existe possivelmente uma transição CSS para a largura do nav (permitindo o efeito de expandir ao hover).
  * O menu expandido (off-canvas) utiliza `position: fixed` ou `position: absolute` para sobrepor o conteúdo. Pelas evidências visuais, o painel do menu ocupa toda a altura da tela (height: 100vh) e fica alinhado à esquerda (left: 0) quando aberto. Deve iniciar com uma transform (translateX(-100%)) para ficar oculto fora da tela, e ao abrir aplica translateX(0) com transition de 0.3s–0.5s, criando o efeito deslizante. O fundo escurecido é um elemento semi-transparente cobrindo o resto da página, provavelmente um `<div class="mobile-menu-overlay">` com `position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.5)` e z-index um pouco menor que o menu para ficar abaixo dele.
  * O cabeçalho "Menu" verde no topo do painel expandido é estilizado como uma barra horizontal destacada. Deve ter padding e cor de fundo verde (#88B04B ou similar do tema vegetal) e texto branco. Esse cabeçalho fica *sticky* no topo do painel para permanecer visível (por exemplo, usando `position: sticky; top: 0` dentro do menu, para que ao rolar uma lista longa de categorias ele continue no topo).
  * Para a exibição apenas de ícones na barra lateral, o CSS pode usar seletores do tipo `.woodmart-categories-menu.minimized ul li a span { display: none; }` para esconder o texto, e `.woodmart-categories-menu.minimized ul li a:before { /* ícone via pseudo-elemento ou background */ }` para mostrar os ícones centralizados. No caso do Woodmart, porém, é provável que os ícones sejam elementos `<img>` ou `<i class="wb-icon carrot">` dentro do HTML, facilitando o estilo responsivo (mostra-se apenas o `<i>` quando colapsado e tanto `<i>` quanto texto quando expandido).
  * **Breakpoints CSS:** Em termos de media queries, deduzimos que por volta de 1024px existe uma mudança: possivelmente algo como `@media (max-width: 1024px) { .woodmart-categories-menu { display: none; } }` para esconder o sidebar em mobile. Em contrapartida, outros estilos habilitam o botão de categorias no header (ex.: `.mobile-header .all-categories-button { display: block; }`).
  * **Z-index e camadas:** O menu off-canvas certamente está em um nível acima do conteúdo. O Woodmart provavelmente define um z-index elevado (por exemplo, z-index: 10000) para o contêiner do menu lateral quando aberto, e um valor um pouco menor para o overlay. Isso garante que o menu apareça por cima de qualquer elemento da página.
  * **Hover e foco:** Cada item de menu muda de aparência ao *hover* (no desktop) ou *focus* (no keyboard). O CSS pode adicionar um fundo de cor diferente (talvez um cinza claro ou verde claro) no item ativo. Além disso, a página atual ou categoria ativa pode ser destacada no menu com classe `.current-menu-item` em negrito ou cor diferenciada.

Em suma, o menu lateral do  consiste em um HTML semântico de listas, com CSS sofisticado para gerir **três estados**: 1) barra de ícones colapsada (desktop idle), 2) painel expandido (desktop hover/click ou mobile aberto), e 3) modo oculto com trigger no mobile. Esse conjunto de estilos e estrutura provê uma experiência consistente de navegação em todos tamanhos de tela.

## Replicando o Menu Lateral com Vuetify 3.8

Com base na análise acima, podemos reproduzir um menu lateral semelhante utilizando os componentes do **Vuetify 3.8**. A ideia é usar o **v-navigation-drawer** do Vuetify como contêiner do menu lateral, combinando-o com listas (v-list, v-list-item) para os links de categorias e ícones (v-icon) para ilustrá-las. Além disso, vamos configurar a responsividade de forma que o drawer seja permanente/visível no desktop (com opção de modo mini-variado para ícones) e se transforme em um menu temporário (overlay) em dispositivos móveis.

### **Componentes e Estrutura Básica:**

* **v-navigation-drawer:** Este componente será a base do menu lateral. Devemos inseri-lo dentro do layout (normalmente dentro de um `<v-app>`). No Vuetify 3, o `<v-navigation-drawer>` aceita a prop `app` (para integrar-se ao layout principal) e pode ser controlado via v-model (true/false abre ou fecha o drawer). Ele suporta um modo temporário (deslizante sobre o conteúdo) e permanente (fixo ao lado do conteúdo). Também possui recursos para mini-variantes (drawer reduzido a ícones).
* **v-list e v-list-item:** Dentro do drawer, podemos usar `<v-list>` com `nav` para indicar que se trata de uma lista de navegação. Cada categoria será representada por um `<v-list-item>`. Vuetify permite aninhar listas usando `<v-list-group>` quando há subitens.
* **v-list-group:** É útil para categorias que possuem subcategorias. Ele renderiza um item expansível com um título e, internamente, uma lista de `<v-list-item>` filhos. Por padrão, o v-list-group já coloca um ícone de seta (chevron) para indicar expansão/colapso, o que é semelhante ao comportamento do Woodmart para itens com submenu.
* **v-icon:** Podemos usar este componente para inserir ícones representando cada categoria. Vuetify 3 por padrão usa a coleção Material Design Icons (MDI), mas você pode configurar outros sets ou até usar imagens SVG diretamente. Para cada `<v-list-item>` ou `<v-list-group>`, podemos definir um `prepend-icon` (ícone à esquerda do texto) com um nome de ícone MDI correspondente (por exemplo, `mdi-carrot` para Vegetais, `mdi-fish` para Seafood, `mdi-cow` para laticínios, etc., ou qualquer ícone que se aproxime do necessário). Caso não exista um ícone adequado, outra opção é usar `<v-avatar>` ou `<v-img>` dentro do item para exibir uma pequena imagem customizada.
* **v-app-bar / v-btn (hamburger):** Em telas menores, precisamos de um botão para abrir o drawer (já que ele ficará escondido). Podemos usar o componente de App Bar do Vuetify com um `<v-app-bar-nav-icon>` (que é um botão hamburger já estilizado) ou simplesmente um `<v-btn icon>` com `<v-icon>` de menu. Este botão deve acionar a mudança do v-model do drawer para `true` (abrir).

### **Configuração de Breakpoints e Responsividade:**

Para obter o comportamento responsivo semelhante (desktop visível, mobile oculto), podemos aproveitar o sistema de breakpoints do Vuetify:

* O **v-navigation-drawer** possui a propriedade **`mobile-breakpoint`** que define a largura da tela em que o drawer muda automaticamente para modo móvel (temporário). Por padrão, o Vuetify usa um breakpoint global (geralmente `960px` para md). Como o Woodmart usa \~1024px, podemos sobrescrever isso. Por exemplo: `<v-navigation-drawer mobile-breakpoint="1024" ...>` fará com que abaixo de 1024px o drawer se comporte como temporário (overlay) automaticamente, e acima disso como permanente.
* Além disso, para emular o **mini-variant de ícones no desktop**, o Vuetify fornece as props `mini-variant` (booleana) e `mini-variant-width`. Podemos utilizar `:mini-variant="true"` para deixar o drawer colapsado a somente ícones. Também existe a prop `expand-on-hover` que, se ativada, expande o drawer automaticamente quando o usuário passar o mouse por cima – isso é exatamente o comportamento observado no Woodmart (barra de ícones que alarga ao hover). Podemos então configurar no desktop: `:mini-variant="isDesktop ? true : false"` e `expand-on-hover` para que em telas grandes o menu fique minimizado até o usuário interagir. Em alternativas mais simples, podemos permitir que o usuário clique num botão para fixar/expandir o menu (similar ao botão "Menu" verde do demo), controlando o mini-variant via sync.
* Em termos de **display**, outra abordagem é usar o composable `useDisplay()` do Vuetify para obter informações responsivas (ex: `const { mdAndUp } = useDisplay()`). Podemos, por exemplo, ligar o estado `drawer` (v-model do v-navigation-drawer) ao `mdAndUp`: quando `mdAndUp` for true (tela >= 960px) podemos mantê-lo aberto/visível, e quando for false, fechá-lo por padrão. Contudo, usando `mobile-breakpoint` isso já é tratado internamente, então a intervenção manual pode ser mínima.

### **Estilização e Ajustes para Similaridade:**

* **Largura do Drawer:** Podemos ajustar a largura padrão do menu para combinar com o design do Woodmart. O Vuetify 3 permite definir a prop `width`. Por exemplo, `width="300"` tornaria o drawer expandido com 300px de largura (aproximado ao painel do Woodmart). O mini-variant por padrão tem \~56px de largura (prop `mini-variant-width`, default 56px, que podemos deixar assim para mostrar apenas ícones).
* **Cores e Temas:** Para o fundo do menu, usamos a cor branca (padrão do drawer do Vuetify é geralmente claro se em tema claro). Podemos explicitamente aplicar classes utilitárias se necessário, como `class="bg-white text-body"` para fundo branco e texto na cor padrão. O cabeçalho “Menu” verde podemos criar como um item separado ou incorporar na App Bar se o menu for parte da header. Outra forma: adicionar um `<v-list-item title="Menu" prepend-icon="mdi-menu" class="pa-4 green lighten-1 white--text">` no topo do drawer para servir de cabeçalho estilizado (com classes do Vuetify para cor de fundo verde e texto branco). Esse item não teria ação, apenas exibição.
* **Ícones nas categorias:** Usando `prepend-icon` em v-list-item ou v-list-group já exibe o ícone do lado esquerdo automaticamente. Devemos escolher ícones adequados da biblioteca ou adicionar custom. Por exemplo: `prepend-icon="mdi-leaf"` para “Leafies & Herbs” ou um ícone de oferta para “Weekly Discounts” (poderia ser `mdi-sale`).
* **Setas de submenu:** O `<v-list-group>` por padrão coloca um ícone de expansão (chevron) no lado direito. Podemos customizar esses ícones via props `append-icon` (ícone quando fechado) e `append-icon-alt` (quando aberto). Vuetify usa chevron-down e chevron-up, respectivamente, que condizem com a necessidade. Caso queiramos um chevron direito/esquerda para drill-down, poderíamos trocar por `mdi-chevron-right` e no submenu usar algo para voltar, mas provavelmente manter o padrão de accordion vertical é mais simples.
* **Acessibilidade:** Vuetify já cuida de muito disso – o drawer com `temporary` inclui um scrim clicável e provavelmente gerencia o foco (ao abrir, ele adiciona `aria-hidden` no conteúdo de fundo e foca dentro do drawer). Ainda assim, podemos adicionar melhorias: por exemplo, adicionar `aria-label="Menu de Categorias"` no `<v-navigation-drawer>` para descrever a região de navegação. Os botões de menu (hamburger) devem ter `aria-label="Abrir menu de categorias"` e, quando o menu está aberto, idealmente mudar para `aria-label="Fechar menu de categorias"`. O Vuetify não faz isso automaticamente, então podemos controlar com `:aria-label="drawer ? 'Fechar menu' : 'Abrir menu'"` num `<v-btn>`.
* **Fechamento no mobile:** Certifique-se de que ou o scrim (fundo escuro) esteja habilitado para fechar ao clicar, ou forneça um botão de fechar (um `<v-btn icon>` com `mdi-close` no topo do drawer, visível só em mobile). O Vuetify’s temporary drawer por padrão fecha ao clicar fora ou pressionar Esc, então isso já atende a maioria dos casos.
* **Sticky:** Para que o menu fique *sticky* no desktop (isto é, não role junto com o conteúdo), usamos o modo `app` do drawer. Isso faz com que o drawer fique posicionado fixamente em relação à viewport e o conteúdo da página seja redimensionado ao lado dele (quando permanente). No nosso caso, porém, estamos optando por um drawer temporário mesmo no desktop (com mini-variant), o que significa que ele está mais “flutuante”. Se quisermos exatamente igual – ícones sempre visíveis fixos – podemos setar `permanent` junto com `mini-variant` em telas desktop, para que a barra de ícones faça parte do layout fixo. Ou então usar CSS custom: por exemplo, aplicar `position: fixed; top: 64px; left: 0;` (considerando altura do header) na barra de ícones. Entretanto, usando `<v-navigation-drawer app permanent mini-variant>` já deve nos dar um efeito parecido: o drawer (mesmo colapsado) fica fixo e o conteúdo ao lado, e com `expand-on-hover` ele se revela.

### **Exemplo de Código (Vuetify 3.8):**

Abaixo, fornecemos um snippet simplificado ilustrando como montar o menu lateral com Vuetify. Ele inclui dois exemplos de categorias – uma com submenu e outra sem – para demonstrar o uso de v-list-group e v-list-item, bem como ícones e responsividade:

```vue
<template>
  <!-- Drawer lateral de categorias -->
  <v-navigation-drawer
    v-model="drawer"
    app
    :mobile-breakpoint="1024"      <!-- Torna-se temporário abaixo de 1024px -->
    :permanent="isDesktop"         <!-- Permanente (fixo) em desktop, temporário em mobile -->
    mini-variant                   <!-- Inicia colapsado a ícones em desktop -->
    expand-on-hover                <!-- Expande ao passar mouse (desktop) -->
    width="300"                    <!-- Largura do menu expandido -->
    mini-variant-width="56"        <!-- Largura da barra colapsada (só ícones) -->
    aria-label="Menu de Categorias"
  >
    <!-- Cabeçalho do menu (opcional, para mostrar "Menu" no topo do drawer) -->
    <v-list-item 
      class="green lighten-1 white--text"
      style="justify-content: start;"
    >
      <v-icon class="mr-2">mdi-menu</v-icon>
      <v-list-item-title>Menu</v-list-item-title>
    </v-list-item>
    
    <!-- Lista de categorias -->
    <v-list nav dense>
      <!-- Categoria com subcategorias -->
      <v-list-group
        title="Vegetables & Fruits"
        prepend-icon="mdi-sprout"       <!-- ícone representando a categoria -->
        append-icon="mdi-chevron-down"  <!-- ícone de expandir/colapsar -->
      >
        <!-- Sub-itens (subcategorias) -->
        <v-list-item title="Leafies & Herbs" @click="irParaCategoria('leafies')" />
        <v-list-item title="Frozen Veg" @click="irParaCategoria('frozen')" />
        <v-list-item title="Mushrooms" @click="irParaCategoria('mushrooms')" />
        <v-list-item title="Fresh Fruits" @click="irParaCategoria('fruits')" />
        <v-list-item title="Fresh Vegetables" @click="irParaCategoria('vegetables')" />
      </v-list-group>
      
      <!-- Categoria sem subcategorias -->
      <v-list-item 
        title="Vegan Meat" 
        prepend-icon="mdi-food-drumstick-outline" 
        @click="irParaCategoria('vegan-meat')"
      />
      
      <!-- (Outras categorias seriam listadas de forma similar) -->
    </v-list>
  </v-navigation-drawer>

  <!-- Botão Hamburguer no topo (só aparece em mobile, via CSS ou v-if) -->
  <v-app-bar flat color="transparent">
    <v-app-bar-nav-icon @click.stop="drawer = true" aria-label="Abrir menu de categorias" />
    <v-toolbar-title>Meu Site</v-toolbar-title>
    <!-- ... outros itens de toolbar ... -->
  </v-app-bar>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDisplay } from 'vuetify';

const drawer = ref(false);            // estado do menu (fechado inicialmente)
const { mdAndUp } = useDisplay();     // composable do Vuetify para breakpoints
const isDesktop = computed(() => mdAndUp.value);  // true se tela >= md (aprox >=960px)

// Abrir o drawer por padrão em desktop
if (isDesktop.value) {
  drawer.value = true;
}

// Função de navegação (placeholder)
const irParaCategoria = (slug) => {
  console.log('Navegando para categoria:', slug);
  // Aqui iria a lógica de roteamento/ navegação para a página da categoria
};
</script>
```

**Explicação do snippet:** No `<v-navigation-drawer>`, usamos `:mobile-breakpoint="1024"` para que abaixo de 1024px ele seja temporário (overlay) automaticamente. Usamos `permanent` atrelado à condição `isDesktop` para mantê-lo sempre presente em viewport maiores, e ativamos `mini-variant` + `expand-on-hover` para reproduzir a **barra de ícones colapsada que expande no hover** tal como no Woodmart. Dentro, definimos um item de lista simulando o cabeçalho "Menu" com fundo verde. Em seguida, montamos a lista de categorias: um `<v-list-group>` para "Vegetables & Fruits" que contém subitens (cada subcategoria como `<v-list-item>`), e um `<v-list-item>` simples para "Vegan Meat" que não tem subcategorias. Os ícones foram escolhidos da biblioteca MDI (`mdi-sprout` como analogia a vegetais, `mdi-food-drumstick-outline` para carnes veganas).

Com essa configuração, em uma tela desktop o usuário verá uma barra lateral estreita com ícones; ao passar o mouse, o drawer expande mostrando os textos das categorias. Ele permanecerá visível (sticky) ao lado do conteúdo. Em dispositivos móveis, o drawer não é exibido por padrão, mas ao clicar no botão de menu (hamburger) no app bar, `drawer = true` abre o menu como overlay ocupando a tela inteira (com fundo escuro atrás). O usuário pode então navegar pelas categorias; subcategorias podem ser acessadas expandindo o v-list-group (no desktop isso aparece como um accordion drop-down, no mobile igualmente poderá expandir dentro do painel). Se preferir imitar o comportamento de *drill-down* com botão voltar no mobile, isso exigiria uma lógica extra (por exemplo, trocar a visualização da lista por uma sub-lista e um custom `<v-list-item>` "Back"). Em muitos casos, porém, o comportamento de accordion (expandir/collapse) já é suficiente e mais simples de implementar com Vuetify.

### **Considerações Finais:**

Seguindo os passos acima – escolhendo os componentes corretos e ajustando suas props – conseguimos replicar com precisão o menu lateral do Woodmart. Em resumo, usamos **v-navigation-drawer** para o container responsivo (permanente/temporário conforme breakpoint), **mini-variant com expand-on-hover** para o estilo colapsado de ícones no desktop, **v-list/v-list-item/v-list-group** para estruturar as categorias e subcategorias, e adicionamos **v-icon** (ou prepend-icon) para trazer os ícones ilustrativos. Customizamos larguras e cores para manter a aparência semelhante (menu branco, destaque verde no cabeçalho, etc.) e nos beneficiamos do Vuetify para animações e acessibilidade integradas (transições de drawer, focus management, etc.). Com esses ajustes e eventuais refinamentos de estilo (como CSS adicional se necessário), a experiência do usuário ficará muito próxima à do demo *Vegetables* da Woodmart, agora dentro de uma aplicação Vue/Vuetify.