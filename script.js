const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const ui = document.getElementById('ui');
const actionBtn = document.getElementById('action-btn');
const message = document.getElementById('message');
const scoreText = document.getElementById('score-text');
const title = document.getElementById('title');

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let state = 'start';
let score = 0;
let highestScore = 0;
let phase = 1;

// Gravidade menor (0.35), pulo mais forte (-11.5) e mais velocidade lateral (7)
const player = {
    x: canvas.width / 2, y: canvas.height / 2, 
    width: 40, height: 40, dy: 0, gravity: 0.35, jump: -11.5, speed: 7, emoji: '🐥'
};

let platforms = [];
let particles = [];
let keys = {};

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Nuvens mais largas na fase 1 (maxW: 120) e velocidades reduzidas nas outras
const phaseConfig = {
    1: { colors: ["#4facfe", "#00f2fe"], probMove: 0.0, maxW: 120, speed: 0 },
    2: { colors: ["#6ac2dc", "#be8fb0"], probMove: 0.2, maxW: 100, speed: 1.5 },
    3: { colors: ["#f6d365", "#fda085"], probMove: 0.4, maxW: 85, speed: 2 },
    4: { colors: ["#667eea", "#764ba2"], probMove: 0.6, maxW: 70, speed: 3 },
    5: { colors: ["#141e30", "#243b55"], probMove: 0.8, maxW: 55, speed: 4 }
};

function checkPhase() {
    if (score >= 1000) phase = 'WIN';
    else if (score >= 800) phase = 5;
    else if (score >= 600) phase = 4;
    else if (score >= 400) phase = 3;
    else if (score >= 200) phase = 2;
}

function createPlatforms() {
    platforms = [];
    let gap = canvas.height / 8.5; // Espaço vertical menor entre as nuvens
    for (let i = 0; i < 9; i++) {
        let cfg = phaseConfig[1];
        platforms.push({
            x: Math.random() * (canvas.width - cfg.maxW),
            y: canvas.height - (i * gap),
            w: cfg.maxW, h: 15,
            moving: false, speed: 0
        });
    }
}

function spawnParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x + 20, y: y + 40, vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3,
            life: 1, size: Math.random() * 4 + 2
        });
    }
}

function endGame(isWin) {
    state = 'gameover';
    if (score > highestScore) highestScore = score;
    ui.style.display = 'flex';
    title.innerText = isWin ? '🏆 Você Venceu!' : 'Ops, você caiu!';
    message.innerHTML = isWin 
        ? `Incrível! Você passou pelas 5 fases.<br>Pontuação Final: <b>${score}</b>` 
        : `Pontuação: <b>${score}</b><br>Recorde: <b>${highestScore}</b>`;
    scoreText.innerText = '';
    actionBtn.innerText = '🔄 Jogar Novamente';
}

function update() {
    if (state !== 'playing') return;

    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;
    
    if (player.x < -player.width) player.x = canvas.width;
    if (player.x > canvas.width) player.x = -player.width;

    player.dy += player.gravity;
    player.y += player.dy;

    let cameraLimit = canvas.height * 0.45;
    if (player.y < cameraLimit) {
        player.y = cameraLimit;
        
        platforms.forEach(p => {
            p.y -= player.dy;
        });

        platforms.forEach(p => {
            if (p.y > canvas.height) {
                let highestY = Math.min(...platforms.map(plat => plat.y));
                let gap = canvas.height / 8.5; // Mantém a distância curta na subida
                
                let cfg = phaseConfig[phase] || phaseConfig[5];
                p.y = highestY - gap;
                p.x = Math.random() * (canvas.width - cfg.maxW);
                p.w = cfg.maxW;
                p.moving = Math.random() < cfg.probMove;
                p.speed = (Math.random() > 0.5 ? 1 : -1) * cfg.speed;
                
                score += 10;
                checkPhase();
                if (phase === 'WIN') endGame(true);
            }
        });
    }

    if (player.dy > 0) {
        platforms.forEach(p => {
            if (player.x < p.x + p.w && player.x + player.width > p.x &&
                player.y + player.height > p.y && player.y + player.height < p.y + p.h + player.dy) {
                player.dy = player.jump;
                spawnParticles(player.x, player.y);
            }
        });
    }

    platforms.forEach(p => {
        if (p.moving) {
            p.x += p.speed;
            if (p.x < 0 || p.x + p.w > canvas.width) p.speed *= -1;
        }
    });

    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.05; });
    particles = particles.filter(p => p.life > 0);

    if (player.y > canvas.height) endGame(false);
}

function draw() {
    let colors = (phaseConfig[phase] || phaseConfig[5]).colors;
    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });

    platforms.forEach(p => {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;
        
        ctx.beginPath();
        let r = p.h / 2;
        ctx.arc(p.x + r, p.y + r, r, 0, Math.PI * 2); 
        ctx.arc(p.x + p.w / 4, p.y + r - 3, r + 2, 0, Math.PI * 2); 
        ctx.arc(p.x + p.w / 2, p.y + r - 5, r + 4, 0, Math.PI * 2); 
        ctx.arc(p.x + p.w * 0.75, p.y + r - 3, r + 2, 0, Math.PI * 2); 
        ctx.arc(p.x + p.w - r, p.y + r, r, 0, Math.PI * 2); 
        ctx.rect(p.x + r, p.y, p.w - 2 * r, p.h);
        ctx.fill();
        
        ctx.shadowColor = 'transparent';
    });

    ctx.font = "40px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.save();
    if (keys['ArrowLeft']) {
        ctx.translate(player.x + player.width, player.y);
        ctx.scale(-1, 1);
        ctx.fillText(player.emoji, 0, 0);
    } else {
        ctx.fillText(player.emoji, player.x, player.y);
    }
    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Nunito';
    ctx.textAlign = 'left';
    ctx.fillText(`Pontos: ${score}`, 15, 15);
    ctx.textAlign = 'right';
    ctx.fillText(`Fase: ${phase === 'WIN' ? 5 : phase}/5`, canvas.width - 15, 15);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

actionBtn.addEventListener('click', () => {
    state = 'playing';
    ui.style.display = 'none';
    score = 0; phase = 1;
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height / 2;
    player.dy = 0; particles = [];
    createPlatforms();
    platforms.push({ x: canvas.width/2 - 60, y: canvas.height - 100, w: 120, h: 15, moving: false, speed: 0 }); 
});

loop();