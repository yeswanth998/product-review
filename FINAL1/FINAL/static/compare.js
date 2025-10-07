document.addEventListener("DOMContentLoaded", () => {
  const brandSelect1 = document.getElementById("brandSelect1");
  const modelSelect1 = document.getElementById("modelSelect1");
  const brandSelect2 = document.getElementById("brandSelect2");
  const modelSelect2 = document.getElementById("modelSelect2");
  // use the same button id as in compare.html
  const compareModelsBtn = document.getElementById("compareModelsBtn");
  const comparisonSection = document.getElementById("comparisonSection");
  const avgBanner = document.getElementById('avgSentimentBanner');
  const avgValue = document.getElementById('avgSentimentValue');

  if (avgBanner) avgBanner.style.display = 'none';

  async function updateModelSelect(brandSelect, modelSelect) {
    if (!brandSelect || !modelSelect) return;
    const brand = brandSelect.value;
    modelSelect.innerHTML = "<option value=''>-- Select Model --</option>";
    if (!brand) return;
    try {
      const res = await fetch("/get_models", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brand: brand.toLowerCase().trim() }) });
      const models = await res.json();
      models.forEach(model => { const option = document.createElement("option"); option.value = model; option.textContent = model; modelSelect.appendChild(option); });
    } catch (err) {
      console.error('Error loading models for compare', err);
    }
  }

  if (brandSelect1 && modelSelect1) brandSelect1.addEventListener('change', () => updateModelSelect(brandSelect1, modelSelect1));
  if (brandSelect2 && modelSelect2) brandSelect2.addEventListener('change', () => updateModelSelect(brandSelect2, modelSelect2));

  if (compareModelsBtn) {
    compareModelsBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      const brand1 = brandSelect1?.value; const model1 = modelSelect1?.value; const brand2 = brandSelect2?.value; const model2 = modelSelect2?.value;
      if (!(brand1 && model1 && brand2 && model2)) {
        if (comparisonSection) { comparisonSection.innerHTML = '<p>Please select both companies and models to compare.</p>'; comparisonSection.style.display = 'block'; }
        return;
      }
      try {
        const res = await fetch("/compare_devices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brand1: brand1.toLowerCase().trim(), model1: model1.toLowerCase().trim(), brand2: brand2.toLowerCase().trim(), model2: model2.toLowerCase().trim() }) });
        const data = await res.json();
        const device1 = data.device1 || [];
        const device2 = data.device2 || [];
        const avg1 = device1.length ? (device1.reduce((sum, r) => sum + parseFloat(r['Star Rating'] || 0), 0) / device1.length).toFixed(2) : 'N/A';
        const avg2 = device2.length ? (device2.reduce((sum, r) => sum + parseFloat(r['Star Rating'] || 0), 0) / device2.length).toFixed(2) : 'N/A';
        const avgSent1 = device1.length ? (device1.reduce((sum, r) => sum + (parseFloat((r.sentiment && r.sentiment.score) || 0)), 0) / device1.length) : null;
        const avgSent2 = device2.length ? (device2.reduce((sum, r) => sum + (parseFloat((r.sentiment && r.sentiment.score) || 0)), 0) / device2.length) : null;

        if (comparisonSection) {
          comparisonSection.innerHTML = `
            <div class='compare-table'>
              <div class='compare-col'>
                <h3>${device1[0]?.Brand || brand1} - ${device1[0]?.Model || model1}</h3>
                <ul>${device1.map(r => { const sent = r.sentiment || {score:0,label:'neutral'}; return `<li>${r['Review Summary']} (<span class='star'>&#11088;</span> ${r['Star Rating']}) <span class='sentiment-tag ${sent.label}'>${sent.label} (${sent.score})</span></li>`; }).join('')}</ul>
                <div class='avg-rating'>Average Rating: <strong>${avg1}</strong></div>
                <div class='avg-sentiment'>Average Sentiment: <strong>${avgSent1 !== null ? avgSent1.toFixed(3) : 'N/A'}</strong></div>
              </div>
              <div class='compare-col'>
                <h3>${device2[0]?.Brand || brand2} - ${device2[0]?.Model || model2}</h3>
                <ul>${device2.map(r => { const sent = r.sentiment || {score:0,label:'neutral'}; return `<li>${r['Review Summary']} (<span class='star'>&#11088;</span> ${r['Star Rating']}) <span class='sentiment-tag ${sent.label}'>${sent.label} (${sent.score})</span></li>`; }).join('')}</ul>
                <div class='avg-rating'>Average Rating: <strong>${avg2}</strong></div>
                <div class='avg-sentiment'>Average Sentiment: <strong>${avgSent2 !== null ? avgSent2.toFixed(3) : 'N/A'}</strong></div>
              </div>
            </div>
            <div class='final-result' style='margin-top:20px; text-align:center; font-size:1.1rem; font-weight:600;'>${(avg1 !== 'N/A' && avg2 !== 'N/A') ? (avg1 > avg2 ? `${device1[0]?.Brand || brand1} - ${device1[0]?.Model || model1} is better!` : (avg2 > avg1 ? `${device2[0]?.Brand || brand2} - ${device2[0]?.Model || model2} is better!` : 'Both models are equally rated!')) : ''}</div>
          `;
          comparisonSection.style.display = 'block';
        }

        if (avgValue && avgBanner) {
          if (avgSent1 !== null && avgSent2 !== null) {
            avgValue.textContent = (((avgSent1 + avgSent2) / 2)).toFixed(3);
            avgBanner.style.display = 'block';
          } else if (avgSent1 !== null) { avgValue.textContent = avgSent1.toFixed(3); avgBanner.style.display = 'block'; }
          else if (avgSent2 !== null) { avgValue.textContent = avgSent2.toFixed(3); avgBanner.style.display = 'block'; }
          else { avgValue.textContent = 'N/A'; avgBanner.style.display = 'none'; }
        }

      } catch (err) {
        console.error('Error fetching compare data', err);
        if (comparisonSection) { comparisonSection.innerHTML = '<p>Error loading comparison.</p>'; comparisonSection.style.display = 'block'; }
      }
    });
  }

});
