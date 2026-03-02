const BACKGROUND = "#0a0a0a"
const FOREGROUND = "#CC1100"

game.width = 800
game.height = 800
const ctx = game.getContext("2d")

function clear() {
    ctx.fillStyle = BACKGROUND
    ctx.fillRect(0, 0, game.width, game.height)
}

function line(p1, p2) {
    ctx.strokeStyle = FOREGROUND
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
}

function screen({ x, y }) {
    return {
        x: (x + 1) / 2 * game.width,
        y: (1 - (y + 1) / 2) * game.height,
    }
}

function project({ x, y, z }) {
    return { x: x / z, y: y / z }
}

function translate_z({ x, y, z }, dz) {
    return { x, y, z: z + dz }
}

function rotate_xz({ x, y, z }, a) {
    const c = Math.cos(a), s = Math.sin(a)
    return { x: x * c - z * s, y, z: x * s + z * c }
}

function rotate_yz({ x, y, z }, a) {
    const c = Math.cos(a), s = Math.sin(a)
    return { x, y: y * c - z * s, z: y * s + z * c }
}


function generateLance() {
    const verts = []
    const faces = []

    function v(x, y, z) {
        verts.push({ x, y, z })
        return verts.length - 1
    }

    function connectRings(r1, r2) {
        const n = r1.length
        for (let i = 0; i < n; i++)
            faces.push([r1[i], r1[(i + 1) % n], r2[(i + 1) % n], r2[i]])
    }

    for (const s of [-1, 1]) {
        const sections = [
            [0.052, 0.040, 0.004, 1.50],
            [0.060, 0.040, 0.010, 0.95],
            [0.065, 0.038, 0.012, 0.55],
            [0.088, 0.030, 0.011, 0.35],
            [0.115, 0.022, 0.008, 0.22],
            [0.082, 0.016, 0.006, 0.15],
            [0.048, 0.012, 0.004, 0.10],
        ]
        const rings = sections.map(([xO, xI, z, y]) => [
            v(s * xO, y, z),
            v(s * xI, y, z),
            v(s * xI, y, -z),
            v(s * xO, y, -z),
        ])
        faces.push(rings[0])
        for (let i = 0; i + 1 < rings.length; i++)
            connectRings(rings[i], rings[i + 1])
        faces.push(rings[rings.length - 1])
    }

    const guardRings = [
        [v(0.048, 0.10, 0), v(0, 0.10, 0.04), v(-0.048, 0.10, 0), v(0, 0.10, -0.04)],
        [v(0.120, 0.04, 0), v(0, 0.04, 0.08), v(-0.120, 0.04, 0), v(0, 0.04, -0.08)],
        [v(0.055, -0.01, 0), v(0, -0.01, 0.04), v(-0.055, -0.01, 0), v(0, -0.01, -0.04)],
        [v(0.120, -0.06, 0), v(0, -0.06, 0.08), v(-0.120, -0.06, 0), v(0, -0.06, -0.08)],
        [v(0.048, -0.11, 0), v(0, -0.11, 0.04), v(-0.048, -0.11, 0), v(0, -0.11, -0.04)],
    ]
    for (let i = 0; i + 1 < guardRings.length; i++)
        connectRings(guardRings[i], guardRings[i + 1])

    for (const s of [-1, 1]) {
        const sIdx = s === 1 ? 0 : 2
        const upperTip = v(s * 0.175, 0.04, 0)
        faces.push([guardRings[0][sIdx], guardRings[1][sIdx], upperTip])
        faces.push([guardRings[1][sIdx], guardRings[2][sIdx], upperTip])
        const lowerTip = v(s * 0.175, -0.06, 0)
        faces.push([guardRings[2][sIdx], guardRings[3][sIdx], lowerTip])
        faces.push([guardRings[3][sIdx], guardRings[4][sIdx], lowerTip])
    }

    const STEPS = 80
    const TURNS = 3.5
    const Y_TOP = -0.13
    const Y_BOT = -2.25

    let prev = null
    for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS
        const y = Y_TOP + t * (Y_BOT - Y_TOP)
        const taper = Math.pow(1 - t, 0.55)
        const r = 0.040 * taper
        const twist = t * TURNS * Math.PI * 2
        const ring = []
        for (let j = 0; j < 4; j++) {
            const a = (j / 4) * Math.PI * 2 + twist
            ring.push(v(r * Math.cos(a), y, r * Math.sin(a)))
        }
        if (prev !== null) connectRings(prev, ring)
        prev = ring
    }

    return { vertices: verts, faces }
}

const { vertices, faces } = generateLance()

const FPS = 60
let angle = 0

function frame() {
    const dt = 1 / FPS
    angle += Math.PI * 0.25 * dt
    clear()
    const transform = p => screen(project(translate_z(rotate_xz(rotate_yz(p, 0.25), angle), 3.0)))
    for (const f of faces) {
        for (let i = 0; i < f.length; i++) {
            line(transform(vertices[f[i]]), transform(vertices[f[(i + 1) % f.length]]))
        }
    }
    setTimeout(frame, 1000 / FPS)
}
setTimeout(frame, 1000 / FPS)
