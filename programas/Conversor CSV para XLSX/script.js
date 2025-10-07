
let currentWorkbook = null;
let currentFiles = [];

function sanitizeCell(cell) {
  return cell.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
}

function processCell(cell) {
  const trimmed = cell.trim();
  if (trimmed !== '' && !isNaN(trimmed) && !isNaN(parseFloat(trimmed))) {
    return parseFloat(trimmed);
  }
  return cell;
}

function showStatus(message, isError = false) {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  statusElement.className = isError ? 'status error' : 'status success';
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function clearFiles() {
  document.getElementById('csvFiles').value = '';
  currentFiles = [];
  currentWorkbook = null;
  document.getElementById('file-info').innerHTML = '';
  document.getElementById('action-buttons').style.display = 'none';
  document.getElementById('preview').innerHTML = '';
  showStatus('');
}

function updateFileInfo() {
  const fileInfo = document.getElementById('file-info');
  const actionButtons = document.getElementById('action-buttons');
  if (currentFiles.length > 0) {
    fileInfo.innerHTML = `<p>${currentFiles.length} arquivo(s) selecionado(s)</p>`;
    actionButtons.style.display = 'flex';
  } else {
    fileInfo.innerHTML = '';
    actionButtons.style.display = 'none';
  }
}

function showSpinner(show) {
  document.getElementById('spinner').style.display = show ? 'block' : 'none';
}

function previewData(data) {
  const preview = document.getElementById('preview');
  const lines = data.slice(0, 5).map(row => row.join(' | ')).join('<br>');
  preview.innerHTML = `<strong>Pré-visualização:</strong><br>${lines}`;
}

function downloadCombined() {
  if (!currentWorkbook) {
    showStatus('Nenhum arquivo processado ainda', true);
    return;
  }
  showStatus('Preparando download...');
  const wbout = XLSX.write(currentWorkbook, {bookType:'xlsx', type:'array'});
  const blob = new Blob([wbout], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  triggerDownload(blob, 'planilhas_completas.xlsx');
  showStatus('Arquivo baixado com sucesso!');
}

function downloadSeparate() {
  if (!currentWorkbook) {
    showStatus('Nenhum arquivo processado ainda', true);
    return;
  }
  showStatus('Preparando downloads separados...');
  currentWorkbook.SheetNames.forEach(sheetName => {
    const sheet = currentWorkbook.Sheets[sheetName];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, sheetName);
    const wbout = XLSX.write(wb, {bookType:'xlsx', type:'array'});
    const blob = new Blob([wbout], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    triggerDownload(blob, `${sheetName}.xlsx`);
  });
  showStatus('Arquivos baixados separadamente com sucesso!');
}

function processFiles() {
  const input = document.getElementById('csvFiles');
  const files = input.files;
  if (files.length === 0) {
    showStatus("Por favor, selecione pelo menos um arquivo CSV.", true);
    return;
  }

  currentFiles = Array.from(files);
  updateFileInfo();
  showSpinner(true);
  showStatus("Processando arquivos...");
  currentWorkbook = XLSX.utils.book_new();
  let processed = 0;

  currentFiles.forEach(file => {
    if (!file.name.endsWith('.csv')) {
      showStatus(`Arquivo ${file.name} não é um CSV válido.`, true);
      processed++;
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const text = e.target.result;
        const delimiter = text.includes(';') ? ';' : ',';
        const rows = text.split('\n').filter(row => row.trim() !== '');
        if (rows.length === 0) {
          showStatus(`Aviso: Arquivo ${file.name} está vazio.`);
          processed++;
          return;
        }

        const data = rows.map(row =>
          row.split(delimiter).map(cell => processCell(sanitizeCell(cell)))
        );

        previewData(data);
        const sheet = XLSX.utils.aoa_to_sheet(data);
        const sheetName = file.name.replace('.csv', '').substring(0, 31);
        XLSX.utils.book_append_sheet(currentWorkbook, sheet, sheetName);

        processed++;
        if (processed === currentFiles.length) {
          showSpinner(false);
          showStatus("Conversão concluída! Arquivo pronto para download.");
        }
      } catch (error) {
        showStatus(`Erro ao processar o arquivo ${file.name}: ${error.message}`, true);
        showSpinner(false);
      }
    };
    reader.onerror = function() {
      showStatus(`Erro ao ler o arquivo ${file.name}`, true);
      showSpinner(false);
      processed++;
    };
    reader.readAsText(file);
  });
}

document.getElementById('csvFiles').addEventListener('change', function() {
  if (this.files.length > 0) {
    processFiles();
  }
});

const dropZone = document.getElementById('drop-zone');
dropZone.addEventListener('dragover', function(e) {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', function() {
  dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', function(e) {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const files = e.dataTransfer.files;
  document.getElementById('csvFiles').files = files;
  processFiles();
});
