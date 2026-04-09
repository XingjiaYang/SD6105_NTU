from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.manifold import TSNE
from sklearn.preprocessing import StandardScaler, LabelEncoder
import os

app = Flask(__name__)
CORS(app)  


DATA_PATH = './data_clean/IPEDS_data_cleaned.csv'

def load_and_preprocess():
    if not os.path.exists(DATA_PATH):
        return None
    df = pd.read_csv(DATA_PATH)
    return df

@app.route('/get_columns', methods=['GET'])
def get_columns():
    df = load_and_preprocess()
    if df is None: return jsonify({"error": "File not found"}), 404
    return jsonify({"columns": df.columns.tolist()})

@app.route('/run_tsne', methods=['POST'])
def run_tsne():
    params = request.json
    mode = params.get('mode', 'sampled')
    sample_size = int(params.get('sample_size', 300))
    seed = int(params.get('seed', 42))
    perplexity = float(params.get('perplexity', 30))
    label_col = params.get('label_col')

    df = load_and_preprocess()
    if df is None: return jsonify({"error": "File not found"}), 404

    if mode == 'sampled' and sample_size < len(df):
        working_df = df.sample(n=sample_size, random_state=seed)
    else:
        working_df = df


    numeric_df = working_df.select_dtypes(include=[np.number])
    
    if numeric_df.empty:
        return jsonify({"error": "No numeric columns for t-SNE"}), 400

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(numeric_df.fillna(0))


    tsne = TSNE(
        n_components=2,
        perplexity=perplexity,
        random_state=seed,
        init='pca',
        learning_rate='auto'
    )
    
    coords = tsne.fit_transform(X_scaled)

    results = []
    labels = working_df[label_col].astype(str).tolist() if label_col in working_df.columns else ["None"] * len(working_df)
    
    for i in range(len(coords)):
        results.append({
            "x": float(coords[i, 0]),
            "y": float(coords[i, 1]),
            "label": labels[i]
        })

    return jsonify({
        "points": results,
        "count": len(results)
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)