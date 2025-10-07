document.addEventListener("DOMContentLoaded", () => {
  const brandSelect = document.getElementById("brandSelect");
  const modelSelect = document.getElementById("modelSelect");
  const reviewsSection = document.getElementById("reviewsSection");
  const getReviewsBtn = document.getElementById("getReviewsBtn");
  const compareBtn = document.getElementById("compareBtn");
  const brandSelect1 = document.getElementById("brandSelect1");
  const modelSelect1 = document.getElementById("modelSelect1");
  const brandSelect2 = document.getElementById("brandSelect2");
  const modelSelect2 = document.getElementById("modelSelect2");
  const comparisonResults = document.getElementById("comparisonResults");
  const comparisonSection = document.getElementById("comparisonSection");
  const showComparisonBtn = document.getElementById("showComparisonBtn");
  const compareForm = document.getElementById("compareForm");
  const showReviewsBtn = document.getElementById("showReviewsBtn");
  const compareModelsBtn = document.getElementById("compareModelsBtn");

  function updateGetReviewsBtnVisibility() {
    const brand = brandSelect.value;
    const model = modelSelect.value;
    if (brand && model) {
      getReviewsBtn.style.display = "block";
    } else {
      getReviewsBtn.style.display = "none";
    }
  }

  if (brandSelect && modelSelect) {
    brandSelect.addEventListener("change", async () => {
      const brand = brandSelect.value;
      modelSelect.innerHTML = "<option value=''>-- Select Model --</option>";
      reviewsSection.innerHTML = ""; // Always clear reviews on brand change
      if (brand) {
        const res = await fetch("/get_models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand })
        });
        const models = await res.json();
        models.forEach(model => {
          const option = document.createElement("option");
          option.value = model;
          option.textContent = model;
          modelSelect.appendChild(option);
        });
      }
    });
    modelSelect.addEventListener("change", () => {
      reviewsSection.innerHTML = ""; // Always clear reviews on model change
    });
    showReviewsBtn.addEventListener("click", async () => {
      const brand = brandSelect.value;
      const model = modelSelect.value;
      reviewsSection.innerHTML = "";
      if (brand && model) {
        const res = await fetch("/get_reviews_with_avg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand, model })
        });
        const data = await res.json();
        const reviews = data.reviews;
        const avg = data.average_rating !== null ? data.average_rating.toFixed(2) : "N/A";
        if (reviews.length > 0) {
          reviewsSection.innerHTML = `
            <div class='compare-card'>
              <h2>Reviews for ${model}</h2>
              <ul>${reviews.map(r => `<li>${r['Review Summary']} (⭐ ${r['Star Rating']})</li>`).join('')}</ul>
              <div class='avg-rating'>Average Rating: <strong>${avg}</strong></div>
            </div>
          `;
        } else {
          reviewsSection.innerHTML = `<div class='compare-card'><p>No reviews found for this model.</p></div>`;
        }
      } else {
        reviewsSection.innerHTML = `<div class='compare-card'><p>Please select both company and model.</p></div>`;
      }
    });
  }

  async function updateModelSelect(brandSelect, modelSelect) {
    const brand = brandSelect.value;
    modelSelect.innerHTML = "<option value=''>-- Select Model --</option>";
    if (brand) {
      const res = await fetch("/get_models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand }) // send brand as-is
      });
      const models = await res.json();
      console.log('Models for brand', brand, models); // debug log
      models.forEach(model => {
        const option = document.createElement("option");
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
      });
    }
    updateCompareBtnVisibility();
  }

  function updateCompareBtnVisibility() {
    const brand1 = brandSelect1.value;
    const model1 = modelSelect1.value;
    const brand2 = brandSelect2.value;
    const model2 = modelSelect2.value;
    if (brand1 && model1 && brand2 && model2) {
      compareBtn.style.display = "block";
    } else {
      compareBtn.style.display = "none";
    }
  }

  function updateShowComparisonBtnVisibility() {
    const brand1 = brandSelect1.value;
    const model1 = modelSelect1.value;
    const brand2 = brandSelect2.value;
    const model2 = modelSelect2.value;
    if (brand1 && model1 && brand2 && model2) {
      showComparisonBtn.style.display = "block";
    } else {
      showComparisonBtn.style.display = "none";
      if (comparisonSection) comparisonSection.style.display = "none";
    }
  }

  if (brandSelect1 && modelSelect1 && brandSelect2 && modelSelect2) {
    brandSelect1.addEventListener("change", () => { updateModelSelect(brandSelect1, modelSelect1); updateShowComparisonBtnVisibility(); });
    brandSelect2.addEventListener("change", () => { updateModelSelect(brandSelect2, modelSelect2); updateShowComparisonBtnVisibility(); });
    modelSelect1.addEventListener("change", updateShowComparisonBtnVisibility);
    modelSelect2.addEventListener("change", updateShowComparisonBtnVisibility);

    showComparisonBtn.addEventListener("click", async () => {
      const brand1 = brandSelect1.value;
      const model1 = modelSelect1.value;
      const brand2 = brandSelect2.value;
      const model2 = modelSelect2.value;
      comparisonResults.innerHTML = "";
      if (brand1 && model1 && brand2 && model2) {
        const res = await fetch("/compare_devices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand1, model1, brand2, model2 })
        });
        const data = await res.json();
        comparisonResults.innerHTML = `
          <div class='compare-table'>
            <div class='compare-col'>
              <h3>${brand1} - ${model1}</h3>
              <ul>${data.device1.map(r => `<li>${r['Review Summary']} (⭐ ${r['Star Rating']})</li>`).join('')}</ul>
            </div>
            <div class='compare-col'>
              <h3>${brand2} - ${model2}</h3>
              <ul>${data.device2.map(r => `<li>${r['Review Summary']} (⭐ ${r['Star Rating']})</li>`).join('')}</ul>
            </div>
          </div>
        `;
        if (comparisonSection) comparisonSection.style.display = "block";
      }
    });
    showComparisonBtn.style.display = "none";
    if (comparisonSection) comparisonSection.style.display = "none";
  }

  if (compareForm) {
    compareForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const brand = brandSelect.value;
      const model = modelSelect.value;
      if (brand && model) {
        window.location.href = `/compare?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`;
      } else {
        alert("Please select both company and model.");
      }
    });
  }

  if (compareModelsBtn) {
    compareModelsBtn.addEventListener("click", function() {
      window.location.href = "/compare";
    });
  }
});
