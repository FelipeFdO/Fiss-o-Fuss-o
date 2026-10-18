# ⚛️☀️ Laboratório Virtual Interativo — Física Nuclear: Fissão vs. Fusão

Simuladores educacionais interativos desenvolvidos em **HTML5 Canvas, CSS3 e JavaScript (Vanilla JS)** para o ensino de Física Nuclear no Ensino Médio e Superior. O projeto permite explorar visualmente desde o duelo entre a **Barreira de Coulomb** e a **Força Nuclear Forte** em escala atômica até a engenharia de **Usinas Nucleares de Fissão**, **Tokamaks (ITER)** e **Confinamento Inercial a Laser (NIF)**.

---

## 🌐 Acesse Online (GitHub Pages)

- 🏠 **Portal Inicial (Menu dos Simuladores):** [https://felipefdo.github.io/Fiss-o-Fuss-o/](https://felipefdo.github.io/Fiss-o-Fuss-o/)
- ⚛️ **Simulador de Fissão Nuclear:** [https://felipefdo.github.io/Fiss-o-Fuss-o/fissao.html](https://felipefdo.github.io/Fiss-o-Fuss-o/fissao.html)
- ☀️ **Simulador de Fusão Nuclear:** [https://felipefdo.github.io/Fiss-o-Fuss-o/fusao.html](https://felipefdo.github.io/Fiss-o-Fuss-o/fusao.html)

---

## ⚛️ 1. Simulador de Fissão Nuclear (`fissao.html`)

Dividido em dois módulos interativos:

### 🔬 Aba 1: Laboratório de Átomo Único
- **Isótopos Disponíveis:**
  - **Urânio-235 ($^{235}_{92}\text{U}$)** — Isótopo *físsil* clássico (divide-se facilmente com nêutrons térmicos lentos).
  - **Plutônio-239 ($^{239}_{94}\text{Pu}$)** — Isótopo *físsil* de alto rendimento de nêutrons.
  - **Tório-232 ($^{232}_{90}\text{Th}$)** — Isótopo *fértil* (ciclo de 2 etapas: absorve o 1º nêutron e sofre decaimento $\beta^-$ transmutando-se em Urânio-233 físsil, que fissiona no 2º disparo).
- **Nêutron ($n^0$) vs. Próton ($p^+$):** Demonstra por que o nêutron (sem carga elétrica) penetra no núcleo sem sofrer repulsão eletrostática, enquanto o próton é desviado pela Barreira de Coulomb.
- **Modelo da Gota Líquida:** Visualização da oscilação nuclear, formação do pescoço de cisão, repulsão elétrica dos fragmentos filhos e liberação de $\sim 200\text{ MeV}$ ($E = \Delta m c^2$).

### ⚡ Aba 2: Reator em Cadeia
- **Escala Configurável (5 a 150 núcleos):** Permite simular desde amostras pequenas (abaixo da massa crítica, onde os nêutrons escapam) até o experimento clássico de **100 núcleos (estilo PhET)**.
- **Moderador Térmico (Água / Grafite):** Desacelera os nêutrons rápidos recém-nascidos para torná-los nêutrons térmicos capazes de sustentar a reação.
- **Barras de Controle (Boro / Cádmio):** Controle manual de inserção (`0%` a `100%`) ou **Modo Automático (`🤖 Auto k = 1`)**, onde o reator regula sozinho as barras e repõe o combustível para manter o fator de multiplicação exatamente em regime crítico ($k_{\text{ef}} \approx 1{,}00$).

---

## ☀️ 2. Simulador de Fusão Nuclear (`fusao.html`)

Dividido em dois módulos interativos:

### 🔬 Aba 1: Colisão & Barreira de Coulomb
- **Pares de Isótopos:**
  - **Deutério + Trítio ($^2_1\text{H} + {^3_1\text{H}} \to {^4_2\text{He}} + {^1_0\text{n}} + 17{,}6\text{ MeV}$)** — Reação principal do ITER e do NIF (limiar de $\sim 100\text{ MK}$).
  - **Deutério + Deutério ($^2_1\text{H} + {^2_1\text{H}}$)** — Combustível abundante na água do mar, com duas rotas equiprováveis (50% $^3\text{He} + n^0$ e 50% $^3\text{H} + p^+$).
  - **Deutério + Hélio-3 ($^2_1\text{H} + {^3_2\text{He}} \to {^4_2\text{He}} + p^+ + 18{,}3\text{ MeV}$)** — Fusão aneutrônica (limiar acima de $135\text{ MK}$ devido à carga dupla $+2$ do Hélio-3).
- **Acelerador Térmico (`10 MK` a `160 MK` — Milhões de Kelvin):** Permite testar como temperaturas baixas resultam em repulsão eletrostática na **Barreira de Coulomb**, e como temperaturas extremas ($\sim 150\text{ MK}$, $10\times$ o núcleo do Sol) permitem que os núcleos se aproximem o suficiente para a **Força Nuclear Forte** ("supercola" de curtíssimo alcance) uni-los.

### ☀️ Aba 2: Tokamak & Laser (Confinamento e Fator $Q$)
- **🧲 Confinamento Magnético — Tokamak (ITER):**
  - Ímãs supercondutores (`0` a `15 Tesla`) criam uma "garrafa magnética invisível" em formato toroidal que mantém o plasma a $150\text{ MK}$ sem encostar nas paredes metálicas ($50\text{ MW}$ injetados $\to 500\text{ MW}$ de fusão, **$Q_{\text{alvo}} = 10{,}0$**).
  - **🧱 Manta Reprodutora de Lítio ($^6\text{Li}$ — *Tritium Breeding*):** Os nêutrons rápidos ($14{,}1\text{ MeV}$) escapam do campo magnético, atingem a parede revestida de Lítio e fabricam novo **Trítio ($^3\text{H}$)** para realimentar o reator ($^1_0\text{n} + {^6_3\text{Li}} \to {^4_2\text{He}} + {^3_1\text{H}} + 4{,}8\text{ MeV}$).
  - **❄️ Segurança Passiva (`⚠️ FALHA 0 T`):** Demonstra que, ao desligar os ímãs, o $\sim 1\text{ grama}$ de plasma toca na parede fria e se apaga em milissegundos, sem qualquer risco de reação descontrolada (*Meltdown*).
- **⚡ Confinamento Inercial a Laser (NIF):**
  - Simula os **192 feixes de laser** comprimindo uma cápsula de Deutério-Trítio por ablação e implosão esférica.
  - **Balanço Real do Fator $Q$ ($Q_{\text{alvo}}$ vs. $Q_{\text{global}}$):** Demonstra o marco histórico de dezembro de 2022 no NIF ($2{,}05\text{ MJ}$ de luz laser gerando $3{,}15\text{ MJ}$ de fusão, **$Q_{\text{alvo}} = 1{,}54 > 1$**), contrastando com os $\sim 300\text{ MJ}$ consumidos da rede elétrica (**$Q_{\text{global}} \approx 0{,}01$**).

---

## ⌨️ Atalhos e Recursos Visuais

- **Barra de Espaço (`Space`):** Pausa / Continua a simulação a qualquer momento para explicação em sala de aula.
- **6 Temas de Cores:** Alternância instantânea no topo da tela (*Roxo Quântico, Magenta Neon, Azul Ciano, Verde Radioativo, Âmbar Solar e Rubi Plasma*).
- **Navegação Rápida:** Botão direto no cabeçalho para transitar entre os simuladores de **Fissão** e **Fusão**.

---

## 📁 Estrutura de Arquivos

```text
├── index.html   # Portal inicial (Menu para escolher entre Fissão e Fusão)
├── fissao.html  # Interface do Simulador de Fissão Nuclear
├── fissao.css   # Estilos e temas do Simulador de Fissão
├── fissao.js    # Motor físico e renderização Canvas da Fissão
├── fusao.html   # Interface do Simulador de Fusão Nuclear
├── fusao.css    # Estilos e temas do Simulador de Fusão
├── fusao.js     # Motor físico e renderização Canvas da Fusão
└── README.md    # Documentação do projeto
```
