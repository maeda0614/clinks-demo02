// --- 1. Custom Cursor Logic ---
const cursor = document.querySelector('.cursor');
const hoverTargets = document.querySelectorAll('.hover-target');

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

hoverTargets.forEach(target => {
    target.addEventListener('mouseenter', () => cursor.classList.add('active'));
    target.addEventListener('mouseleave', () => cursor.classList.remove('active'));
});

// =====================================================================
// --- 2. Three.js Background ---
// =====================================================================
const canvas = document.getElementById('webgl-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.z = 100;

const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    alpha: true, 
    antialias: true 
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const particleCount = Math.min(window.innerWidth / 10, 120); 
const particles = new THREE.Group();
scene.add(particles);

const r = 400;
const geometry = new THREE.BufferGeometry();
const pPos = new Float32Array(particleCount * 3);
const particleData = [];

for (let i = 0; i < particleCount; i++) {
    const x = Math.random() * r - r / 2;
    const y = Math.random() * r - r / 2;
    const z = Math.random() * r - r / 2;
    pPos[i * 3] = x;
    pPos[i * 3 + 1] = y;
    pPos[i * 3 + 2] = z;
    particleData.push({
        velocity: new THREE.Vector3(
            -0.2 + Math.random() * 0.4,
            -0.2 + Math.random() * 0.4,
            -0.2 + Math.random() * 0.4
        ),
        numConnections: 0
    });
}
geometry.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

const pMaterial = new THREE.PointsMaterial({
    color: 0xFFB600, 
    size: 3,
    transparent: true,
    opacity: 0.6, 
    sizeAttenuation: true
});
const pointCloud = new THREE.Points(geometry, pMaterial);
particles.add(pointCloud);

const segments = particleCount * particleCount;
const positions = new Float32Array(segments * 3);
const colors = new Float32Array(segments * 3);

const pGeometry = new THREE.BufferGeometry();
pGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
pGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));

const pLinesMaterial = new THREE.LineBasicMaterial({
    color: 0xFFFFFF, 
    vertexColors: true,
    transparent: true,
    opacity: 0.2 
});

const linesMesh = new THREE.LineSegments(pGeometry, pLinesMaterial);
particles.add(linesMesh);

const connectDistance = 100;

function animate() {
    let vertexpos = 0;
    let colorpos = 0;
    let numConnected = 0;

    for (let i = 0; i < particleCount; i++) {
        particleData[i].numConnections = 0;
        let px = pPos[i * 3]; let py = pPos[i * 3 + 1]; let pz = pPos[i * 3 + 2];
        px += particleData[i].velocity.x; py += particleData[i].velocity.y; pz += particleData[i].velocity.z;

        if (px < -r / 2 || px > r / 2) particleData[i].velocity.x *= -1;
        if (py < -r / 2 || py > r / 2) particleData[i].velocity.y *= -1;
        if (pz < -r / 2 || pz > r / 2) particleData[i].velocity.z *= -1;

        pPos[i * 3] = px; pPos[i * 3 + 1] = py; pPos[i * 3 + 2] = pz;

        for (let j = i + 1; j < particleCount; j++) {
            let dx = pPos[i * 3] - pPos[j * 3]; let dy = pPos[i * 3 + 1] - pPos[j * 3 + 1]; let dz = pPos[i * 3 + 2] - pPos[j * 3 + 2];
            let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < connectDistance) {
                particleData[i].numConnections++;
                particleData[j].numConnections++;
                positions[vertexpos++] = pPos[i * 3]; positions[vertexpos++] = pPos[i * 3 + 1]; positions[vertexpos++] = pPos[i * 3 + 2];
                positions[vertexpos++] = pPos[j * 3]; positions[vertexpos++] = pPos[j * 3 + 1]; positions[vertexpos++] = pPos[j * 3 + 2];
                colors[colorpos++] = 1.0; colors[colorpos++] = 0.6; colors[colorpos++] = 0.0;
                colors[colorpos++] = 1.0; colors[colorpos++] = 0.8; colors[colorpos++] = 0.0;
                numConnected++;
            }
        }
    }
    linesMesh.geometry.setDrawRange(0, numConnected * 2);
    linesMesh.geometry.attributes.position.needsUpdate = true;
    linesMesh.geometry.attributes.color.needsUpdate = true;
    pointCloud.geometry.attributes.position.needsUpdate = true;
    particles.rotation.y += 0.001;
    particles.rotation.x += 0.0005;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// =====================================================================
// --- 3. GSAP Scroll Animations ---
// =====================================================================
gsap.registerPlugin(ScrollTrigger);

gsap.from(".hero-left h1, .hero-left p, .hero-subtitle", {
    duration: 1.5,
    y: 100,
    opacity: 0,
    ease: "power4.out",
    stagger: 0.2
});

gsap.from(".hero-right", {
    duration: 1.5,
    x: 50,
    opacity: 0,
    ease: "power4.out",
    delay: 0.5
});

gsap.utils.toArray("section h2, section p, .card").forEach(element => {
    if(!element.closest('.hero')) {
        gsap.from(element, {
            scrollTrigger: {
                trigger: element,
                start: "top 85%", 
                toggleActions: "play none none reverse"
            },
            y: 50,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        });
    }
});

gsap.to(".press-release-bar", {
    scrollTrigger: {
        trigger: ".hero",
        start: "top center",
    },
    y: 0,
    opacity: 1,
    duration: 1,
    delay: 1, 
    ease: "power3.out"
});

// Chatbot Logic
const chatbot = document.getElementById('aiChatbot');
if(chatbot){
    chatbot.addEventListener('mouseenter', () => {
        gsap.to(chatbot, { scale: 1.1, duration: 0.3, ease: "back.out(1.7)" });
    });
    chatbot.addEventListener('mouseleave', () => {
        gsap.to(chatbot, { scale: 1, duration: 0.3 });
    });
}

// --- Mega Menu Arrow Positioning ---
const dropdownItems = document.querySelectorAll('nav li.has-dropdown');
dropdownItems.forEach(item => {
    const megaMenu = item.querySelector('.mega-menu');
    item.addEventListener('mouseenter', () => {
        if (!megaMenu) return;
        const buttonRect = item.getBoundingClientRect();
        const buttonCenter = buttonRect.left + (buttonRect.width / 2);
        const menuRect = megaMenu.getBoundingClientRect();
        const relativeX = buttonCenter - menuRect.left;
        megaMenu.style.setProperty('--arrow-x', `${relativeX}px`);
    });
});

window.addEventListener('resize', () => {
    dropdownItems.forEach(item => {
        const megaMenu = item.querySelector('.mega-menu');
        if (megaMenu && getComputedStyle(megaMenu).opacity !== '0') {
             const buttonRect = item.getBoundingClientRect();
             const buttonCenter = buttonRect.left + (buttonRect.width / 2);
             const menuRect = megaMenu.getBoundingClientRect();
             const relativeX = buttonCenter - menuRect.left;
             megaMenu.style.setProperty('--arrow-x', `${relativeX}px`);
        }
    });
});

// =====================================================================
// --- 4. Mobile Menu Logic ---
// =====================================================================

// ハンバーガーメニューの開閉
const hamburgerBtn = document.querySelector('.hamburger-menu');
const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');

if (hamburgerBtn && mobileMenuOverlay) {
    hamburgerBtn.addEventListener('click', () => {
        hamburgerBtn.classList.toggle('active');
        mobileMenuOverlay.classList.toggle('active');
        
        // メニューが開いているときは背景スクロールを禁止
        if (mobileMenuOverlay.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });
}

// モバイル用アコーディオンメニュー
const mobileNavHeaders = document.querySelectorAll('.mobile-nav-header');

mobileNavHeaders.forEach(header => {
    header.addEventListener('click', () => {
        // アイコンの回転切り替え
        header.classList.toggle('active');
        
        // コンテンツの開閉
        const content = header.nextElementSibling;
        if (content) {
            content.classList.toggle('open');
        }
    });
});
