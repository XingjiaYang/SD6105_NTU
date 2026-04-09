import pandas as pd
import json

# 读取数据
df = pd.read_csv('ipeds_panel_2017_2023.csv')

# 筛选条件：包含 4 年制和 2 年制院校
df_filtered = df[df['sector_label'].str.contains('4-year|2-year', na=False)].copy()

# 州名映射
state_map = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
    'DC': 'District of Columbia'
}

df_filtered['state'] = df_filtered['state_abbr'].map(state_map)
df_filtered = df_filtered.dropna(subset=['latitude', 'longitude', 'institution_name', 'state'])

# 简化控制属性
df_filtered['type'] = df_filtered['control_label'].apply(lambda x: 'Public' if str(x) == 'Public' else 'Private')
df_filtered['rate'] = df_filtered['admission_rate'].fillna(0) / 100

# 构造最终数据集
data_by_year = {}
for year in sorted(df_filtered['year'].unique()):
    y_df = df_filtered[df_filtered['year'] == year]
    year_records = []
    for _, row in y_df.iterrows():
        year_records.append({
            "n": row['institution_name'],
            "s": row['state'],
            "lat": round(row['latitude'], 4),
            "lon": round(row['longitude'], 4),
            "t": row['type'],
            "r": round(row['rate'], 3)
        })
    data_by_year[int(year)] = year_records

# 保存为 data.json
with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(data_by_year, f)