document.addEventListener("DOMContentLoaded", () => {
  const brandSelect = document.getElementById("brandSelect");
  const modelSelect = document.getElementById("modelSelect");
  const reviewsSection = document.getElementById("reviewsSection");
  const showReviewsBtn = document.getElementById("showReviewsBtn");
  const compareModelsBtn = document.getElementById("compareModelsBtn");
  const avgBanner = document.getElementById('avgSentimentBanner');
  const avgValue = document.getElementById('avgSentimentValue');

  // Hide banner initially
  if (avgBanner) avgBanner.style.display = 'none';

  function setTopAvgSent(val) {
    if (!avgValue) return;
    avgValue.textContent = (val === null || val === undefined) ? 'N/A' : String(val);
    if (avgBanner) {
      // show banner only when we have a concrete value (not null/undefined)
      avgBanner.style.display = (val === null || val === undefined) ? 'none' : 'block';
    }
  }

  async function loadModelsForBrand(brand) {
    if (!brand || !modelSelect) return;
    modelSelect.innerHTML = "<option value=''>-- Select Model --</option>";
    try {
      const res = await fetch('/get_models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brand }) });
      const models = await res.json();
      models.forEach(m => {
        const option = document.createElement('option');
        option.value = m;
        option.textContent = m;
        modelSelect.appendChild(option);
      });
    } catch (err) {
      console.error('Error loading models', err);
    }
  }

  if (brandSelect) brandSelect.addEventListener('change', () => { if (reviewsSection) reviewsSection.innerHTML = ''; setTopAvgSent(null); loadModelsForBrand(brandSelect.value); });
  if (modelSelect) modelSelect.addEventListener('change', () => { if (reviewsSection) reviewsSection.innerHTML = ''; });

  // Function to update and highlight sentiment score
  function updateSentimentScore(score) {
    const sentimentScoreDiv = document.getElementById('sentimentScore');
    const sentimentScoreValue = document.getElementById('sentimentScoreValue');

    if (score !== null && score !== undefined) {
      sentimentScoreValue.textContent = score.toFixed(2);
      sentimentScoreDiv.style.display = 'block';
      sentimentScoreValue.style.color = score > 0 ? 'green' : 'red';
    } else {
      sentimentScoreDiv.style.display = 'none';
    }
  }

  if (showReviewsBtn) {
    showReviewsBtn.addEventListener('click', async () => {
      if (!brandSelect || !modelSelect) return;
      const brand = brandSelect.value; const model = modelSelect.value;
      if (reviewsSection) reviewsSection.innerHTML = '';
      setTopAvgSent(null);
      if (!brand || !model) {
        if (reviewsSection) reviewsSection.innerHTML = `<div class='compare-card'><p>Please select both company and model.</p></div>`;
        return;
      }
      try {
        const res = await fetch('/get_reviews_with_avg', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brand, model }) });
        const data = await res.json();
        const reviews = data.reviews || [];
        // show average sentiment banner and value
        setTopAvgSent(data.average_sentiment);
        const avg = (data.average_rating !== null && data.average_rating !== undefined) ? Number(data.average_rating).toFixed(2) : 'N/A';
        if (reviews.length === 0) {
          if (reviewsSection) reviewsSection.innerHTML = `<div class='compare-card'><p>No reviews found for this model.</p></div>`;
          return;
        }
        if (reviewsSection) {
          reviewsSection.innerHTML = `
            <div class='compare-card'>
              <h2>Reviews for ${model}</h2>
              <ul>${reviews.map(r => { const sent = r.sentiment || {score:0,label:'neutral'}; return `<li>${r['Review Summary']} (<span class='star'>&#11088;</span> ${r['Star Rating']}) <span class='sentiment-tag ${sent.label}'>${sent.label} (${sent.score})</span></li>`; }).join('')}</ul>
              <div class='avg-rating'>Average Rating: <strong>${avg}</strong></div>
              <div class='avg-sentiment'>Average Sentiment: <strong>${data.average_sentiment !== null && data.average_sentiment !== undefined ? data.average_sentiment : 'N/A'}</strong></div>
            </div>
          `;
        }

        // removed fetch('/get_sentiment_score') which caused 404
      } catch (err) {
        console.error('Error fetching reviews', err);
        if (reviewsSection) reviewsSection.innerHTML = `<div class='compare-card'><p>Error loading reviews.</p></div>`;
      }
    });
  }

  // Handle comparison models functionality
  if (compareModelsBtn) {
    compareModelsBtn.addEventListener('click', () => { window.location.href = '/compare'; });
  }

});
