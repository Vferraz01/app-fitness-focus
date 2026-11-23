# Como o Fitness Focus funciona (guia para quem está começando)

Este guia explica o projeto do zero: o que cada arquivo faz, como o código foi pensado e como as peças se conectam. Não é preciso saber programar para começar a ler. Os termos técnicos aparecem explicados e há um glossário no fim.

---

## 1. A ideia geral

O app é um **site** feito com três tecnologias, e cada uma tem um papel:

| Arquivo | Tecnologia | Papel (analogia com uma casa) |
|---|---|---|
| `index.html` | HTML | **A estrutura**: as paredes e os cômodos vazios |
| `css/style.css` | CSS | **A decoração**: cores, tamanhos, espaçamentos |
| `js/app.js` | JavaScript | **A parte elétrica e o morador**: faz tudo acontecer, calcula, guarda e desenha as telas |

Fora esses três arquivos, há a pasta `assets/` (a imagem do corpo humano) e `docs/` (capturas de tela e este guia).

---

## 2. `index.html`: quase vazio de propósito

Abra o arquivo: ele tem só umas 15 linhas. O que importa são estes pedaços:

```html
<link rel="stylesheet" href="css/style.css">   <!-- liga o visual -->
<div class="wrap">
  <header><h1>Fitness Focus</h1> ... </header>
  <main id="main"></main>                      <!-- AQUI aparece cada página -->
</div>
<div id="toast" hidden></div>                  <!-- avisos rápidos -->
<nav id="nav"></nav>                           <!-- menu de baixo -->
<script src="js/app.js"></script>              <!-- liga o cérebro -->
```

O truque do projeto é este: o HTML tem **espaços vazios** (`<main>` e `<nav>`), e o JavaScript **preenche esses espaços** conforme você navega. Por isso o site é uma "página única": o menu e o título nunca recarregam, só o conteúdo do meio troca.

O `id="main"` funciona como um endereço. O JavaScript diz "coloque tal conteúdo no elemento chamado `main`".

---

## 3. `css/style.css`: o visual

### Variáveis de cor
No começo do arquivo ficam as cores, com nomes:

```css
:root { --bg:#eef1f5; --card:#fff; --tx:#101a2e; --ac:#0f9d7a; ... }
```

Em vez de repetir `#0f9d7a` em cem lugares, o código usa `var(--ac)` ("cor de destaque"). Para mudar a cor principal do app inteiro, basta alterar uma linha.

### Modo claro e escuro automático
```css
@media (prefers-color-scheme: dark) { :root { --bg:#0d1424; ... } }
```
Se o celular estiver no modo escuro, esse bloco troca os valores das mesmas variáveis. As telas não precisam saber disso: elas só pedem `var(--bg)` e recebem a cor certa.

### Classes
Cada elemento do app tem um nome de "estilo": `.card` (caixa branca arredondada), `.row` (linha que quebra em telas pequenas), `.bar` (barra de progresso), `.pill` (etiqueta arredondada). O JavaScript só escolhe o nome, e o CSS decide a aparência.

---

## 4. `js/app.js`: o cérebro

É o arquivo grande (cerca de 1.800 linhas, já formatado e comentado). Para entendê-lo, guarde uma ideia só:

> **Tudo gira em torno de um objeto chamado `S` (o "estado"). A tela é sempre um desenho do que há dentro de `S`.**

### 4.1 O estado `S`: a memória do app

```js
let S = { profile:{...}, plan:[], wp:{...}, diet:{}, water:{}, rem:{...}, dd:{}, ... }
```

| Campo | O que guarda |
|---|---|
| `profile` | sexo, idade, peso, altura, atividade, objetivo, horários, preferência alimentar |
| `wp` | escolhas do Início: objetivo do treino, dias por semana, estratégia |
| `plan` | o treino: lista de dias, e cada dia tem uma lista de exercícios com as séries registradas |
| `diet` | alimentos consumidos, organizados por data |
| `menu` | cardápio sugerido, organizado por data |
| `water` | registros de água, organizados por data |
| `rem` | configuração dos lembretes de água |
| `dd`, `e1`, `bd` | pontos dos músculos por dia, força estimada por exercício e recordes do dia (usados na Evolução) |

Os campos organizados "por data" usam a data como chave, por exemplo `S.water["2026-11-23"]`.

### 4.2 Como os dados ficam salvos

```js
const save = () => { localStorage.setItem(KEY, JSON.stringify(S)) ... }
```

- `JSON.stringify(S)` transforma o objeto em texto.
- `localStorage` é uma pequena "gaveta" do navegador, que guarda texto mesmo depois que a página fecha.
- Ao abrir o app, o caminho inverso: lê o texto e usa `JSON.parse` para recriar `S`.

**Regra de ouro do projeto:** toda vez que algo muda em `S`, chama-se `save()`. É por isso que o app "lembra" de tudo. Por isso também os dados ficam só no aparelho: o `localStorage` é privado de cada navegador.

### 4.3 Como a tela é desenhada: `render()`

```js
function render(){
  const V = { inicio:vI, treino:vT, evolucao:vE, dieta:vD, agua:vA, perfil:vP };
  $('#main').innerHTML = V[tab]();          // desenha a página atual
  $('#nav').innerHTML  = ...                // desenha o menu de baixo
}
```

- Existe **uma função por página**: `vI` (Início), `vT` (Treino), `vE` (Evolução), `vD` (Dieta), `vA` (Água), `vP` (Perfil). O "v" vem de *view* (visão).
- Cada função **devolve um texto HTML** montado a partir de `S`. Por exemplo, `vA()` lê os registros de água, calcula o total e devolve o HTML com o medidor.
- `render()` escolhe a função da página atual (`tab`) e **substitui todo o conteúdo** de `<main>` por esse HTML novo.

Essa ideia ("o estado manda, a tela é redesenhada") é a mesma de frameworks famosos como React. Aqui está feita na versão mais simples.

### 4.4 Textos com `${...}`: a parte que mais confunde

O código HTML dentro do JavaScript usa crases (`` ` ``) e `${ }`:

```js
`<div class="card"><h3>${nome}</h3> <p>${total} ml</p></div>`
```

Tudo dentro de `${ }` é **calculado** e o resultado entra no texto. Isso se chama *template string*. Para listas, usa-se `.map(...)` para criar um pedaço de HTML por item e `.join('')` para colar todos:

```js
${[150,250,350,500].map(v => `<button>+${v} ml</button>`).join('')}
```
Resultado: quatro botões, um para cada valor.

### 4.5 Navegação entre páginas

```js
function route(){ tab = location.hash.slice(1) ...; render() }
addEventListener('hashchange', route);
```

Os botões do menu são links como `href="#treino"`. Ao clicar, o endereço muda para `...#treino`, o navegador avisa ("hashchange") e `route()` descobre qual página é, guarda em `tab` e chama `render()`. Não há recarregamento de página.

### 4.6 Como os botões funcionam: eventos

Em vez de ligar uma função em cada botão, o código usa **um único ouvinte para a página toda**:

```js
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');   // achou um botão com data-act?
  const a = b.dataset.act;                    // qual ação?
  if (a === 'addW') { ...registra água... }
  else if (a === 'delFood') { ...remove alimento... }
  ...
  render();                                   // redesenha a tela no fim
});
```

Cada botão é escrito no HTML com um rótulo de ação:

```html
<button data-act="addW" data-v="500">+500 ml</button>
```

Ao clicar, o ouvinte lê `data-act="addW"` e `data-v="500"`, executa a ação correspondente e redesenha. Existe um segundo ouvinte, para `change` (quando um campo ou lista de seleção muda), que usa `data-f` com a mesma lógica.

**Exemplo completo: tocar em "+500 ml"**
1. O clique chega ao ouvinte, que lê `data-act="addW"` e `data-v="500"`.
2. O código acrescenta `{ml:500, t:"14:32"}` em `S.water[hoje]`.
3. Chama `save()`, que guarda tudo no navegador.
4. Chama `render()`, que redesenha a página, agora com o medidor atualizado.

Quase tudo no app segue esses quatro passos: **ação, muda `S`, `save()`, `render()`**.

---

## 5. Mapa do `app.js` por funções

O arquivo está em ordem de montagem. Use `Ctrl+F` no VS Code para procurar pelo nome.

| Nome | O que faz |
|---|---|
| `S`, `save`, `push` | Estado e salvamento (local e, no claude.ai, na conta) |
| `EX` | Lista de exercícios: nome, grupo muscular e local |
| `DESC` | Texto do "Como fazer" de cada exercício |
| `FOODS` | Tabela de alimentos: nome, kcal, proteína, carboidrato e gordura por 100 g |
| `GOALS` | Objetivos de treino: séries, repetições e descanso |
| `TPL`, `SPLIT`, `STR` | Modelos de dia de treino e estratégias de divisão (corpo todo, superiores/inferiores…) |
| `calc()` | Calcula as metas de calorias, macros e água |
| `gen()` | Gera o treino a partir do objetivo, dos dias e da estratégia |
| `rate()` | Decide se uma estratégia é "Recomendada", "Possível" ou "Menos indicada" |
| `exDone`, `setRows` | Marca exercícios concluídos e desenha as linhas de série |
| `aw`, `paceF`, `armRem`, `tick` | Horários acordado/dormindo, ritmo de hidratação e lembretes |
| `genMeal`, `genMenu`, `mealPlan` | Gerador de cardápio e a tela do plano de refeições |
| `pts`, `award`, `lvl` | Pontos por série, força estimada (1RM) e níveis musculares |
| `ZN`, `anatSvg` | Regiões do corpo e o desenho da Evolução |
| `vI`, `vT`, `vE`, `vD`, `vA`, `vP` | As seis páginas |
| `render`, `route` | Desenham a página e controlam a navegação |
| os dois `addEventListener` | Tratam cliques e mudanças |
| bloco `(async()=>{...})()` no fim | Sincroniza com a conta quando o app roda dentro do claude.ai |

---

## 6. Os cálculos, em português

### Metas diárias (`calc()`)
1. **Metabolismo basal (Mifflin-St Jeor):** `10 × peso + 6,25 × altura − 5 × idade`, mais 5 para homens ou menos 161 para mulheres.
2. **Gasto total:** basal × fator de atividade (1,2 sedentário até 1,725 intenso).
3. **Calorias da meta:** gasto total × 0,8 (perder), × 1 (manter) ou × 1,1 (ganhar).
4. **Proteína:** peso × 2, 1,6 ou 1,8 g. **Gordura:** peso × 0,9 g. **Carboidrato:** o que sobra das calorias, dividindo por 4 (1 g de carbo = 4 kcal; proteína 4; gordura 9).
5. **Água:** peso × 35, 40 ou 45 ml, conforme a atividade.

### Nível dos músculos (`pts()`)
1. Cada série concluída vale pontos para o grupo muscular do exercício.
2. O app estima sua carga máxima em 1 repetição: `carga × (1 + repetições ÷ 30)`, a fórmula de Epley, contando no máximo 12 repetições.
3. Compara com o melhor valor já registrado naquele exercício. Se a série está abaixo de 60% dele, vale 0 (carga leve). Se superar o recorde, ganha +1 ponto.
4. Os pontos somados definem o nível (`LV`): 0, 1, 25, 70, 160 e 300 pontos.

### Cardápio (`genMenu` e `genMeal`)
1. Divide as metas do dia entre as refeições (lanches e ceia pesam menos).
2. Para cada refeição, escolhe alimentos de listas que dependem do objetivo e filtra pela preferência alimentar (vegetariano, sem lactose).
3. Calcula as gramas da fonte de proteína para atingir a proteína da refeição, depois as do carboidrato.
4. No fim, ajusta as quantidades de carboidrato para o total do dia chegar perto da meta de calorias.

---

## 7. A imagem do corpo na Evolução

- A página mostra a imagem `assets/anatomia.webp` (uma foto de anatomia em preto e branco).
- Por cima dela há um desenho em **SVG** com formas (`ZN`: polígonos, listas de pontos `x,y`) que cobrem cada músculo.
- Cada forma é colorida com a cor do nível do grupo e funciona como um botão: tocar nela escolhe o músculo.
- O arquivo `ZN` parece "só números" porque são as coordenadas dos contornos.

---

## 8. Como ler o código

A partir desta versão, `js/app.js` e `css/style.css` estão **formatados** (indentação e uma instrução por linha) e **comentados em português**. Cada bloco tem uma explicação acima dele, e o início do arquivo traz um roteiro de leitura.

Algumas partes continuam densas por natureza:
- **Textos HTML dentro do JavaScript** (entre crases): foram quebrados em linhas, mas algumas linhas ainda são longas porque contêm vários elementos.
- **Tabelas de dados** (`EX`, `FOODS`, `DESC`, `ZN`): são listas longas de nomes e números.

Os nomes curtos mais usados:

| Nome | Significa |
|---|---|
| `S` | estado (state) |
| `k`, `p`, `c`, `f` | kcal, proteína, carboidrato, gordura (fat) |
| `g` | gramas ou grupo muscular, conforme o lugar |
| `$` | atalho para `document.querySelector` (encontrar um elemento) |
| `esc` | torna um texto seguro antes de colocá-lo no HTML |
| `opts` | monta as opções de uma lista de seleção |
| `sum` | soma calorias e macros de uma lista de alimentos |
| `cl(v,a,b)` | limita o valor `v` entre `a` e `b` |
| `rg(g,s)` | arredonda `g` para múltiplos de `s` |

Dica: para manter o código sempre organizado ao editar, instale a extensão **Prettier** no VS Code e use *Format Document* (Shift+Alt+F no Windows, Shift+Option+F no Mac).

---

## 9. Pratique: mudanças pequenas para aprender

Abra o projeto no VS Code com a extensão Live Server. Edite, salve e veja o resultado no navegador.

1. **Mudar a cor de destaque:** em `style.css`, altere `--ac` (por exemplo, para `#7c3aed`).
2. **Mudar o nome do app:** em `index.html`, troque o texto de `<h1>` e de `<title>`.
3. **Adicionar um alimento:** em `app.js`, no fim da lista `FOODS`, adicione `['Pão de queijo',363,5.2,34,22]` (nome, kcal, proteína, carboidrato e gordura por 100 g).
4. **Adicionar um botão de água:** procure `[150,250,350,500]` e inclua `750`.
5. **Mudar os níveis musculares:** procure `const LV=[` e altere os valores de `m` (os pontos de cada nível).
6. **Mudar a fórmula da meta:** em `calc()`, troque `p.peso*.9` (gordura) por outro valor e veja as metas mudarem no Perfil.

Se algo quebrar, desfaça com `Ctrl+Z`. Se a página ficar em branco, abra o console do navegador (F12) para ver a mensagem de erro com o número da linha.

---

## 10. Glossário

- **HTML:** linguagem que descreve o conteúdo e a estrutura da página.
- **CSS:** linguagem que define a aparência.
- **JavaScript:** linguagem que dá comportamento à página.
- **DOM:** a página representada como uma árvore de elementos que o JavaScript pode alterar.
- **Estado:** o conjunto de dados que descreve a situação atual do app (`S`).
- **Renderizar:** desenhar a tela a partir do estado.
- **Evento:** algo que acontece na página (clique, mudança de campo).
- **Função:** um bloco de código com nome que pode ser chamado várias vezes.
- **Array (lista):** uma sequência de itens: `[150,250,350]`.
- **Objeto:** um conjunto de campos com nome: `{nome:'Ana', idade:30}`.
- **`const` e `let`:** formas de criar variáveis. `const` não pode ser reatribuída, `let` pode.
- **`=>` (função seta):** jeito curto de escrever funções: `v => v*2`.
- **`.map`, `.filter`, `.find`, `.reduce`:** métodos de lista para transformar, filtrar, procurar e somar.
- **JSON:** formato de texto para guardar objetos e listas.
- **localStorage:** pequena memória do navegador, que sobrevive ao fechar a página.
- **SVG:** formato de desenho feito de formas matemáticas (usado no medidor de água e no corpo).
- **Template string:** texto entre crases com partes calculadas em `${ }`.
- **PWA:** site que pode ser instalado como app no celular.
