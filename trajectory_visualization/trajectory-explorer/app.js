/**
 * app.js — 应用入口
 *  1. 加载 CSV 数据并转换数值类型
 *  2. 填充控件选项（含筛选条件）
 *  3. 绑定事件（含 2D/3D 切换、筛选）
 *  4. 调用当前模式的 chart.render()
 */

(function () {
  "use strict";

  // ---- 双模式图表实例 ----
  const chart3D = new TrajectoryChart3D("#chart-3d", CONFIG);
  const chart2D = new TrajectoryChart("#chart-2d", CONFIG);

  let mode = "2d";
  let rawData = [];

  const numericCols = [...new Set([...CONFIG.xColumns, ...CONFIG.yColumns])];

  // 筛选状态：每个 slot 记录选中的维度和允许的值集合
  const filters = [
    { dim: "", allowedValues: null },
    { dim: "", allowedValues: null },
  ];

  function activeChart() {
    return mode === "3d" ? chart3D : chart2D;
  }

  /* ---- 初始化 ---- */

  async function init() {
    const status = document.getElementById("load-status");
    try {
      if (status) status.textContent = "Loading data…";
      const raw = await d3.csv(CONFIG.dataPath);
      rawData = raw.map(row => {
        const r = { ...row };
        r[CONFIG.timeColumn] = +r[CONFIG.timeColumn];
        for (const col of numericCols) {
          const v = r[col];
          r[col] = (v === "" || v == null) ? NaN : +v;
        }
        for (const col of CONFIG.colorColumns) {
          const v = r[col];
          if (v !== "" && v != null && !isNaN(+v)) r[col] = +v;
        }
        return r;
      });
      if (status) status.textContent = `${rawData.length.toLocaleString()} records loaded`;
    } catch (err) {
      console.error("Data loading failed:", err);
      document.getElementById("chart-container").innerHTML =
        `<p style="padding:40px;color:#c00;">Failed to load data. Please verify the path <code>${CONFIG.dataPath}</code> is correct.</p>`;
      return;
    }

    populateSelect("select-x", CONFIG.xColumns, CONFIG.defaults.x);
    populateSelect("select-y", CONFIG.yColumns, CONFIG.defaults.y);
    populateSelect("select-color", CONFIG.colorColumns, CONFIG.defaults.color);

    // 填充筛选维度选择器
    initFilterSelects();
    initSearch();

    bindEvents();
    applyMode();
    update();
  }

  /* ---- 填充下拉框 ---- */

  function populateSelect(id, columns, defaultVal) {
    const sel = document.getElementById(id);
    columns.forEach(col => {
      const opt = document.createElement("option");
      opt.value = col;
      opt.textContent = CONFIG.columnLabels[col] || col;
      if (col === defaultVal) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  /* ---- 筛选条件 ---- */

  function initFilterSelects() {
    for (let i = 0; i < 2; i++) {
      const sel = document.getElementById(`filter-dim-${i}`);
      CONFIG.colorColumns.forEach(col => {
        const opt = document.createElement("option");
        opt.value = col;
        opt.textContent = CONFIG.columnLabels[col] || col;
        sel.appendChild(opt);
      });
    }
  }

  /** 当筛选维度下拉变化时，重建该 slot 的值复选框 */
  function onFilterDimChange(slotIdx) {
    const sel = document.getElementById(`filter-dim-${slotIdx}`);
    const container = document.getElementById(`filter-values-${slotIdx}`);
    const dim = sel.value;
    container.innerHTML = "";
    filters[slotIdx].dim = dim;
    filters[slotIdx].allowedValues = null;

    if (!dim) { update(); return; }

    // 收集该维度的所有唯一值
    const uniqueVals = [...new Set(rawData.map(d => d[dim]))].filter(v => v != null && v !== "");
    uniqueVals.sort((a, b) => (+a) - (+b));

    const catLabels = CONFIG.categoryLabels[dim] || {};

    // 全选/全不选按钮
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "filter-actions";
    const btnAll = document.createElement("button");
    btnAll.textContent = "All";
    btnAll.onclick = () => { setAllChecked(slotIdx, true); update(); };
    const btnNone = document.createElement("button");
    btnNone.textContent = "None";
    btnNone.onclick = () => { setAllChecked(slotIdx, false); update(); };
    actionsDiv.appendChild(btnAll);
    actionsDiv.appendChild(btnNone);
    container.appendChild(actionsDiv);

    // 默认全部选中
    const allowed = new Set(uniqueVals.map(String));
    filters[slotIdx].allowedValues = allowed;

    uniqueVals.forEach(val => {
      const lbl = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = true;
      cb.dataset.val = String(val);
      cb.addEventListener("change", () => {
        if (cb.checked) allowed.add(String(val));
        else allowed.delete(String(val));
        update();
      });
      const display = catLabels[val] || (CONFIG.sentinelLabels && CONFIG.sentinelLabels[String(val)]) || val;
      lbl.appendChild(cb);
      lbl.appendChild(document.createTextNode(display));
      container.appendChild(lbl);
    });

    update();
  }

  function setAllChecked(slotIdx, checked) {
    const container = document.getElementById(`filter-values-${slotIdx}`);
    const cbs = container.querySelectorAll('input[type="checkbox"]');
    const allowed = filters[slotIdx].allowedValues;
    cbs.forEach(cb => {
      cb.checked = checked;
      if (checked) allowed.add(cb.dataset.val);
      else allowed.delete(cb.dataset.val);
    });
  }

  /** 对 rawData 应用筛选条件，返回过滤后的数据 */
  function applyFilters(data) {
    let result = data;
    for (const f of filters) {
      if (!f.dim || !f.allowedValues) continue;
      const dim = f.dim;
      const allowed = f.allowedValues;
      result = result.filter(d => allowed.has(String(d[dim])));
    }
    return result;
  }

  /* ---- 搜索 ---- */

  /** 构建去重的机构索引（unitid → {name, state}），只取第一条记录 */
  function buildEntityIndex() {
    const map = new Map();
    for (const d of rawData) {
      const id = d[CONFIG.entityColumn];
      if (!map.has(id)) {
        map.set(id, {
          entity: id,
          name: d[CONFIG.entityNameColumn] || String(id),
          state: d.state_abbr || "",
        });
      }
    }
    return map;
  }

  let entityIndex = null; // 懒初始化

  let searchMode = "name"; // "name" or "state"

  function initSearch() {
    const input = document.getElementById("search-input");
    const clearBtn = document.getElementById("search-clear");
    const resultsDiv = document.getElementById("search-results");
    const btnName = document.getElementById("search-mode-name");
    const btnState = document.getElementById("search-mode-state");

    function setSearchMode(mode) {
      searchMode = mode;
      btnName.classList.toggle("active", mode === "name");
      btnState.classList.toggle("active", mode === "state");
      input.placeholder = mode === "name"
        ? "Enter institution name (e.g. MIT, Harvard)…"
        : "Enter state name or abbreviation (e.g. CA, California)…";
      if (input.value.trim()) onSearchInput(input.value.trim());
    }

    btnName.addEventListener("click", () => setSearchMode("name"));
    btnState.addEventListener("click", () => setSearchMode("state"));

    let debounceTimer = null;

    input.addEventListener("input", () => {
      clearBtn.style.display = input.value ? "" : "none";
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => onSearchInput(input.value.trim()), 200);
    });

    input.addEventListener("focus", () => {
      if (input.value.trim()) onSearchInput(input.value.trim());
    });

    clearBtn.addEventListener("click", () => {
      input.value = "";
      clearBtn.style.display = "none";
      resultsDiv.classList.remove("open");
      activeChart().setSearchHighlight(null);
    });

    // 点击外部关闭下拉
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-bar")) {
        resultsDiv.classList.remove("open");
      }
    });
  }

  // US state full name → abbreviation mapping for state search
  const STATE_NAME_TO_ABBR = {
    "alabama":"AL","alaska":"AK","arizona":"AZ","arkansas":"AR","california":"CA",
    "colorado":"CO","connecticut":"CT","delaware":"DE","florida":"FL","georgia":"GA",
    "hawaii":"HI","idaho":"ID","illinois":"IL","indiana":"IN","iowa":"IA","kansas":"KS",
    "kentucky":"KY","louisiana":"LA","maine":"ME","maryland":"MD","massachusetts":"MA",
    "michigan":"MI","minnesota":"MN","mississippi":"MS","missouri":"MO","montana":"MT",
    "nebraska":"NE","nevada":"NV","new hampshire":"NH","new jersey":"NJ","new mexico":"NM",
    "new york":"NY","north carolina":"NC","north dakota":"ND","ohio":"OH","oklahoma":"OK",
    "oregon":"OR","pennsylvania":"PA","rhode island":"RI","south carolina":"SC",
    "south dakota":"SD","tennessee":"TN","texas":"TX","utah":"UT","vermont":"VT",
    "virginia":"VA","washington":"WA","west virginia":"WV","wisconsin":"WI","wyoming":"WY",
    "district of columbia":"DC","puerto rico":"PR","guam":"GU","virgin islands":"VI",
    "american samoa":"AS","northern mariana islands":"MP",
  };
  // All known abbreviations (upper-case set)
  const ALL_ABBRS = new Set(Object.values(STATE_NAME_TO_ABBR));

  /** Resolve query to a state abbreviation if it matches a state name or abbr */
  function resolveStateQuery(qLower) {
    const qUp = qLower.toUpperCase();
    if (ALL_ABBRS.has(qUp)) return qUp;
    if (STATE_NAME_TO_ABBR[qLower]) return STATE_NAME_TO_ABBR[qLower];
    // Partial match on state name (e.g. "calif" → "CA")
    for (const [name, abbr] of Object.entries(STATE_NAME_TO_ABBR)) {
      if (name.startsWith(qLower) && qLower.length >= 3) return abbr;
    }
    return null;
  }

  function onSearchInput(query) {
    const resultsDiv = document.getElementById("search-results");
    resultsDiv.innerHTML = "";

    if (!query) {
      resultsDiv.classList.remove("open");
      activeChart().setSearchHighlight(null);
      return;
    }

    if (!entityIndex) entityIndex = buildEntityIndex();

    // 当前筛选后存在的实体集合
    const filteredData = applyFilters(rawData);
    const filteredEntities = new Set(filteredData.map(d => d[CONFIG.entityColumn]));

    const qLower = query.toLowerCase();
    const matches = [];
    const MAX_RESULTS = 50;
    let matchedState = null;

    if (searchMode === "state") {
      matchedState = resolveStateQuery(qLower);
      if (matchedState) {
        for (const info of entityIndex.values()) {
          if (matches.length >= MAX_RESULTS) break;
          if (info.state.toUpperCase() === matchedState) {
            matches.push({ ...info, available: filteredEntities.has(info.entity) });
          }
        }
      }
    } else {
      for (const info of entityIndex.values()) {
        if (matches.length >= MAX_RESULTS) break;
        if (info.name.toLowerCase().includes(qLower)) {
          matches.push({ ...info, available: filteredEntities.has(info.entity) });
        }
      }
    }

    if (matches.length === 0) {
      const hint = searchMode === "state" && !matchedState
        ? "No matching state found"
        : "No results found";
      resultsDiv.innerHTML = `<div class="search-result-summary">${hint}</div>`;
      resultsDiv.classList.add("open");
      activeChart().setSearchHighlight(null);
      return;
    }

    const availableMatches = matches.filter(m => m.available);

    // 摘要行
    const summary = document.createElement("div");
    summary.className = "search-result-summary";
    const modeLabel = matchedState ? `State: ${matchedState} · ` : "";
    const countText = matches.length >= MAX_RESULTS
      ? `${modeLabel}First ${MAX_RESULTS} results (type more to narrow down)`
      : `${modeLabel}${matches.length} results`;
    summary.textContent = availableMatches.length < matches.length
      ? `${countText}, ${matches.length - availableMatches.length} filtered out`
      : countText;
    resultsDiv.appendChild(summary);

    // 一键全部高亮（仅高亮符合筛选的）
    if (availableMatches.length > 0) {
      const allBtn = document.createElement("div");
      allBtn.className = "search-result-item";
      allBtn.innerHTML = '<span class="search-result-name" style="color:#0066cc;font-weight:600;">Highlight all matches</span>';
      allBtn.addEventListener("click", () => {
        const entitySet = new Set(availableMatches.map(m => m.entity));
        activeChart().setSearchHighlight(entitySet);
        resultsDiv.classList.remove("open");
      });
      resultsDiv.appendChild(allBtn);
    }

    matches.forEach(info => {
      const item = document.createElement("div");
      item.className = "search-result-item" + (info.available ? "" : " disabled");
      if (!info.available) item.title = "Excluded by current filters";
      item.innerHTML =
        `<span class="search-result-name">${escapeHtml(info.name)}</span>` +
        `<span class="search-result-state">${escapeHtml(info.state)}</span>`;
      if (info.available) {
        item.addEventListener("click", () => {
          activeChart().setSearchHighlight(new Set([info.entity]));
          resultsDiv.querySelectorAll(".search-result-item").forEach(el => el.classList.remove("selected"));
          item.classList.add("selected");
        });
      }
      resultsDiv.appendChild(item);
    });

    resultsDiv.classList.add("open");
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---- 2D / 3D 切换 ---- */

  function applyMode() {
    const el2d = document.getElementById("chart-2d");
    const el3d = document.getElementById("chart-3d");
    const modeBtn = document.getElementById("toggle-mode");
    const resetBtn = document.getElementById("btn-reset-view");
    const playBtn = document.getElementById("btn-play");

    if (mode === "3d") {
      el2d.style.display = "none";
      el3d.style.display = "";
      modeBtn.textContent = "2D";
      resetBtn.style.display = "";
      playBtn.style.display = "none";
    } else {
      el3d.style.display = "none";
      el2d.style.display = "";
      modeBtn.textContent = "3D";
      resetBtn.style.display = "none";
      playBtn.style.display = "";
    }
  }

  /* ---- 事件绑定 ---- */

  function bindEvents() {
    document.getElementById("select-x").addEventListener("change", update);
    document.getElementById("select-y").addEventListener("change", update);
    document.getElementById("select-color").addEventListener("change", update);
    initTimeRangeSlider();
    document.getElementById("toggle-smooth").addEventListener("change", update);

    // 筛选维度变化
    document.getElementById("filter-dim-0").addEventListener("change", () => onFilterDimChange(0));
    document.getElementById("filter-dim-1").addEventListener("change", () => onFilterDimChange(1));

    // 2D / 3D 切换
    document.getElementById("toggle-mode").addEventListener("click", () => {
      mode = mode === "3d" ? "2d" : "3d";
      applyMode();
      if (mode === "3d") chart3D._onResize();
      const dotsActive = document.getElementById("toggle-dots").classList.contains("active");
      const tipActive = document.getElementById("toggle-tooltip").classList.contains("active");
      activeChart().setDotsVisible(dotsActive);
      activeChart().setTooltipEnabled(tipActive);
      update();
    });

    // 数据点显示/隐藏
    const dotsBtn = document.getElementById("toggle-dots");
    dotsBtn.addEventListener("click", () => {
      const active = dotsBtn.classList.toggle("active");
      activeChart().setDotsVisible(active);
    });

    // tooltip 启用/禁用
    const tipBtn = document.getElementById("toggle-tooltip");
    tipBtn.addEventListener("click", () => {
      const active = tipBtn.classList.toggle("active");
      activeChart().setTooltipEnabled(active);
    });

    // 轨迹播放
    const playBtn = document.getElementById("btn-play");
    playBtn.addEventListener("click", () => {
      const chart = activeChart();
      if (chart.isPlaying) {
        chart.stopPlay();
        playBtn.textContent = "▶ Play";
        playBtn.classList.remove("playing");
      } else {
        playBtn.textContent = "■ Stop";
        playBtn.classList.add("playing");
        chart.play(applyFilters(rawData), buildOptions());
        // 播放结束自动恢复按钮
        const checkEnd = setInterval(() => {
          if (!chart.isPlaying) {
            playBtn.textContent = "▶ Play";
            playBtn.classList.remove("playing");
            clearInterval(checkEnd);
          }
        }, 300);
      }
    });

    // 重置视角（仅 3D）
    document.getElementById("btn-reset-view").addEventListener("click", () => {
      chart3D.resetView();
    });

    // 分类切换触发重绘
    setInterval(() => {
      if (activeChart().needsRerender) update();
    }, 200);
  }

  /* ---- Time Range Slider ---- */

  const TIME_MIN = 2017;
  const TIME_MAX = 2024;
  let timeRangeMin = TIME_MIN;
  let timeRangeMax = TIME_MAX;

  function initTimeRangeSlider() {
    const bar = document.getElementById("time-range-bar");
    const selected = document.getElementById("time-range-selected");
    const handleMin = document.getElementById("time-handle-min");
    const handleMax = document.getElementById("time-handle-max");
    const ticksContainer = document.getElementById("time-range-ticks");

    // Build tick marks
    for (let y = TIME_MIN; y <= TIME_MAX; y++) {
      const tick = document.createElement("span");
      tick.className = "time-range-tick";
      tick.textContent = y;
      const pct = (y - TIME_MIN) / (TIME_MAX - TIME_MIN) * 100;
      tick.style.left = pct + "%";
      ticksContainer.appendChild(tick);
    }

    updateSliderUI();

    // dragType: "min" | "max" | "undecided" | "range"
    // "undecided" is used when handles overlap — first movement decides min vs max
    let dragType = null;
    let dragStartX = 0;
    let dragStartMin = 0;
    let dragStartMax = 0;

    function yearFromX(clientX) {
      const rect = bar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(pct * (TIME_MAX - TIME_MIN) + TIME_MIN);
    }

    function startDrag(e, type) {
      e.preventDefault();
      e.stopPropagation();
      // When handles overlap, enter "undecided" — resolved on first move
      if (timeRangeMin === timeRangeMax && (type === "min" || type === "max")) {
        type = "undecided";
      }
      dragType = type;
      dragStartX = e.clientX;
      dragStartMin = timeRangeMin;
      dragStartMax = timeRangeMax;
      e.target.setPointerCapture(e.pointerId);
    }

    handleMin.addEventListener("pointerdown", (e) => startDrag(e, "min"));
    handleMax.addEventListener("pointerdown", (e) => startDrag(e, "max"));
    selected.addEventListener("pointerdown", (e) => startDrag(e, "range"));

    function onPointerMove(e) {
      if (!dragType) return;

      if (dragType === "undecided") {
        const dx = e.clientX - dragStartX;
        if (Math.abs(dx) < 2) return; // wait for clear direction
        dragType = dx > 0 ? "max" : "min";
      }

      const year = yearFromX(e.clientX);

      if (dragType === "min") {
        timeRangeMin = Math.max(TIME_MIN, Math.min(year, timeRangeMax));
      } else if (dragType === "max") {
        timeRangeMax = Math.min(TIME_MAX, Math.max(year, timeRangeMin));
      } else if (dragType === "range") {
        const rect = bar.getBoundingClientRect();
        const pxPerYear = rect.width / (TIME_MAX - TIME_MIN);
        const deltaYears = Math.round((e.clientX - dragStartX) / pxPerYear);
        const span = dragStartMax - dragStartMin;
        let newMin = dragStartMin + deltaYears;
        let newMax = dragStartMax + deltaYears;
        if (newMin < TIME_MIN) { newMin = TIME_MIN; newMax = TIME_MIN + span; }
        if (newMax > TIME_MAX) { newMax = TIME_MAX; newMin = TIME_MAX - span; }
        timeRangeMin = newMin;
        timeRangeMax = newMax;
      }

      updateSliderUI();
      update();
    }

    function onPointerUp() {
      dragType = null;
    }

    // Click on track to jump nearest handle
    bar.addEventListener("pointerdown", (e) => {
      if (dragType) return;
      if (e.target === handleMin || e.target === handleMax || e.target === selected) return;
      const year = yearFromX(e.clientX);
      // Move whichever handle is closer; if equidistant, move the one in the click direction
      const distMin = Math.abs(year - timeRangeMin);
      const distMax = Math.abs(year - timeRangeMax);
      if (distMin < distMax || (distMin === distMax && year <= timeRangeMin)) {
        timeRangeMin = Math.min(year, timeRangeMax);
      } else {
        timeRangeMax = Math.max(year, timeRangeMin);
      }
      updateSliderUI();
      update();
    });

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  }

  function updateSliderUI() {
    const selected = document.getElementById("time-range-selected");
    const handleMin = document.getElementById("time-handle-min");
    const handleMax = document.getElementById("time-handle-max");
    const label = document.getElementById("year-label");

    const pctMin = (timeRangeMin - TIME_MIN) / (TIME_MAX - TIME_MIN) * 100;
    const pctMax = (timeRangeMax - TIME_MIN) / (TIME_MAX - TIME_MIN) * 100;

    selected.style.left = pctMin + "%";
    selected.style.width = (pctMax - pctMin) + "%";
    handleMin.style.left = pctMin + "%";
    handleMax.style.left = pctMax + "%";

    // When collapsed, show a wider grab zone for range sliding
    selected.classList.toggle("collapsed", timeRangeMin === timeRangeMax);

    label.textContent = timeRangeMin === timeRangeMax
      ? String(timeRangeMin)
      : `${timeRangeMin} – ${timeRangeMax}`;
  }

  /* ---- 更新图表 ---- */

  function buildOptions() {
    const colorCol = document.getElementById("select-color").value;
    const allCategories = [...new Set(rawData.map(d => d[colorCol]))]
      .filter(v => v != null && v !== "")
      .sort((a, b) => a - b);
    return {
      xCol: document.getElementById("select-x").value,
      yCol: document.getElementById("select-y").value,
      colorCol,
      yearMin: timeRangeMin,
      yearMax: timeRangeMax,
      smooth: document.getElementById("toggle-smooth").checked,
      showDots: document.getElementById("toggle-dots").classList.contains("active"),
      allCategories,
    };
  }

  function update() {
    // 参数变化时停止播放
    const chart = activeChart();
    if (chart.isPlaying) {
      chart.stopPlay();
      const playBtn = document.getElementById("btn-play");
      playBtn.textContent = "▶ Play";
      playBtn.classList.remove("playing");
    }
    chart.render(applyFilters(rawData), buildOptions());
  }

  init();
})();
