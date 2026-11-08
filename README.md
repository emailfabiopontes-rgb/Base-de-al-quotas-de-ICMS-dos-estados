# Base de alíquotas de ICMS dos estados + Controle Financeiro

- `aliquotas.csv` — alíquota interna padrão de ICMS por UF (separador `;`).
- `index.html` — app de **Controle Financeiro** (HTML/CSS/JS puro, sem dependências).

## Controle Financeiro

- Lançamentos de receitas e despesas com descrição, valor, data e categoria.
- Resumo do mês (receitas, despesas, saldo) e saldo acumulado; navegação entre meses.
- Despesas por categoria com percentual do mês.
- Calculadora de ICMS usando `aliquotas.csv` (ICMS contido no valor, valor sem ICMS
  e preço para embutir o imposto), com opção de lançar o ICMS como despesa.
- Exportar/importar lançamentos em CSV (`Data;Tipo;Descricao;Categoria;Valor`).
- Os dados ficam salvos no navegador (`localStorage`).

### Como usar

Sirva a pasta por HTTP para que o app leia `aliquotas.csv`:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

Também funciona abrindo `index.html` direto, ou publicando no GitHub Pages; sem HTTP o app
usa uma cópia embutida das alíquotas.
