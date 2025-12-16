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
// --- 2. Three.js Background (明るいグラデーション・高可読性版) ---
// =====================================================================
const canvas = document.getElementById('webgl-canvas');
const scene = new THREE.Scene();

// カメラ設定
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.z = 100;

// レンダラー設定
const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    alpha: true, 
    antialias: true 
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// --- ネットワークの設定 ---
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

// 【修正1】粒子のマテリアル（点）
const pMaterial = new THREE.PointsMaterial({
    // 色を明るいイエローオレンジに変更（文字と重なっても見やすい）
    color: 0xFFB600, 
    size: 3,
    transparent: true,
    // 【修正2】透明度を下げて主張を抑える
    opacity: 0.6, 
    sizeAttenuation: true
});

const pointCloud = new THREE.Points(geometry, pMaterial);
particles.add(pointCloud);


// 線の設定
const segments = particleCount * particleCount;
const positions = new Float32Array(segments * 3);
const colors = new Float32Array(segments * 3);

const pGeometry = new THREE.BufferGeometry();
pGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
pGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));

// 【修正3】線のマテリアル
const pLinesMaterial = new THREE.LineBasicMaterial({
    color: 0xFFFFFF, // 頂点カラーを使うのでベースは白
    vertexColors: true,
    transparent: true,
    // 【修正4】透明度を大幅に下げて、文字の可読性を最優先する
    opacity: 0.2 
});

const linesMesh = new THREE.LineSegments(pGeometry, pLinesMaterial);
particles.add(linesMesh);

// --- アニメーションループ ---
const connectDistance = 100;

function animate() {
    let vertexpos = 0;
    let colorpos = 0;
    let numConnected = 0;

    for (let i = 0; i < particleCount; i++) {
        particleData[i].numConnections = 0;

        let px = pPos[i * 3];
        let py = pPos[i * 3 + 1];
        let pz = pPos[i * 3 + 2];

        px += particleData[i].velocity.x;
        py += particleData[i].velocity.y;
        pz += particleData[i].velocity.z;

        if (px < -r / 2 || px > r / 2) particleData[i].velocity.x *= -1;
        if (py < -r / 2 || py > r / 2) particleData[i].velocity.y *= -1;
        if (pz < -r / 2 || pz > r / 2) particleData[i].velocity.z *= -1;

        pPos[i * 3] = px;
        pPos[i * 3 + 1] = py;
        pPos[i * 3 + 2] = pz;

        for (let j = i + 1; j < particleCount; j++) {
            let dx = pPos[i * 3] - pPos[j * 3];
            let dy = pPos[i * 3 + 1] - pPos[j * 3 + 1];
            let dz = pPos[i * 3 + 2] - pPos[j * 3 + 2];
            let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < connectDistance) {
                particleData[i].numConnections++;
                particleData[j].numConnections++;

                let alpha = 1.0 - dist / connectDistance;

                positions[vertexpos++] = pPos[i * 3];
                positions[vertexpos++] = pPos[i * 3 + 1];
                positions[vertexpos++] = pPos[i * 3 + 2];

                positions[vertexpos++] = pPos[j * 3];
                positions[vertexpos++] = pPos[j * 3 + 1];
                positions[vertexpos++] = pPos[j * 3 + 2];

                // 【修正5】線の色をグラデーションにする
                // 始点は明るいオレンジ (1.0, 0.6, 0.0)
                colors[colorpos++] = 1.0; 
                colors[colorpos++] = 0.6;
                colors[colorpos++] = 0.0;

                // 終点は少し黄色寄りのオレンジ (1.0, 0.8, 0.0)
                colors[colorpos++] = 1.0;
                colors[colorpos++] = 0.8;
                colors[colorpos++] = 0.0;

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

// --- リサイズ対応 ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// =====================================================================
// --- 3. GSAP Scroll Animations (変更なし) ---
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

gsap.to("body", {
    scrollTrigger: {
        trigger: ".services",
        start: "top center",
        end: "bottom center",
        scrub: true
    },
    backgroundColor: "#F9F9F9" 
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

const chatbot = document.getElementById('aiChatbot');
if(chatbot){
    window.addEventListener('scroll', () => {
        if (window.scrollY > window.innerHeight * 0.5) {
            chatbot.classList.add('visible');
        } else {
            chatbot.classList.remove('visible');
        }
    });
    chatbot.addEventListener('mouseenter', () => {
        gsap.to(chatbot, { scale: 1.05, duration: 0.3, ease: "back.out(1.7)" });
    });
    chatbot.addEventListener('mouseleave', () => {
        gsap.to(chatbot, { scale: 1, duration: 0.3 });
    });
}
// --- 7. Mega Menu Arrow Positioning (Multiple Menus Support) ---
// すべてのドロップダウンメニューに対して矢印位置を計算する
const dropdownItems = document.querySelectorAll('nav li.has-dropdown');

dropdownItems.forEach(item => {
    const megaMenu = item.querySelector('.mega-menu');
    
    // ホバー時の処理
    item.addEventListener('mouseenter', () => {
        if (!megaMenu) return;

        // 1. ホバーした「ボタン」の中心位置を取得
        const buttonRect = item.getBoundingClientRect();
        const buttonCenter = buttonRect.left + (buttonRect.width / 2);
        
        // 2. 表示される「メニュー」の左端位置を取得
        // (display: noneではないのでgetBoundingClientRectで取得可能)
        const menuRect = megaMenu.getBoundingClientRect();
        
        // 3. 相対位置を計算
        const relativeX = buttonCenter - menuRect.left;
        
        // 4. そのメニュー固有の矢印位置変数を更新
        megaMenu.style.setProperty('--arrow-x', `${relativeX}px`);
    });
});

// ウィンドウリサイズ時の再計算（開いているメニューがあれば調整）
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