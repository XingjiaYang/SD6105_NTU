/**
 * 配置文件 — 定义可选维度与分类模式
 *
 * xColumns / yColumns : X / Y 轴可选的数值列名集合（可重叠）
 * colorColumns        : 用于颜色分类的列名集合（与 X/Y 无交集）
 * columnLabels        : 列名 → 显示名称的映射
 * timeColumn          : 时间维度列名
 * entityColumn        : 每条轨迹的标识列（同一实体在不同年份连成线）
 */

const CONFIG = {
  dataPath: "../data/institution_panel.csv",

  timeColumn: "year",
  entityColumn: "unitid",
  entityNameColumn: "institution_name",

  // ── X 轴可选列 ──
  // SFA + IC_AY + Finance + FRED 宏观
  xColumns: [
    // SFA
    "ftft_ug_count",
    "pct_any_aid", "pct_any_grant", "pct_federal_grant",
    "pct_pell_grant", "pct_other_federal_grant",
    "pct_state_grant", "pct_institutional_grant",
    "pct_any_loan", "pct_federal_loan", "pct_other_loan",
    "avg_grant_amount", "avg_loan_amount",
    "avg_net_price_0_30k", "avg_net_price_30_48k",
    "avg_net_price_48_75k", "avg_net_price_75_110k",
    "avg_net_price_gt110k",
    // IC_AY
    "tuition_fees_instate", "tuition_fees_outstate",
    "total_price_instate_oncampus", "total_price_outstate_oncampus",
    // Finance
    "tuition_net_revenue", "federal_grants_revenue", "state_grants_revenue",
    "instruction_expense", "total_expense", "endowment_end_year",
    // FRED 宏观（按学校所在州匹配）
    "real_gdp_millions", "unemployment_rate",
    "per_capita_personal_income", "mortgage_rate_30yr",
    "state_local_govt_tax_revenue",
  ],

  // ── Y 轴可选列 ──
  // EF-A(不含种族%) + Completions + ADM + EF-D + SFA + IC_AY
  yColumns: [
    // EF-A（不含种族/民族百分比）
    "total_enrollment", "ft_enrollment", "pt_enrollment",
    "enrollment_men", "enrollment_women",
    "ug_enrollment", "ft_ug_enrollment", "pt_ug_enrollment",
    "grad_enrollment", "ft_grad_enrollment", "pt_grad_enrollment",
    "freshman_enrollment",
    // Completions
    "assoc_degrees_awarded", "bach_degrees_awarded",
    "masters_degrees_awarded", "doctoral_research_awarded",
    "doctoral_professional_awarded", "doctoral_other_awarded",
    "cert_lt_1yr_awarded", "cert_1_2yr_awarded", "cert_2_4yr_awarded",
    "postbacc_cert_awarded", "postmaster_cert_awarded",
    // ADM
    "applicants_total", "admissions_total", "enrolled_total",
    "admission_rate", "enrollment_yield",
    "pct_submit_sat", "pct_submit_act",
    "sat_cr_25th", "sat_cr_75th",
    "sat_math_25th", "sat_math_75th",
    "act_composite_25th", "act_composite_75th",
    // EF-D
    "retention_rate_ft", "retention_rate_pt", "student_faculty_ratio",
    // SFA
    "ftft_ug_count",
    "pct_any_aid", "pct_any_grant", "pct_federal_grant",
    "pct_pell_grant", "pct_other_federal_grant",
    "pct_state_grant", "pct_institutional_grant",
    "pct_any_loan", "pct_federal_loan", "pct_other_loan",
    "avg_grant_amount", "avg_loan_amount",
    "avg_net_price_0_30k", "avg_net_price_30_48k",
    "avg_net_price_48_75k", "avg_net_price_75_110k",
    "avg_net_price_gt110k",
    // IC_AY
    "tuition_fees_instate", "tuition_fees_outstate",
    "total_price_instate_oncampus", "total_price_outstate_oncampus",
  ],

  // ── 分类列（与 X/Y 完全无交集）──
  colorColumns: [
    "region_code",
    "control_code",
    "sector_code",
    "highest_degree_code",
    "urban_locale_code",
    "institution_size",
  ],

  // ── IPEDS sentinel value labels (-3=Suppressed, -2=Not applicable, -1=Not reported) ──
  sentinelLabels: {
    "-3": "Suppressed",
    "-2": "Not applicable",
    "-1": "Not reported",
  },

  // ── Category value → display label mapping ──
  categoryLabels: {
    region_code: {
      0: "US Service Schools", 1: "New England", 2: "Mid East",
      3: "Great Lakes", 4: "Plains", 5: "Southeast",
      6: "Southwest", 7: "Rocky Mountains", 8: "Far West", 9: "Outlying Areas",
    },
    control_code: {
      1: "Public", 2: "Private Non-profit", 3: "Private For-profit",
    },
    sector_code: {
      0: "Not classified",
      1: "Public 4-year+", 2: "Private Non-profit 4-year+", 3: "Private For-profit 4-year+",
      4: "Public 2-year", 5: "Private Non-profit 2-year", 6: "Private For-profit 2-year",
      7: "Public <2-year", 8: "Private Non-profit <2-year", 9: "Private For-profit <2-year",
      99: "Not classified",
    },
    highest_degree_code: {
      0: "N/A", 1: "Certificate <1yr", 2: "Certificate 1-2yr", 3: "Associate's",
      4: "Certificate 2-4yr", 5: "Bachelor's", 6: "Post-baccalaureate Cert.",
      7: "Master's", 8: "Post-master's Cert.", 9: "Doctorate (Research)",
      10: "Doctorate (Professional)", 11: "Doctorate (Other)", 12: "First Professional Cert.",
    },
    urban_locale_code: {
      11: "City: Large", 12: "City: Midsize", 13: "City: Small",
      21: "Suburb: Large", 22: "Suburb: Midsize", 23: "Suburb: Small",
      31: "Town: Fringe", 32: "Town: Distant", 33: "Town: Remote",
      41: "Rural: Fringe", 42: "Rural: Distant", 43: "Rural: Remote",
    },
    institution_size: {
      1: "<1,000", 2: "1,000-4,999", 3: "5,000-9,999",
      4: "10,000-19,999", 5: "20,000+",
    },
  },

  // ── Column name → display label ──
  columnLabels: {
    year: "Year",
    unitid: "Unit ID",
    institution_name: "Institution Name",
    state_abbr: "State",
    // Classification
    region_code: "Region",
    control_code: "Control",
    sector_code: "Sector",
    highest_degree_code: "Highest Degree",
    urban_locale_code: "Locale",
    institution_size: "Institution Size",
    // EF-A
    total_enrollment: "Total Enrollment",
    ft_enrollment: "Full-time Enrollment",
    pt_enrollment: "Part-time Enrollment",
    enrollment_men: "Male Enrollment",
    enrollment_women: "Female Enrollment",
    ug_enrollment: "Undergraduate Enrollment",
    ft_ug_enrollment: "Full-time Undergrad",
    pt_ug_enrollment: "Part-time Undergrad",
    grad_enrollment: "Graduate Enrollment",
    ft_grad_enrollment: "Full-time Graduate",
    pt_grad_enrollment: "Part-time Graduate",
    freshman_enrollment: "Freshman Enrollment",
    // Completions
    assoc_degrees_awarded: "Associate's Awarded",
    bach_degrees_awarded: "Bachelor's Awarded",
    masters_degrees_awarded: "Master's Awarded",
    doctoral_research_awarded: "Doctorate (Research) Awarded",
    doctoral_professional_awarded: "Doctorate (Professional) Awarded",
    doctoral_other_awarded: "Doctorate (Other) Awarded",
    cert_lt_1yr_awarded: "Certificates (<1yr) Awarded",
    cert_1_2yr_awarded: "Certificates (1-2yr) Awarded",
    cert_2_4yr_awarded: "Certificates (2-4yr) Awarded",
    postbacc_cert_awarded: "Post-baccalaureate Cert. Awarded",
    postmaster_cert_awarded: "Post-master's Cert. Awarded",
    // ADM
    applicants_total: "Total Applicants",
    admissions_total: "Total Admissions",
    enrolled_total: "Total Enrolled",
    admission_rate: "Admission Rate (%)",
    enrollment_yield: "Enrollment Yield (%)",
    pct_submit_sat: "% Submitting SAT",
    pct_submit_act: "% Submitting ACT",
    sat_cr_25th: "SAT Reading 25th",
    sat_cr_75th: "SAT Reading 75th",
    sat_math_25th: "SAT Math 25th",
    sat_math_75th: "SAT Math 75th",
    act_composite_25th: "ACT Composite 25th",
    act_composite_75th: "ACT Composite 75th",
    // EF-D
    retention_rate_ft: "FT Retention Rate (%)",
    retention_rate_pt: "PT Retention Rate (%)",
    student_faculty_ratio: "Student-Faculty Ratio",
    // SFA
    ftft_ug_count: "FTFT Undergrad Count",
    pct_any_aid: "% Receiving Any Aid",
    pct_any_grant: "% Receiving Grants",
    pct_federal_grant: "% Receiving Federal Grants",
    pct_pell_grant: "% Receiving Pell Grants",
    pct_other_federal_grant: "% Other Federal Grants",
    pct_state_grant: "% Receiving State Grants",
    pct_institutional_grant: "% Institutional Grants",
    pct_any_loan: "% Receiving Any Loans",
    pct_federal_loan: "% Federal Loans",
    pct_other_loan: "% Other Loans",
    avg_grant_amount: "Avg Grant Amount ($)",
    avg_loan_amount: "Avg Loan Amount ($)",
    avg_net_price_0_30k: "Net Price ($0-30k Income)",
    avg_net_price_30_48k: "Net Price ($30-48k Income)",
    avg_net_price_48_75k: "Net Price ($48-75k Income)",
    avg_net_price_75_110k: "Net Price ($75-110k Income)",
    avg_net_price_gt110k: "Net Price (>$110k Income)",
    // IC_AY
    tuition_fees_instate: "In-state Tuition & Fees ($)",
    tuition_fees_outstate: "Out-of-state Tuition & Fees ($)",
    total_price_instate_oncampus: "In-state On-campus Total ($)",
    total_price_outstate_oncampus: "Out-of-state On-campus Total ($)",
    // Finance
    tuition_net_revenue: "Tuition Net Revenue ($)",
    federal_grants_revenue: "Federal Grants Revenue ($)",
    state_grants_revenue: "State Grants Revenue ($)",
    instruction_expense: "Instruction Expense ($)",
    total_expense: "Total Expense ($)",
    endowment_end_year: "Endowment EOY ($)",
    // FRED Macro
    real_gdp_millions: "Real GDP (Millions $)",
    unemployment_rate: "Unemployment Rate (%)",
    per_capita_personal_income: "Per Capita Income ($)",
    mortgage_rate_30yr: "30-Year Mortgage Rate (%)",
    state_local_govt_tax_revenue: "State & Local Tax Revenue ($K)",
  },

  // Defaults
  defaults: {
    x: "tuition_fees_instate",
    y: "total_enrollment",
    color: "control_code",
  },

  // Chart dimensions
  chart: {
    width: 960,
    height: 600,
    margin: { top: 30, right: 30, bottom: 55, left: 80 },
  },
};
