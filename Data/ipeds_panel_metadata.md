# IPEDS Panel Dataset Metadata
**文件**: `ipeds_panel_2017_2023.csv`
**行数**: 51,789（机构 × 年份）
**列数**: 143
**年份范围**: 2017–2024（SFA、F、ADM、IC_AY、EF-D、EF-C 仅至 2023；EF-A/C/D 2024 暂不可用）
**数据来源**: NCES IPEDS Complete Data Files（https://nces.ed.gov/ipeds/datacenter/data）
**关联键**: `unitid + year`

---

## 未纳入的参考列说明

以下参考文件（`IPEDS_data.csv`）中的列因数据来源未下载或结构过于复杂，本数据集**未予纳入**：

| 参考列 | 原因 |
|--------|------|
| 本科毕业率（4/5/6 年） | GR 模块 grtype/chrtstat 编码结构复杂，需专项数据字典解析，暂跳过 |
| 历年学费（2010-11 至 2013-14） | IC_AY 文件仅记录当年学费；历史数据在该文件中已滚动替换，不再可用 |
| 捐赠资产/FTE | 需要 EFIA（12 个月在校人数）模块计算 FTE，未下载；本表提供年末捐赠总额 |
| "每年估计在校人数"系列 | 来自 EFIA 模块（12 个月在校人数），非 EF 秋季调查，未下载 |
| SAT Writing 25th/75th | College Board 于 2016 年取消 SAT 写作部分，ADM 文件 2017 年起不再包含此数据 |

---

## 列说明

### 一、机构标识与基本信息
来源：HD（Institutional Characteristics - Directory）

| 列名 | 说明 | 值域/备注 |
|------|------|-----------|
| `unitid` | IPEDS 机构唯一 ID | 整数，联邦唯一标识符 |
| `institution_name` | 机构名称 | 文本 |
| `year` | 学年结束年（如 2017 = 2016–17 学年）| 2017–2024 |
| `zip_code` | 邮政编码 | 部分含扩展码（如 35294-0110） |
| `county_name` | 所在县名 | 文本 |
| `longitude` | 经度 | 十进制度，西经为负 |
| `latitude` | 纬度 | 十进制度 |
| `state_abbr` | 州缩写 | 两字母代码，如 AL、CA |
| `fips_state` | 州 FIPS 代码 | 01–56 |
| `region_code` | NCES 地理区代码 | 0=联邦服务学校, 1=新英格兰, 2=中大西洋, 3=五大湖区, 4=平原, 5=东南, 6=西南, 7=落基山脉, 8=远西, 9=外围区域 |
| `region_name` | 地理区名称 | 如 "Southeast" |
| `sector_code` | 机构类型代码 | 1=公立4年制+, 2=私立非盈利4年制+, 3=私立盈利4年制+, 4=公立2年制, 5=私立非盈利2年制, 6=私立盈利2年制, 7-9=小于2年制, 99=未分类 |
| `sector_label` | 机构类型文字标签 | |
| `control_code` | 办学性质代码 | 1=公立, 2=私立非盈利, 3=私立盈利 |
| `control_label` | 办学性质标签 | |
| `level_code` | 最高教育层级代码 | 1=四年制及以上, 2=两至四年制, 3=两年制以下 |
| `level_label` | 最高教育层级标签 | |
| `highest_degree_code` | 最高授予学位代码（hloffer）| 0=不适用, 1=证书<1年, 2=证书1-2年, 3=副学士, 4=证书2-4年, 5=学士, 6=学士后证书, 7=硕士, 8=硕士后证书, 9=博士研究型, 10=博士专业型, 11=博士其他, 12=第一职业证书 |
| `highest_degree_label` | 最高授予学位文字标签 | |
| `hbcu` | 历史上黑人大学（HBCU）| 1=是, 2=否 |
| `tribal_college` | 部落学院 | 1=是, 2=否 |
| `urban_locale_code` | 城镇化程度代码 | 11=大城市, 12=中等城市, 13=小城市, 21-23=郊区, 31-33=城镇, 41-43=农村 |
| `urban_locale_label` | 城镇化程度标签 | 如 "City: Midsize" |
| `carnegie_basic` | Carnegie 基础分类代码 | 优先 c18basic → c15basic → ccbasic → carnegie |
| `institution_size` | 机构规模代码 | 1=<1000人, 2=1000-4999, 3=5000-9999, 4=10000-19999, 5=20000+ |

---

### 二、机构宗教背景与课程设置
来源：IC（Institutional Characteristics - Supplemental）

| 列名 | 说明 | 原始变量 | 值域/备注 |
|------|------|---------|-----------|
| `relaffil_code` | 宗教背景代码 | RELAFFIL | -2/-1=无宗教背景, 22=天主教, 24=美国浸信会, 27=卫理公会, 28=长老会(USA), 34=路德会(ELCA), 37=基督复临安息日会, 57=犹太教, 64=伊斯兰教, 等 |
| `relaffil_label` | 宗教背景文字标签 | RELAFFIL | 见 RELAFFIL 编码表 |
| `open_admissions` | 开放招生政策 | OPENADMP | 1=实行开放招生（无申请限制）, 2=否, -1/-2=不适用 |
| `offer_lt1yr_cert` | 是否提供学时<1年证书 | LEVEL1 | 0=否, 1=是 |
| `offer_1_2yr_cert` | 是否提供1-2年证书 | LEVEL2 | 0=否, 1=是 |
| `offer_assoc` | 是否提供副学士学位 | LEVEL3 | 0=否, 1=是 |
| `offer_2_4yr_cert` | 是否提供2-4年证书 | LEVEL4 | 0=否, 1=是 |
| `offer_bach` | 是否提供学士学位 | LEVEL5 | 0=否, 1=是 |
| `offer_postbacc_cert` | 是否提供学士后证书 | LEVEL6 | 0=否, 1=是 |
| `offer_masters` | 是否提供硕士学位 | LEVEL7 | 0=否, 1=是 |
| `offer_postmaster_cert` | 是否提供硕士后证书 | LEVEL8 | 0=否, 1=是 |
| `offer_doctoral_research` | 是否提供研究型博士 | LEVEL12 | 0=否, 1=是 |
| `offer_doctoral_professional` | 是否提供专业实践型博士 | LEVEL17 | 0=否, 1=是 |
| `offer_doctoral_other` | 是否提供其他类型博士 | LEVEL18 | 0=否, 1=是 |

**注**: IC 数据覆盖 2017–2024 年。

---

### 三、在校人数
来源：EF-A（Fall Enrollment，秋季在校人数）

SECTION 字段含义：3=合计（按种族/性别）, 1=全日制（full-time）, 2=兼读制（part-time）

| 列名 | 说明 | 原始条件 |
|------|------|---------|
| `total_enrollment` | 秋季在校生总数 | SECTION=3, EFALEVEL=1, EFTOTLT |
| `ft_enrollment` | 全日制在校生总数 | SECTION=1, EFALEVEL=21, EFTOTLT |
| `pt_enrollment` | 兼读制在校生总数 | SECTION=2, EFALEVEL=41, EFTOTLT |
| `enrollment_men` | 男生总数 | SECTION=3, EFALEVEL=1, EFTOTLM |
| `enrollment_women` | 女生总数 | SECTION=3, EFALEVEL=1, EFTOTLW |
| `ug_enrollment` | 本科生总数 | SECTION=3, EFALEVEL=2, EFTOTLT |
| `ft_ug_enrollment` | 全日制本科生数 | SECTION=1, EFALEVEL=22, EFTOTLT |
| `pt_ug_enrollment` | 兼读制本科生数 | SECTION=2, EFALEVEL=42, EFTOTLT |
| `grad_enrollment` | 研究生总数 | SECTION=3, EFALEVEL=12, EFTOTLT |
| `ft_grad_enrollment` | 全日制研究生数 | SECTION=1, EFALEVEL=32, EFTOTLT |
| `pt_grad_enrollment` | 兼读制研究生数 | SECTION=2, EFALEVEL=52, EFTOTLT |
| `freshman_enrollment` | 首次入读学位/证书课程本科新生数 | SECTION=3, EFALEVEL=4, EFTOTLT |

**全体学生种族/民族比例（%）**（基于 SECTION=3, EFALEVEL=1）：

| 列名 | 说明 |
|------|------|
| `pct_american_indian` | 美洲印第安/阿拉斯加原住民占比 |
| `pct_asian` | 亚裔占比 |
| `pct_black` | 非裔美国人占比 |
| `pct_hispanic` | 西班牙裔/拉丁裔占比 |
| `pct_pacific_islander` | 夏威夷原住民/太平洋岛民占比 |
| `pct_white` | 白人占比 |
| `pct_two_or_more_races` | 多种族占比 |
| `pct_race_unknown` | 种族未知占比 |
| `pct_nonresident_alien` | 非居民外国人占比 |
| `pct_women` | 女生占比 |

**本科生种族/民族比例（%）**（基于 SECTION=3, EFALEVEL=2）：

`ug_pct_american_indian`, `ug_pct_asian`, `ug_pct_black`, `ug_pct_hispanic`, `ug_pct_pacific_islander`, `ug_pct_white`, `ug_pct_two_or_more_races`, `ug_pct_race_unknown`, `ug_pct_nonresident_alien`, `ug_pct_women`

**研究生种族/民族比例（%）**（基于 SECTION=3, EFALEVEL=12）：

`grad_pct_american_indian`, `grad_pct_asian`, `grad_pct_black`, `grad_pct_hispanic`, `grad_pct_pacific_islander`, `grad_pct_white`, `grad_pct_two_or_more_races`, `grad_pct_race_unknown`, `grad_pct_nonresident_alien`, `grad_pct_women`

**注**: EF 2024 数据（EF2024A.zip）在 NCES 服务器上暂不可用，2024 年行的在校人数列均为空。

---

### 四、学位与证书授予数
来源：C（Completions）

按 awlevel（授予层级）对 ctotalt（授予总数）求和，仅统计 majornum=1（第一专业方向）。

| 列名 | 说明 | awlevel |
|------|------|---------|
| `assoc_degrees_awarded` | 副学士学位授予数 | 3 |
| `bach_degrees_awarded` | 学士学位授予数 | 5 |
| `masters_degrees_awarded` | 硕士学位授予数 | 7 |
| `doctoral_research_awarded` | 博士（研究/学术型）授予数 | 9 |
| `doctoral_professional_awarded` | 博士（专业实践型）授予数 | 10 |
| `doctoral_other_awarded` | 博士（其他类型）授予数 | 11 |
| `cert_lt_1yr_awarded` | 证书（学时<1年）授予数 | 1 |
| `cert_1_2yr_awarded` | 证书（1至2年）授予数 | 2 |
| `cert_2_4yr_awarded` | 证书（2至4年）授予数 | 4 |
| `postbacc_cert_awarded` | 学士后证书授予数 | 6 |
| `postmaster_cert_awarded` | 硕士后证书授予数 | 8 |

---

### 五、招生与入学考试成绩
来源：ADM（Admissions and Test Scores）

**注**: ADM 数据仅覆盖 2017–2023 年（ADM2024.zip 暂不可用）。

| 列名 | 说明 | 原始变量 |
|------|------|---------|
| `applicants_total` | 申请总人数 | APPLCN |
| `admissions_total` | 录取总人数 | ADMSSN |
| `enrolled_total` | 实际入学人数（首次本科新生）| ENRLT |
| `admission_rate` | 录取率（%）= admissions_total / applicants_total × 100 | 计算列 |
| `enrollment_yield` | 入学率（%）= enrolled_total / admissions_total × 100 | 计算列 |
| `pct_submit_sat` | 提交 SAT 成绩的新生比例（%）| SATPCT |
| `pct_submit_act` | 提交 ACT 成绩的新生比例（%）| ACTPCT |
| `sat_cr_25th` | SAT 阅读/证据写作 25th 百分位分数 | SATVR25 |
| `sat_cr_75th` | SAT 阅读/证据写作 75th 百分位分数 | SATVR75 |
| `sat_math_25th` | SAT 数学 25th 百分位分数 | SATMT25 |
| `sat_math_75th` | SAT 数学 75th 百分位分数 | SATMT75 |
| `act_composite_25th` | ACT 综合 25th 百分位分数 | ACTCM25 |
| `act_composite_75th` | ACT 综合 75th 百分位分数 | ACTCM75 |

**说明**: SAT Writing（写作部分）已于 2016 年取消，2017 年起 ADM 文件不再包含该数据，故本数据集不含 SAT 写作成绩。

---

### 六、保留率与师生比
来源：EF-D（Fall Enrollment - Retention Rates and Student-Faculty Ratio）

**注**: EF-D 数据仅覆盖 2017–2023 年。

| 列名 | 说明 | 原始变量 |
|------|------|---------|
| `retention_rate_ft` | 全日制学生保留率（%）：上一年秋季入读全日制新生在本年秋季继续就读的比例 | RRFTCT |
| `retention_rate_pt` | 兼读制学生保留率（%）| RRPTCT |
| `student_faculty_ratio` | 师生比（学生数/教师数）| STUFACR |

---

### 七、首次本科新生地理来源
来源：EF-C（Fall Enrollment - Residence and Migration of First-Time Students）

**注**: 统计对象为首次入读学位/证书课程的本科生（first-time degree/certificate-seeking undergraduates）。EF-C 数据仅覆盖 2017–2023 年。

**在州/外州判定方法**：EF-C 按 EFCSTATE（学生来源州 FIPS 代码）记录人数。与 HD 模块中机构所在州（fips_state）匹配，同州学生计为"在州"，其余为"外州"。EFCSTATE=99 为各分组合计；EFCSTATE=98 为来源州未知。

| 列名 | 说明 | 备注 |
|------|------|------|
| `ft_ug_instate_n` | 来自本州的首次本科新生人数 | 匹配 fips_state |
| `ft_ug_instate_pct` | 本州来源比例（%）| |
| `ft_ug_outstate_n` | 来自外州（含境外）的首次本科新生人数 | = 合计 - 本州 - 未知 |
| `ft_ug_outstate_pct` | 外州来源比例（%）| |
| `ft_ug_unknown_n` | 来源地未知的首次本科新生人数 | EFCSTATE=98 |
| `ft_ug_unknown_pct` | 来源地未知比例（%）| |
| `ft_ug_total_n` | 首次本科新生总人数（地理统计口径）| EFCSTATE=99 |

---

### 八、学生财政援助
来源：SFA（Student Financial Aid and Net Price）

统计对象：全日制首次入读本科生（FTFT UG），分母为 SCUGFFN（FTFT 学生数）。
**注**: SFA 数据仅覆盖 2017–2023 年。

| 列名 | 说明 | 原始变量 |
|------|------|---------|
| `ftft_ug_count` | 全日制首次入读本科生人数（援助统计分母）| SCUGFFN |
| `pct_any_aid` | 获得任意形式资助的学生比例（%）| ANYAIDP |
| `pct_any_grant` | 获得任意助学金的学生比例（%）| AGRNT_P |
| `pct_federal_grant` | 获得联邦助学金的学生比例（%）| FGRNT_P |
| `pct_pell_grant` | 获得 Pell Grant 的学生比例（%）| PGRNT_P |
| `pct_other_federal_grant` | 获得其他联邦助学金的学生比例（%）| OFGRT_P |
| `pct_state_grant` | 获得州/地方政府助学金的学生比例（%）| SGRNT_P |
| `pct_institutional_grant` | 获得机构自有助学金的学生比例（%）| IGRNT_P |
| `pct_any_loan` | 获得任意学生贷款的学生比例（%）| LOAN_P |
| `pct_federal_loan` | 获得联邦学生贷款的学生比例（%）| FLOAN_P |
| `pct_other_loan` | 获得其他贷款的学生比例（%）| OLOAN_P |
| `avg_grant_amount` | 获得助学金学生的平均助学金金额（美元）| AGRNT_A |
| `avg_loan_amount` | 获得贷款学生的平均贷款金额（美元）| LOAN_A |
| `avg_net_price_0_30k` | 家庭收入 $0–$30,000 学生的平均净费用（美元）| NPT412（四年制） |
| `avg_net_price_30_48k` | 家庭收入 $30,001–$48,000 的平均净费用 | NPT422 |
| `avg_net_price_48_75k` | 家庭收入 $48,001–$75,000 的平均净费用 | NPT432 |
| `avg_net_price_75_110k` | 家庭收入 $75,001–$110,000 的平均净费用 | NPT442 |
| `avg_net_price_gt110k` | 家庭收入 $110,001 以上的平均净费用 | NPT452 |

**净费用定义**: 出勤总费用（学费+住宿+生活）减去联邦/州/机构助学金后的学生实付金额，仅适用于四年制机构获联邦财政援助资格的全日制本科生。

---

### 九、学费与住校费用
来源：IC_AY（Institutional Characteristics - Academic Year Charges）

统计对象：全日制本科生（academic year charges for full-time undergraduates）。
**注**: IC_AY 数据仅覆盖 2017–2023 年（IC2024_AY.zip 暂不可用）。

IC_AY 文件中每年包含 4 个年份的数据（后缀 0-3），本表取后缀=3（文件中最近一年，即对应学年的当年收费）。

| 列名 | 说明 | 原始变量 | 备注 |
|------|------|---------|------|
| `tuition_fees_instate` | 在州学生学费+必要费用合计（美元）| CHG2AY3 | 在州（in-state）全日制本科生 |
| `tuition_fees_outstate` | 外州学生学费+必要费用合计（美元）| CHG3AY3 | 外州（out-of-state）全日制本科生 |
| `total_price_instate_oncampus` | 在州学生住校总费用（美元）| CHG2AY3+CHG4AY3+CHG5AY3+CHG6AY3 | 学费+费用+书本+住宿餐饮+其他 |
| `total_price_outstate_oncampus` | 外州学生住校总费用（美元）| CHG3AY3+CHG4AY3+CHG5AY3+CHG6AY3 | 学费+费用+书本+住宿餐饮+其他 |

**组成说明**:
- CHG2AY3 / CHG3AY3：在/外州学费 + 必要费用（tuition + required fees）
- CHG4AY3：书本及学习材料费
- CHG5AY3：住校住宿+餐饮费（on-campus room and board）
- CHG6AY3：其他在校附加费用

---

### 十、机构财务
来源：F（Finance，财务调查）

IPEDS 财务按会计准则分为两类：
- **F1A（GASB）**: 公立机构，政府会计准则委员会标准
- **F2（FASB）**: 私立非盈利及盈利机构，财务会计准则委员会标准

每家机构只出现在其中一个文件中。金额单位均为**美元**。
**注**: Finance 数据仅覆盖 2017–2023 年。

| 列名 | 说明 | GASB 变量 | FASB 变量 |
|------|------|-----------|-----------|
| `tuition_net_revenue` | 学费及费用净收入 | F1C011 | F2B01 |
| `federal_grants_revenue` | 联邦政府拨款及合同收入 | F1B01 | F2B04 |
| `state_grants_revenue` | 州政府拨款及合同收入 | F1B02 | 无（FASB 不单独披露） |
| `instruction_expense` | 教学支出 | F1D01 | F2C01 |
| `total_expense` | 总支出 | F1E011 | F2E011 |
| `endowment_end_year` | 年末捐赠基金资产总额（美元）| F1H02 | F2H02 |

---

## 数据质量说明

1. **空值（NaN）**: 机构未参与某调查、NCES 保密处理（Privacy Suppression）、或该列对当前机构类型不适用（如私立机构无州政府拨款）。
2. **年份缺口**: EF-A 2024 数据暂未发布；SFA、F、ADM、IC_AY 2024 数据不可用，对应列在 2024 年行中为空。
3. **Carnegie 编码变更**: 不同年份使用 c18basic/c15basic/ccbasic 等不同版本，已按优先级合并，不同年份代码含义可能有细微差异。
4. **Finance 金额单位**: 部分早期年份财务数据已从"千美元"改为"美元"报告，使用前建议与 IPEDS 数据中心原始文件核对量级。
5. **在校人数一致性**: EF-A total_enrollment（grand total）与 ug_enrollment + grad_enrollment 之和可能存在小量差异，来自非学位/证书课程学生的归类。
6. **地理来源比例**: EF-C 统计的"外州"包含美国外州及境外学生（foreign），因为 EF-C 仅列出美国各州 FIPS 代码，境外来源并无单独行，已归入本州+外州+未知的合计中。
7. **SAT 数据断层**: 2016 年起 College Board 重新设计 SAT（取消 Writing 部分），部分院校在 COVID-19 期间（2020-2022）暂停 SAT/ACT 要求，导致 pct_submit_sat 和考试成绩列在这些年份有大量缺失。
