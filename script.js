// Replace with your Mathpix API key
const MATHPIX_API_KEY = 'YOUR_API_KEY_HERE';

async function processImages() {
    const files = document.getElementById('imageUpload').files;
    const tableBody = document.querySelector('#resultsTable tbody');
    const downloadButton = document.getElementById('downloadButton');
    tableBody.innerHTML = ''; // Clear previous results

    if (files.length === 0) {
        alert('Please upload at least one image.');
        return;
    }

    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('options', JSON.stringify({ formats: ['smiles'] }));

        try {
            const response = await fetch('https://api.mathpix.com/v3/chemistry', {
                method: 'POST',
                headers: { 'app_key': MATHPIX_API_KEY },
                body: formData
            });
            const data = await response.json();
            const smiles = data.smiles || 'Recognition failed';
            addToTable(file, smiles);
        } catch (error) {
            console.error('Error:', error);
            addToTable(file, 'Error');
        }
    }
    downloadButton.style.display = 'block'; // Show download button after processing
}

function addToTable(file, smiles) {
    const tableBody = document.querySelector('#resultsTable tbody');
    const row = document.createElement('tr');

    // Image thumbnail
    const imgCell = document.createElement('td');
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.width = 100;
    imgCell.appendChild(img);

    // Structure rendering
    const structureCell = document.createElement('td');
    const canvas = document.createElement('canvas');
    canvas.id = `structure-${file.name}-${Date.now()}`; // Unique ID
    structureCell.appendChild(canvas);

    // SMILES code
    const smilesCell = document.createElement('td');
    smilesCell.textContent = smiles;

    row.appendChild(imgCell);
    row.appendChild(structureCell);
    row.appendChild(smilesCell);
    tableBody.appendChild(row);

    // Render structure if SMILES is valid
    if (smiles && smiles !== 'Recognition failed' && smiles !== 'Error') {
        try {
            const mol = ChemDoodle.readSMILES(smiles);
            const viewer = new ChemDoodle.ViewerCanvas(canvas.id, 100, 100);
            viewer.loadMolecule(mol);
        } catch (e) {
            structureCell.textContent = 'Rendering failed';
        }
    }
}

function downloadCSV() {
    const rows = Array.from(document.querySelectorAll('#resultsTable tbody tr'));
    let csvContent = 'data:text/csv;charset=utf-8,Filename,SMILES\n';

    rows.forEach(row => {
        const filename = row.cells[0].querySelector('img').src.split('/').pop();
        const smiles = row.cells[2].textContent;
        csvContent += `"${filename}","${smiles}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'smiles_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
