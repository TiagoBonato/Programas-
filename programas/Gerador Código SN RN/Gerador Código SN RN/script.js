
window.onload = function() {
  document.getElementById('sn').focus();
};

const rnBases = {
  "1": 125, "01": 125,
  "2": 539, "02": 539,
  "3": 1264, "03": 1264,
  "4": 2313, "04": 2313,
  "5": 3696, "05": 3696,
  "6": 5421, "06": 5421
};

function gerarCodigo(sn, rn) {
  if (!/^\d{1,6}$/.test(sn)) {
    return {erro: "⚠️ SN inválido! Digite até 6 dígitos numéricos."};
  }
  if (!rnBases[rn]) {
    return {erro: "⚠️ Selecione um RN válido (1 a 6)."};
  }
  const base = rnBases[rn];
  const resultado = parseInt(sn) * base;
  const hex = resultado.toString(16);
  const codigo = hex.slice(-4).toUpperCase();
  return {codigo};
}

document.getElementById('formulario').onsubmit = function(e){
  e.preventDefault();
  const sn = document.getElementById('sn').value.trim();
  const rn = document.getElementById('rn').value;
  const output = document.getElementById('output');
  output.innerHTML = "";
  const res = gerarCodigo(sn, rn);
  if (res.erro) {
    output.innerHTML = `<span class="erro">${res.erro}</span>`;
    return;
  }
  output.innerHTML = `
    <div>Código Gerado:</div>
    <span class="codigo" onclick="copiarCodigo(this)">${res.codigo}</span>
    <div class="copiado" id="copiadoMsg" style="display:none;">Copiado!</div>
  `;
};

function copiarCodigo(el) {
  if (!el.innerText) return;
  navigator.clipboard.writeText(el.innerText).then(() => {
    const msg = document.getElementById('copiadoMsg');
    if(msg){
      msg.style.display = "block";
      setTimeout(()=>msg.style.display="none", 1100);
    }
  });
}

function limparCampos(){
  document.getElementById('sn').value = "";
  document.getElementById('rn').selectedIndex = 0;
  document.getElementById('output').innerHTML = "";
  document.getElementById('sn').focus();
}
