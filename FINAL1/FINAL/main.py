from flask import Flask, render_template, request, jsonify
import pandas as pd

app = Flask(__name__)

 # Load new dataset (update filename if needed)
df = pd.read_csv("data/your_new_dataset.csv", encoding="latin1")  # Change to your new CSV filename and encoding if needed
df = df.dropna(subset=['Brand', 'Model', 'Review Summary'])

# Strip whitespace from column names to avoid KeyError
df.columns = df.columns.str.strip()

# Print columns for debugging
print('DataFrame columns:', list(df.columns))

# Simple lexicon-based sentiment scoring (small, dependency-free)
POSITIVE_WORDS = set(["good", "great", "excellent", "amazing", "love", "liked", "best", "nice", "satisfied", "happy", "fantastic", "perfect", "easy"]) 
NEGATIVE_WORDS = set(["bad", "terrible", "awful", "hate", "disappointed", "worst", "poor", "buggy", "slow", "problem", "issue", "broken", "difficult"])

def sentiment_score(text: str):
    """Return a sentiment score between -1 (very negative) and +1 (very positive) and a label."""
    if not text or not isinstance(text, str):
        return {"score": 0.0, "label": "neutral"}
    text_l = text.lower()
    # simple tokenization
    tokens = [w.strip(".,!?:;()[]\"\'") for w in text_l.split()]
    pos = sum(1 for t in tokens if t in POSITIVE_WORDS)
    neg = sum(1 for t in tokens if t in NEGATIVE_WORDS)
    # score: normalized difference
    total = pos + neg
    if total == 0:
        score = 0.0
    else:
        score = (pos - neg) / total
    if score > 0.2:
        label = "positive"
    elif score < -0.2:
        label = "negative"
    else:
        label = "neutral"
    return {"score": round(float(score), 3), "label": label}

# Routes
@app.route("/")
def home():
    brands = sorted(df['Brand'].dropna().unique().tolist())
    return render_template("index.html", brands=brands)

@app.route("/get_models", methods=["POST"])
def get_models():
    data = request.json
    brand = data.get("brand", "").strip().lower()
    # Match brand case-insensitively and ignore whitespace
    models = df[df['Brand'].str.strip().str.lower() == brand]['Model'].dropna().unique().tolist()
    # If no models found, try partial match (for extra robustness)
    if not models:
        models = df[df['Brand'].str.strip().str.lower().str.contains(brand)]['Model'].dropna().unique().tolist()
    return jsonify(models)

@app.route("/get_reviews", methods=["POST"])
def get_reviews():
    data = request.json
    brand = data.get("brand", "").strip().lower()
    model = data.get("model", "").strip().lower()
    reviews = df[
        (df['Brand'].str.strip().str.lower() == brand) &
        (df['Model'].str.strip().str.lower() == model)
    ][['Review Summary', 'Star Rating']].head(5).to_dict(orient='records')
    # attach sentiment for each review
    for r in reviews:
        s = sentiment_score(r.get('Review Summary', ''))
        r['sentiment'] = s
    return jsonify(reviews)

@app.route("/compare_devices", methods=["POST"])
def compare_devices():
    data = request.json
    print("Request received for /compare_devices")
    print("Data:", data)
    brand1 = data.get("brand1", "").strip().lower()
    model1 = data.get("model1", "").strip().lower()
    brand2 = data.get("brand2", "").strip().lower()
    model2 = data.get("model2", "").strip().lower()
    device1_reviews = df[
        (df['Brand'].str.strip().str.lower() == brand1) &
        (df['Model'].str.strip().str.lower() == model1)
    ][['Brand', 'Model', 'Review Summary', 'Star Rating']].head(5).to_dict(orient='records')
    device2_reviews = df[
        (df['Brand'].str.strip().str.lower() == brand2) &
        (df['Model'].str.strip().str.lower() == model2)
    ][['Brand', 'Model', 'Review Summary', 'Star Rating']].head(5).to_dict(orient='records')
    # attach sentiment to each review for frontend display
    for r in device1_reviews:
        r['sentiment'] = sentiment_score(r.get('Review Summary', ''))

    for r in device2_reviews:
        r['sentiment'] = sentiment_score(r.get('Review Summary', ''))

    return jsonify({"device1": device1_reviews, "device2": device2_reviews})

@app.route("/compare")
def compare():
    brands = sorted(df['Brand'].dropna().unique().tolist())
    print("Brands available:", brands)  # Debugging line to check brands
    return render_template("compare.html", brands=brands)

@app.route("/get_reviews_with_avg", methods=["POST"])
def get_reviews_with_avg():
    data = request.json
    brand = data.get("brand", "").strip().lower()
    model = data.get("model", "").strip().lower()
    reviews_df = df[
        (df['Brand'].str.strip().str.lower() == brand) &
        (df['Model'].str.strip().str.lower() == model)
    ][['Review Summary', 'Star Rating']].head(5)
    reviews = reviews_df.to_dict(orient='records')
    # attach sentiment scores and compute average sentiment
    sentiments = []
    for r in reviews:
        s = sentiment_score(r.get('Review Summary', ''))
        r['sentiment'] = s
        sentiments.append(s['score'])
    # Calculate average rating
    avg_rating = reviews_df['Star Rating'].astype(float).mean() if not reviews_df.empty else None
    avg_sentiment = round(sum(sentiments)/len(sentiments), 3) if sentiments else None
    return jsonify({"reviews": reviews, "average_rating": avg_rating, "average_sentiment": avg_sentiment})

if __name__ == "__main__":
    app.run(debug=True)
