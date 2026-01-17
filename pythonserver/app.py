import json
from dotenv import load_dotenv
import spacy
from flask import Flask, request, jsonify
from flask_cors import CORS
import re
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import nltk
import logging
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId
import os

# Logging configuration
for logger_name in [
    "pymongo",
    "pymongo.pool",
    "pymongo.server_selection",
    "pymongo.topology",
    "urllib3",
    "requests",
]:
    logging.getLogger(logger_name).setLevel(logging.WARNING)

logging.basicConfig(
    level=logging.DEBUG,
    format='%(levelname)s:%(name)s:%(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Flask app
app = Flask(__name__)
CORS(app)

# NLP setup
nltk.download('vader_lexicon', quiet=True)
nlp = spacy.load("en_core_web_sm")
sid = SentimentIntensityAnalyzer()

# Predefined skill list
PREDEFINED_SKILLS = {
    "Plumbing": ["plumbing", "pipe repair", "leak fixing", "drain cleaning"],
    "Electrical": ["wiring", "circuit repair", "electrical installation"],
    "Carpentry": ["woodwork", "furniture repair", "cabinet making"],
    "Painting": ["wall painting", "house painting"],
    "Others": []
}

# MongoDB client
client = MongoClient(os.environ.get("MONGODB_URI"), serverSelectionTimeoutMS=60000)
db = client['test']

# Utility functions
def preprocess_text(text):
    return re.sub(r'\s+', ' ', text.lower().strip())

def extract_skills(text):
    if not text:
        return {}
    processed_text = preprocess_text(text)
    doc = nlp(processed_text)
    potential_skills = {token.text for token in doc if token.pos_ in ["NOUN", "VERB"] and len(token.text) > 2}
    categorized_skills = {}
    for category, skills in PREDEFINED_SKILLS.items():
        matched_skills = [skill for skill in skills if skill in potential_skills]
        if matched_skills or category == "Others":
            categorized_skills[category] = matched_skills
    if not categorized_skills:
        categorized_skills["Others"] = list(potential_skills)
    return categorized_skills

def analyze_sentiment(text):
    if not text:
        return {"sentiment": "neutral", "score": 0.0, "flag": False}
    sentiment_scores = sid.polarity_scores(text)
    compound_score = sentiment_scores["compound"]
    logger.debug(f"Text: {text}, Compound Score: {compound_score}")
    if compound_score >= 0.1:
        sentiment = "positive"
    elif compound_score <= -0.1:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    flag = sentiment == "negative"
    return {"sentiment": sentiment, "score": compound_score, "flag": flag}

def preprocess_text_spacy(text):
    text = re.sub(r'\s+', ' ', text.lower().strip())
    doc = nlp(text)
    tokens = [token.lemma_ for token in doc if not token.is_stop and token.is_alpha]
    return " ".join(tokens)

# Routes
@app.route("/extract-skills", methods=["POST"])
def extract_skills_endpoint():
    data = request.get_json()
    text = data.get("text", "")
    categorized_skills = extract_skills(text)
    return jsonify({"categorized_skills": categorized_skills})

@app.route("/analyze-sentiment", methods=["POST"])
def analyze_sentiment_endpoint():
    data = request.get_json()
    text = data.get("text", "")
    sentiment_result = analyze_sentiment(text)
    return jsonify(sentiment_result)
# ... (keep your imports and utils)

@app.route("/recommend-jobs", methods=["POST"])
def recommend_jobs():
    data = request.get_json()
    search_query = data.get("query", "").strip().lower()
    freelancer_skills = data.get("skills", [])  # Now used!

    if not search_query:
        logger.debug("No search query provided.")
        return jsonify({"error": "Missing search query"}), 400

    try:
        # Suggest category from query
        categorized = extract_skills(search_query)
        suggested_category = list(categorized.keys())[0] if categorized else None

        # Pre-filter jobs by suggested category if available (efficient!)
        query_filter = {"category": suggested_category} if suggested_category else {}
        jobs = list(db.projects.find(query_filter, {"title": 1, "description": 1, "skillsRequired": 1, "category": 1, "_id": 1}))
        logger.debug(f"Filtered jobs fetched: {len(jobs)} (category: {suggested_category})")

        if not jobs:
            return jsonify({"threshold_values": [], "suggestions": []}), 200

        # Incorporate freelancer skills into query for personalization
        skills_text = " ".join(freelancer_skills).lower()
        full_query = f"{search_query} {skills_text}".strip()
        processed_query = preprocess_text_spacy(full_query)

        job_texts = [preprocess_text_spacy(f"{job.get('title', '')} {job.get('description', '')} {' '.join(job.get('skillsRequired', []))}") for job in jobs]

        all_texts = [processed_query] + job_texts
        vectorizer = TfidfVectorizer(ngram_range=(1, 2))  # Add n-grams for better phrase matching
        tfidf_matrix = vectorizer.fit_transform(all_texts)
        cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

        # Sort and filter with higher threshold
        sim_scores = sorted(enumerate(cosine_sim), key=lambda x: x[1], reverse=True)
        suggestions = [
            {
                "job_id": str(jobs[i]["_id"]),
                "title": jobs[i].get("title", "No Title"),
                "description": jobs[i].get("description", "No Description"),
                "score": round(float(score), 3)
            }
            for i, score in sim_scores if score > 0.15  # Stricter threshold
        ][:10]  # Limit to top 10

        return jsonify({"query": search_query, "suggestions": suggestions}), 200

    except Exception as e:
        logger.error(f"Error in recommend_jobs: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route("/related-jobs/<job_id>", methods=["POST"])
def get_related_jobs(job_id):
    data = request.get_json()
    query = data.get("query", "").strip().lower()
    freelancer_skills = data.get("skills", [])  # Now used!

    if not query or not job_id:
        return jsonify({"error": "Missing query or job_id"}), 400

    try:
        # Fetch clicked job
        clicked_job = db.projects.find_one({"_id": ObjectId(job_id)}, {"title": 1, "description": 1, "skillsRequired": 1, "category": 1})
        if not clicked_job:
            return jsonify({"suggestions": [], "message": "Job not found"}), 404

        clicked_category = clicked_job.get("category", "Others")

        # Pre-filter by category (key to relevance!)
        query_filter = {"category": clicked_category}
        all_jobs = list(db.projects.find(query_filter, {"title": 1, "description": 1, "skillsRequired": 1, "_id": 1}))

        if len(all_jobs) < 5:  # Fallback if too few
            all_jobs += list(db.projects.find({"category": {"$ne": clicked_category}}, {"title": 1, "description": 1, "skillsRequired": 1, "_id": 1}))[:10]

        if not all_jobs:
            return jsonify({"suggestions": []}), 200

        # Combine query + clicked job + freelancer skills
        clicked_text = preprocess_text_spacy(f"{clicked_job.get('title', '')} {clicked_job.get('description', '')} {' '.join(clicked_job.get('skillsRequired', []))}")
        skills_text = " ".join(freelancer_skills).lower()
        search_text = f"{query} {clicked_text} {skills_text}".strip()
        processed_search = preprocess_text_spacy(search_text)

        job_texts = [preprocess_text_spacy(f"{job.get('title', '')} {job.get('description', '')} {' '.join(job.get('skillsRequired', []))}") for job in all_jobs]

        all_texts = [processed_search] + job_texts
        vectorizer = TfidfVectorizer(ngram_range=(1, 2))  # Add n-grams
        tfidf_matrix = vectorizer.fit_transform(all_texts)
        cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

        # Sort and filter
        sim_scores = sorted(enumerate(cosine_sim), key=lambda x: x[1], reverse=True)
        suggestions = [
            {
                "job_id": str(all_jobs[i]["_id"]),
                "title": all_jobs[i].get("title", "No Title"),
                "description": all_jobs[i].get("description", "No Description"),
                "score": round(float(score), 3)
            }
            for i, score in sim_scores if score > 0.15
        ][:10]

        return jsonify({"suggestions": suggestions}), 200

    except Exception as e:
        logger.error(f"Error in get_related_jobs: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500
@app.route("/match-jobs", methods=["POST"])
def match_jobs():
    data = request.get_json()
    search_query = data.get("query", "")

    if not search_query:
        return jsonify({"error": "Missing search query"}), 400

    try:
        client.admin.command('ping')
        logger.info("MongoDB connected successfully")

        jobs = list(db.projects.find({}, {"title": 1, "description": 1, "skillsRequired": 1}))
        if not jobs:
            return jsonify({"top_matches": [], "message": "No jobs found"}), 200

        job_texts = [
            f"{job.get('title', '')} {job.get('description', '')} {', '.join(job.get('skillsRequired', []))}"
            for job in jobs
        ]
        all_texts = [search_query] + job_texts

        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform(all_texts)
        cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])

        sim_scores = sorted(enumerate(cosine_sim[0]), key=lambda x: x[1], reverse=True)
        top_matches = [
            {
                "job_id": str(jobs[i]["_id"]),
                "title": jobs[i].get("title", "No Title"),
                "description": jobs[i].get("description", "No Description"),
                "skillsRequired": jobs[i].get("skillsRequired", []),
                "score": float(score)
            }
            for i, score in sim_scores if score > 0.1
        ][:5]

        return jsonify({"top_matches": top_matches, "status": "MongoDB connected successfully"})
    except Exception as e:
        logger.error(f"Error connecting to MongoDB Atlas: {e}")
        return jsonify({"error": "Failed to fetch jobs", "details": str(e)}), 500

# Run app
if __name__ == "__main__":
    try:
        app.run(debug=True, host="0.0.0.0", port=5000)
    finally:
        client.close()
        logger.info("MongoClient closed on application shutdown")
