/**
 * TrajectoryChart — 核心渲染类
 *
 * 职责：
 *  1. 在 X-Y 平面绘制散点
 *  2. 同一实体的点按时间排序后用线连接，形成"轨迹"
 *  3. 按分类列着色（使用 categoryLabels 将代码映射为可读标签）
 *  4. 支持平滑/直线切换、tooltip、图例交互（高亮/静音）
 *  5. 缺失年份自动跳过（defined() 过滤），全部年份缺失则不绘制
 */

class TrajectoryChart {
  constructor(svgSelector, cfg) {
    this.svg = d3.select(svgSelector);
    this.cfg = cfg;
    const { width, height, margin } = cfg.chart;
    this.width = width - margin.left - margin.right;
    this.height = height - margin.top - margin.bottom;

    this.svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    this.g = this.svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 点击空白处取消高亮（同时清除搜索 tooltip 限制）
    this.svg.on("click", (event) => {
      if (!event.target.closest(".dot")) {
        this._searchEntities = null;
        this.highlightEntities(null);
      }
    });

    // 层级：grid → trajectories → dots → labels
    this.layerGrid = this.g.append("g").attr("class", "grid");
    this.layerTrajectories = this.g.append("g").attr("class", "layer-trajectories");
    this.layerDots = this.g.append("g").attr("class", "layer-dots");
    this.layerYearMarkers = this.g.append("g").attr("class", "layer-year-markers");

    // 坐标轴容器
    this.xAxisG = this.g.append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${this.height})`);
    this.yAxisG = this.g.append("g")
      .attr("class", "axis y-axis");

    // 轴标签
    this.xLabel = this.g.append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("x", this.width / 2)
      .attr("y", this.height + 45);
    this.yLabel = this.g.append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("transform", `rotate(-90)`)
      .attr("x", -this.height / 2)
      .attr("y", -65);

    // tooltip 引用
    this.tooltip = d3.select("#tooltip");

    // 比例尺
    this.xScale = d3.scaleLinear().range([0, this.width]);
    this.yScale = d3.scaleLinear().range([this.height, 0]);
    this.colorScale = d3.scaleOrdinal();

    // 状态
    this.mutedCategories = new Set();
    this._tooltipEnabled = true;
    this._pendingRerender = false;
    this._searchEntities = null; // search-highlighted entity set
  }

  /* ---- 公共接口（与 TrajectoryChart3D 兼容） ---- */

  setDotsVisible(visible) {
    this.layerDots.style("opacity", visible ? null : 0);
    this.layerDots.style("pointer-events", visible ? null : "all");
  }

  setTooltipEnabled(enabled) {
    this._tooltipEnabled = enabled;
    if (!enabled) this.tooltip.style("opacity", 0);
  }

  get needsRerender() {
    const v = this._pendingRerender;
    this._pendingRerender = false;
    return v;
  }

  render(data, options) {
    const { xCol, yCol, colorCol, yearMin, yearMax, smooth, showDots, allCategories } = options;
    const timCol = this.cfg.timeColumn;
    const entCol = this.cfg.entityColumn;
    const labels = this.cfg.columnLabels;
    const catLabels = this.cfg.categoryLabels[colorCol] || {};

    // 1. 过滤：时间范围 + X/Y 有效数值
    const filtered = data.filter(d =>
      d[timCol] >= yearMin &&
      d[timCol] <= yearMax &&
      d[xCol] != null && !isNaN(d[xCol]) &&
      d[yCol] != null && !isNaN(d[yCol])
    );

    if (filtered.length === 0) {
      this._clearAll();
      return;
    }

    // 2. 比例尺
    this.xScale.domain(d3.extent(filtered, d => d[xCol])).nice();
    this.yScale.domain(d3.extent(filtered, d => d[yCol])).nice();

    const fullCats = allCategories || [...new Set(filtered.map(d => d[colorCol]))].sort((a, b) => a - b);
    const categories = [...new Set(filtered.map(d => d[colorCol]))].sort((a, b) => a - b);
    this.colorScale
      .domain(fullCats)
      .range(d3.quantize(
        t => d3.interpolateRainbow(t * 0.85 + 0.05),
        Math.max(fullCats.length, 1)
      ));

    // 3. 按实体分组 → 每组按时间排序
    const grouped = d3.groups(filtered, d => d[entCol])
      .map(([entity, rows]) => ({
        entity,
        name: rows[0][this.cfg.entityNameColumn] || entity,
        category: rows[0][colorCol],
        points: rows.sort((a, b) => a[timCol] - b[timCol]),
      }));

    // 4. 绘制
    this._drawGrid();
    this._drawAxes(labels[xCol] || xCol, labels[yCol] || yCol);
    this._drawTrajectories(grouped, xCol, yCol, smooth);
    this._drawDots(grouped, xCol, yCol, timCol, colorCol, labels, catLabels, showDots);
    this._drawYearMarkers(grouped, xCol, yCol, timCol);
    this._buildLegend(categories, colorCol, labels, catLabels);
    this._applyMute();
  }

  /* ---- 内部绘制 ---- */

  _clearAll() {
    this.layerGrid.selectAll("*").remove();
    this.layerTrajectories.selectAll("*").remove();
    this.layerDots.selectAll("*").remove();
    this.layerYearMarkers.selectAll("*").remove();
    d3.select("#legend").selectAll("*").remove();
  }

  _drawGrid() {
    this.layerGrid.selectAll("*").remove();
    this.layerGrid.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${this.height})`)
      .call(d3.axisBottom(this.xScale).tickSize(-this.height).tickFormat(""));
    this.layerGrid.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(this.yScale).tickSize(-this.width).tickFormat(""));
  }

  _drawAxes(xLabel, yLabel) {
    this.xAxisG.transition().duration(400).call(d3.axisBottom(this.xScale).ticks(8));
    this.yAxisG.transition().duration(400).call(d3.axisLeft(this.yScale).ticks(8));
    this.xLabel.text(xLabel);
    this.yLabel.text(yLabel);
  }

  _drawTrajectories(grouped, xCol, yCol, smooth) {
    const xS = this.xScale, yS = this.yScale, cS = this.colorScale;

    // defined() 确保缺失值不连线（跳过该年份）
    const lineGen = d3.line()
      .defined(d => d[xCol] != null && !isNaN(d[xCol]) && d[yCol] != null && !isNaN(d[yCol]))
      .x(d => xS(d[xCol]))
      .y(d => yS(d[yCol]));

    if (smooth) lineGen.curve(d3.curveCatmullRom.alpha(0.5));

    const paths = this.layerTrajectories.selectAll(".trajectory")
      .data(grouped, d => d.entity);

    paths.exit().remove();

    const enter = paths.enter().append("path").attr("class", "trajectory");

    enter.merge(paths)
      .attr("stroke", d => cS(d.category))
      .attr("data-category", d => d.category)
      .transition().duration(500)
      .attr("d", d => lineGen(d.points));
  }

  _drawDots(grouped, xCol, yCol, timCol, colorCol, labels, catLabels, showDots) {
    const xS = this.xScale, yS = this.yScale, cS = this.colorScale;
    const tooltip = this.tooltip;
    const fmt = d3.format(",.2f");
    const allDots = showDots
      ? grouped.flatMap(g => g.points.map(p => ({
          ...p, _entity: g.entity, _name: g.name, _category: g.category
        })))
      : [];

    const dots = this.layerDots.selectAll(".dot")
      .data(allDots, d => `${d._entity}-${d[timCol]}`);

    dots.exit().remove();

    const enter = dots.enter().append("circle").attr("class", "dot").attr("r", 0);

    enter.merge(dots)
      .attr("fill", d => cS(d._category))
      .attr("data-category", d => d._category)
      .on("mouseover", (event, d) => {
        if (!this._tooltipEnabled) return;
        if (this._searchEntities && !this._searchEntities.has(d._entity)) return;
        const catDisplay = catLabels[d._category] || d._category;
        tooltip.style("opacity", 1).html(
          `<strong>${d._name}</strong> (${d[timCol]})<br>` +
          `${labels[xCol] || xCol}: ${fmt(d[xCol])}<br>` +
          `${labels[yCol] || yCol}: ${fmt(d[yCol])}<br>` +
          `${labels[colorCol] || colorCol}: ${catDisplay}`
        );
      })
      .on("mousemove", (event) => {
        if (!this._tooltipEnabled) return;
        const container = document.getElementById("chart-container");
        const rect = container.getBoundingClientRect();
        tooltip
          .style("left", (event.clientX - rect.left + 12) + "px")
          .style("top", (event.clientY - rect.top - 10) + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0))
      .on("click", (event, d) => {
        this._searchEntities = null;
        this._highlightEntity(d._entity);
      })
      .transition().duration(500)
      .attr("cx", d => xS(d[xCol]))
      .attr("cy", d => yS(d[yCol]))
      .attr("r", 3);
  }

  _drawYearMarkers(grouped, xCol, yCol, timCol) {
    const xS = this.xScale, yS = this.yScale;

    // Skip year markers when too many entities or when <=2 unique time points
    const uniqueYears = new Set(grouped.flatMap(g => g.points.map(p => p[timCol])));
    const markers = grouped.length <= 200 && uniqueYears.size > 2
      ? grouped.flatMap(g => {
          if (g.points.length === 0) return [];
          const first = g.points[0];
          const last = g.points[g.points.length - 1];
          const result = [{ ...first, _entity: g.entity, _category: g.category, _pos: "start" }];
          if (g.points.length > 1) {
            result.push({ ...last, _entity: g.entity, _category: g.category, _pos: "end" });
          }
          return result;
        })
      : [];

    const labels = this.layerYearMarkers.selectAll(".year-marker")
      .data(markers, d => `${d._entity}-${d._pos}`);

    labels.exit().remove();

    labels.enter().append("text")
      .attr("class", "year-marker")
      .merge(labels)
      .attr("data-category", d => d._category)
      .text(d => d[timCol])
      .transition().duration(500)
      .attr("x", d => xS(d[xCol]) + (d._pos === "start" ? -14 : 6))
      .attr("y", d => yS(d[yCol]) + 3);
  }

  /* ---- 图例 ---- */

  _buildLegend(categories, colorCol, labels, catLabels) {
    const legend = d3.select("#legend");
    legend.selectAll("*").remove();

    const cS = this.colorScale;

    categories.forEach(cat => {
      const displayName = catLabels[cat] || cat;
      const item = legend.append("div")
        .attr("class", "legend-item")
        .attr("data-category", cat)
        .on("click", () => this._toggleCategory(cat));

      item.append("div")
        .attr("class", "legend-swatch")
        .style("background", cS(cat));

      item.append("span").text(displayName);
    });
  }

  /* ---- 交互：分类静音 / 高亮 ---- */

  _toggleCategory(cat) {
    if (this.mutedCategories.has(cat)) {
      this.mutedCategories.delete(cat);
    } else {
      this.mutedCategories.add(cat);
    }
    this._applyMute();
    this._pendingRerender = true;
  }

  _applyMute() {
    const muted = this.mutedCategories;

    d3.selectAll(".legend-item").classed("muted", function () {
      return muted.has(+this.getAttribute("data-category") || this.getAttribute("data-category"));
    });

    // 需要同时匹配数值和字符串形式的 category
    const isMuted = function () {
      const val = this.getAttribute("data-category");
      return muted.has(val) || muted.has(+val);
    };

    this.layerTrajectories.selectAll(".trajectory")
      .style("display", function () { return isMuted.call(this) ? "none" : null; });
    this.layerDots.selectAll(".dot")
      .style("display", function () { return isMuted.call(this) ? "none" : null; });
    this.layerYearMarkers.selectAll(".year-marker")
      .style("display", function () { return isMuted.call(this) ? "none" : null; });
  }

  /* ---- 轨迹播放 ---- */

  play(data, options) {
    this.stopPlay();
    this.render(data, options);

    const timCol = this.cfg.timeColumn;
    const { yearMin, yearMax } = options;
    const span = yearMax - yearMin;
    if (span <= 0) return;

    const duration = Math.max(2000, span * 600); // 每年 ~600ms

    this._playing = true;
    this._playTransitions = [];

    // 1. 轨迹路径：stroke-dashoffset 动画（GPU 加速）
    this.layerTrajectories.selectAll(".trajectory").each(function () {
      const len = this.getTotalLength();
      if (!len) return;
      const t = d3.select(this)
        .attr("stroke-dasharray", len)
        .attr("stroke-dashoffset", len)
        .transition("play")
        .duration(duration)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
    });

    // 2. 散点：按年份延迟出现
    this.layerDots.selectAll(".dot")
      .style("opacity", 0)
      .transition("play")
      .delay(d => ((d[timCol] - yearMin) / span) * duration)
      .duration(150)
      .style("opacity", null);

    // 3. 年份标记：同步
    this.layerYearMarkers.selectAll(".year-marker")
      .style("opacity", 0)
      .transition("play")
      .delay(d => ((d[timCol] - yearMin) / span) * duration)
      .duration(150)
      .style("opacity", null);

    // 播放结束后清理 dasharray
    this._playTimer = setTimeout(() => {
      this._cleanupPlay();
    }, duration + 300);
  }

  stopPlay() {
    if (!this._playing) return;
    this._playing = false;
    if (this._playTimer) { clearTimeout(this._playTimer); this._playTimer = null; }

    // 中断所有 play 过渡
    this.layerTrajectories.selectAll(".trajectory").interrupt("play");
    this.layerDots.selectAll(".dot").interrupt("play");
    this.layerYearMarkers.selectAll(".year-marker").interrupt("play");

    this._cleanupPlay();
  }

  _cleanupPlay() {
    this._playing = false;
    // 移除 dasharray 恢复正常绘制
    this.layerTrajectories.selectAll(".trajectory")
      .attr("stroke-dasharray", null)
      .attr("stroke-dashoffset", null);
    this.layerDots.selectAll(".dot").style("opacity", null);
    this.layerYearMarkers.selectAll(".year-marker").style("opacity", null);
  }

  get isPlaying() { return !!this._playing; }

  /* ---- 实体高亮 ---- */

  _highlightEntity(entity) {
    this.highlightEntities(entity == null ? null : new Set([entity]));
  }

  /**
   * 高亮一组实体（公共接口，搜索/点击共用）
   * @param {Set|null} entitySet — null 表示清除高亮
   */
  highlightEntities(entitySet) {
    this.layerTrajectories.selectAll(".trajectory")
      .classed("highlighted", false)
      .style("stroke-opacity", null);

    if (entitySet && entitySet.size > 0) {
      this.layerTrajectories.selectAll(".trajectory")
        .style("stroke-opacity", d => entitySet.has(d.entity) ? 1 : 0.05)
        .classed("highlighted", d => entitySet.has(d.entity));
    }
  }

  /** Search-specific highlight: also restricts tooltips to highlighted entities */
  setSearchHighlight(entitySet) {
    this._searchEntities = entitySet;
    this.highlightEntities(entitySet);
  }
}
