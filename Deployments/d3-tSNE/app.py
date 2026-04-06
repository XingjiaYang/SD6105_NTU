from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.manifold import TSNE
import os

app = Flask(__name__)
CORS(app)  

DATA_PATH = r'./data_clean/ipeds_cleaned_and_scaled.csv'

def load_data():
    if not os.path.exists(DATA_PATH):
        return None
    return pd.read_csv(DATA_PATH)

@app.route('/get_metadata', methods=['GET'])
def get_metadata():
    """获取元数据：年份列表和所有列名"""
    df = load_data()
    if df is None: return jsonify({"error": "Data file not found"}), 404
    
    years = sorted(df['year'].unique().tolist(), reverse=True)
    columns = df.columns.tolist()
    
    return jsonify({
        "years": years,
        "columns": columns
    })

@app.route('/run_tsne', methods=['POST'])
def run_tsne():
    params = request.json
    selected_year = params.get('year')
    label_col = params.get('label_col', 'control_label')
    perplexity = float(params.get('perplexity', 30))
    seed = int(params.get('seed', 42))

    df = load_data()
    if df is None: return jsonify({"error": "File not found"}), 404

    if selected_year:
        working_df = df[df['year'] == int(selected_year)].copy()
    else:
        latest_year = df['year'].max()
        working_df = df[df['year'] == latest_year].copy()

    if working_df.empty:
        return jsonify({"error": "No data found for the selection"}), 400

    id_cols = ['unitid', 'institution_name', 'year', 'state_abbr', 'zip_code', 'county_name']
    features = [c for c in working_df.columns if c not in id_cols]
    numeric_df = working_df[features].select_dtypes(include=[np.number])
    
    X = numeric_df.fillna(0).values
    
    tsne = TSNE(
        n_components=2,
        perplexity=perplexity,
        random_state=seed,
        init='pca',
        learning_rate='auto',
        n_jobs=-1
    )
    
    coords = tsne.fit_transform(X)

    results = []
    labels = working_df[label_col].fillna("Unknown").astype(str).values
    names = working_df['institution_name'].values

    for i in range(len(coords)):
        results.append({
            "x": float(coords[i, 0]),
            "y": float(coords[i, 1]),
            "label": labels[i],
            "name": names[i]
        })

    return jsonify({
        "year": selected_year,
        "count": len(results),
        "data": results
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)