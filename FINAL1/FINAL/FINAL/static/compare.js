document.addEventListener("DOMContentLoaded", () => {
  const brandSelect1 = document.getElementById("brandSelect1");
  const modelSelect1 = document.getElementById("modelSelect1");
  const brandSelect2 = document.getElementById("brandSelect2");
  const modelSelect2 = document.getElementById("modelSelect2");
  const showComparisonBtn = document.getElementById("showComparisonBtn");
  const comparisonSection = document.getElementById("comparisonSection");

  async function updateModelSelect(brandSelect, modelSelect) {
    const brand = brandSelect.value;
    modelSelect.innerHTML = "<option value=''>-- Select Model --</option>";
    if (brand) {
      const res = await fetch("/get_models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: brand.toLowerCase().trim() })
      });
      const models = await res.json();
      models.forEach(model => {
        const option = document.createElement("option");
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
      });
    }
  }

  if (brandSelect1 && modelSelect1) {
    brandSelect1.addEventListener("change", () => updateModelSelect(brandSelect1, modelSelect1));
  }
  if (brandSelect2 && modelSelect2) {
    brandSelect2.addEventListener("change", () => updateModelSelect(brandSelect2, modelSelect2));
  }

  if (showComparisonBtn) {
    showComparisonBtn.addEventListener("click", async function(e) {
      e.preventDefault();
      const brand1 = brandSelect1.value;
      const model1 = modelSelect1.value;
      const brand2 = brandSelect2.value;
      const model2 = modelSelect2.value;
      if (brand1 && model1 && brand2 && model2) {
        const res = await fetch("/compare_devices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand1: brand1.toLowerCase().trim(), model1: model1.toLowerCase().trim(), brand2: brand2.toLowerCase().trim(), model2: model2.toLowerCase().trim() })
        });
        const data = await res.json();
        // Calculate average ratings
        const avg1 = data.device1.length ? (data.device1.reduce((sum, r) => sum + parseFloat(r['Star Rating']), 0) / data.device1.length).toFixed(2) : 'N/A';
        const avg2 = data.device2.length ? (data.device2.reduce((sum, r) => sum + parseFloat(r['Star Rating']), 0) / data.device2.length).toFixed(2) : 'N/A';
        let winner = '';
        if (avg1 !== 'N/A' && avg2 !== 'N/A') {
          if (avg1 > avg2) winner = `${data.device1[0]?.Brand || brand1} - ${data.device1[0]?.Model || model1} is better!`;
          else if (avg2 > avg1) winner = `${data.device2[0]?.Brand || brand2} - ${data.device2[0]?.Model || model2} is better!`;
          else winner = 'Both models are equally rated!';
        }
        comparisonSection.innerHTML = `
          <div class='compare-table'>
            <div class='compare-col'>
              <h3>${data.device1[0]?.Brand || brand1} - ${data.device1[0]?.Model || model1}</h3>
              <ul>${data.device1.map(r => `<li>${r['Review Summary']} (⭐ ${r['Star Rating']})</li>`).join('')}</ul>
              <div class='avg-rating'>Average Rating: <strong>${avg1}</strong></div>
            </div>
            <div class='compare-col'>
              <h3>${data.device2[0]?.Brand || brand2} - ${data.device2[0]?.Model || model2}</h3>
              <ul>${data.device2.map(r => `<li>${r['Review Summary']} (⭐ ${r['Star Rating']})</li>`).join('')}</ul>
              <div class='avg-rating'>Average Rating: <strong>${avg2}</strong></div>
            </div>
          </div>
          <div class='final-result' style='margin-top:20px; text-align:center; font-size:1.1rem; font-weight:600;'>${winner}</div>
        `;
        comparisonSection.style.display = "block";
      } else {
        comparisonSection.innerHTML = '<p>Please select both companies and models to compare.</p>';
        comparisonSection.style.display = "block";
      }
    });
  }
});
