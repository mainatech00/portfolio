(function () {
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Scroll progress */
  var bar = document.getElementById("progress");
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = "scaleX(" + (h > 0 ? Math.min(scrollY / h, 1) : 0) + ")";
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Reveal on scroll (elements are visible at rest, they only slide) */
  var rv = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    rv.forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 90 + "ms"; io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add("in"); }); }

  /* Typing role line */
  var roleEl = document.getElementById("role");
  var roles = ["build responsive websites", "design small databases", "solve problems with code"];
  if (!reduce) {
    var ri = 0, ci = roles[0].length, del = true;
    (function tick() {
      var word = roles[ri];
      if (del) { ci--; } else { ci++; }
      roleEl.textContent = word.slice(0, ci);
      var wait = del ? 38 : 70;
      if (!del && ci === word.length) { del = true; wait = 1700; }
      else if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; wait = 350; }
      setTimeout(tick, wait);
    })();
  }

  /* Draggable CSS 3D cube */
  var cube = document.getElementById("cube"), scene = document.getElementById("cubeScene");
  var rx = -22, ry = 30, drag = false, lx = 0, ly = 0;
  function paintCube() { cube.style.transform = "rotateX(" + rx + "deg) rotateY(" + ry + "deg)"; }
  paintCube();
  scene.addEventListener("pointerdown", function (e) { drag = true; lx = e.clientX; ly = e.clientY; scene.setPointerCapture(e.pointerId); });
  scene.addEventListener("pointermove", function (e) {
    if (!drag) return;
    ry += (e.clientX - lx) * 0.6; rx -= (e.clientY - ly) * 0.6;
    lx = e.clientX; ly = e.clientY; paintCube();
  });
  function end() { drag = false; }
  scene.addEventListener("pointerup", end); scene.addEventListener("pointercancel", end);
  if (!reduce) {
    (function spin() { if (!drag) { ry += 0.35; rx += Math.sin(ry / 40) * 0.05; paintCube(); } requestAnimationFrame(spin); })();
  }

  /* Tilt on project cards */
  document.querySelectorAll(".card").forEach(function (card) {
    if (reduce) return;
    card.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--ry", (x * 12).toFixed(2) + "deg");
      card.style.setProperty("--rx", (-y * 12).toFixed(2) + "deg");
    });
    card.addEventListener("pointerleave", function () {
      card.style.setProperty("--ry", "0deg"); card.style.setProperty("--rx", "0deg");
    });
  });

  /* Copy buttons */
  document.querySelectorAll(".copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var node = document.getElementById(btn.getAttribute("data-target"));
      var text = node.textContent.trim();
      function selectIt() {
        var range = document.createRange(); range.selectNodeContents(node);
        var sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
        btn.textContent = "Selected";
      }
      try {
        navigator.clipboard.writeText(text).then(function () { btn.textContent = "Copied"; }, selectIt);
      } catch (e) { selectIt(); }
      setTimeout(function () { btn.textContent = "Copy"; }, 1800);
    });
  });

  /* Contact form (demo, nothing is sent) */
  var form = document.getElementById("contactForm"), status = document.getElementById("formStatus");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { status.textContent = "Please fill in your name, a valid email and a message."; return; }
    status.textContent = "This form is a preview and does not send yet. Please use the email or phone number beside it.";
  });

  /* three.js hero */
  var canvas = document.getElementById("stage");
  if (!canvas || !window.THREE) return;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); }
  catch (err) { canvas.style.display = "none"; return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  var sc = new THREE.Scene();
  var cam = new THREE.PerspectiveCamera(45, 1, 0.1, 100); cam.position.set(0, 0, 8);
  var group = new THREE.Group(); sc.add(group);

  var knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.45, 0.4, 180, 20, 2, 3),
    new THREE.MeshBasicMaterial({ color: 0x4aa3ff, wireframe: true, transparent: true, opacity: 0.6 }));
  var core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.62, 1),
    new THREE.MeshBasicMaterial({ color: 0xff9a3c, wireframe: true }));
  group.add(knot, core);

  var cubes = [];
  for (var i = 0; i < 7; i++) {
    var m = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.3, 0.3, 0.3)),
      new THREE.LineBasicMaterial({ color: i % 2 ? 0xff9a3c : 0x9fd0ff }));
    m.userData = { r: 2.5 + Math.random() * 1.3, a: Math.random() * 6.28, s: 0.2 + Math.random() * 0.3, y: (Math.random() - 0.5) * 2.4 };
    group.add(m); cubes.push(m);
  }

  var N = 520, arr = new Float32Array(N * 3);
  for (var k = 0; k < N; k++) {
    var rr = 5 + Math.random() * 9, t = Math.random() * 6.283, p = Math.acos(2 * Math.random() - 1);
    arr[k * 3] = rr * Math.sin(p) * Math.cos(t);
    arr[k * 3 + 1] = rr * Math.sin(p) * Math.sin(t) * 0.6;
    arr[k * 3 + 2] = rr * Math.cos(p) - 4;
  }
  var geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  var stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xcfe3ff, size: 0.04, transparent: true, opacity: 0.8 }));
  sc.add(stars);

  var mx = 0, my = 0;
  addEventListener("pointermove", function (e) { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });

  function size() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    cam.aspect = w / h; cam.updateProjectionMatrix();
    group.position.x = w > 820 ? 2.7 : 0;
    group.scale.setScalar(w > 820 ? 1 : 0.8);
    if (reduce) renderer.render(sc, cam);
  }
  size();
  if ("ResizeObserver" in window) new ResizeObserver(size).observe(canvas); else addEventListener("resize", size);

  var visible = true;
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(canvas);

  if (reduce) { renderer.render(sc, cam); return; }
  var t0 = performance.now();
  (function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    var t = (now - t0) / 1000;
    knot.rotation.x = t * 0.25; knot.rotation.y = t * 0.35;
    core.rotation.x = t * 0.4; core.rotation.y = -t * 0.6;
    cubes.forEach(function (c) {
      var d = c.userData, a = d.a + t * d.s;
      c.position.set(Math.cos(a) * d.r, d.y + Math.sin(t * d.s * 2) * 0.2, Math.sin(a) * d.r);
      c.rotation.x = t * d.s * 2; c.rotation.y = t * d.s * 3;
    });
    group.rotation.y += (mx * 0.9 - group.rotation.y) * 0.05;
    group.rotation.x += (my * 0.6 - group.rotation.x) * 0.05;
    group.position.y = scrollY * 0.004;
    stars.rotation.y = t * 0.02;
    renderer.render(sc, cam);
  })(t0);
})();