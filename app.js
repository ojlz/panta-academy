gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const isMobile = matchMedia('(max-width: 900px)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Smooth scroll: só desktop ---------- */
let lenis = null;
if (window.Lenis && !reduced && !isMobile) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- HALTER 3D (carrega separado: a página nunca trava por causa dele) ---------- */
const canvas = document.getElementById('dumbbell');
let bellRef = null;

async function initGL() {
  let THREE;
  try {
    THREE = await import('three');
  } catch (err) {
    hideGL();
    return;
  }
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    camera.position.set(0, 0.4, 6.2);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const lVolt = new THREE.PointLight(0xb4ff39, 60, 25); lVolt.position.set(-4, 3, 3); scene.add(lVolt);
    const lWhite = new THREE.PointLight(0xffffff, 28, 25); lWhite.position.set(4, -2, 4); scene.add(lWhite);

    const metal = new THREE.MeshStandardMaterial({ color: 0x161a15, metalness: 0.9, roughness: 0.35 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xb9beb9, metalness: 1, roughness: 0.25 });
    const voltMat = new THREE.MeshStandardMaterial({ color: 0xb4ff39, metalness: 0.4, roughness: 0.4, emissive: 0x5a8015, emissiveIntensity: 0.8 });

    const bell = new THREE.Group();
    const tube = (r, len, mat, x) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 40), mat);
      m.rotation.z = Math.PI / 2;
      m.position.x = x;
      bell.add(m);
    };
    tube(0.085, 3.6, chrome, 0);
    [[-0.95, 0.78, 0.22], [-1.22, 0.64, 0.2], [-1.46, 0.5, 0.18]].forEach(([x, r, w]) => tube(r, w, metal, x));
    [[0.95, 0.78, 0.22], [1.22, 0.64, 0.2], [1.46, 0.5, 0.18]].forEach(([x, r, w]) => tube(r, w, metal, x));
    tube(0.14, 0.16, voltMat, -1.68);
    tube(0.14, 0.16, voltMat, 1.68);
    bell.rotation.set(0.15, 0.5, -0.12);
    scene.add(bell);
    bellRef = bell;

    const sizeGL = () => {
      const w = canvas.clientWidth || 300;
      const h = canvas.clientHeight || 300;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    sizeGL();
    addEventListener('resize', sizeGL);

    // Arraste para girar (com inércia). Já nasce com velocidade para girar de cara.
    let targetRY = 0.5, targetRX = 0.15, velY = 0.035, dragging = false, lastX = 0, lastY = 0;
    canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      targetRY += dx * 0.008; velY = dx * 0.008;
      targetRX = Math.max(-0.9, Math.min(0.9, targetRX + dy * 0.004));
    });
    addEventListener('pointerup', () => { dragging = false; });

    const clock = new THREE.Clock();
    let running = true;
    const tick = () => {
      if (!running) return;
      const t = clock.getElapsedTime();
      if (!dragging && !reduced) { targetRY += velY; velY *= 0.985; targetRY += 0.009; }
      bell.rotation.y += (targetRY - bell.rotation.y) * 0.08;
      bell.rotation.x += (targetRX - bell.rotation.x) * 0.08;
      bell.position.y = reduced ? 0 : Math.sin(t * 0.8) * 0.12;
      bell.rotation.z = reduced ? -0.12 : -0.12 + Math.sin(t * 0.4) * 0.03;
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) tick(); });
    tick();
  } catch (err) {
    hideGL();
  }
}
function hideGL() {
  canvas.style.display = 'none';
  const hint = document.querySelector('.hint-3d');
  if (hint) hint.style.display = 'none';
}
initGL();

/* ---------- Preloader ---------- */
const preNum = document.getElementById('preNum');
const preFill = document.getElementById('preBarFill');
const preloader = document.getElementById('preloader');
const preProgress = { v: 0 };
function renderPre() {
  preNum.textContent = String(Math.floor(preProgress.v)).padStart(2, '0');
  preFill.style.width = preProgress.v + '%';
}
const loadTween = gsap.to(preProgress, { v: 90, duration: 2.2, ease: 'power2.out', onUpdate: renderPre });

gsap.set('.hero-title .line > span', { yPercent: 110 });
let preDone = false;
function finishLoad() {
  if (preDone) return; preDone = true;
  loadTween.kill();
  gsap.to(preProgress, {
    v: 100, duration: 0.4, ease: 'power2.inOut', onUpdate: renderPre,
    onComplete: () => {
      document.body.dataset.loading = 'false';
      preloader.classList.add('done');
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .to('.hero-title .line > span', { yPercent: 0, duration: 1.1, stagger: 0.1 }, 0.3)
        .to('.hero .reveal-hero', { opacity: 1, y: 0, duration: 0.9, stagger: 0.07, ease: 'power3.out' }, 0.5);
      if (bellRef) gsap.fromTo(bellRef.scale, { x: 0.7, y: 0.7, z: 0.7 }, { x: 1, y: 1, z: 1, duration: 1.6, ease: 'expo.out' });
      ScrollTrigger.refresh();
      setTimeout(() => preloader.remove(), 1000);
    }
  });
}
if (document.readyState === 'complete') setTimeout(finishLoad, 350);
else {
  addEventListener('load', () => setTimeout(finishLoad, 300));
  setTimeout(finishLoad, 5000);
}

/* ---------- Onça marca d'água: parallax + respiro ---------- */
if (!reduced) {
  gsap.to('.jaguar-bg', {
    y: 140, rotate: 5, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
  });
  gsap.to('.jaguar-bg img', {
    y: -18, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut'
  });
}
gsap.utils.toArray('main .reveal').forEach((el) => {
  if (el.closest('.hero')) return;
  gsap.to(el, {
    opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 90%', once: true }
  });
});

/* ---------- Alternador de planos ---------- */
const PLANS = {
  mensal: { tag: 'Mensal', price: 'R$ 119', per: '/mês', extra: 'Sem taxa de matrícula*', cta: 'Assinar mensal', wa: 'https://wa.me/5500090000005?text=Quero%20o%20plano%20MENSAL' },
  anual: { tag: 'Anual', price: 'R$ 420', per: '/ano', extra: 'Sai menos de R$ 40 por mês', cta: 'Assinar anual', wa: 'https://wa.me/5500090000005?text=Quero%20o%20plano%20ANUAL' }
};
const planTag = document.getElementById('planTag');
const planPrice = document.getElementById('planPrice');
const planPer = document.getElementById('planPer');
const planExtra = document.getElementById('planExtra');
const planCta = document.getElementById('planCta');
document.querySelectorAll('.bt-opt').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.bt-opt').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const d = PLANS[btn.dataset.mode];
    gsap.fromTo('#planMain', { opacity: 0.4, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    planTag.textContent = d.tag;
    planPrice.textContent = d.price;
    planPer.textContent = d.per;
    planExtra.textContent = d.extra;
    planCta.querySelector('span').textContent = d.cta;
    planCta.href = d.wa;
  });
});

/* ---------- FAQ sanfona com easing ---------- */
document.querySelectorAll('.faq-item').forEach((item) => {
  const btn = item.querySelector('.faq-q');
  const body = item.querySelector('.faq-a');
  const text = body.querySelector('p');
  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach((o) => {
      if (o === item) return;
      o.classList.remove('open');
      gsap.to(o.querySelector('.faq-a'), { height: 0, opacity: 0, duration: 0.45, ease: 'expo.inOut', overwrite: 'auto' });
    });
    if (isOpen) {
      item.classList.remove('open');
      gsap.to(body, { height: 0, opacity: 0, duration: 0.45, ease: 'expo.inOut', overwrite: 'auto' });
    } else {
      item.classList.add('open');
      gsap.to(body, { height: 'auto', opacity: 1, duration: 0.65, ease: 'expo.out', overwrite: 'auto' });
      gsap.fromTo(text, { y: 14 }, { y: 0, duration: 0.55, ease: 'power3.out', overwrite: 'auto' });
      gsap.fromTo(btn.querySelector('.faq-icon'), { rotate: 0 }, { rotate: 180, duration: 0.5, ease: 'back.out(1.6)', overwrite: 'auto' });
    }
  });
});

/* ---------- Menu + âncoras ---------- */
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('open'));
mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => mobileMenu.classList.remove('open')));
document.getElementById('toTop').addEventListener('click', () => {
  if (lenis) lenis.scrollTo(0); else scrollTo({ top: 0, behavior: 'smooth' });
});
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1 && document.querySelector(id)) {
      e.preventDefault();
      if (lenis) lenis.scrollTo(id, { offset: -76 }); else document.querySelector(id).scrollIntoView({ behavior: 'smooth' });
    }
  });
});
