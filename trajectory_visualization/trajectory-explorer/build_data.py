"""
build_data.py — 构建轨迹探索器所需的数据文件

读取 IPEDS 面板数据和 FRED 宏观经济数据，合并后输出精简 CSV。
用法: python build_data.py
"""

import pandas as pd
import os

# ── 路径 ──
BASE = os.path.dirname(os.path.abspath(__file__))
IPEDS_PATH = os.path.join(BASE, "..", "..", "output", "ipeds_panel_2017_2023.csv")
FRED_PATH = os.path.join(BASE, "..", "..", "output", "fred_macro_state.csv")
OUT_PATH = os.path.join(BASE, "..", "data", "institution_panel.csv")

# ── 需要保留的列 ──

IDENTITY_COLS = [
    "unitid", "institution_name", "year", "state_abbr",
]

CLASSIFICATION_COLS = [
    "region_code", "region_name",
    "control_code", "control_label",
    "sector_code", "sector_label",
    "highest_degree_code", "highest_degree_label",
    "urban_locale_code", "urban_locale_label",
    "institution_size",
]

# EF-A (不含种族/民族百分比)
EF_A_COLS = [
    "total_enrollment", "ft_enrollment", "pt_enrollment",
    "enrollment_men", "enrollment_women",
    "ug_enrollment", "ft_ug_enrollment", "pt_ug_enrollment",
    "grad_enrollment", "ft_grad_enrollment", "pt_grad_enrollment",
    "freshman_enrollment",
]

# Completions
COMPLETIONS_COLS = [
    "assoc_degrees_awarded", "bach_degrees_awarded",
    "masters_degrees_awarded", "doctoral_research_awarded",
    "doctoral_professional_awarded", "doctoral_other_awarded",
    "cert_lt_1yr_awarded", "cert_1_2yr_awarded", "cert_2_4yr_awarded",
    "postbacc_cert_awarded", "postmaster_cert_awarded",
]

# ADM
ADM_COLS = [
    "applicants_total", "admissions_total", "enrolled_total",
    "admission_rate", "enrollment_yield",
    "pct_submit_sat", "pct_submit_act",
    "sat_cr_25th", "sat_cr_75th",
    "sat_math_25th", "sat_math_75th",
    "act_composite_25th", "act_composite_75th",
]

# EF-D
EF_D_COLS = [
    "retention_rate_ft", "retention_rate_pt", "student_faculty_ratio",
]

# SFA
SFA_COLS = [
    "ftft_ug_count",
    "pct_any_aid", "pct_any_grant", "pct_federal_grant",
    "pct_pell_grant", "pct_other_federal_grant",
    "pct_state_grant", "pct_institutional_grant",
    "pct_any_loan", "pct_federal_loan", "pct_other_loan",
    "avg_grant_amount", "avg_loan_amount",
    "avg_net_price_0_30k", "avg_net_price_30_48k",
    "avg_net_price_48_75k", "avg_net_price_75_110k",
    "avg_net_price_gt110k",
]

# IC_AY
IC_AY_COLS = [
    "tuition_fees_instate", "tuition_fees_outstate",
    "total_price_instate_oncampus", "total_price_outstate_oncampus",
]

# Finance
FINANCE_COLS = [
    "tuition_net_revenue", "federal_grants_revenue", "state_grants_revenue",
    "instruction_expense", "total_expense", "endowment_end_year",
]

# FRED 宏观 (year 右侧的所有列)
FRED_COLS = [
    "real_gdp_millions", "unemployment_rate",
    "per_capita_personal_income", "mortgage_rate_30yr",
    "state_local_govt_tax_revenue",
]

ALL_COLS = (
    IDENTITY_COLS + CLASSIFICATION_COLS +
    EF_A_COLS + COMPLETIONS_COLS + ADM_COLS + EF_D_COLS +
    SFA_COLS + IC_AY_COLS + FINANCE_COLS + FRED_COLS
)


def main():
    print("读取 IPEDS 面板数据...")
    ipeds = pd.read_csv(IPEDS_PATH, encoding="utf-8-sig")
    print(f"  {ipeds.shape[0]} 行, {ipeds.shape[1]} 列")

    print("读取 FRED 宏观经济数据...")
    fred = pd.read_csv(FRED_PATH, encoding="utf-8-sig")
    print(f"  {fred.shape[0]} 行, {fred.shape[1]} 列")

    # 只保留需要的 FRED 列
    fred_keep = ["state_abbr", "year"] + FRED_COLS
    fred = fred[[c for c in fred_keep if c in fred.columns]]

    print("合并数据...")
    merged = ipeds.merge(fred, on=["state_abbr", "year"], how="left")

    # 只保留需要的列
    keep = [c for c in ALL_COLS if c in merged.columns]
    missing = set(ALL_COLS) - set(keep)
    if missing:
        print(f"  警告: 以下列不存在: {missing}")
    result = merged[keep]

    # 输出
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    result.to_csv(OUT_PATH, index=False)
    size_mb = os.path.getsize(OUT_PATH) / (1024 * 1024)
    print(f"输出: {OUT_PATH}")
    print(f"  {result.shape[0]} 行, {result.shape[1]} 列, {size_mb:.1f} MB")


if __name__ == "__main__":
    main()
