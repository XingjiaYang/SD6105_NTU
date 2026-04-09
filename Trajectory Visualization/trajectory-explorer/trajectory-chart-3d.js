/**
 * TrajectoryChart3D — 3D 渲染类（基于 Three.js）
 *
 * 职责：
 *  1. X-Y-Time 三维散点 + 轨迹线
 *  2. OrbitControls 拖拽旋转视角，默认 X-Y 平面俯视
 *  3. 粗数据点（sphere），可显示/隐藏
 *  4. Raycaster tooltip，可启用/禁用
 *  5. 图例交互（静音分类）
 */

class TrajectoryChart3D {
  constructor(containerSelector, cfg) {
    this.cfg = cfg;
    this.container = document.querySelector(containerSelector);
    this.mutedCategories = new Set();
    this.tooltipEnabled = true;
    this.dotsVisible = true;
    this._searchEntities = null;

    // 尺寸（容器可能 display:none，取父元素或回退值）
    this.w = this.container.clientWidth || this.container.parentElement.clientWidth || 960;
    this.h = this.container.clientHeight || 600;

    // Three.js 基础
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xfafafa);

    this.camera = new THREE.PerspectiveCamera(50, this.w / this.h, 0.1, 2000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.w, this.h);
    this.container.appendChild(this.renderer.domElement);

    // OrbitControls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;

    // 灯光
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    // Raycaster
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points = { threshold: 0 };
    this.mouse = new THREE.Vector2();
    this.tooltip = document.getElementById("tooltip");

    // 数据组
    this.dataGroup = new THREE.Group();
    this.scene.add(this.dataGroup);

    // 轴线组
    this.axisGroup = new THREE.Group();
    this.scene.add(this.axisGroup);

    // sphere 列表（用于 raycaster）
    this.spheres = [];
    this.sphereDataMap = new WeakMap();

    // 缩放范围（供轴标签用）
    this.scaleInfo = null;

    // 高亮状态
    this._highlightedEntity = null;

    // 绑定事件
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onResize = this._onResize.bind(this);
    this.container.addEventListener("mousemove", this._onMouseMove);
    this.container.addEventListener("click", this._onClick);
    window.addEventListener("resize", this._onResize);

    // 默认相机位置（X-Y 平面俯视）
    this._defaultCameraPos = new THREE.Vector3(0, 0, 420);
    this._defaultTarget = new THREE.Vector3(0, 0, 0);
    this.resetView();

    // 动画循环
    this._animate();
  }

  /* ---- 公共接口 ---- */

  render(data, options) {
    const { xCol, yCol, colorCol, yearMin, yearMax, smooth, showDots, allCategories } = options;
    const timCol = this.cfg.timeColumn;
    const entCol = this.cfg.entityColumn;
    const labels = this.cfg.columnLabels;
    const catLabels = this.cfg.categoryLabels[colorCol] || {};

    // 1. 过滤
    const filtered = data.filter(d =>
      d[timCol] >= yearMin && d[timCol] <= yearMax &&
      d[xCol] != null && !isNaN(d[xCol]) &&
      d[yCol] != null && !isNaN(d[yCol])
    );

    if (filtered.length === 0) {
      this._clearData();
      this._buildLegend([], colorCol, labels, catLabels, d3.scaleOrdinal());
      return;
    }

    // 2. 比例尺（映射到 [-100, 100] 区间便于 3D 显示）
    const xExtent = d3.extent(filtered, d => d[xCol]);
    const yExtent = d3.extent(filtered, d => d[yCol]);
    const tExtent = [yearMin, yearMax];

    const xScale = d3.scaleLinear().domain(xExtent).range([-120, 120]);
    const yScale = d3.scaleLinear().domain(yExtent).range([-80, 80]);
    const tScale = d3.scaleLinear().domain(tExtent).range([-80, 80]);

    this.scaleInfo = { xCol, yCol, timCol, xExtent, yExtent, tExtent, xScale, yScale, tScale, labels, catLabels, colorCol };

    // 3. 颜色（基于全量分类值，保证筛选时颜色不变）
    const fullCats = allCategories || [...new Set(filtered.map(d => d[colorCol]))].sort((a, b) => a - b);
    const categories = [...new Set(filtered.map(d => d[colorCol]))].sort((a, b) => a - b);
    const colorScaleD3 = d3.scaleOrdinal()
      .domain(fullCats)
      .range(d3.quantize(t => d3.interpolateRainbow(t * 0.85 + 0.05), Math.max(fullCats.length, 1)));

    // 4. 按实体分组
    const grouped = d3.groups(filtered, d => d[entCol])
      .map(([entity, rows]) => ({
        entity,
        name: rows[0][this.cfg.entityNameColumn] || entity,
        category: rows[0][colorCol],
        points: rows.sort((a, b) => a[timCol] - b[timCol]),
      }));

    // 5. 绘制
    this._clearData();
    this._drawAxes3D();
    this._drawTrajectoriesAndDots(grouped, xCol, yCol, timCol, colorCol, xScale, yScale, tScale, colorScaleD3, labels, catLabels);
    this._buildLegend(categories, colorCol, labels, catLabels, colorScaleD3);
    this._applyMute();
    this.dotsVisible = showDots;
    this._updateDotsVisibility();
  }

  resetView() {
    this.camera.position.copy(this._defaultCameraPos);
    this.controls.target.copy(this._defaultTarget);
    this.controls.update();
  }

  setTooltipEnabled(enabled) {
    this.tooltipEnabled = enabled;
    if (!enabled) this.tooltip.style.opacity = 0;
  }

  setDotsVisible(visible) {
    this.dotsVisible = visible;
    this._updateDotsVisibility();
  }

  play() { /* 3D 模式暂不支持播放 */ }
  stopPlay() {}
  get isPlaying() { return false; }

  /* ---- 内部：3D 绘制 ---- */

  _clearData() {
    while (this.dataGroup.children.length) {
      const child = this.dataGroup.children[0];
      this.dataGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    }
    this.spheres = [];
    this.sphereDataMap = new WeakMap();
  }

  _drawAxes3D() {
    while (this.axisGroup.children.length) {
      const c = this.axisGroup.children[0];
      this.axisGroup.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    }

    if (!this.scaleInfo) return;
    const { xScale, yScale, tScale, xExtent, yExtent, tExtent, labels, xCol, yCol, timCol } = this.scaleInfo;

    const axisMat = new THREE.LineBasicMaterial({ color: 0x888888 });

    // X 轴
    const xGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xScale(xExtent[0]), yScale(yExtent[0]), tScale(tExtent[0])),
      new THREE.Vector3(xScale(xExtent[1]), yScale(yExtent[0]), tScale(tExtent[0])),
    ]);
    this.axisGroup.add(new THREE.Line(xGeom, axisMat));

    // Y 轴
    const yGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xScale(xExtent[0]), yScale(yExtent[0]), tScale(tExtent[0])),
      new THREE.Vector3(xScale(xExtent[0]), yScale(yExtent[1]), tScale(tExtent[0])),
    ]);
    this.axisGroup.add(new THREE.Line(yGeom, axisMat));

    // T(Z) 轴
    const zGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xScale(xExtent[0]), yScale(yExtent[0]), tScale(tExtent[0])),
      new THREE.Vector3(xScale(xExtent[0]), yScale(yExtent[0]), tScale(tExtent[1])),
    ]);
    this.axisGroup.add(new THREE.Line(zGeom, axisMat));

    // 轴标签（使用 CSS2DRenderer 或 sprite）
    this._addAxisLabel(labels[xCol] || xCol,
      new THREE.Vector3(xScale(xExtent[1]) + 16, yScale(yExtent[0]) - 24, tScale(tExtent[0])));
    this._addAxisLabel(labels[yCol] || yCol,
      new THREE.Vector3(xScale(xExtent[0]) - 28, yScale(yExtent[1]) + 28, tScale(tExtent[0])));
    this._addAxisLabel("Year",
      new THREE.Vector3(xScale(xExtent[0]) - 16, yScale(yExtent[0]) - 24, tScale(tExtent[1]) + 16));

    // 刻度标签 — X 轴
    const xTicks = d3.scaleLinear().domain(xExtent).nice().ticks(6);
    xTicks.forEach(v => {
      this._addTickLabel(this._formatTick(v),
        new THREE.Vector3(xScale(v), yScale(yExtent[0]) - 10, tScale(tExtent[0])));
    });

    // 刻度标签 — Y 轴
    const yTicks = d3.scaleLinear().domain(yExtent).nice().ticks(6);
    yTicks.forEach(v => {
      this._addTickLabel(this._formatTick(v),
        new THREE.Vector3(xScale(xExtent[0]) - 10, yScale(v), tScale(tExtent[0])));
    });

    // 刻度标签 — T(Z) 轴（年份）
    for (let yr = tExtent[0]; yr <= tExtent[1]; yr++) {
      this._addTickLabel(String(yr),
        new THREE.Vector3(xScale(xExtent[0]) - 10, yScale(yExtent[0]) - 10, tScale(yr)));
    }
  }

  _formatTick(v) {
    if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(1) + "B";
    if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + "M";
    if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + "K";
    return v.toFixed(Number.isInteger(v) ? 0 : 1);
  }

  _addAxisLabel(text, position) {
    const sprite = this._makeTextSprite(text, {
      fontSize: 56, fontWeight: "bold", color: "#333", bgColor: "rgba(250,250,250,0.85)"
    });
    sprite.position.copy(position);
    const aspect = sprite.material.map.image.width / sprite.material.map.image.height;
    sprite.scale.set(18 * aspect, 18, 1);
    this.axisGroup.add(sprite);
  }

  _addTickLabel(text, position) {
    const sprite = this._makeTextSprite(text, {
      fontSize: 48, color: "#666", bgColor: "rgba(250,250,250,0.75)"
    });
    sprite.position.copy(position);
    const aspect = sprite.material.map.image.width / sprite.material.map.image.height;
    sprite.scale.set(12 * aspect, 12, 1);
    this.axisGroup.add(sprite);
  }

  _makeTextSprite(text, opts) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const fontSize = opts.fontSize || 32;
    const fontWeight = opts.fontWeight || "normal";
    ctx.font = `${fontWeight} ${fontSize}px -apple-system, sans-serif`;
    const metrics = ctx.measureText(text);
    const tw = metrics.width + 12;
    const th = fontSize + 12;
    canvas.width = Math.ceil(tw);
    canvas.height = Math.ceil(th);
    // 背景
    if (opts.bgColor) {
      ctx.fillStyle = opts.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.font = `${fontWeight} ${fontSize}px -apple-system, sans-serif`;
    ctx.fillStyle = opts.color || "#333";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 6, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    return new THREE.Sprite(mat);
  }

  _drawTrajectoriesAndDots(grouped, xCol, yCol, timCol, colorCol, xScale, yScale, tScale, colorScaleD3, labels, catLabels) {
    const sphereGeom = new THREE.SphereGeometry(1.5, 12, 8);
    const fmt = d3.format(",.2f");

    grouped.forEach(g => {
      if (this.mutedCategories.has(g.category)) return;

      const colorHex = colorScaleD3(g.category);
      const threeColor = new THREE.Color(colorHex);

      // 轨迹线
      const validPts = g.points.filter(p =>
        p[xCol] != null && !isNaN(p[xCol]) && p[yCol] != null && !isNaN(p[yCol])
      );
      if (validPts.length >= 2) {
        const positions = validPts.map(p => new THREE.Vector3(
          xScale(p[xCol]), yScale(p[yCol]), tScale(p[timCol])
        ));
        const lineGeom = new THREE.BufferGeometry().setFromPoints(positions);
        const lineMat = new THREE.LineBasicMaterial({
          color: threeColor, transparent: true, opacity: 0.25, linewidth: 1,
        });
        const line = new THREE.Line(lineGeom, lineMat);
        line.userData = { category: g.category, type: "trajectory", entity: g.entity };
        this.dataGroup.add(line);
      }

      // 数据点
      validPts.forEach(p => {
        const mat = new THREE.MeshLambertMaterial({ color: threeColor });
        const mesh = new THREE.Mesh(sphereGeom, mat);
        mesh.position.set(xScale(p[xCol]), yScale(p[yCol]), tScale(p[timCol]));
        mesh.userData = {
          category: g.category, type: "dot", entity: g.entity,
          _name: g.name,
          _year: p[timCol],
          _xVal: p[xCol], _yVal: p[yCol],
          _xLabel: labels[xCol] || xCol,
          _yLabel: labels[yCol] || yCol,
          _colorLabel: labels[colorCol] || colorCol,
          _catDisplay: catLabels[g.category] || g.category,
        };
        this.dataGroup.add(mesh);
        this.spheres.push(mesh);
      });
    });
  }

  _updateDotsVisibility() {
    this.spheres.forEach(s => {
      s.material.opacity = this.dotsVisible ? 1 : 0;
      s.material.transparent = true;
    });
  }

  /* ---- 图例 ---- */

  _buildLegend(categories, colorCol, labels, catLabels, colorScaleD3) {
    const legend = document.getElementById("legend");
    legend.innerHTML = "";

    categories.forEach(cat => {
      const displayName = catLabels[cat] || cat;
      const item = document.createElement("div");
      item.className = "legend-item" + (this.mutedCategories.has(cat) ? " muted" : "");
      item.dataset.category = cat;
      item.onclick = () => this._toggleCategory(cat);

      const swatch = document.createElement("div");
      swatch.className = "legend-swatch";
      swatch.style.background = colorScaleD3(cat);

      const span = document.createElement("span");
      span.textContent = displayName;

      item.appendChild(swatch);
      item.appendChild(span);
      legend.appendChild(item);
    });
  }

  _toggleCategory(cat) {
    if (this.mutedCategories.has(cat)) this.mutedCategories.delete(cat);
    else this.mutedCategories.add(cat);
    // 需要触发完整重绘（因为 3D 对象需要重建）
    this._pendingRerender = true;
  }

  _applyMute() {
    // 在 3D 模式下，mute 通过重绘实现
    document.querySelectorAll(".legend-item").forEach(el => {
      const cat = +el.dataset.category;
      const catStr = el.dataset.category;
      el.classList.toggle("muted", this.mutedCategories.has(cat) || this.mutedCategories.has(catStr));
    });
  }

  /* ---- 事件 ---- */

  _onMouseMove(event) {
    if (!this.tooltipEnabled || this.spheres.length === 0) {
      this.tooltip.style.opacity = 0;
      return;
    }

    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.spheres);

    if (intersects.length > 0) {
      const d = intersects[0].object.userData;
      if (this._searchEntities && !this._searchEntities.has(d.entity)) {
        this.tooltip.style.opacity = 0;
        return;
      }
      const fmt = d3.format(",.2f");
      this.tooltip.innerHTML =
        `<strong>${d._name}</strong> (${d._year})<br>` +
        `${d._xLabel}: ${fmt(d._xVal)}<br>` +
        `${d._yLabel}: ${fmt(d._yVal)}<br>` +
        `${d._colorLabel}: ${d._catDisplay}`;
      this.tooltip.style.opacity = 1;
      this.tooltip.style.left = (event.clientX - rect.left + 14) + "px";
      this.tooltip.style.top = (event.clientY - rect.top - 12) + "px";
    } else {
      this.tooltip.style.opacity = 0;
    }
  }

  _onClick(event) {
    this._searchEntities = null; // click clears search tooltip restriction
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.spheres);

    if (intersects.length > 0) {
      const entity = intersects[0].object.userData.entity;
      this._highlightEntity(entity === this._highlightedEntity ? null : entity);
    } else {
      this._highlightEntity(null);
    }
  }

  _highlightEntity(entity) {
    this.highlightEntities(entity == null ? null : new Set([entity]));
  }

  /**
   * 高亮一组实体（公共接口，搜索/点击共用）
   * @param {Set|null} entitySet — null 表示清除高亮
   */
  highlightEntities(entitySet) {
    this._highlightedEntity = entitySet && entitySet.size === 1 ? [...entitySet][0] : null;
    this.dataGroup.children.forEach(child => {
      if (child.userData.type === "trajectory") {
        if (!entitySet || entitySet.size === 0) {
          child.material.opacity = 0.25;
          child.material.linewidth = 1;
        } else if (entitySet.has(child.userData.entity)) {
          child.material.opacity = 1;
          child.material.linewidth = 2;
        } else {
          child.material.opacity = 0.03;
          child.material.linewidth = 1;
        }
      }
    });
  }

  /** Search-specific highlight: also restricts tooltips to highlighted entities */
  setSearchHighlight(entitySet) {
    this._searchEntities = entitySet;
    this.highlightEntities(entitySet);
  }

  _onResize() {
    const w = this.container.clientWidth || this.container.parentElement.clientWidth || 960;
    const h = this.container.clientHeight || 600;
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  /* ---- 用于 app.js 调用重绘的标志 ---- */
  get needsRerender() {
    const v = this._pendingRerender;
    this._pendingRerender = false;
    return v;
  }
}
