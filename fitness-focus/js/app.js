// ============================================================================
// FITNESS FOCUS — lógica do aplicativo (app.js)
//
// Ideia central: tudo gira em torno de um objeto chamado `S` (o "estado"), que
// guarda os dados do usuário. A tela é sempre um desenho do que há em `S`.
//
// Todo botão segue o mesmo caminho:
//   1) o usuário clica  →  2) o código muda `S`  →  3) save() guarda no navegador
//   →  4) render() redesenha a tela.
//
// Ordem do arquivo:
//   1. Ferramentas básicas e estado (S, save)
//   2. Tabelas de dados (exercícios, alimentos, objetivos)
//   3. Cálculos (metas, treino, água, cardápio, níveis musculares)
//   4. As seis páginas (Início, Treino, Evolução, Dieta, Água, Perfil)
//   5. Navegação (render/route) e eventos (cliques e mudanças)
//   6. Sincronização com a conta (só funciona dentro do claude.ai)
// ============================================================================

// ===== 1. FERRAMENTAS BÁSICAS E ESTADO ======================================

// Atalho para encontrar um elemento da página pelo seletor CSS. Ex.: $('#main')
const $ = (s) => document.querySelector(s);
// Torna um texto seguro antes de colocá-lo dentro de HTML (troca < > & " por códigos).
// Evita que um nome digitado pelo usuário "quebre" a página.
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  );
// Nome da "gaveta" do navegador (localStorage) onde os dados ficam guardados.
const KEY = 'prumo_v1'; // chave mantida para não perder dados já salvos
// Converte uma data em texto AAAA-MM-DD (ex.: 2026-11-23). Usamos esse texto como chave dos dados por dia.
const ymd = (d) => d.toLocaleDateString('sv-SE');
// O ESTADO: toda a memória do aplicativo.
//   profile  → dados do perfil (sexo, idade, peso, altura, atividade, objetivo...)
//   plan     → o treino: lista de dias, cada dia com sua lista de exercícios
//   wp       → escolhas feitas no Início (objetivo do treino, dias, estratégia)
//   diet     → alimentos consumidos, por data
//   water    → registros de água, por data
// (outros campos são criados logo abaixo: rem, dd, best, e1, bd, menu)
let S = {
  profile: { sexo: 'm', idade: 30, peso: 75, altura: 175, ativ: 1.55, obj: 'manter' },
  plan: [],
  wp: { goal: 'hipertrofia', loc: 'academia', days: 4 },
  diet: {},
  water: {},
};
// Ao abrir o app, lê o que foi salvo antes (se houver) e mistura com o estado inicial.
// JSON.parse transforma o texto guardado de volta em objeto.
try {
  const r = localStorage.getItem(KEY);
  if (r) S = Object.assign(S, JSON.parse(r));
} catch (e) {}
// Garante que os campos adicionais existam (usuários antigos podem não ter salvo esses campos):
//   rem  → configuração do lembrete de água
//   dd   → pontos dos músculos por dia
//   best → melhor volume por exercício (campo antigo, mantido por compatibilidade)
//   e1   → força máxima estimada (1RM) por exercício
//   bd   → dia em que cada exercício bateu recorde
//   menu → cardápio sugerido, por data
S.rem = S.rem || { on: false, iv: 30 };
S.dd = S.dd || {};
S.best = S.best || {};
S.e1 = S.e1 || {};
S.bd = S.bd || {};
S.menu = S.menu || {};
// Variáveis da sincronização com a conta (só usadas dentro do claude.ai):
//   cref = documento na nuvem, ct = temporizador do envio, ready/first = controle de carregamento.
let cref = null,
  ct = 0,
  ready = false,
  first = true;
// Mostra no topo da página a situação do salvamento ("Salvo só neste aparelho", "Salvo na sua conta"...).
const setSync = (m) => {
  const e = $('#sync');
  if (e) e.textContent = m;
};
// SALVAR: deve ser chamado sempre que `S` muda.
// Guarda no navegador na hora e, se a conta estiver conectada, envia para a nuvem.
const save = () => {
  // Marca a hora da última alteração (usada para saber qual versão é mais nova ao sincronizar).
  S._ts = Date.now();
  try {
    // Guarda tudo no navegador, como texto.
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {}
  // Se a conta está conectada, envia para a nuvem 1,2 s depois da última mudança (evita enviar a cada tecla).
  if (cref && ready) {
    clearTimeout(ct);
    ct = setTimeout(push, 1200);
    setSync('Salvando…');
  }
};
// Envia o estado completo para a nuvem (conta do claude.ai), como texto JSON.
function push() {
  if (!cref) return;
  cref.set({ json: JSON.stringify(S), ts: S._ts || (S._ts = Date.now()) }).then(
    () => setSync('☁️ Salvo na sua conta'),
    () => setSync('Falha ao sincronizar; dados salvos só neste aparelho')
  );
}
// date = dia que está sendo visto na Dieta e na Água.   lm = última refeição escolhida na lista.
let date = ymd(new Date()),
  lm = 'Almoço';
// Abas do menu de baixo: [identificador, ícone, nome]. O identificador vira o endereço (#treino).
const TABS = [
  ['inicio', '🏠', 'Início'],
  ['treino', '🏋️', 'Treino'],
  ['evolucao', '📈', 'Evolução'],
  ['dieta', '🍽️', 'Dieta'],
  ['agua', '💧', 'Água'],
  ['perfil', '👤', 'Perfil'],
];
// Refeições do diário de consumo.
const MEALS = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar', 'Ceia'];
// exercícios: nome, grupo, local (a=academia, o=ar livre, b=ambos)
// ===== 2. TABELAS DE DADOS ===================================================

// Exercícios: [nome, grupo muscular, local]. Local: a = academia, o = ar livre, b = ambos.
// O grupo muscular decide qual músculo recebe pontos na página Evolução.
const EX = [
  ['Supino reto', 'peito', 'a'],
  ['Supino inclinado', 'peito', 'a'],
  ['Crucifixo', 'peito', 'a'],
  ['Flexão de braço', 'peito', 'o'],
  ['Flexão inclinada', 'peito', 'o'],
  ['Flexão declinada', 'peito', 'o'],
  ['Puxada frontal', 'costas', 'a'],
  ['Remada curvada', 'costas', 'a'],
  ['Remada baixa', 'costas', 'a'],
  ['Barra fixa', 'costas', 'o'],
  ['Remada australiana', 'costas', 'o'],
  ['Superman no solo', 'costas', 'o'],
  ['Agachamento livre', 'pernas', 'a'],
  ['Leg press', 'pernas', 'a'],
  ['Cadeira extensora', 'pernas', 'a'],
  ['Mesa flexora', 'pernas', 'a'],
  ['Stiff', 'pernas', 'a'],
  ['Elevação pélvica', 'pernas', 'a'],
  ['Agachamento com peso do corpo', 'pernas', 'o'],
  ['Afundo', 'pernas', 'o'],
  ['Agachamento búlgaro', 'pernas', 'o'],
  ['Elevação pélvica no solo', 'pernas', 'o'],
  ['Panturrilha no degrau', 'pernas', 'o'],
  ['Agachamento com salto', 'pernas', 'o'],
  ['Desenvolvimento com halteres', 'ombros', 'a'],
  ['Elevação lateral', 'ombros', 'a'],
  ['Elevação frontal', 'ombros', 'a'],
  ['Flexão pike', 'ombros', 'o'],
  ['Elevação lateral com mochila', 'ombros', 'o'],
  ['Remada alta com mochila', 'ombros', 'o'],
  ['Rosca direta', 'braços', 'a'],
  ['Tríceps pulley', 'braços', 'a'],
  ['Rosca martelo', 'braços', 'a'],
  ['Tríceps testa', 'braços', 'a'],
  ['Mergulho no banco', 'braços', 'o'],
  ['Barra fixa supinada', 'braços', 'o'],
  ['Flexão diamante', 'braços', 'o'],
  ['Abdominal na máquina', 'core', 'a'],
  ['Prancha', 'core', 'b'],
  ['Elevação de pernas', 'core', 'b'],
  ['Abdominal canivete', 'core', 'o'],
  ['Esteira', 'cardio', 'a'],
  ['Bicicleta ergométrica', 'cardio', 'a'],
  ['Corrida', 'cardio', 'o'],
  ['Pular corda', 'cardio', 'b'],
  ['Burpee', 'cardio', 'b'],
  ['Polichinelo', 'cardio', 'o'],
];
// Alimentos: [nome, kcal, proteína, carboidrato, gordura], sempre por 100 g.
// A ORDEM importa: a lista de seleção da Dieta usa a posição do alimento (não adicione no meio).
const FOODS = [
  ['Arroz cozido', 128, 2.5, 28, 0.2],
  ['Feijão cozido', 76, 4.8, 14, 0.5],
  ['Frango grelhado', 159, 32, 0, 2.5],
  ['Ovo cozido', 155, 13, 1.1, 11],
  ['Carne bovina magra grelhada', 219, 32, 0, 9],
  ['Tilápia grelhada', 128, 26, 0, 2.7],
  ['Batata-doce cozida', 77, 0.6, 18, 0.1],
  ['Pão francês', 300, 8, 58, 3.1],
  ['Aveia em flocos', 394, 14, 67, 8.5],
  ['Banana', 89, 1.1, 23, 0.3],
  ['Maçã', 52, 0.3, 14, 0.2],
  ['Leite integral', 61, 3.2, 4.7, 3.3],
  ['Iogurte natural', 61, 3.5, 4.7, 3.3],
  ['Whey protein', 400, 80, 8, 6],
  ['Pasta de amendoim', 588, 25, 20, 50],
  ['Azeite de oliva', 884, 0, 0, 100],
  ['Arroz integral cozido', 124, 2.6, 25.8, 1],
  ['Macarrão cozido', 158, 5.8, 30.9, 0.9],
  ['Pão integral', 253, 9.4, 49.9, 3.4],
  ['Batata inglesa cozida', 52, 1.2, 11.9, 0],
  ['Mandioca cozida', 125, 0.6, 30.1, 0.3],
  ['Queijo minas frescal', 264, 17.4, 3.2, 20.2],
  ['Queijo cottage', 98, 11, 3.4, 4.3],
  ['Atum em conserva', 116, 25.5, 0, 0.8],
  ['Salmão grelhado', 206, 22, 0, 12],
  ['Tofu', 76, 8.1, 1.9, 4.8],
  ['Lentilha cozida', 116, 9, 20, 0.4],
  ['Grão-de-bico cozido', 164, 8.9, 27.4, 2.6],
  ['Brócolis cozido', 35, 2.4, 7.2, 0.4],
  ['Alface', 15, 1.4, 2.9, 0.2],
  ['Tomate', 18, 0.9, 3.9, 0.2],
  ['Cenoura cozida', 35, 0.8, 8.2, 0.2],
  ['Abobrinha cozida', 15, 1.1, 2.7, 0.4],
  ['Mamão papaia', 43, 0.5, 11, 0.3],
  ['Laranja', 47, 0.9, 11.8, 0.1],
  ['Morango', 32, 0.7, 7.7, 0.3],
  ['Abacate', 160, 2, 8.5, 14.7],
  ['Amêndoas', 579, 21, 22, 50],
  ['Iogurte grego natural', 97, 9, 3.9, 5],
  ['Leite desnatado', 35, 3.4, 5, 0.1],
];
// Objetivos de treino: nome, séries por exercício, repetições e descanso (segundos).
const GOALS = {
  hipertrofia: ['Ganho de massa', 4, '8–12', 75],
  forca: ['Força', 5, '3–6', 120],
  emagrecimento: ['Emagrecimento', 3, '12–15', 40],
  resistencia: ['Resistência', 3, '15–20', 30],
};
// Modelos de dia de treino: nome do dia e quantos exercícios de cada grupo muscular entram.
// Ex.: upper = 2 de peito, 2 de costas, 1 de ombros e 2 de braços.
const TPL = {
  full: ['Corpo todo', { peito: 1, costas: 1, pernas: 2, ombros: 1, core: 1 }],
  upper: ['Superiores', { peito: 2, costas: 2, ombros: 1, braços: 2 }],
  lower: ['Inferiores', { pernas: 4, core: 1 }],
  push: ['Empurrar', { peito: 2, ombros: 2 }],
  pull: ['Puxar', { costas: 3, braços: 2 }],
  legs: ['Pernas', { pernas: 4, core: 1 }],
};
// Modelos extras, usados na divisão por grupo muscular (peito, costas, ombros e braços).
Object.assign(TPL, {
  chest: ['Peito', { peito: 3, braços: 1 }],
  back: ['Costas', { costas: 3, braços: 1 }],
  sa: ['Ombros e braços', { ombros: 2, braços: 3 }],
  sh: ['Ombros', { ombros: 3, core: 1 }],
  arms: ['Braços', { braços: 4 }],
});
// Divisões antigas por número de dias (hoje substituídas por STR, mais abaixo).
const SPLIT = {
  2: ['full', 'full'],
  3: ['full', 'full', 'full'],
  4: ['upper', 'lower', 'upper', 'lower'],
  5: ['push', 'pull', 'legs', 'upper', 'lower'],
  6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
};

// ===== 3. CÁLCULOS ===========================================================

// METAS DIÁRIAS a partir do perfil: calorias, proteína, carboidrato, gordura e água.
// É chamada sempre que alguma tela precisa de uma meta.
function calc() {
  const p = S.profile,
    // Metabolismo basal (Mifflin-St Jeor): calorias gastas em repouso.
    tmb = 10 * p.peso + 6.25 * p.altura - 5 * p.idade + (p.sexo === 'm' ? 5 : -161),
    // Gasto total do dia = basal × fator de atividade (1,2 sedentário até 1,725 intenso).
    tdee = tmb * p.ativ;
  // Meta de calorias: -20% para perder gordura, +10% para ganhar massa.
  // Proteína por kg conforme o objetivo; gordura 0,9 g/kg; carboidrato = calorias restantes ÷ 4.
  // (1 g de proteína ou carboidrato = 4 kcal; 1 g de gordura = 9 kcal.)
  const kcal = Math.round(tdee * (p.obj === 'perder' ? 0.8 : p.obj === 'ganhar' ? 1.1 : 1)),
    prot = Math.round(p.peso * (p.obj === 'perder' ? 2 : p.obj === 'ganhar' ? 1.8 : 1.6)),
    fat = Math.round(p.peso * 0.9),
    carb = Math.max(0, Math.round((kcal - prot * 4 - fat * 9) / 4)),
    // Água: 35, 40 ou 45 ml por kg conforme a atividade, arredondada de 50 em 50 ml.
    agua = Math.round((p.peso * (p.ativ < 1.4 ? 35 : p.ativ < 1.7 ? 40 : 45)) / 50) * 50;
  return {
    tmb: Math.round(tmb),
    tdee: Math.round(tdee),
    kcal,
    prot,
    fat,
    carb,
    // Se o usuário definiu uma meta própria de água, ela vale; senão, usa a sugerida.
    agua: S.profile.aguaM > 0 ? S.profile.aguaM : agua,
    aguaSug: agua,
  };
}

// GERAR TREINO: monta S.plan (a lista de dias) conforme objetivo, dias e estratégia escolhidos no Início.
function gen() {
  // Lê as escolhas do Início e a prescrição do objetivo (séries, repetições, descanso).
  const { goal, loc, days } = S.wp,
    [, sets, reps, rest] = GOALS[goal],
    cnt = {},
    L = 'ABCDEF';
  // Para cada dia da estratégia escolhida, monta a lista de exercícios.
  S.plan = STR[S.wp.strat].s(days).map((t, i) => {
    const [nm, gs] = TPL[t],
      items = [];
    // Para cada grupo muscular do modelo de dia, pega a quantidade pedida de exercícios.
    // `cnt` lembra onde parou em cada grupo, assim os dias seguintes usam exercícios diferentes.
    for (const g in gs) {
      const pool = EX.filter((e) => e[1] === g),
        o = cnt[g] || 0;
      let n = 0;
      for (let k = 0; n < gs[g] && k < pool.length; k++) {
        const e = pool[(o + k) % pool.length];
        if (!items.some((x) => x.n === e[0])) {
          items.push({ n: e[0], s: sets, r: reps, rest, done: false });
          n++;
        }
      }
      cnt[g] = o + gs[g];
    }
    // Emagrecimento e resistência terminam o treino com cardio.
    if (goal === 'emagrecimento' || goal === 'resistencia') {
      const c = EX.filter((e) => e[1] === 'cardio');
      items.push({ n: c[i % c.length][0], s: 1, r: '15–20 min', rest: 0, done: false });
    }
    return { name: 'Dia ' + L[i] + ' · ' + nm, items };
  });
  // Guarda o treino gerado.
  save();
}

// Texto do "Como fazer" de cada exercício da lista.
const DESC = {
  'Supino reto':
    'Deitado no banco, desça a barra até o peito e empurre até estender os cotovelos, mantendo as escápulas juntas.',
  'Supino inclinado':
    'Mesmo movimento do supino, com o banco inclinado (30–45°), enfatizando a parte superior do peito.',
  Crucifixo:
    'Com os cotovelos levemente flexionados, abra os braços em arco até sentir o peito alongar e feche juntando as mãos.',
  'Flexão de braço':
    'Mãos na largura dos ombros e corpo alinhado; desça o peito perto do chão e empurre de volta.',
  'Flexão inclinada':
    'Mãos apoiadas em banco ou degrau; versão mais leve da flexão, boa para iniciantes.',
  'Flexão declinada':
    'Pés elevados em um banco; desça o peito até quase tocar o chão. Trabalha mais a parte superior do peito e os ombros.',
  'Puxada frontal':
    'Puxe a barra até a altura do queixo levando os cotovelos para baixo e para trás, sem balançar o tronco.',
  'Remada curvada':
    'Tronco inclinado e coluna neutra; puxe a barra em direção ao abdômen e desça com controle.',
  'Remada baixa':
    'Sentado no cabo, puxe o triângulo até o abdômen juntando as escápulas, sem jogar o tronco para trás.',
  'Barra fixa':
    'Pendurado na barra, puxe o corpo até o queixo passar da barra e desça devagar até estender os braços.',
  'Remada australiana':
    'Deitado sob uma barra baixa, com o corpo reto, puxe o peito até a barra. Quanto mais em pé o corpo, mais fácil.',
  'Superman no solo':
    'De bruços, eleve braços e pernas ao mesmo tempo, segure 2 s e desça. Fortalece lombar e costas.',
  'Agachamento livre':
    'Barra apoiada nas costas e pés na largura dos ombros; desça até as coxas ficarem paralelas ao chão, joelhos alinhados aos pés.',
  'Leg press':
    'Pés na plataforma na largura dos ombros; flexione os joelhos até cerca de 90° e empurre sem travar os joelhos.',
  'Cadeira extensora':
    'Sentado, estenda os joelhos até esticar as pernas e desça devagar. Foco no quadríceps.',
  'Mesa flexora':
    'Deitado, flexione os joelhos levando o calcanhar ao glúteo e retorne com controle. Foco na parte de trás da coxa.',
  Stiff:
    'Joelhos levemente flexionados, desça a barra rente às pernas levando o quadril para trás e suba contraindo os glúteos.',
  'Elevação pélvica':
    'Costas apoiadas no banco e barra sobre o quadril; suba o quadril até alinhar tronco e coxas, contraindo o glúteo.',
  'Agachamento com peso do corpo':
    'Pés na largura dos ombros; sente para trás como em uma cadeira, peito aberto, e volte empurrando o chão.',
  Afundo:
    'Dê um passo à frente e desça até os dois joelhos formarem cerca de 90°; empurre de volta e alterne as pernas.',
  'Agachamento búlgaro':
    'Pé de trás apoiado em um banco; desça com a perna da frente até a coxa ficar paralela ao chão.',
  'Elevação pélvica no solo':
    'Deitado, pés no chão e joelhos dobrados; suba o quadril contraindo o glúteo e desça sem apoiar no chão.',
  'Panturrilha no degrau':
    'Com a ponta dos pés no degrau, suba o máximo que puder e desça alongando o calcanhar abaixo do degrau.',
  'Agachamento com salto':
    'Agache e salte de forma explosiva, aterrissando com os joelhos flexionados para amortecer.',
  'Desenvolvimento com halteres':
    'Sentado ou em pé, empurre os halteres da altura dos ombros até acima da cabeça e desça com controle.',
  'Elevação lateral':
    'Braços ao lado do corpo, eleve os halteres até a altura dos ombros com os cotovelos levemente flexionados.',
  'Elevação frontal':
    'Eleve o halter à frente do corpo até a altura dos ombros e desça devagar, sem balançar o tronco.',
  'Flexão pike':
    'Quadril elevado, corpo em V invertido; flexione os cotovelos levando a cabeça em direção ao chão. Foco nos ombros.',
  'Elevação lateral com mochila':
    'Segure a mochila com carga pela alça e eleve o braço para o lado até a altura do ombro.',
  'Remada alta com mochila':
    'Segure a mochila à frente e puxe-a rente ao corpo até o peito, com os cotovelos acima das mãos.',
  'Rosca direta':
    'Cotovelos junto ao corpo, flexione os braços levando a barra aos ombros e desça sem balançar.',
  'Tríceps pulley':
    'Cotovelos fixos ao lado do corpo, empurre a barra para baixo até estender os braços e volte devagar.',
  'Rosca martelo':
    'Pegada neutra, com as palmas voltadas uma para a outra; flexione o cotovelo levando o halter ao ombro.',
  'Tríceps testa':
    'Deitado, flexione os cotovelos levando a barra em direção à testa e estenda sem abrir os cotovelos.',
  'Mergulho no banco':
    'Mãos apoiadas no banco atrás do corpo; flexione os cotovelos até cerca de 90° e estenda. Foco no tríceps.',
  'Barra fixa supinada':
    'Barra fixa com as palmas voltadas para você; puxe até o queixo passar da barra. Trabalha bíceps e costas.',
  'Flexão diamante':
    'Mãos juntas formando um losango sob o peito; faça a flexão com os cotovelos junto ao corpo. Foco no tríceps.',
  'Abdominal na máquina':
    'Flexione o tronco contraindo o abdômen, sem puxar com os braços, e retorne devagar.',
  Prancha:
    'Apoiado nos antebraços e nas pontas dos pés, corpo reto da cabeça aos calcanhares, abdômen contraído.',
  'Elevação de pernas':
    'Deitado ou pendurado, eleve as pernas até cerca de 90° sem arquear a lombar e desça com controle.',
  'Abdominal canivete':
    'Deitado, eleve ao mesmo tempo tronco e pernas tentando tocar os pés e retorne devagar.',
  Esteira:
    'Ajuste ritmo e inclinação para manter um esforço moderado, ainda conseguindo falar frases curtas; postura ereta.',
  'Bicicleta ergométrica':
    'Banco na altura do quadril; pedale em ritmo constante, mantendo a coluna ereta.',
  Corrida: 'Passadas leves e respiração regular; comece em ritmo confortável e aumente aos poucos.',
  'Pular corda':
    'Pule com os pés juntos usando só o movimento dos punhos, aterrissando na ponta dos pés.',
  Burpee:
    'Agache, estenda as pernas para trás, faça uma flexão, volte e salte com os braços para cima.',
  Polichinelo:
    'Salte abrindo pernas e braços acima da cabeça e volte à posição inicial em ritmo constante.',
};
// Um exercício está concluído quando TODAS as séries estão marcadas.
const exDone = (x) => {
  const l = x.log || [];
  return x.s > 0 && Array.from({ length: x.s }, (_, j) => l[j] && l[j].d).every(Boolean);
};
// Desenha as linhas de série de um exercício: caixa de marcar, repetições feitas e carga (kg) ou distância (km) no cardio.
const setRows = (x, di, i) =>
  Array.from({ length: x.s }, (_, j) => {
    const g = (x.log || [])[j] || {},
      a = `data-d="${di}" data-i="${i}" data-j="${j}"`;
    return `<div class="set${g.d ? ' on' : ''}"><input type="checkbox" data-f="sd" ${a}${g.d ? ' checked' : ''} aria-label="Série ${j + 1} feita"><span>Série ${j + 1}${g.d ? ` <small style="color:${g.xp > 0 ? 'var(--ok)' : 'var(--warn)'}">${g.xp > 0 ? '+' + r1(g.xp) + ' pts' : 'carga leve: 0 pts'}</small>` : ''}</span><input type="number" min="0" inputmode="numeric" data-f="sl" data-k="r" ${a} placeholder="${esc(x.r)}" value="${g.r ?? ''}" aria-label="${isC(x) ? 'Tempo em minutos' : 'Repetições feitas'}">${isC(x) ? (isDist(x) ? `<input type="number" min="0" step="0.1" data-f="sl" data-k="w" ${a} placeholder="km" value="${g.w ?? ''}" aria-label="Distância em km">` : '<span></span>') : `<input type="number" min="0" step="0.5" data-f="sl" data-k="w" ${a} placeholder="kg" value="${g.w ?? ''}" aria-label="Carga em kg">`}</div>`;
  }).join('');
// Converte um horário "07:30" em minutos desde meia-noite (450). Facilita as contas de horário.
const mn = (s) => {
  const [a, b] = (s || '0:0').split(':');
  return +a * 60 + +b;
};
// Faz o contrário: converte minutos em "HH:MM".
const hm = (m) => {
  m = ((Math.round(m) % 1440) + 1440) % 1440;
  return String((m / 60) | 0).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
};
// "Acordado": devolve a hora de acordar (a), a de dormir (s) e quantos minutos o usuário fica acordado (len).
const aw = () => {
  const p = S.profile,
    a = mn(p.acorda || '07:00'),
    s = mn(p.dorme || '23:00');
  return { a, s, len: (s - a + 1440) % 1440 || 1440 };
};
// Que fração do dia acordado já passou (0 a 1) em uma determinada hora. Usada no ritmo ideal de água.
const paceF = (h) => {
  const w = aw(),
    m = (h * 60 - w.a + 1440) % 1440;
  return m > w.len ? (m - w.len < (1440 - w.len) / 2 ? 1 : 0) : m / w.len;
};
// Campos de horário (acordar e dormir). Aparecem no Perfil e na Água.
const timeRow = () => `<div class="row" style="margin-top:8px">
<div><label>Horário em que acorda</label><input type="time" data-f="pr" data-k="acorda" value="${S.profile.acorda || '07:00'}"></div>
<div><label>Horário em que dorme</label><input type="time" data-f="pr" data-k="dorme" value="${S.profile.dorme || '23:00'}"></div></div>`;
// ----- Lembretes de água -----
// nextAt = momento (em milissegundos) do próximo aviso.
let nextAt = 0;
// Programa o próximo lembrete para daqui a "intervalo" minutos (ou cancela, se estiver desligado).
function armRem() {
  nextAt = S.rem.on ? Date.now() + S.rem.iv * 6e4 : 0;
}
// Quantos lembretes cabem no período em que o usuário está acordado.
const remN = () => Math.max(1, Math.floor(aw().len / S.rem.iv));
// Quanto beber em cada lembrete para atingir a meta do dia (arredondado de 10 em 10 ml).
const remAmt = () => Math.round(calc().agua / remN() / 10) * 10;
// Roda a cada 15 s e verifica se chegou a hora do lembrete. Se sim, mostra o aviso na página e, se permitido, uma notificação.
function tick() {
  // Desligado ou ainda não é hora: não faz nada.
  if (!S.rem.on || Date.now() < nextAt) return;
  nextAt = Date.now() + S.rem.iv * 6e4;
  const n = new Date(),
    w = aw();
  if ((n.getHours() * 60 + n.getMinutes() - w.a + 1440) % 1440 > w.len) return;
  const ml = remAmt(),
    t = $('#toast');
  t.innerHTML = `💧 Hora de beber água: ${ml} ml <button class="pri sm" data-act="addR" data-v="${ml}">Já bebi</button><button class="sm" data-act="hideT">Depois</button>`;
  t.hidden = false;
  try {
    // Notificação do navegador, se o usuário permitiu.
    if (window.Notification && Notification.permission === 'granted')
      new Notification('Hora de beber água', { body: ml + ' ml' });
  } catch (e) {}
}
// Liga o relógio: chama tick() a cada 15 segundos.
setInterval(tick, 15000);
// Cartão "Meta e lembretes" da página Água.
const wCfg = (c) => {
  const w = aw(),
    on = S.rem.on,
    nx = new Date(nextAt);
  return `<div class="card">
<h3 style="margin-bottom:8px">Meta e lembretes</h3>
<div class="row">
<div><label>Meta diária (ml)</label><input type="number" min="500" step="50" data-f="aguaM" value="${c.agua}"></div>
<div style="flex:0 0 auto"><button class="sm" data-act="aguaSug">Usar sugerida (${c.aguaSug} ml)</button></div></div>${timeRow()}
 <div class="row" style="margin-top:8px">
<div><label>Lembrar a cada</label><select data-f="rem">${opts(
    [
      [15, '15 min'],
      [30, '30 min'],
      [45, '45 min'],
      [60, '1 hora'],
    ],
    S.rem.iv
  )}</select></div>
<div style="flex:0 0 auto"><button class="${on ? '' : 'pri'}" data-act="remOn">${on ? 'Desativar lembretes' : 'Ativar lembretes'}</button></div></div>
 <p class="msg">Você fica acordado por ${Math.floor(w.len / 60)} h ${w.len % 60} min: são ${remN()} lembretes de ${remAmt()} ml para chegar a ${c.agua} ml.${on ? ' Próximo aviso às ' + hm(nx.getHours() * 60 + nx.getMinutes()) + '.' : ''}</p>
 <p class="sub" style="margin:4px 0 0;font-size:14px">Os avisos funcionam com o site aberto; lembretes em segundo plano dependem do app instalado.</p></div>`;
};
// Nomes das refeições conforme a quantidade escolhida por dia (3 a 6).
const NAMES = {
  3: ['Café da manhã', 'Almoço', 'Jantar'],
  4: ['Café da manhã', 'Almoço', 'Lanche', 'Jantar'],
  5: MEALS,
  6: ['Café da manhã', 'Lanche da manhã', 'Almoço', 'Lanche da tarde', 'Jantar', 'Ceia'],
};
// ----- Cardápio automático -----

// Etiquetas de alimentos para respeitar a preferência alimentar:
//   M = carne ou peixe (não vegetariano)   L = contém lactose
const TG = {};
[
  'Frango grelhado',
  'Carne bovina magra grelhada',
  'Tilápia grelhada',
  'Salmão grelhado',
  'Atum em conserva',
].forEach((n) => (TG[n] = 'M'));
[
  'Leite integral',
  'Leite desnatado',
  'Iogurte natural',
  'Iogurte grego natural',
  'Queijo minas frescal',
  'Queijo cottage',
  'Whey protein',
].forEach((n) => (TG[n] = 'L'));
// Procura um alimento na tabela FOODS pelo nome.
const fd = (n) => FOODS.find((f) => f[0] === n);
// O alimento é permitido na preferência do usuário (sem restrição, vegetariano ou sem lactose)?
const dietOk = (n) => {
  const d = S.profile.dieta || 'onivoro',
    t = TG[n] || '';
  return d === 'vegetariano' ? t !== 'M' : d === 'semlactose' ? t !== 'L' : true;
};
// Cria um item de refeição: calcula kcal e macros para a quantidade em gramas. `role` indica o papel do item (P proteína, C carboidrato, F fruta, V vegetal, L leguminosa, O óleo, N castanhas).
const mk = (n, g, role) => {
  const f = fd(n),
    r = g / 100;
  return { n, g, role, k: f[1] * r, p: f[2] * r, c: f[3] * r, f: f[4] * r };
};
// Funções auxiliares:  rg(g, s) = arredonda g para múltiplos de s.   cl(v, a, b) = limita v entre a e b.
const rg = (g, s) => Math.round(g / s) * s,
  cl = (v, a, b) => Math.min(b, Math.max(a, v));
// Porção padrão de cada fruta, em gramas.
const fruitG = (n) => ({ Banana: 100, Maçã: 130 })[n] || 150;
// Soma n dias a uma data "AAAA-MM-DD".
const addD = (d, n) => {
  const x = new Date(d + 'T12:00:00');
  x.setDate(x.getDate() + n);
  return ymd(x);
};
// Mostra um aviso curto na barra inferior (o mesmo local dos lembretes).
const note = (m) => {
  const t = $('#toast');
  t.innerHTML = esc(m) + ' <button class="sm" data-act="hideT">Ok</button>';
  t.hidden = false;
};
// Listas de alimentos candidatos por papel na refeição (proteína, carboidrato, fruta...), que mudam conforme o objetivo.
// O gerador escolhe um item de cada lista, girando conforme o dia, para variar o cardápio.
const POOLS = (g) => {
  const L = g === 'perder',
    G = g === 'ganhar';
  return {
    prot: L
      ? [
          'Frango grelhado',
          'Tilápia grelhada',
          'Atum em conserva',
          'Ovo cozido',
          'Tofu',
          'Frango grelhado',
        ]
      : G
        ? [
            'Carne bovina magra grelhada',
            'Frango grelhado',
            'Salmão grelhado',
            'Ovo cozido',
            'Tilápia grelhada',
            'Tofu',
          ]
        : [
            'Frango grelhado',
            'Carne bovina magra grelhada',
            'Tilápia grelhada',
            'Salmão grelhado',
            'Ovo cozido',
            'Tofu',
          ],
    carb: L
      ? ['Batata-doce cozida', 'Arroz integral cozido', 'Batata inglesa cozida', 'Mandioca cozida']
      : G
        ? [
            'Arroz cozido',
            'Macarrão cozido',
            'Batata-doce cozida',
            'Arroz cozido',
            'Mandioca cozida',
          ]
        : [
            'Arroz cozido',
            'Batata-doce cozida',
            'Arroz integral cozido',
            'Macarrão cozido',
            'Mandioca cozida',
          ],
    leg: ['Feijão cozido', 'Lentilha cozida', 'Feijão cozido', 'Grão-de-bico cozido'],
    veg: ['Brócolis cozido', 'Cenoura cozida', 'Abobrinha cozida', 'Brócolis cozido'],
    cafeP: L
      ? ['Ovo cozido', 'Queijo cottage', 'Iogurte grego natural', 'Whey protein']
      : [
          'Ovo cozido',
          'Queijo minas frescal',
          'Iogurte grego natural',
          'Queijo cottage',
          'Whey protein',
        ],
    cafeC: L
      ? ['Pão integral', 'Aveia em flocos']
      : G
        ? ['Pão francês', 'Aveia em flocos', 'Pão integral']
        : ['Pão integral', 'Aveia em flocos', 'Pão francês'],
    fruit: ['Banana', 'Maçã', 'Mamão papaia', 'Laranja', 'Morango'],
    snkP: L
      ? ['Iogurte grego natural', 'Whey protein', 'Queijo cottage', 'Ovo cozido']
      : [
          'Iogurte grego natural',
          'Whey protein',
          'Queijo minas frescal',
          'Queijo cottage',
          'Ovo cozido',
        ],
    snkC: ['Aveia em flocos', 'Pão integral', 'Banana'],
    ceiaP: ['Queijo cottage', 'Iogurte grego natural', 'Whey protein', 'Ovo cozido', 'Tofu'],
  };
};
// Monta UMA refeição:
//   type = tipo (cafe, main = almoço/jantar, snack = lanche, ceia)   t = metas da refeição
//   sd = número usado para variar a escolha   goal = objetivo (perder, manter, ganhar)
// Estratégia: coloca os itens de quantidade fixa (fruta, legumes) e calcula as gramas da proteína
// e do carboidrato para chegar perto das metas da refeição.
function genMeal(type, t, sd, goal) {
  const P = POOLS(goal),
    it = [],
    add = (n, g, r) => {
      if (n && g > 0) it.push(mk(n, g, r));
    },
    pk = (a, o) => {
      const l = a.filter(dietOk);
      return l.length ? l[(sd + o) % l.length] : null;
    },
    pg = (n, rem, mn, mx) => {
      const w = n === 'Whey protein';
      return cl(
        rg((Math.max(0, rem) / (fd(n)[2] || 0.1)) * 100, w ? 5 : 10),
        w ? 20 : mn,
        w ? 60 : Math.min(mx, { 'Ovo cozido': 150, Tofu: 250 }[n] || mx)
      );
    },
    cg = (n, rem, mn, mx) => cl(rg((Math.max(0, rem) / (fd(n)[3] || 1)) * 100, 5), mn, mx),
    left = (k) => t[k] - sum(it)[k];
  // Almoço/jantar: leguminosa + legumes + salada, depois proteína e carboidrato calculados, e um fio de azeite.
  if (type === 'main') {
    add(pk(P.leg, 0), goal === 'perder' ? 80 : goal === 'ganhar' ? 120 : 100, 'L');
    add(pk(P.veg, 1), goal === 'perder' ? 120 : 100, 'V');
    add('Alface', 50, 'V');
    const pr = pk(P.prot, 2);
    if (pr) add(pr, pg(pr, left('p'), 60, 300), 'P');
    const cr = pk(P.carb, 3);
    add(cr, cg(cr, left('c'), 40, 450), 'C');
    add('Azeite de oliva', cl(Math.round(left('f')), 3, goal === 'perder' ? 8 : 15), 'O');
  // Café da manhã: fruta, proteína (ovo, queijo, iogurte ou whey) e carboidrato (pão ou aveia).
  } else if (type === 'cafe') {
    const fr = pk(P.fruit, 1);
    add(fr, fruitG(fr), 'F');
    const pr = pk(P.cafeP, 0);
    if (pr) add(pr, pg(pr, left('p'), 50, 300), 'P');
    const cr = pk(P.cafeC, 2);
    add(cr, cg(cr, left('c'), 30, 200), 'C');
  // Lanche: fruta, castanhas/pasta de amendoim (exceto para perder gordura), proteína e carboidrato se faltar.
  } else if (type === 'snack') {
    const fr = pk(P.fruit, 0);
    add(fr, fruitG(fr), 'F');
    if (goal !== 'perder') add('Pasta de amendoim', goal === 'ganhar' ? 25 : 12, 'N');
    const sp = pk(P.snkP, 1);
    if (sp) add(sp, pg(sp, left('p'), 50, 300), 'P');
    if (left('c') > 20) {
      const cr = pk(P.snkC, 2);
      if (cr && cr !== fr) add(cr, cg(cr, left('c'), 20, 120), 'C');
    }
  } else {
    const pr = pk(P.ceiaP, 0);
    if (pr) add(pr, pg(pr, t.p, 50, 300), 'P');
    const fr = pk(P.fruit, 3);
    add(fr, fruitG(fr), 'F');
    if (left('c') > 15) add('Aveia em flocos', cg('Aveia em flocos', left('c'), 15, 60), 'C');
  }
  // Lista de itens da refeição.
  return it;
}
// "Assinatura" do perfil usada para detectar se o cardápio ficou desatualizado (metas, objetivo, preferência ou horários mudaram).
const sigOf = (c, n) =>
  [
    c.kcal,
    c.prot,
    c.carb,
    c.fat,
    n,
    S.profile.obj,
    S.profile.dieta || 'onivoro',
    S.profile.acorda || '',
    S.profile.dorme || '',
  ].join('|');
// Gera o cardápio de UM dia: divide as metas entre as refeições, monta cada uma com genMeal()
// e, no fim, ajusta os carboidratos para o total de calorias chegar perto da meta.
function genMenu(dt, vv) {
  // c = metas do dia; n = quantidade de refeições; w = horários acordado/dormindo; nm = nomes das refeições.
  // t0 = primeira refeição (30 min após acordar); t1 = última (2h30 antes de dormir); st = intervalo entre refeições.
  // wt = "peso" de cada refeição (lanches e ceia valem menos); sw = soma dos pesos; dn = número do dia (para variar o cardápio).
  const c = calc(),
    n = S.profile.refs || 5,
    w = aw(),
    nm = NAMES[n],
    t0 = w.a + 30,
    t1 = w.a + w.len - 150,
    st = (t1 - t0) / (n - 1),
    wt = nm.map((x) => (/Lanche|Ceia/.test(x) ? 0.7 : 1.2)),
    sw = wt.reduce((a, b) => a + b, 0),
    goal = S.profile.obj || 'manter',
    dn = Math.floor(new Date(dt + 'T12:00:00') / 864e5);
  // Para cada refeição: s = fatia do dia, type = tipo, t = metas da refeição, seed = número que varia a escolha dos alimentos.
  const meals = nm.map((x, i) => {
    const s = wt[i] / sw,
      type = /Café/.test(x)
        ? 'cafe'
        : /Almoço|Jantar/.test(x)
          ? 'main'
          : /Ceia/.test(x)
            ? 'ceia'
            : 'snack',
      t = { k: c.kcal * s, p: c.prot * s, c: c.carb * s, f: c.fat * s },
      seed = dn + vv * 7 + i * 3;
    return { name: x, time: hm(t0 + st * i), type, t, seed, items: genMeal(type, t, seed, goal) };
  });
  // Ajuste de calorias (até 3 tentativas): se o total ficou longe da meta, aumenta ou diminui só os carboidratos.
  for (let r = 0; r < 3; r++) {
    const tk = sum(meals.flatMap((m) => m.items)).k,
      f = cl(c.kcal / (tk || 1), 0.7, 1.4);
    if (Math.abs(f - 1) < 0.04) break;
    meals.forEach(
      (m) =>
        (m.items = m.items.map((e) =>
          e.role === 'C' ? mk(e.n, cl(rg(e.g * f, 5), 30, 450), 'C') : e
        ))
    );
  }
  return { sig: sigOf(c, n), n, vv, meals };
}
// Cartão "Plano de refeições" da página Dieta: horários, cardápio sugerido e botões.
const mealPlan = (c) => {
  // Mesmos horários e fatias do gerador. mu = cardápio do dia; ok = cardápio compatível com o número de refeições;
  // stale = perfil mudou desde que foi gerado; T = totais do cardápio.
  const n = S.profile.refs || 5,
    w = aw(),
    nm = NAMES[n],
    t0 = w.a + 30,
    t1 = w.a + w.len - 150,
    st = (t1 - t0) / (n - 1),
    wt = nm.map((x) => (/Lanche|Ceia/.test(x) ? 0.7 : 1.2)),
    sw = wt.reduce((a, b) => a + b),
    mu = S.menu[date],
    ok = mu && mu.n === n,
    stale = ok && mu.sig !== sigOf(c, n),
    T = ok ? sum(mu.meals.flatMap((m) => m.items)) : null;
  return `<div class="card">
<h3 style="margin-bottom:8px">Plano de refeições</h3>
<div class="row">
<div><label>Refeições por dia</label><select data-f="pr" data-k="refs">${opts(
    [3, 4, 5, 6].map((v) => [v, v]),
    n
  )}</select></div></div>
 <div class="row" style="margin-top:8px"><button class="pri" data-act="genMenu">${ok ? 'Gerar outro cardápio' : 'Gerar cardápio do dia'}</button><button data-act="genWeek">Gerar 7 dias</button>${mu ? '<button data-act="clrMenu">Apagar cardápio</button>' : ''}</div>
 ${stale || (mu && !ok) ? '<p class="msg" style="color:var(--warn)">O perfil ou o número de refeições mudou desde que este cardápio foi gerado. Gere novamente para atualizar.</p>' : ''}
 ${T ? `<p class="msg">Cardápio: ${Math.round(T.k)} kcal · P ${Math.round(T.p)} · C ${Math.round(T.c)} · G ${Math.round(T.f)} g<br><small style="color:var(--mu)">Meta: ${c.kcal} kcal · P ${c.prot} · C ${c.carb} · G ${c.fat} g. Quantidades em g, alimentos já cozidos ou prontos.${T.p < c.prot * 0.9 ? ' A proteína ficou abaixo da meta: considere uma fonte extra (por exemplo, whey ou mais leguminosas).' : ''}</small></p>` : ''}
 ${c.kcal < 1400 || S.profile.idade < 18 ? '<p class="msg" style="color:var(--warn)">Sua meta calórica é baixa ou você tem menos de 18 anos: converse com um nutricionista antes de seguir um cardápio.</p>' : ''}
 ${nm
   .map((x, i) => {
     const s = wt[i] / sw,
       m = ok ? mu.meals[i] : null;
     if (!m)
       return `<div class="li"><span>${hm(t0 + st * i)} · ${x}</span><small>~${Math.round(c.kcal * s)} kcal · P ${Math.round(c.prot * s)} · C ${Math.round(c.carb * s)} · G ${Math.round(c.fat * s)} g</small></div>`;
     const ms = sum(m.items);
     return `<div style="border-top:1px solid var(--bd);padding:8px 0">
<div class="row" style="align-items:center"><b style="flex:1 1 140px">${m.time} · ${esc(m.name)}</b><small style="flex:0 1 auto;color:var(--mu)">${Math.round(ms.k)} kcal · P ${Math.round(ms.p)} · C ${Math.round(ms.c)} · G ${Math.round(ms.f)}</small></div>
  ${m.items.map((e) => `<div class="li" style="border:0;padding:3px 0"><span>${esc(e.n)}${e.n === 'Ovo cozido' ? ` (≈${Math.max(1, Math.round(e.g / 50))} un)` : ''}</span><small>${e.g} g · ${Math.round(e.k)} kcal</small></div>`).join('')}
  <div class="row" style="margin-top:6px"><button class="sm${m.ids ? '' : ' pri'}" data-act="${m.ids ? 'undoM' : 'regM'}" data-i="${i}">${m.ids ? 'Registrado ✓ (desfazer)' : 'Registrar refeição'}</button>${m.ids ? '' : `<button class="sm" data-act="swapM" data-i="${i}">Trocar</button>`}</div></div>`;
   })
   .join('')}
 <p class="sub" style="margin:8px 0 0;font-size:14px">Intervalo de cerca de ${r1(st / 60)} h entre refeições, do despertar até 2h30 antes de dormir. O cardápio usa suas metas, seu objetivo, sua preferência alimentar e seus horários (perfil).</p></div>`;
};
// Soma kcal (k), proteína (p), carboidrato (c) e gordura (f) de uma lista de itens.
const sum = (l) =>
  l.reduce((a, e) => ({ k: a.k + e.k, p: a.p + e.p, c: a.c + e.c, f: a.f + e.f }), {
    k: 0,
    p: 0,
    c: 0,
    f: 0,
  });
// Arredonda para 1 casa decimal.
const r1 = (n) => Math.round(n * 10) / 10;
// Desenha uma barra de progresso: v = valor atual, m = máximo, col = cor.
const bar = (v, m, col) =>
  `<div class="bar"><i style="width:${Math.min(100, m ? (v / m) * 100 : 0)}%;background:${col}"></i></div>`;
// Monta as opções de uma lista de seleção (<select>). `sel` é a opção marcada.
const opts = (a, sel) =>
  a
    .map(
      ([v, t]) =>
        `<option value="${v}"${String(v) === String(sel) ? ' selected' : ''}>${esc(t)}</option>`
    )
    .join('');

// Estratégias de divisão do treino: n = nome, d = dias possíveis por semana,
// s = função que devolve a lista de modelos de dia (de TPL), t = descrição.
const STR = {
  full: {
    n: 'Corpo todo (full body)',
    d: [2, 3, 4],
    s: (d) => Array(d).fill('full'),
    t: 'Todos os grupos musculares em cada treino.',
  },
  ul: {
    n: 'Superiores e inferiores',
    d: [2, 4, 6],
    s: (d) => Array.from({ length: d }, (_, i) => (i % 2 ? 'lower' : 'upper')),
    t: 'Alterna treinos de parte superior do corpo e de pernas.',
  },
  ppl: {
    n: 'Empurrar, puxar e pernas',
    d: [3, 6],
    s: (d) => Array.from({ length: d }, (_, i) => ['push', 'pull', 'legs'][i % 3]),
    t: 'Empurrar (peito, ombros), puxar (costas, bíceps) e pernas.',
  },
  hib: {
    n: 'Híbrido: empurrar, puxar, pernas + superiores e inferiores',
    d: [5],
    s: () => ['push', 'pull', 'legs', 'upper', 'lower'],
    t: 'Combina os dois modelos anteriores para chegar a 5 dias.',
  },
  grp: {
    n: 'Peito, costas, pernas e braços (por grupo)',
    d: [4, 5],
    s: (d) => (d === 4 ? ['chest', 'back', 'legs', 'sa'] : ['chest', 'back', 'legs', 'sh', 'arms']),
    t: 'Um grupo muscular principal por dia, no estilo de divisão clássica.',
  },
};
// Quantas vezes por semana cada músculo é treinado em cada estratégia (com d dias).
const FQ = { full: (d) => d, ul: (d) => d / 2, ppl: (d) => d / 3, hib: () => 2, grp: () => 1 };
// Textos das etiquetas de indicação.
const BL = { rec: 'Recomendada', ok: 'Possível', low: 'Menos indicada' };
// Indica se uma estratégia é Recomendada, Possível ou Menos indicada para o objetivo, com base na frequência semanal.
function rate(g, k, d) {
  const f = FQ[k](d);
  if (f < 2)
    return g === 'hipertrofia'
      ? [
          'ok',
          'Possível se o volume semanal por músculo for alto; treinar 1× por semana tende a ser menos eficiente.',
        ]
      : ['low', 'Menos indicada: cada músculo é treinado só 1× por semana.'];
  if (g !== 'hipertrofia' && (k === 'ppl' || k === 'grp' || k === 'hib'))
    return [
      'ok',
      'Boa opção, mas ocupa mais tempo e não há vantagem comprovada para este objetivo.',
    ];
  return ['rec', 'Recomendada: cada músculo é treinado 2× ou mais por semana.'];
}
// ===== 4. AS PÁGINAS =========================================================
// Cada função abaixo (vI, vT, vE, vD, vA, vP) devolve o HTML da página, montado a partir de `S`.
// O "v" vem de "view" (visão).

// PÁGINA INÍCIO: objetivo, dias por semana e escolha da estratégia.
function vI() {
  const w = S.wp,
    av = Object.keys(STR).filter((k) => STR[k].d.includes(w.days));
  // av = estratégias disponíveis para os dias escolhidos. Se a estratégia salva não serve mais, escolhe a primeira recomendada.
  if (!av.includes(w.strat))
    w.strat = av.find((k) => rate(w.goal, k, w.days)[0] === 'rec') || av[0];
  const g = GOALS[w.goal];
  return `<h2>Início</h2>
<p class="sub">Defina seu objetivo, quantos dias treina por semana e a estratégia de divisão dos treinos.</p>
 <div class="card">
<div class="row">
<div><label>Objetivo do treino</label><select aria-label="Objetivo" data-f="wp" data-k="goal">${opts(
    Object.entries(GOALS).map(([k, v]) => [k, v[0]]),
    w.goal
  )}</select></div>
 <div><label>Dias por semana</label><select aria-label="Dias" data-f="wp" data-k="days">${opts(
   [2, 3, 4, 5, 6].map((n) => [n, n]),
   w.days
 )}</select></div></div>
 <p class="msg" style="color:var(--mu)">Prescrição inicial: ${g[1]} séries de ${g[2]} repetições, descanso de ${g[3]} s${w.goal === 'emagrecimento' || w.goal === 'resistencia' ? ', com cardio no fim do treino' : ''}.</p></div>
 <div class="card">
<h3>Estratégia da semana</h3>
<p class="sub" style="margin:2px 0 0">Opções disponíveis para ${w.days} dias, com a indicação para o seu objetivo.</p>
 ${av
   .map((k) => {
     const [r, tx] = rate(w.goal, k, w.days);
     return `<label class="opt"><input type="radio" name="st" data-f="wp" data-k="strat" value="${k}"${k === w.strat ? ' checked' : ''}><span><b>${STR[k].n}</b> <span class="pill ${r}">${BL[r]}</span><small>${STR[k].t}</small><small>${tx}</small></span></label>`;
   })
   .join('')}
 <div style="margin-top:12px"><button class="pri" data-act="gen">Gerar treino</button></div>
<p class="sub" style="margin:8px 0 0;font-size:14px">${S.plan.length ? 'Gerar um novo treino substitui o atual.' : 'Depois de gerar, você ajusta tudo na aba Treino.'}</p></div>
 <div class="card ev">
<details>
<summary>O que dizem os estudos</summary>
 <p><b>Hipertrofia.</b> Uma meta-análise de 2016 associou treinar o músculo mais de 1× por semana a ganhos maiores. Revisões posteriores mostram que, com o volume semanal igualado, a frequência e o tipo de divisão (corpo todo ou dividido) não mudam de forma relevante o ganho de massa.</p>
 <p><b>Força.</b> Frequências maiores deram mais força, mas o efeito vem principalmente do maior volume semanal; com volume igual não há diferença significativa. Frequência alta é uma forma prática de acumular volume.</p>
 <p><b>Emagrecimento e resistência.</b> Não encontrei estudos que relacionem esses objetivos a uma divisão específica. A indicação aqui usa critérios práticos: tempo disponível, recuperação e regularidade, com cardio ao final.</p>
 <p><b>Na prática:</b> o objetivo influencia mais o volume, a carga e o descanso do que a estratégia. Por isso as indicações acima priorizam treinar cada músculo ao menos 2× por semana e escolher o que cabe na sua rotina.</p>
 <p style="color:var(--mu);font-size:14px">Referências: Schoenfeld, Ogborn e Krieger (2016, Sports Medicine); Grgic et al. (2018, Sports Medicine); Ralston et al. (2018, Sports Medicine Open); Grgic, Schoenfeld e Latella (2019, J Sci Med Sport); Ramos-Campo et al. (2024, J Strength Cond Res).</p></details></div>`;
}
// Mapa nome do exercício → grupo muscular, criado a partir da lista EX.
const GRP = Object.fromEntries(EX.map((e) => [e[0], e[1]]));
// ----- Evolução muscular -----

// Níveis: nome, cor e pontos mínimos (m) para alcançar cada um.
const LV = [
  { n: 'Sem treino', c: '#9ca3af', m: 0 },
  { n: 'Iniciante', c: '#38bdf8', m: 1 },
  { n: 'Básico', c: '#34d399', m: 25 },
  { n: 'Intermediário', c: '#facc15', m: 70 },
  { n: 'Avançado', c: '#fb923c', m: 160 },
  { n: 'Elite', c: '#c026d3', m: 300 },
];
// selM = músculo selecionado na página Evolução; evoArm = confirmação do botão "Zerar evolução".
let selM = 'peito',
  evoArm = false;
// Compatibilidade: pontos antigos de "pernas" e "braços" passam para quadríceps e bíceps.
const LEG = { quadriceps: ['pernas'], biceps: ['braços'] },
  dv = (d, g) => (d[g] || 0) + (LEG[g] || []).reduce((a, k) => a + (d[k] || 0), 0);
// Total de pontos de um músculo somando todos os dias.
const tot = (g) => Object.values(S.dd).reduce((a, d) => a + dv(d, g), 0);
// Descobre o nível (0 a 5) a partir dos pontos.
const lvl = (x) => LV.reduce((a, l, i) => (x >= l.m ? i : a), 0);
// Dá (ou retira) os pontos de uma série quando ela é marcada ou desmarcada.
// x = exercício, g = a série. Avisa quando o músculo sobe de nível.
function award(x, g) {
  gmOf(x); // garante que exercícios criados pelo usuário tenham um grupo sugerido
  const gr = x.gm || FM(x.n);
  // Se a série já tinha dado pontos antes, devolve esses pontos primeiro (evita contar duas vezes ao editar).
  if (g.xp && g.gr) {
    const o = S.dd[g.dt];
    if (o) o[g.gr] = Math.max(0, (o[g.gr] || 0) - g.xp);
  }
  g.xp = 0;
  // Só pontua se a série estiver marcada e o exercício tiver um grupo muscular (cardio não pontua).
  if (!g.d || !gr || gr === 'cardio') return;
  const b0 = lvl(tot(gr)),
    p = pts(x, g);

  const dt = ymd(new Date());
  S.dd[dt] = S.dd[dt] || {};
  S.dd[dt][gr] = (S.dd[dt][gr] || 0) + p;
  g.xp = p;
  g.gr = gr;
  g.dt = dt;
  const a = lvl(tot(gr));
  // Subiu de nível: mostra o aviso.
  if (a > b0) {
    const t = $('#toast');
    t.innerHTML = `🎉 ${MN[gr]} subiu para ${LV[a].n}! <button class="sm" data-act="hideT">Ok</button>`;
    t.hidden = false;
  }
}
// Define o grupo muscular detalhado de um exercício (ex.: perna → quadríceps, posterior, glúteos ou panturrilha).
const FM = (n) => {
  const g = GRP[n];
  if (g === 'pernas')
    return /Panturrilha/.test(n)
      ? 'panturrilha'
      : /pélvica/.test(n)
        ? 'gluteos'
        : /flexora|Stiff/.test(n)
          ? 'posterior'
          : 'quadriceps';
  if (g === 'braços') return /Tríceps|Mergulho|diamante/.test(n) ? 'triceps' : 'biceps';
  return g;
};
// Nomes dos grupos musculares mostrados na tela.
const MN = {
  peito: 'Peito',
  costas: 'Costas e trapézio',
  ombros: 'Ombros (deltoides)',
  biceps: 'Bíceps e antebraço',
  triceps: 'Tríceps e antebraço',
  core: 'Abdômen e oblíquos',
  quadriceps: 'Quadríceps',
  posterior: 'Posterior de coxa',
  gluteos: 'Glúteos',
  panturrilha: 'Panturrilhas',
};
// Exercícios feitos com o peso do corpo: que fração do peso do usuário conta como carga (ex.: flexão ≈ 64%).
const BWF = [
  [/Flexão diamante|Flexão de braço/, 0.64],
  [/Flexão inclinada/, 0.5],
  [/Flexão declinada/, 0.75],
  [/Flexão pike/, 0.6],
  [/Barra fixa/, 1],
  [/Remada australiana/, 0.6],
  [/Mergulho/, 0.6],
  [/peso do corpo/, 0.7],
  [/Afundo/, 0.6],
  [/búlgaro/, 0.65],
  [/no solo|Superman/, 0.5],
  [/degrau/, 0.8],
  [/salto/, 0.7],
  [/Prancha|Abdominal canivete|Elevação de pernas/, 0.4],
];
// PONTOS DE UMA SÉRIE (o coração da Evolução).
//   1) carga = carga extra informada + fração do peso do corpo (nos exercícios que usam o corpo)
//   2) força estimada para 1 repetição (1RM, fórmula de Epley) = carga × (1 + repetições ÷ 30)
//   3) compara com o melhor registro do exercício:
//        abaixo de 60% do melhor → 0 ponto (carga leve demais)
//        entre 60% e 100% → de 0,6 a 1 ponto
//        novo recorde → +1 ponto extra (uma vez por dia por exercício)
//   Sem carga informada, a série vale 0,5.
function pts(x, g) {
  // dt = hoje; r = repetições (no máximo 12 contam); f = fração do peso do corpo; L = carga total.
  const dt = ymd(new Date()),
    r = Math.min(+g.r || parseInt(x.r) || 10, 12),
    f = (BWF.find((b) => b[0].test(x.n)) || [])[1],
    L = (f ? f * (S.profile.peso || 70) : 0) + (+g.w || 0);
  // Sem carga informada: vale meio ponto.
  if (!(L > 0)) return 0.5;
  const e = L * (1 + r / 30),
    ref = S.e1[x.n] || 0;
  let p = 1;
  if (ref > 0) {
    const q = e / ref;
    p = q < 0.6 ? 0 : Math.min(1, q);
    if (e > ref * 1.005 && S.bd[x.n] !== dt) {
      p += 1;
      S.bd[x.n] = dt;
    }
  }
  // Atualiza o melhor registro de força do exercício.
  if (e > ref) S.e1[x.n] = e;
  return p;
}
// Lista "Força estimada por exercício" (os 10 maiores valores) da página Evolução.
const eList = () => {
  const a = Object.entries(S.e1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  return a.length
    ? `<div class="card">
<h3 style="margin-bottom:6px">Força estimada por exercício</h3>${a.map(([n, v]) => `<div class="li"><span>${esc(n)}</span><b>${Math.round(v)} kg</b></div>`).join('')}<p class="sub" style="margin:6px 0 0;font-size:14px">Carga estimada para 1 repetição máxima, considerando carga e repetições. É ela que define se cada série conta e se você evoluiu.</p></div>`
    : '';
};
// Imagem anatômica de base (arquivo em assets/).
const IMG = 'assets/anatomia.webp';
// Regiões clicáveis do corpo: para cada grupo muscular, uma lista de polígonos (pontos x,y)
// desenhados sobre a imagem. São só coordenadas, por isso parecem "números soltos".
const ZN = {
  ombros: [
    '1032,199 1029,204 1030,213 1020,245 1024,250 1029,279 1054,287 1072,298 1077,299 1078,261 1076,251 1070,245 1070,232 1062,218 1054,209 1042,201',
    '315,198 276,202 265,208 253,220 240,248 236,280 240,280 276,298 296,297 299,285 299,250 308,241 323,214 323,211',
    '793,194 780,198 767,205 758,214 751,225 745,241 741,263 741,282 744,302 748,302 774,287 795,281 799,277 802,250 806,247 797,213 798,203',
    '500,195 494,202 493,214 510,246 518,253 519,270 522,282 521,299 536,297 557,281 562,281 566,285 575,284 576,263 574,252 569,237 559,220 547,209 528,202 519,196 510,193',
  ],
  peito: [
    '300,250 300,285 297,298 317,313 360,322 382,322 404,319 450,322 494,314 513,305 520,297 521,282 518,270 517,253 509,246 494,216 489,213 449,206 412,213 401,213 369,206 324,213 309,241',
  ],
  core: [
    '514,306 508,307 494,315 450,323 432,323 409,320 382,323 360,323 319,315 308,308 300,313 295,362 311,393 314,420 311,452 313,485 309,501 313,505 320,507 374,507 398,520 409,520 439,507 487,507 494,505 500,499 510,483 506,459 501,451 498,429 501,391 512,371 521,372 525,388 527,388 527,378 520,344 518,321',
  ],
  biceps: [
    '559,281 536,298 520,300 515,304 519,321 521,344 528,378 528,396 537,415 539,424 541,453 537,465 558,507 564,509 571,521 589,564 594,564 595,549 620,549 615,513 615,472 608,439 599,419 586,397 583,387 581,344 574,318 576,285 566,286',
    '240,281 237,281 238,315 234,316 229,321 226,330 222,387 216,393 205,411 192,437 184,471 184,491 181,495 175,525 169,541 169,545 173,550 190,556 194,561 202,561 205,558 251,480 257,463 259,450 266,435 269,408 279,387 286,363 293,362 299,313 305,308 305,305 296,298 274,298',
  ],
  quadriceps: [
    '311,514 302,522 300,548 294,574 288,620 287,715 289,718 289,739 292,760 302,798 303,809 311,814 350,821 357,819 376,797 380,782 388,731 396,702 398,687 407,686 409,689 411,712 415,729 419,770 435,810 440,815 447,817 477,817 484,815 494,807 506,775 514,741 520,694 522,613 516,568 511,546 509,518 504,514 495,511 435,511 428,513 411,527 404,527 395,519 380,511 320,511',
  ],
  costas: [
    '881,95 863,109 865,126 869,133 868,156 856,166 836,176 795,192 795,197 799,203 798,213 806,239 806,248 803,250 799,278 801,282 800,293 802,295 794,369 795,372 803,373 817,408 822,439 819,479 841,483 867,474 876,474 882,481 907,496 914,504 919,505 925,495 945,482 950,475 965,475 984,482 1003,480 999,433 1004,404 1015,382 1020,366 1033,365 1025,305 1025,296 1027,294 1026,283 1028,277 1023,250 1020,248 1020,241 1029,213 1030,197 986,178 962,175 961,167 946,155 945,129 948,122 949,110 956,106 956,104 946,96',
  ],
  triceps: [
    '1029,281 1027,283 1028,294 1025,297 1033,356 1034,378 1047,414 1049,436 1059,455 1062,470 1068,478 1072,479 1072,493 1076,501 1109,548 1122,573 1128,574 1140,571 1149,564 1150,545 1140,504 1136,497 1136,479 1132,455 1128,441 1115,420 1107,411 1102,409 1104,398 1098,389 1095,379 1094,358 1091,354 1091,338 1087,325 1075,300 1054,288',
    '799,281 774,288 745,305 745,315 739,332 739,337 742,338 742,371 735,372 735,384 732,393 725,405 725,409 719,414 710,432 703,454 700,476 699,524 694,554 731,554 742,531 759,503 767,484 774,454 782,438 783,415 789,397 794,372 794,356 799,326 800,303 802,300',
  ],
  gluteos: [
    '819,480 819,494 803,552 798,584 799,605 816,639 833,648 851,651 888,650 904,646 904,637 907,632 919,633 920,644 943,648 1005,646 1008,644 1021,644 1029,626 1027,618 1026,582 1020,550 1003,490 1003,481 984,483 965,476 950,476 945,483 925,496 919,505 914,505 907,497 882,482 875,474 841,484',
  ],
  posterior: [
    '920,645 919,673 922,705 934,759 939,803 949,822 973,852 982,853 995,849 1014,840 1014,824 1028,777 1027,764 1032,754 1034,742 1037,692 1021,645 965,649 943,649',
    '808,640 799,650 791,679 790,696 792,724 797,754 806,794 817,824 817,836 834,850 840,852 863,854 883,849 888,846 890,785 904,706 906,682 904,648 888,651 851,652 833,649 815,639',
  ],
  panturrilha: [
    '833,852 817,857 816,877 806,908 805,940 831,1052 834,1074 862,1074 868,1058 871,1037 872,994 881,975 885,960 884,926 876,897 876,882 881,872 882,865 862,855',
    '991,850 950,868 959,890 959,899 953,926 952,950 957,973 967,990 969,1018 975,1048 976,1063 985,1073 1007,1074 1011,1073 1013,1041 1017,1036 1032,950 1032,924 1028,903 1016,871 1016,859 999,850',
    '465,849 436,857 437,869 427,913 428,942 439,969 440,993 447,1027 447,1049 441,1074 472,1074 476,1066 493,997 508,923 507,888 496,857',
    '314,846 299,849 288,877 282,902 282,928 286,954 290,961 289,979 302,1046 303,1074 340,1073 336,1052 338,1022 346,990 348,970 356,956 361,942 363,912 356,875 357,861 323,847',
  ],
};
// Monta o desenho SVG da Evolução: a imagem de base + um polígono colorido por músculo.
// `st(g)` devolve [cor, selecionado?, treinado hoje?, descrição, tem nível?] de cada grupo.
function anatSvg(st) {
  return (
    `<svg viewBox="100 0 1130 1199" width="100%" style="display:block" role="img" aria-label="Anatomia muscular com o nível de cada músculo"><image href="${IMG}" x="0" y="0" width="1312" height="1199"/>` +
    Object.entries(ZN)
      .map(([g, ps]) => {
        const [c, s, t, l, n] = st(g);
        return `<g data-act="mus" data-g="${g}" fill="${n ? c : '#fff'}" fill-opacity="${n ? (t ? 1 : 0.8) : 0}" stroke="${s ? 'var(--ac)' : 'none'}" stroke-width="${s ? 3 : 0}" stroke-linejoin="round" style="cursor:pointer;mix-blend-mode:${n ? 'color' : 'normal'}" role="button" aria-label="${l}">${ps.map((p) => `<polygon points="${p}"/>`).join('')}</g>`;
      })
      .join('') +
    '</svg>'
  );
}
// PÁGINA EVOLUÇÃO: corpo colorido por nível, detalhes do músculo selecionado e lista de todos os grupos.
function vE() {
  // td = hoje; gs = lista de grupos; tdy(g) = pontos de hoje; wk(g) = pontos dos últimos 7 dias.
  const td = ymd(new Date()),
    dd = S.dd,
    gs = Object.keys(MN),
    T = tot,
    tdy = (g) => dv(dd[td] || {}, g),
    tp = gs.reduce((a, g) => a + tdy(g), 0),
    wk = (g) => {
      let s = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        s += dv(dd[ymd(d)] || {}, g);
      }
      return s;
    };
  // Do músculo selecionado: x = pontos, l = nível atual, nx = próximo nível, pc = progresso até ele (0 a 1).
  const x = T(selM),
    l = lvl(x),
    nx = LV[l + 1],
    pc = nx ? (x - LV[l].m) / (nx.m - LV[l].m) : 1;
  return `<h2>Evolução muscular</h2>
<p class="sub">Cada série marcada no Treino soma pontos ao músculo trabalhado. Toque em um músculo da ilustração para ver os detalhes.</p>
 <div class="card">${anatSvg((g) => [LV[lvl(T(g))].c, g === selM, tdy(g) > 0, MN[g] + ', ' + LV[lvl(T(g))].n, lvl(T(g)) > 0])}
 <div class="row" style="justify-content:center;gap:10px;margin-top:6px">${LV.map((v, i) => `<span style="flex:0 0 auto;font-size:13px"><i style="display:inline-block;width:11px;height:11px;border-radius:50%;background:${v.c};vertical-align:-1px"></i> ${i} · ${v.n}</span>`).join('')}</div>
 <p class="sub" style="text-align:center;margin:8px 0 0;font-size:14px">Cor mais intensa = músculo trabalhado hoje (${r1(tp)} pontos hoje)</p></div>
 <div class="card">
<div class="row" style="align-items:center">
<h3>${MN[selM]}</h3><span class="pill" style="flex:0 0 auto;background:${LV[l].c};color:#101a2e">Nível ${l} · ${LV[l].n}</span></div>
<div style="margin-top:8px">${bar(pc, 1, LV[l].c)}</div>
 <p class="msg">${nx ? `Faltam ${r1(nx.m - x)} pontos para o nível ${nx.n}.` : 'Nível máximo atingido.'}</p>
 <div class="stats">
<div><b>${r1(x)}</b><span>pontos acumulados</span></div>
<div><b>${r1(wk(selM))}</b><span>pontos nos últimos 7 dias</span></div>
<div><b>${r1(tdy(selM))}</b><span>pontos hoje</span></div></div></div>
 <div class="card">${gs
   .map((g) => {
     const v = T(g),
       k = lvl(v);
     return `<div class="li" data-act="mus" data-g="${g}" style="cursor:pointer"><span style="flex:1"><b>${MN[g]}</b> <small>Nível ${k} · ${LV[k].n}</small>${bar(v - LV[k].m, LV[k + 1] ? LV[k + 1].m - LV[k].m : 1, LV[k].c)}</span><small>${r1(v)} pts</small></div>`;
   })
   .join('')}</div>
 ${eList()}<div class="card ev">
<details>
<summary>Como o nível é calculado</summary>
 <p>Cada série concluída gera pontos para o músculo do exercício conforme a força que você demonstrou nela. O app estima sua carga máxima para 1 repetição (1RM) a partir da carga e das repetições (fórmula de Epley, contando no máximo 12 repetições) e compara com o melhor que você já registrou naquele exercício. Série com pelo menos 60% desse melhor vale de 0,6 a 1 ponto; abaixo disso, a carga é leve demais e vale 0. Bater um novo recorde de força no exercício rende +1 ponto extra, uma vez por exercício a cada dia. Assim, só aumentar repetições com carga muito leve não faz o nível subir. Em exercícios com o peso do corpo, o app soma uma fração do seu peso (do perfil) à carga extra. Sem carga informada, a série vale 0,5.</p>
 <p>Pontos para cada nível: ${LV.slice(1)
   .map((v, i) => `${i + 1} ${v.n} (${v.m}+)`)
   .join(' · ')}. Desmarcar uma série devolve os pontos dela.</p>
 <p>A evolução fica salva neste aparelho e continua mesmo ao gerar outro treino ou limpar as marcações. Cardio não pontua. Exercícios que você adiciona contam para o grupo muscular indicado no próprio exercício (o app sugere um pelo nome e você pode trocar); sem grupo definido, não pontuam. Músculos auxiliares não são contados. Essa escala é uma estimativa de apoio, não uma medida científica de força ou massa.</p></details></div>
 <button data-act="evoReset">${evoArm ? 'Toque de novo para zerar tudo' : 'Zerar evolução'}</button>`;
}
// Guarda quais "gavetas" (<details>) estão abertas, para não fecharem quando a tela é redesenhada.
let od = {};
document.addEventListener(
  'toggle',
  (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.od) od[t.dataset.od] = t.open;
  },
  true
);
// ----- Exercícios criados pelo usuário -----

// Opções da lista "Escolher grupo" mostrada ao lado de exercícios digitados pelo usuário.
const GM_OPT = [
  ['', 'Escolher grupo…'],
  ['peito', 'Peito'],
  ['costas', 'Costas'],
  ['ombros', 'Ombros'],
  ['biceps', 'Bíceps'],
  ['triceps', 'Tríceps'],
  ['core', 'Abdômen'],
  ['quadriceps', 'Quadríceps'],
  ['posterior', 'Posterior'],
  ['gluteos', 'Glúteos'],
  ['panturrilha', 'Panturrilha'],
  ['cardio', 'Cardio'],
];
// Palavras-chave para adivinhar o grupo muscular pelo nome digitado (ex.: "rosca" → bíceps).
const GU = [
  ['panturrilha', /panturrilha|g[eê]meos|s[oó]leo|calf/i],
  [
    'cardio',
    /corrida|esteira|bicicleta|caminhada|ciclismo|nata[cç][aã]o|el[ií]ptico|trote|escada|corda|burpee|polichinelo|hiit|cardio|remo ergom/i,
  ],
  ['triceps', /tr[ií]ceps|mergulho|paralela|testa|franc[eê]s/i],
  ['biceps', /rosca|b[ií]ceps|martelo/i],
  ['gluteos', /gl[uú]teo|p[eé]lvica|hip thrust|coice|abdu[cç][aã]o/i],
  ['posterior', /stiff|flexora|leg curl|terra|romeno|good morning/i],
  ['quadriceps', /agachamento|leg press|extensora|afundo|passada|hack|avan[cç]o|sissy/i],
  ['core', /abdominal|prancha|core|obl[ií]quo|eleva[cç][aã]o de pernas|russian/i],
  ['ombros', /desenvolvimento|ombro|militar|arnold|eleva[cç][aã]o (lateral|frontal)/i],
  ['peito', /supino|crucifixo|flex[aã]o|peck|peitoral|crossover/i],
  ['costas', /remada|puxada|barra fixa|pulldown|dorsal|serrote|encolhimento/i],
];
// Sugere o grupo muscular a partir do nome do exercício.
const guess = (n) => (GU.find((r) => r[1].test(n)) || [''])[0];
// Grupo muscular de um exercício: da lista oficial, ou o escolhido/sugerido para exercícios criados.
const gmOf = (x) => {
  if (x.gm === undefined && !GRP[x.n]) x.gm = guess(x.n);
  return x.gm || GRP[x.n] || '';
};
// É cardio? (cardio não dá pontos)
const isC = (x) => gmOf(x) === 'cardio';
// O cardio usa distância em km? (pular corda, burpee etc. não usam)
const isDist = (x) => isC(x) && !/corda|burpee|polichinelo|hiit|salto/i.test(x.n);
// Cria um exercício novo digitado pelo usuário, com valores iniciais adequados (cardio: 1 série de 20 min).
const newEx = (v) => {
  const gm = GRP[v] ? undefined : guess(v),
    c = (gm || GRP[v]) === 'cardio';
  return { n: v, gm, s: c ? 1 : 3, r: c ? '20 min' : '10–12', rest: c ? 0 : 60, done: false };
};
// Lista para trocar o grupo muscular — só aparece em exercícios criados pelo usuário.
const custSel = (x, di, i) =>
  GRP[x.n]
    ? ''
    : `<select data-f="gm" data-d="${di}" data-i="${i}" aria-label="Grupo muscular" style="width:auto;padding:3px 6px">${opts(GM_OPT, gmOf(x))}</select>`;
// PÁGINA TREINO: dias em "gaveta", exercícios, séries e botões de ordenar.
function vT() {
  const w = S.wp;
  // h = HTML da página, montado por partes (a cabeça aqui e, abaixo, um bloco por dia de treino).
  let h = `<h2>Treino</h2>
<p class="sub">Gere uma sugestão pelo seu objetivo ou monte o seu. Tudo pode ser editado depois.</p>
 <div class="card">
<div class="row">
 <div style="flex:3 1 220px"><b>${GOALS[w.goal][0]}</b> · ${w.days} dias por semana<br><small class="sub">${STR[w.strat] ? STR[w.strat].n : 'Estratégia a definir'}</small></div>
 
 </div>
 <div class="row" style="margin-top:10px"><button data-act="goHome">Mudar objetivo e estratégia</button><button data-act="goEvo">Ver evolução muscular</button><button data-act="addDay">+ Montar do zero</button></div></div>
 <datalist id="exl">${EX.map((e) => `<option value="${esc(e[0])}">`).join('')}</datalist>`;
  if (!S.plan.length)
    return (
      h +
      '<div class="empty">Nenhum treino ainda. Vá ao Início, escolha objetivo, dias e estratégia e toque em “Gerar treino”.</div>'
    );
  S.plan.forEach((d, di) => {
    const dn = d.items.filter(exDone).length;
    h += `<details class="card day" data-od="d${di}"${(od['d' + di] === undefined ? di === 0 : od['d' + di]) ? ' open' : ''}>
<summary><span class="dn">${esc(d.name)}</span><span class="pill">${dn}/${d.items.length}</span><button class="x" data-act="mvDay" data-d="${di}" data-dir="-1" title="Mover dia para cima" aria-label="Mover dia para cima"${di === 0 ? ' disabled' : ''}>▲</button><button class="x" data-act="mvDay" data-d="${di}" data-dir="1" title="Mover dia para baixo" aria-label="Mover dia para baixo"${di === S.plan.length - 1 ? ' disabled' : ''}>▼</button></summary>
<div class="row" style="margin:8px 0;align-items:center"><input data-f="dn" data-d="${di}" value="${esc(d.name)}" aria-label="Nome do dia"><button class="x" data-act="delDay" data-d="${di}" title="Remover dia" style="flex:0 0 auto">✕</button></div>`;
    d.items.forEach((x, i) => {
      h += `<div class="ex${exDone(x) ? ' done' : ''}"><span class="nm">${esc(x.n)}${
        DESC[x.n]
          ? `<details data-od="e${di}-${i}"${od['e' + di + '-' + i] ? ' open' : ''}>
<summary>Como fazer</summary>${esc(DESC[x.n])}</details>`
          : ''
      }</span><button class="x" data-act="delEx" data-d="${di}" data-i="${i}" title="Remover">✕</button>
   <div class="cfg">Meta:<input type="number" min="1" data-f="ex" data-k="s" data-d="${di}" data-i="${i}" value="${x.s}" aria-label="Séries">séries ×<input class="r" data-f="ex" data-k="r" data-d="${di}" data-i="${i}" value="${esc(x.r)}" aria-label="Repetições">desc.<input type="number" min="0" step="5" data-f="ex" data-k="rest" data-d="${di}" data-i="${i}" value="${x.rest}" aria-label="Descanso em segundos">s${custSel(x, di, i)}</div>${setRows(x, di, i)}</div>`;
    });
    h += `<div class="row" style="margin-top:8px"><input id="nx${di}" list="exl" placeholder="Adicionar exercício (escolha ou digite)" style="flex:3 1 160px"><button data-act="addEx" data-d="${di}" style="flex:0 0 auto">Adicionar</button></div></details>`;
  });
  return (
    h +
    `<div class="row"><button data-act="addDay">+ Novo dia</button><button data-act="clrMarks">Limpar marcações</button><button data-act="clrPlan">Apagar treino</button></div>`
  );
}

// Barra de data (anterior, calendário, próximo) usada na Dieta e na Água.
function dateBar() {
  return `<div class="datebar"><button data-act="prevD" aria-label="Dia anterior">‹</button><input type="date" data-f="date" value="${date}"><button data-act="nextD" aria-label="Próximo dia">›</button></div>`;
}

// PÁGINA DIETA: resumo de calorias e macros do dia, plano de refeições, adicionar alimento e lista consumida.
function vD() {
  // c = metas; L = alimentos consumidos no dia; t = totais consumidos;
  // pc, cc, fc = % das calorias vindas de proteína, carboidrato e gordura.
  const c = calc(),
    L = S.diet[date] || [],
    t = sum(L),
    pc = t.k ? ((t.p * 4) / t.k) * 100 : 0,
    cc = t.k ? ((t.c * 4) / t.k) * 100 : 0,
    fc = t.k ? ((t.f * 9) / t.k) * 100 : 0;
  // rem = calorias restantes; notes = mensagens de análise mostradas abaixo das barras.
  const rem = c.kcal - t.k,
    notes = [];
  if (!L.length) notes.push('Registre sua primeira refeição para ver a análise do dia.');
  else {
    notes.push(
      rem >= 0
        ? `Restam ${Math.round(rem)} kcal para a meta do dia.`
        : `Você passou ${Math.round(-rem)} kcal da meta.`
    );
    if (t.p < c.prot * 0.8)
      notes.push(`Proteína abaixo da meta: faltam ${Math.round(c.prot - t.p)} g.`);
    else if (t.p >= c.prot) notes.push('Meta de proteína atingida.');
    if (t.f > c.fat * 1.2)
      notes.push('Gordura acima do planejado; ajuste porções de óleos e frituras.');
    if (t.c > c.carb * 1.2) notes.push('Carboidratos acima da meta do dia.');
  }
  let h = `<h2>Dieta</h2>
<div class="card">
<div class="stats">
<div><b>${Math.round(t.k)}</b><span>kcal consumidas de ${c.kcal}</span></div>
<div><b>${Math.round(rem)}</b><span>kcal restantes</span></div></div>
 <div style="margin-top:10px">${bar(t.k, c.kcal, rem < 0 ? 'var(--bad)' : 'var(--ac)')}</div>
 ${[
   ['Proteína', t.p, c.prot, 'var(--p)'],
   ['Carboidratos', t.c, c.carb, 'var(--c)'],
   ['Gorduras', t.f, c.fat, 'var(--f)'],
 ]
   .map(
     ([n, v, m, col]) => `<div class="mac">
<div class="t"><span>${n}</span><span>${r1(v)} / ${m} g</span></div>${bar(v, m, col)}</div>`
   )
   .join('')}
 <p class="sub" style="margin:8px 0 4px">Distribuição das calorias: proteína ${Math.round(pc)}% · carboidratos ${Math.round(cc)}% · gorduras ${Math.round(fc)}%</p>
 ${notes.map((n) => `<p class="msg">${esc(n)}</p>`).join('')}</div>
 ${mealPlan(c)}<div class="card">
<h3 style="margin-bottom:8px">Adicionar alimento</h3>
<div class="row">
 <div><label>Refeição</label><select id="meal" data-f="meal">${opts(
   MEALS.map((m) => [m, m]),
   lm
 )}</select></div>
 <div><label>Alimento</label><select id="food" data-f="food">${FOODS.map((f, i) => `<option value="${i}">${esc(f[0])}</option>`).join('')}<option value="-1">Outro (informar valores)</option></select></div>
 <div><label>Quantidade (g ou ml)</label><input id="grams" type="number" min="1" value="100"></div></div>
 <div id="cust" class="row" style="display:none;margin-top:8px">
<div style="flex:2 1 150px"><label>Nome</label><input id="cn"></div>
<div><label>kcal/100 g</label><input id="ck" type="number" min="0"></div>
<div><label>Prot. g</label><input id="cp" type="number" min="0"></div>
<div><label>Carb. g</label><input id="cc" type="number" min="0"></div>
<div><label>Gord. g</label><input id="cf" type="number" min="0"></div></div>
 <div style="margin-top:10px"><button class="pri" data-act="addFood">Adicionar</button></div></div>`;
  MEALS.forEach((m) => {
    const l = L.filter((e) => e.meal === m);
    if (!l.length) return;
    const s = sum(l);
    h += `<div class="card">
<div class="row" style="align-items:center">
<h3>${m}</h3><span class="sub" style="margin:0;text-align:right">${Math.round(s.k)} kcal · P ${r1(s.p)} · C ${r1(s.c)} · G ${r1(s.f)}</span></div>
  ${l.map((e) => `<div class="li"><span>${esc(e.name)} <small>${e.g} g</small><br><small>${Math.round(e.k)} kcal · P ${r1(e.p)} · C ${r1(e.c)} · G ${r1(e.f)}</small></span><button class="x" data-act="delFood" data-id="${e.id}" title="Remover">✕</button></div>`).join('')}</div>`;
  });
  return h;
}

// PÁGINA ÁGUA: medidor circular, registro rápido, histórico do dia e cartão de meta e lembretes.
function vA() {
  // c = metas; L = registros do dia; ml = total bebido; pct = fração da meta;
  // R e C = raio e perímetro do círculo do medidor.
  const c = calc(),
    L = S.water[date] || [],
    ml = L.reduce((a, e) => a + e.ml, 0),
    pct = ml / c.agua,
    R = 84,
    C = 2 * Math.PI * R;
  // st = [classificação, cor] conforme o percentual atingido.
  const st =
    pct >= 1
      ? ['Meta atingida', 'var(--ok)']
      : pct >= 0.75
        ? ['Boa hidratação', 'var(--ok)']
        : pct >= 0.5
          ? ['Moderada', 'var(--warn)']
          : pct >= 0.25
            ? ['Baixa', 'var(--warn)']
            : ['Muito baixa', 'var(--bad)'];
  let pace = '';
  if (date === ymd(new Date())) {
    const n = new Date(),
      hr = n.getHours() + n.getMinutes() / 60,
      exp = Math.round((c.agua * paceF(hr)) / 50) * 50;
    pace =
      ml >= exp
        ? `Você está no ritmo: até agora o ideal seria cerca de ${exp} ml.`
        : `Pelo horário, o ideal já seria cerca de ${exp} ml. Faltam ${exp - ml} ml para acompanhar o ritmo.`;
  }
  return `<h2>Hidratação</h2>
<div class="card" style="text-align:center">
<div class="gauge"><svg viewBox="0 0 220 220" width="220" height="220" role="img" aria-label="${Math.round(pct * 100)}% da meta de água"><circle cx="110" cy="110" r="${R}" fill="none" stroke="var(--bg)" stroke-width="18"/><circle cx="110" cy="110" r="${R}" fill="none" stroke="var(--w)" stroke-width="18" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - Math.min(1, pct))}" transform="rotate(-90 110 110)"/></svg>
 <div class="c"><b>${ml} ml</b><span class="sub" style="margin:0">de ${c.agua} ml (${Math.round(pct * 100)}%)</span></div></div>
 <div style="font:700 20px var(--hd);color:${st[1]}">${st[0]}</div>
<p class="msg" style="color:var(--mu)">${pace}</p></div>
 <div class="card">
<h3 style="margin-bottom:8px">Registrar consumo</h3>
<div class="row">${[150, 250, 350, 500].map((v) => `<button data-act="addW" data-v="${v}">+${v} ml</button>`).join('')}</div>
 <div class="row" style="margin-top:8px"><input id="wc" type="number" min="1" placeholder="Outro valor em ml"><button class="pri" data-act="addWc" style="flex:0 0 auto">Registrar</button></div></div>
 <div class="card">
<div class="row" style="align-items:center">
<h3>Registros do dia</h3><button class="sm" data-act="undoW" style="flex:0 0 auto"${L.length ? '' : ' disabled'}>Desfazer último</button></div>
 ${
   L.length
     ? L.slice()
         .reverse()
         .map(
           (e) =>
             `<div class="li"><span>${e.ml} ml <small>às ${e.t}</small></span><button class="x" data-act="delW" data-id="${e.id}" title="Remover">✕</button></div>`
         )
         .join('')
     : '<div class="empty">Nada registrado neste dia.</div>'
 }</div>
 ${wCfg(c)}
 <p class="sub">A meta é calculada pelo seu peso e nível de atividade (perfil). Em dias quentes ou de treino intenso, beba mais.</p>`;
}

// PÁGINA PERFIL: dados pessoais, preferência alimentar, horários e metas calculadas.
function vP() {
  // p = perfil; c = metas calculadas; I = cria um campo numérico do perfil.
  const p = S.profile,
    c = calc(),
    I = (k, l, min) =>
      `<div><label>${l}</label><input type="number" min="${min}" data-f="pr" data-k="${k}" value="${p[k]}"></div>`;
  return `<h2>Perfil e metas</h2>
<p class="sub">Esses dados alimentam as metas de calorias, macros e água.</p>
<div class="card">
<div class="row">
 <div><label>Sexo</label><select data-f="pr" data-k="sexo">${opts(
   [
     ['m', 'Masculino'],
     ['f', 'Feminino'],
   ],
   p.sexo
 )}</select></div>${I('idade', 'Idade', 10)}${I('peso', 'Peso (kg)', 30)}${I('altura', 'Altura (cm)', 100)}</div>
 <div class="row" style="margin-top:8px">
<div><label>Atividade</label><select data-f="pr" data-k="ativ">${opts(
    [
      [1.2, 'Sedentário'],
      [1.375, 'Leve (1–3 treinos/sem.)'],
      [1.55, 'Moderado (3–5 treinos/sem.)'],
      [1.725, 'Intenso (6–7 treinos/sem.)'],
    ],
    p.ativ
  )}</select></div>
 <div><label>Objetivo da dieta</label><select data-f="pr" data-k="obj">${opts(
   [
     ['perder', 'Perder gordura'],
     ['manter', 'Manter peso'],
     ['ganhar', 'Ganhar massa'],
   ],
   p.obj
 )}</select></div></div>
 <div class="row" style="margin-top:8px">
<div><label>Preferência alimentar (usada no cardápio)</label><select data-f="pr" data-k="dieta">${opts(
    [
      ['onivoro', 'Sem restrição'],
      ['vegetariano', 'Vegetariano'],
      ['semlactose', 'Sem lactose'],
    ],
    p.dieta || 'onivoro'
  )}</select></div></div>${timeRow()}</div>
 <div class="card">
<h3 style="margin-bottom:8px">Suas metas diárias</h3>
<div class="stats">
<div><b>${c.kcal}</b><span>kcal</span></div>
<div><b>${c.prot} g</b><span>proteína</span></div>
<div><b>${c.carb} g</b><span>carboidratos</span></div>
<div><b>${c.fat} g</b><span>gorduras</span></div>
<div><b>${c.agua} ml</b><span>água</span></div></div>
 <p class="sub" style="margin:10px 0 0">Metabolismo basal ${c.tmb} kcal; gasto total estimado ${c.tdee} kcal (fórmula de Mifflin-St Jeor). São estimativas gerais, não substituem orientação de nutricionista ou médico.</p></div>`;
}

// ===== 5. NAVEGAÇÃO E EVENTOS ===============================================

// REDESENHAR A TELA: escolhe a função da página atual (tab), coloca o HTML dela em <main>
// e refaz o menu de baixo. É chamada depois de qualquer mudança em `S`.
function render() {
  const V = { evolucao: vE, inicio: vI, treino: vT, dieta: vD, agua: vA, perfil: vP };
  // Coloca o HTML da página atual no <main>. A Dieta e a Água ganham também a barra de data.
  $('#main').innerHTML = (tab === 'dieta' || tab === 'agua' ? dateBar() : '') + V[tab]();
  $('#nav').innerHTML = TABS.map(
    ([k, i, n]) => `<a href="#${k}" class="${k === tab ? 'on' : ''}"><span>${i}</span>${n}</a>`
  ).join('');
  $('#sub').textContent =
    date === ymd(new Date()) ? 'Treino, dieta e hidratação em um só lugar' : '';
}
// tab = página atual.
let tab = 'inicio';
// Lê o endereço (ex.: ...#treino), descobre a página e redesenha. Roda quando o endereço muda.
function route() {
  const h = location.hash.slice(1);
  // Se o endereço não for de uma página válida, volta ao Início.
  tab = V_OK.includes(h) ? h : 'inicio';
  render();
}
// Páginas válidas.
const V_OK = ['evolucao', 'inicio', 'treino', 'dieta', 'agua', 'perfil'];
// Gera um identificador único curto para cada registro (alimento, água...).
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
// Muda o dia visto na Dieta/Água em n dias (n = -1 volta, +1 avança).
const shift = (n) => {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + n);
  date = ymd(d);
  render();
};

// EVENTOS DE MUDANÇA: disparam quando um campo ou lista muda.
// Cada campo do HTML traz `data-f` dizendo o que ele altera (ex.: data-f="pr" = campo do perfil).
document.addEventListener('change', (e) => {
  const t = e.target,
    f = t.dataset.f;
  if (!f) return;
  const d = +t.dataset.d,
    i = +t.dataset.i,
    k = t.dataset.k;
  if (f === 'wp') {
    // Escolhas do Início (objetivo, dias, estratégia).
    S.wp[k] = k === 'days' ? +t.value : t.value;
    save();
    render();
  } else if (f === 'pr') {
    // Campos do Perfil. Textos ficam como texto; o resto vira número.
    S.profile[k] = ['sexo', 'obj', 'dieta', 'acorda', 'dorme'].includes(k) ? t.value : +t.value;
    armRem();
    save();
    render();
  } else if (f === 'dn') {
    // Nome de um dia do treino.
    S.plan[d].name = t.value;
    save();
    render();
  } else if (f === 'ex') {
    // Séries, repetições ou descanso planejados de um exercício.
    S.plan[d].items[i][k] = k === 'r' ? t.value : Math.max(0, +t.value || 0);
    save();
    render();
  } else if (f === 'sd' || f === 'sl') {
    // Série: caixa de "feita" (sd) ou repetições/carga/km digitados (sl). Cada mudança recalcula os pontos.
    const x = S.plan[d].items[i],
      j = +t.dataset.j;
    x.log = x.log || [];
    const g = (x.log[j] = x.log[j] || {});
    if (f === 'sd') g.d = t.checked;
    else g[k] = t.value === '' ? '' : +t.value;
    if (f === 'sd' || g.d) award(x, g);
    save();
    if (f === 'sd') render();
  } else if (f === 'gm') {
    // Grupo muscular escolhido para um exercício criado pelo usuário.
    S.plan[d].items[i].gm = t.value;
    save();
    render();
  } else if (f === 'aguaM') {
    // Meta diária de água digitada pelo usuário.
    S.profile.aguaM = +t.value || 0;
    save();
    render();
  } else if (f === 'rem') {
    // Intervalo do lembrete de água.
    S.rem.iv = +t.value;
    armRem();
    save();
    render();
  } else if (f === 'meal') lm = t.value;
  else if (f === 'food') $('#cust').style.display = t.value === '-1' ? 'flex' : 'none';
  else if (f === 'date' && t.value) {
    date = t.value;
    render();
  }
});

// EVENTOS DE CLIQUE: um ÚNICO ouvinte para a página toda.
// Cada botão do HTML traz `data-act` com o nome da ação (ex.: data-act="addW" = adicionar água).
// Dados extras vêm em data-d, data-i, data-v...: d = dia, i = item, id = registro.
// Depois de qualquer ação, o código chama render() no final para redesenhar a tela.
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const a = b.dataset.act,
    d = +b.dataset.d,
    i = +b.dataset.i,
    id = b.dataset.id;
  if (a === 'gen') {
    // Gerar treino com as escolhas do Início e ir para a aba Treino.
    gen();
    location.hash = 'treino';
    return;
  } else if (a === 'addDay') {
    // Novo dia de treino vazio.
    S.plan.push({ name: 'Dia ' + 'ABCDEFGH'[S.plan.length % 8] + ' · Novo', items: [] });
    save();
  } else if (a === 'mvDay') {
    // Mover um dia para cima (-1) ou para baixo (+1): troca de posição com o vizinho, renumera "Dia A, B, C..."
    // e leva junto o estado aberto/fechado das gavetas.
    const j = d + +b.dataset.dir;
    if (j < 0 || j >= S.plan.length) return;
    const op = (k) => (od['d' + k] === undefined ? k === 0 : od['d' + k]),
      o1 = op(d),
      o2 = op(j);
    [S.plan[d], S.plan[j]] = [S.plan[j], S.plan[d]];
    S.plan.forEach((x, k) => {
      x.name = x.name.replace(/^Dia [A-H] · /, 'Dia ' + 'ABCDEFGH'[k] + ' · ');
    });
    const nod = {};
    for (const k in od) {
      const m = k.match(/^e(\d+)-(\d+)$/);
      if (m && (+m[1] === d || +m[1] === j)) nod['e' + (+m[1] === d ? j : d) + '-' + m[2]] = od[k];
      else if (!/^d\d+$/.test(k)) nod[k] = od[k];
    }
    nod['d' + d] = o2;
    nod['d' + j] = o1;
    od = nod;
    save();
  } else if (a === 'genMenu') {
    // Gerar cardápio do dia (ou outro, se já existir). Não permite se há refeições já registradas.
    const o = S.menu[date];
    if (o && o.meals.some((m) => m.ids))
      return note('Desfaça o registro das refeições para gerar outro cardápio.');
    S.menu[date] = genMenu(date, o ? (o.vv || 0) + 1 : 0);
    save();
  } else if (a === 'genWeek') {
    // Gerar cardápio para 7 dias seguidos, pulando dias com refeições já registradas.
    let sk = 0;
    for (let j = 0; j < 7; j++) {
      const d2 = addD(date, j),
        o = S.menu[d2];
      if (o && o.meals.some((m) => m.ids)) {
        sk++;
        continue;
      }
      S.menu[d2] = genMenu(d2, o ? (o.vv || 0) + 1 : 0);
    }
    save();
    if (sk) note('Dias com refeições já registradas foram mantidos.');
  } else if (a === 'clrMenu') {
    // Apagar o cardápio do dia.
    delete S.menu[date];
    save();
  } else if (a === 'regM') {
    // Registrar a refeição sugerida no diário de consumo. Guarda os ids para poder desfazer.
    const m = S.menu[date].meals[i],
      key = m.name.replace(/^Lanche.*/, 'Lanche'),
      L2 = (S.diet[date] = S.diet[date] || []);
    m.ids = m.items.map((e) => {
      const id = uid();
      L2.push({ id, meal: key, name: e.n, g: e.g, k: e.k, p: e.p, c: e.c, f: e.f });
      return id;
    });
    save();
  } else if (a === 'undoM') {
    // Desfazer o registro: remove do diário os alimentos criados por essa refeição.
    const m = S.menu[date].meals[i];
    S.diet[date] = (S.diet[date] || []).filter((x) => !(m.ids || []).includes(x.id));
    delete m.ids;
    save();
  } else if (a === 'swapM') {
    // Trocar uma refeição: muda o número de variação e gera de novo só ela.
    const m = S.menu[date].meals[i];
    m.seed += 11;
    m.items = genMeal(m.type, m.t, m.seed, S.profile.obj || 'manter');
    save();
  } else if (a === 'delDay') {
    // Remover um dia de treino.
    S.plan.splice(d, 1);
    save();
  } else if (a === 'delEx') {
    // Remover um exercício.
    S.plan[d].items.splice(i, 1);
    save();
  } else if (a === 'addEx') {
    // Adicionar exercício digitado ou escolhido na lista.
    const v = $('#nx' + d).value.trim();
    if (!v) return $('#nx' + d).focus();
    S.plan[d].items.push(newEx(v));
    save();
  } else if (a === 'clrMarks') {
    // Limpar séries marcadas, repetições e cargas (a evolução já ganha continua guardada).
    S.plan.forEach((x) => x.items.forEach((y) => (y.log = [])));
    save();
  } else if (a === 'clrPlan') {
    // Apagar todo o treino.
    S.plan = [];
    save();
  } else if (a === 'addFood') {
    // Adicionar alimento ao diário: lê quantidade e alimento, calcula kcal e macros proporcionais à quantidade.
    const g = +$('#grams').value,
      fi = +$('#food').value;
    if (!(g > 0)) return $('#grams').focus();
    const f =
        fi < 0
          ? [
              $('#cn').value.trim() || 'Alimento',
              +$('#ck').value || 0,
              +$('#cp').value || 0,
              +$('#cc').value || 0,
              +$('#cf').value || 0,
            ]
          : FOODS[fi],
      r = g / 100;
    (S.diet[date] = S.diet[date] || []).push({
      id: uid(),
      meal: $('#meal').value,
      name: f[0],
      g,
      k: f[1] * r,
      p: f[2] * r,
      c: f[3] * r,
      f: f[4] * r,
    });
    save();
  } else if (a === 'delFood') {
    // Remover alimento do diário.
    S.diet[date] = S.diet[date].filter((x) => x.id !== id);
    save();
  } else if (a === 'addW' || a === 'addWc') {
    // Registrar água: botão rápido (addW) ou valor digitado (addWc).
    const ml = a === 'addW' ? +b.dataset.v : +$('#wc').value;
    if (!(ml > 0)) return $('#wc').focus();
    (S.water[date] = S.water[date] || []).push({
      id: uid(),
      ml: Math.round(ml),
      t: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    });
    save();
  } else if (a === 'addR') {
    // "Já bebi" do lembrete: registra a quantidade sugerida e fecha o aviso.
    const k = ymd(new Date());
    (S.water[k] = S.water[k] || []).push({
      id: uid(),
      ml: +b.dataset.v,
      t: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    });
    $('#toast').hidden = true;
    save();
  } else if (a === 'hideT') $('#toast').hidden = true;
  else if (a === 'goHome') {
    location.hash = 'inicio';
    return;
  } else if (a === 'goEvo') {
    location.hash = 'evolucao';
    return;
  } else if (a === 'mus') selM = b.dataset.g;
  else if (a === 'evoReset') {
    // Zerar a evolução: pede um segundo toque para confirmar.
    if (!evoArm) {
      evoArm = true;
      render();
      return;
    }
    S.dd = {};
    S.best = {};
    evoArm = false;
    save();
  } else if (a === 'remOn') {
    // Ligar/desligar os lembretes de água (e pedir permissão de notificação ao ligar).
    S.rem.on = !S.rem.on;
    armRem();
    if (S.rem.on)
      try {
        window.Notification &&
          Notification.permission === 'default' &&
          Notification.requestPermission();
      } catch (e) {}
    save();
  } else if (a === 'aguaSug') {
    // Voltar à meta de água sugerida.
    S.profile.aguaM = 0;
    save();
  } else if (a === 'undoW') {
    // Desfazer o último registro de água.
    (S.water[date] || []).pop();
    save();
  } else if (a === 'delW') {
    // Remover um registro de água.
    S.water[date] = S.water[date].filter((x) => x.id !== id);
    save();
  } else if (a === 'prevD') return shift(-1);
  else if (a === 'nextD') return shift(1);
  render();
});
// Liga a navegação: quando o endereço muda, route() redesenha. Depois desenha a primeira tela e liga os lembretes.
addEventListener('hashchange', route);
route();
armRem();
// Mensagem inicial; a sincronização abaixo troca por "Salvo na sua conta" se estiver disponível.
setSync('Salvo só neste aparelho');
// ===== 6. SINCRONIZAÇÃO COM A CONTA =========================================
// Só funciona quando o app roda dentro do claude.ai (onde existe o objeto `claude`).
// Fora dele (GitHub Pages, por exemplo), cai no primeiro `return` e os dados ficam só no aparelho.
(async () => {
  try {
    if (typeof claude === 'undefined') {
      setSync('Salvo só neste aparelho');
      return;
    }
    const [u, db] = await Promise.all([claude.use('user'), claude.use('db')]);
    if (!u || !db) {
      setSync('Salvo só neste aparelho (abra no claude.ai com sua conta para sincronizar)');
      return;
    }
    cref = db.collection('data/users/' + (await u.id())).doc('state');
    cref.onSnapshot(
      (s) => {
        const d = s.exists ? s.data() : null;
        if (!d || !d.json) {
          ready = true;
          first = false;
          push();
          return;
        }
        if (first || d.ts > (S._ts || 0)) {
          try {
            S = JSON.parse(d.json);
            S.rem = S.rem || { on: false, iv: 30 };
            S.dd = S.dd || {};
            S.best = S.best || {};
            S.e1 = S.e1 || {};
            S.bd = S.bd || {};
            S.menu = S.menu || {};
            S._ts = d.ts;
            localStorage.setItem(KEY, JSON.stringify(S));
          } catch (e) {}
          armRem();
          render();
          setSync('☁️ Sincronizado com sua conta');
        } else if (d.ts < (S._ts || 0)) push();
        else setSync('☁️ Salvo na sua conta');
        first = false;
        ready = true;
      },
      () => setSync('Falha ao sincronizar; dados salvos só neste aparelho')
    );
  } catch (e) {
    setSync('Salvo só neste aparelho');
  }
})();
