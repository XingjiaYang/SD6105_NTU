import numpy as np
import pandas as pd
from sklearn.impute import KNNImputer
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler

file_name = 'ipeds_panel_2017_2023.csv'
df = pd.read_csv(file_name)


id_cols = ['unitid', 'institution_name', 'year', 'state_abbr', 'zip_code', 'county_name']


missing_ratio = df.isnull().sum() / len(df)

cols_to_keep = [col for col in df.columns if missing_ratio[col] < 0.1 or col in id_cols]
df_clear = df[cols_to_keep].copy()

print(f"Raw Columns: {df.shape[1]}, Cleaned Rows: {df_clear.shape[1]}")


features = [col for col in df_clear.columns if col not in id_cols]
numeric_cols = df_clear[features].select_dtypes(include=['float64', 'int64']).columns
non_numeric_cols = df_clear[features].select_dtypes(exclude=['float64', 'int64']).columns


imputer = KNNImputer(n_neighbors=5)
df_clear[numeric_cols] = imputer.fit_transform(df_clear[numeric_cols])


if len(non_numeric_cols) > 0:
    knn_model = NearestNeighbors(n_neighbors=5)
    knn_model.fit(df_clear[numeric_cols])

    for col in non_numeric_cols:
        missing_idx = df_clear[df_clear[col].isna()].index
        if len(missing_idx) > 0:
            for idx in missing_idx:

                this_row = df_clear.loc[[idx], numeric_cols]
  
                _, neighbors_indices = knn_model.kneighbors(this_row)

                neighbor_values = df_clear.loc[neighbors_indices[0], col]
                mode_val = neighbor_values.mode()
                if not mode_val.empty:
                    df_clear.at[idx, col] = mode_val[0]


if 'pct_any_aid' in df_clear.columns and 'pct_nonresident_alien' in df_clear.columns:

    df_clear['pct_any_aid_adjusted'] = (
        df_clear['pct_any_aid'] / (1 - df_clear['pct_nonresident_alien'] / 100)
    ).replace([np.inf, -np.inf], 0).fillna(0)


scale_method = StandardScaler()
df_scaled = df_clear.copy()
df_scaled[numeric_cols] = scale_method.fit_transform(df_scaled[numeric_cols])


output_file = 'ipeds_cleaned_and_scaled.csv'
df_scaled.to_csv(output_file, index=False)

print(f"Cleaning is DONE: {output_file}")
print(df_scaled[numeric_cols].head())