import numpy as np
import pandas as pd

# Read Data
df = pd.read_csv('IPEDS_data.csv')

# Drop Columns with too much missing values
missing_counts = df.isna().sum()
missing_ratio = missing_counts / len(df)
df_clear = df.loc[:, missing_ratio < .1].copy()

# Use KNN imputer to imput NAs
from sklearn.impute import KNNImputer
from sklearn.neighbors import NearestNeighbors

imputer_method = KNNImputer(n_neighbors=5)

numeric_cols = df_clear.select_dtypes(include=['float64', 'int64']).columns
non_numeric_cols = df_clear.select_dtypes(exclude=['float64', 'int64']).columns

df_clear[numeric_cols] = imputer_method.fit_transform(df_clear[numeric_cols])


# Since KNN imputer cannot impute categories,
# Therefore I will manaually do it, select mode in n=5
knn_model = NearestNeighbors(n_neighbors=5)
knn_model.fit(df_clear[numeric_cols])

for col in non_numeric_cols:
    missing_idx = df_clear[df_clear[col].isna()].index

    for idx in missing_idx:
        
        this_row = df_clear.loc[[idx], numeric_cols] 

        _, neighbors = knn_model.kneighbors(this_row, n_neighbors=5)
        neighbor_idx = neighbors[0]

        neighbor_values = df_clear.loc[neighbor_idx, col].dropna()

        if not neighbor_values.empty:
            df_clear.at[idx, col] = neighbor_values.mode().iloc[0]

# Clean Columns
# Since many columns having some meaning, deleting redundant information
selected_cols = [
    "Religious affiliation",
    
    "Offers Less than one year certificate",
    "Offers One but less than two years certificate",
    "Offers Associate's degree",
    "Offers Postbaccalaureate certificate",
    "Offers Master's degree",
    "Offers Post-master's certificate",
    "Offers Doctor's degree - research/scholarship",
    "Offers Doctor's degree - professional practice",
    
    "Associate's degrees awarded",
    "Bachelor's degrees awarded",
    "Master's degrees awarded",
    "Doctor's degrese - research/scholarship awarded",
    "Doctor's degrees - professional practice awarded",
    "Doctor's degrees - other awarded",
    "Certificates of less than 1-year awarded",
    "Certificates of 1 but less than 2-years awarded",
    "Certificates of 2 but less than 4-years awarded",
    "Postbaccalaureate certificates awarded",
    "Post-master's certificates awarded",
    
    "Tuition and fees, 2010-11",
    "Tuition and fees, 2011-12",
    "Tuition and fees, 2012-13",
    "Tuition and fees, 2013-14",
    
    "Total price for in-state students living on campus 2013-14",
    "Total price for out-of-state students living on campus 2013-14",
    
    "State abbreviation",
    "Sector of institution",
    "Degree of urbanization (Urban-centric locale)",
    "Carnegie Classification 2010: Basic",

    "Total enrollment",
    "Full-time enrollment",
    "Undergraduate enrollment",
    "Full-time undergraduate enrollment",
    "Part-time undergraduate enrollment",
    "Percent of total enrollment that are American Indian or Alaska Native",
    "Percent of total enrollment that are Asian",
    "Percent of total enrollment that are Black or African American",
    "Percent of total enrollment that are Hispanic/Latino",
    "Percent of total enrollment that are Native Hawaiian or Other Pacific Islander",
    "Percent of total enrollment that are White",
    "Percent of total enrollment that are two or more races",
    "Percent of total enrollment that are Race/ethnicity unknown",
    "Percent of total enrollment that are Nonresident Alien",
    "Percent of total enrollment that are Asian/Native Hawaiian/Pacific Islander",
    "Percent of total enrollment that are women",
    "Graduation rate - Bachelor degree within 6 years, total",
    "Percent of freshmen receiving any financial aid",
    "Percent of freshmen receiving federal, state, local or institutional grant aid",
    "Percent of freshmen receiving federal grant aid",
    "Percent of freshmen receiving Pell grants",
    "Percent of freshmen receiving other federal grant aid",
    "Percent of freshmen receiving state/local grant aid",
    "Percent of freshmen receiving institutional grant aid",
    "Percent of freshmen receiving student loan aid",
    "Percent of freshmen receiving federal student loans",
    "Percent of freshmen receiving other loan aid"
]

df_necessary = df_clear[selected_cols].copy()

##############################################
# Transfer Offers column
def process_non_degree_columns(df):
    
    non_degree_columns = [
        "Offers Less than one year certificate",
        "Offers One but less than two years certificate",
        "Offers Associate's degree",
        "Offers Postbaccalaureate certificate",
        "Offers Post-master's certificate"
    ]

    # Use OR logical
    df.loc[:, "Offers Non-Degree"] = df[non_degree_columns].apply(lambda row: any(val == "Yes" for val in row), axis=1)
    df["Offers Non-Degree"] = df["Offers Non-Degree"].replace({True: "TRUE", False: "FALSE"})
    
    return df

def process_bachelor_master(df):

    # Just transfer Name, to make format tidy
    df.loc[:, "Offers Master's degree"] = df["Offers Master's degree"].replace({"Yes": "TRUE", "Implied no": "FALSE"})
    
    return df
def process_doctor_degrees(df):
    doctor_columns = [
        "Offers Doctor's degree - research/scholarship",
        "Offers Doctor's degree - professional practice"
    ]
    
    # Use OR logical
    df.loc[:, "Offers Doctor's degree"] = df[doctor_columns].apply(lambda row: any(val == "Yes" for val in row), axis=1)
    df["Offers Doctor's degree"] = df["Offers Doctor's degree"].replace({True: "TRUE", False: "FALSE"})
    
    return df

# Apply to transfer
df_necessary = process_non_degree_columns(df_necessary)
df_necessary = process_bachelor_master(df_necessary)
df_necessary = process_doctor_degrees(df_necessary)

# Drop Useless Columns
columns_to_drop_offers = [
    "Offers Less than one year certificate",
    "Offers One but less than two years certificate",
    "Offers Associate's degree",
    "Offers Postbaccalaureate certificate",
    "Offers Post-master's certificate",
    "Offers Doctor's degree - research/scholarship",
    "Offers Doctor's degree - professional practice",
]

df_necessary = df_necessary.drop(columns_to_drop_offers, axis=1)

# Finished Offers Part
#########################################

#######################################
# Start Clean Award

awarded_columns = [
    "Associate's degrees awarded",
    "Bachelor's degrees awarded",
    "Master's degrees awarded",
    "Doctor's degrese - research/scholarship awarded",
    "Doctor's degrees - professional practice awarded",
    "Doctor's degrees - other awarded",
    "Certificates of less than 1-year awarded",
    "Certificates of 1 but less than 2-years awarded",
    "Certificates of 2 but less than 4-years awarded",
    "Postbaccalaureate certificates awarded",
    "Post-master's certificates awarded"
]

df_necessary['Total degrees awarded'] = df_necessary[awarded_columns].sum(axis=1)

for col in ["Bachelor's degrees awarded", "Master's degrees awarded"]:
    df_necessary[col + ' Ratio'] = df_necessary[col] / df_necessary['Total degrees awarded']


associate_and_certificates = [
    "Associate's degrees awarded",
    "Certificates of less than 1-year awarded",
    "Certificates of 1 but less than 2-years awarded",
    "Certificates of 2 but less than 4-years awarded",
    "Postbaccalaureate certificates awarded",
    "Post-master's certificates awarded"
]
df_necessary["Non-degree awarded"] = df_necessary[associate_and_certificates].sum(axis=1)

df_necessary['Non-degree awarded Ratio'] = df_necessary['Non-degree awarded'] / df_necessary['Total degrees awarded']

doctor_columns = [
    "Doctor's degrese - research/scholarship awarded",
    "Doctor's degrees - professional practice awarded",
    "Doctor's degrees - other awarded"
]

df_necessary["Doctor's degree awarded"] = df_necessary[doctor_columns].sum(axis=1)

df_necessary["Doctor's degree awarded Ratio"] = df_necessary["Doctor's degree awarded"] / df_necessary['Total degrees awarded']


# Drop Useless Columns
columns_to_drop_award = [
    "Associate's degrees awarded",
    "Bachelor's degrees awarded",
    "Master's degrees awarded",
    "Doctor's degrese - research/scholarship awarded",
    "Doctor's degrees - professional practice awarded",
    "Doctor's degrees - other awarded",
    "Certificates of less than 1-year awarded",
    "Certificates of 1 but less than 2-years awarded",
    "Certificates of 2 but less than 4-years awarded",
    "Postbaccalaureate certificates awarded",
    "Post-master's certificates awarded",
    "Doctor's degree awarded",
    'Non-degree awarded',
    'Total degrees awarded'
]

df_necessary = df_necessary.drop(columns_to_drop_award, axis=1)

# Finished Cleaning Award Columns
###############################################

################################################
# Clean Tuition and Fees

tuition_columns = [
    'Tuition and fees, 2010-11',
    'Tuition and fees, 2011-12',
    'Tuition and fees, 2012-13',
    'Tuition and fees, 2013-14'
]

df_necessary['Average Tuition and Fees'] = df_necessary[tuition_columns].mean(axis=1)

df_necessary = df_necessary.drop(tuition_columns, axis=1)

# Finished Cleaning Tuition
#################################################

###############################################
# Start Clean Enrollment

df_necessary['Full-time Enrollment Ratio'] = df_necessary['Full-time enrollment'] / df_necessary['Total enrollment']

df_necessary = df_necessary.drop(['Full-time enrollment', 'Full-time undergraduate enrollment', 'Part-time undergraduate enrollment'], axis=1)

# Finish Clean Enrollment
############################################


############################################
# Clean Percent of Total Enrollment

df_necessary['Percent of total enrollment that are Minor'] = (
    df_necessary['Percent of total enrollment that are American Indian or Alaska Native'] +
    df_necessary['Percent of total enrollment that are Asian'] +
    df_necessary['Percent of total enrollment that are Black or African American'] +
    df_necessary['Percent of total enrollment that are Hispanic/Latino'] +
    df_necessary['Percent of total enrollment that are Native Hawaiian or Other Pacific Islander'] +
    df_necessary['Percent of total enrollment that are two or more races'] +
    df_necessary['Percent of total enrollment that are Race/ethnicity unknown']
)
 
df_necessary = df_necessary.drop([
    'Percent of total enrollment that are American Indian or Alaska Native',
    'Percent of total enrollment that are Asian',
    'Percent of total enrollment that are Black or African American',
    'Percent of total enrollment that are Hispanic/Latino',
    'Percent of total enrollment that are Native Hawaiian or Other Pacific Islander',
    'Percent of total enrollment that are two or more races',
    'Percent of total enrollment that are Race/ethnicity unknown',
    'Percent of total enrollment that are Asian/Native Hawaiian/Pacific Islander'
], axis=1)


# Finished Clean Percent of Enrollment
############################################

############################################
# Clean Financial Aid

df_necessary = df_necessary.drop([
    'Percent of freshmen receiving federal, state, local or institutional grant aid',
    'Percent of freshmen receiving federal grant aid',
    'Percent of freshmen receiving Pell grants',
    'Percent of freshmen receiving other federal grant aid',
    'Percent of freshmen receiving state/local grant aid',
    'Percent of freshmen receiving institutional grant aid',
    'Percent of freshmen receiving federal student loans',
    'Percent of freshmen receiving other loan aid'
], axis=1)

df_necessary['Percent of freshmen receiving any financial aid'] = (
    df_necessary['Percent of freshmen receiving any financial aid'] / 
    (1 - df_necessary['Percent of total enrollment that are Nonresident Alien'] / 100)
)

df_necessary['Percent of freshmen receiving student loan aid'] = (
    df_necessary['Percent of freshmen receiving student loan aid'] / 
    (1 - df_necessary['Percent of total enrollment that are Nonresident Alien'] / 100)
)

#####################################
# FINISH ALL

# Scale the numerical part of data
from sklearn.preprocessing import StandardScaler

numeric_cols = df_necessary.select_dtypes(include=['number']).columns

scale_method = StandardScaler()

df_scaled = df_necessary.copy()
df_scaled[numeric_cols] = scale_method.fit_transform(df_scaled[numeric_cols])

# Write dataframe to csv
df_scaled.to_csv('IPEDS_data_cleaned.csv', index=False)