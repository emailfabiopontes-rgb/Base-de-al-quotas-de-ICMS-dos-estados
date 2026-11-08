(function () {
  'use strict';

  var CHAVE = 'controle-financeiro:lancamentos';

  // Cópia de aliquotas.csv usada quando o arquivo não pode ser lido (ex.: aberto via file://).
  var ALIQUOTAS_PADRAO = {
    AC: 17, AL: 18, AM: 18, AP: 18, BA: 20.5, CE: 18, DF: 18, ES: 17, GO: 17,
    MA: 20, MG: 18, MS: 17, MT: 17, PA: 17, PB: 18, PE: 18, PI: 18, PR: 19,
    RJ: 20, RN: 18, RO: 17.5, RR: 17, RS: 18, SC: 17, SE: 18, SP: 18, TO: 18
  };

  var CATEGORIAS_SUGERIDAS = [
    'Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer',
    'Impostos', 'Salário', 'Vendas', 'Outros'
  ];

  var moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var $ = function (id) { return document.getElementById(id); };

  var lancamentos = carregar();
  var aliquotas = Object.assign({}, ALIQUOTAS_PADRAO);

  // ---------- Persistência ----------
  function carregar() {
    try {
      var bruto = localStorage.getItem(CHAVE);
      var lista = bruto ? JSON.parse(bruto) : [];
      return Array.isArray(lista) ? lista.filter(valido) : [];
    } catch (e) {
      return [];
    }
  }

  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(lancamentos));
    } catch (e) { /* armazenamento indisponível: mantém só em memória */ }
  }

  function valido(l) {
    return l && (l.tipo === 'receita' || l.tipo === 'despesa') &&
      typeof l.valor === 'number' && isFinite(l.valor) && l.valor > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(l.data) && typeof l.descricao === 'string';
  }

  function novoId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---------- Datas ----------
  function hojeISO() {
    var d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  function deslocarMes(mes, delta) {
    var p = mes.split('-').map(Number);
    var d = new Date(p[0], p[1] - 1 + delta, 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function formatarData(iso) {
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  // ---------- Renderização ----------
  function render() {
    var mes = $('mesSelecionado').value;
    var doMes = lancamentos
      .filter(function (l) { return l.data.slice(0, 7) === mes; })
      .sort(function (a, b) { return b.data.localeCompare(a.data); });

    var receitas = soma(doMes, 'receita');
    var despesas = soma(doMes, 'despesa');
    var saldo = receitas - despesas;

    var ateMes = lancamentos.filter(function (l) { return l.data.slice(0, 7) <= mes; });
    var saldoGeral = soma(ateMes, 'receita') - soma(ateMes, 'despesa');

    $('totalReceitas').textContent = moeda.format(receitas);
    $('totalDespesas').textContent = moeda.format(despesas);
    pintarSaldo($('saldoMes'), saldo);
    pintarSaldo($('saldoGeral'), saldoGeral);

    renderTabela(doMes);
    renderCategorias(doMes, despesas);
    renderSugestoes();
  }

  function soma(lista, tipo) {
    return lista.reduce(function (t, l) { return l.tipo === tipo ? t + l.valor : t; }, 0);
  }

  function pintarSaldo(el, valor) {
    el.textContent = moeda.format(valor);
    el.className = valor < 0 ? 'neg' : valor > 0 ? 'pos' : '';
  }

  function renderTabela(lista) {
    var corpo = $('tabela');
    corpo.textContent = '';
    lista.forEach(function (l) {
      var tr = document.createElement('tr');
      celula(tr, formatarData(l.data));
      celula(tr, l.descricao);
      celula(tr, l.categoria || '—');
      var v = celula(tr, (l.tipo === 'despesa' ? '− ' : '+ ') + moeda.format(l.valor));
      v.className = 'num ' + (l.tipo === 'despesa' ? 'neg' : 'pos');
      var acao = celula(tr, '');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'excluir';
      btn.textContent = '✕';
      btn.title = 'Excluir';
      btn.setAttribute('aria-label', 'Excluir ' + l.descricao);
      btn.addEventListener('click', function () { excluir(l.id); });
      acao.appendChild(btn);
      corpo.appendChild(tr);
    });
    $('vazio').hidden = lista.length > 0;
  }

  function celula(tr, texto) {
    var td = document.createElement('td');
    td.textContent = texto;
    tr.appendChild(td);
    return td;
  }

  function renderCategorias(lista, totalDespesas) {
    var ul = $('porCategoria');
    ul.textContent = '';
    var mapa = {};
    lista.forEach(function (l) {
      if (l.tipo !== 'despesa') return;
      var c = l.categoria || 'Sem categoria';
      mapa[c] = (mapa[c] || 0) + l.valor;
    });
    var itens = Object.keys(mapa)
      .map(function (c) { return [c, mapa[c]]; })
      .sort(function (a, b) { return b[1] - a[1]; });

    if (!itens.length) {
      var li = document.createElement('li');
      li.className = 'vazio';
      li.textContent = 'Sem despesas neste mês.';
      ul.appendChild(li);
      return;
    }

    itens.forEach(function (item) {
      var pct = totalDespesas ? (item[1] / totalDespesas) * 100 : 0;
      var li = document.createElement('li');
      var rotulo = document.createElement('div');
      rotulo.className = 'rotulo';
      var nome = document.createElement('span');
      nome.textContent = item[0];
      var valor = document.createElement('span');
      valor.textContent = moeda.format(item[1]) + ' · ' + pct.toFixed(1).replace('.', ',') + '%';
      rotulo.appendChild(nome);
      rotulo.appendChild(valor);
      var trilho = document.createElement('div');
      trilho.className = 'trilho';
      var barra = document.createElement('div');
      barra.className = 'preenchido';
      barra.style.width = pct + '%';
      trilho.appendChild(barra);
      li.appendChild(rotulo);
      li.appendChild(trilho);
      ul.appendChild(li);
    });
  }

  function renderSugestoes() {
    var usadas = lancamentos.map(function (l) { return l.categoria; }).filter(Boolean);
    var todas = Array.from(new Set(CATEGORIAS_SUGERIDAS.concat(usadas))).sort();
    var dl = $('listaCategorias');
    dl.textContent = '';
    todas.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c;
      dl.appendChild(o);
    });
  }

  // ---------- Ações ----------
  function adicionar(dados) {
    lancamentos.push(Object.assign({ id: novoId() }, dados));
    salvar();
    render();
  }

  function excluir(id) {
    var l = lancamentos.find(function (x) { return x.id === id; });
    if (!l || !confirm('Excluir "' + l.descricao + '"?')) return;
    lancamentos = lancamentos.filter(function (x) { return x.id !== id; });
    salvar();
    render();
  }

  $('formLancamento').addEventListener('submit', function (e) {
    e.preventDefault();
    var valor = arredondar(parseFloat($('valor').value));
    if (!(valor > 0)) return;
    var data = $('data').value;
    adicionar({
      tipo: document.querySelector('input[name="tipo"]:checked').value,
      descricao: $('descricao').value.trim(),
      categoria: $('categoria').value.trim(),
      valor: valor,
      data: data
    });
    $('descricao').value = '';
    $('valor').value = '';
    $('categoria').value = '';
    $('mesSelecionado').value = data.slice(0, 7);
    render();
    $('descricao').focus();
  });

  function arredondar(n) {
    return Math.round(n * 100) / 100;
  }

  // ---------- Navegação por mês ----------
  $('mesSelecionado').value = hojeISO().slice(0, 7);
  $('data').value = hojeISO();
  $('mesSelecionado').addEventListener('change', function () {
    if (!this.value) this.value = hojeISO().slice(0, 7);
    render();
  });
  $('mesAnterior').addEventListener('click', function () {
    $('mesSelecionado').value = deslocarMes($('mesSelecionado').value, -1);
    render();
  });
  $('mesProximo').addEventListener('click', function () {
    $('mesSelecionado').value = deslocarMes($('mesSelecionado').value, 1);
    render();
  });

  // ---------- ICMS ----------
  function preencherUFs() {
    var sel = $('uf');
    var atual = sel.value || 'SP';
    sel.textContent = '';
    Object.keys(aliquotas).sort().forEach(function (uf) {
      var o = document.createElement('option');
      o.value = uf;
      o.textContent = uf;
      sel.appendChild(o);
    });
    sel.value = aliquotas[atual] !== undefined ? atual : sel.options[0].value;
    calcularIcms();
  }

  function calcularIcms() {
    var aliq = aliquotas[$('uf').value] || 0;
    var valor = parseFloat($('valorBase').value) || 0;
    var icms = arredondar(valor * aliq / 100);
    var bruto = aliq < 100 ? arredondar(valor / (1 - aliq / 100)) : 0;
    $('aliquota').value = String(aliq).replace('.', ',') + '%';
    $('icmsContido').textContent = moeda.format(icms);
    $('valorLiquido').textContent = moeda.format(valor - icms);
    $('precoBruto').textContent = moeda.format(bruto);
    return { aliq: aliq, valor: valor, icms: icms };
  }

  $('uf').addEventListener('change', calcularIcms);
  $('valorBase').addEventListener('input', calcularIcms);

  $('lancarIcms').addEventListener('click', function () {
    var r = calcularIcms();
    var icms = r.icms;
    if (!(icms > 0)) { $('valorBase').focus(); return; }
    adicionar({
      tipo: 'despesa',
      descricao: 'ICMS ' + $('uf').value + ' (' + String(r.aliq).replace('.', ',') + '% sobre ' + moeda.format(r.valor) + ')',
      categoria: 'Impostos',
      valor: icms,
      data: hojeISO()
    });
    $('mesSelecionado').value = hojeISO().slice(0, 7);
    render();
  });

  function carregarAliquotas() {
    if (!window.fetch || location.protocol === 'file:') return;
    fetch('aliquotas.csv', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (texto) {
        var lidas = {};
        texto.split(/\r?\n/).slice(1).forEach(function (linha) {
          var p = linha.split(';');
          var v = parseFloat((p[1] || '').replace(',', '.'));
          if (/^[A-Z]{2}$/.test((p[0] || '').trim()) && isFinite(v)) lidas[p[0].trim()] = v;
        });
        if (Object.keys(lidas).length) {
          aliquotas = lidas;
          preencherUFs();
        }
      })
      .catch(function () { /* mantém a tabela embutida */ });
  }

  // ---------- CSV ----------
  function campoCsv(v) {
    var s = String(v);
    return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function lerLinhasCsv(texto) {
    var linhas = [], campo = '', linha = [], aspas = false;
    for (var i = 0; i < texto.length; i++) {
      var c = texto[i];
      if (aspas) {
        if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
        else if (c === '"') aspas = false;
        else campo += c;
      } else if (c === '"') aspas = true;
      else if (c === ';') { linha.push(campo); campo = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && texto[i + 1] === '\n') i++;
        linha.push(campo); linhas.push(linha); linha = []; campo = '';
      } else campo += c;
    }
    if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
    return linhas;
  }

  // Aceita "1234.56", "1234,56" e "1.234,56".
  function lerNumero(texto) {
    var t = String(texto || '').trim().replace(/[R$\s]/g, '');
    if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.');
    return parseFloat(t);
  }

  $('exportar').addEventListener('click', function () {
    var linhas = [['Data', 'Tipo', 'Descricao', 'Categoria', 'Valor']];
    lancamentos
      .slice()
      .sort(function (a, b) { return a.data.localeCompare(b.data); })
      .forEach(function (l) {
        linhas.push([l.data, l.tipo, l.descricao, l.categoria || '', l.valor.toFixed(2)]);
      });
    var csv = linhas.map(function (l) { return l.map(campoCsv).join(';'); }).join('\n');
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lancamentos.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  $('importar').addEventListener('change', function () {
    var arquivo = this.files[0];
    this.value = '';
    if (!arquivo) return;
    arquivo.text().then(function (texto) {
      var linhas = lerLinhasCsv(texto.replace(/^﻿/, '')).slice(1);
      var novos = linhas.map(function (p) {
        return {
          id: novoId(),
          data: (p[0] || '').trim(),
          tipo: (p[1] || '').trim().toLowerCase(),
          descricao: (p[2] || '').trim(),
          categoria: (p[3] || '').trim(),
          valor: arredondar(lerNumero(p[4]))
        };
      }).filter(valido);
      if (!novos.length) { alert('Nenhum lançamento válido encontrado no arquivo.'); return; }
      lancamentos = lancamentos.concat(novos);
      salvar();
      render();
      alert(novos.length + ' lançamento(s) importado(s).');
    });
  });

  // ---------- Início ----------
  preencherUFs();
  carregarAliquotas();
  render();
})();
