import * as THREE from "three";
import { GridHelper } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

const sleep = ms => new Promise(r => setTimeout(r, ms));

const N = 10; // NxN board size
const ani = true; // enable / disable animations
const paintTrail = true; // enable / disable paint trails for rolling finder block

let l = -(N / 2) + 0.5; // lower bound
let u = N / 2 - 0.5; // upper bound



// Priority Queue implentation for A* Search
class QElement {
    constructor(element, priority) {
        this.element = element;
        this.priority = priority;
    }
}

class PriorityQueue {

    constructor() {
        this.items = [];
    }

    enqueue(element, priority) {
        var qElement = new QElement(element, priority);
        var contain = false;
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].priority > qElement.priority) {
                this.items.splice(i, 0, qElement);
                contain = true;
                break;
            }
        }
        if (!contain) {
            this.items.push(qElement);
        }
    }

    dequeue() {
        if (this.isEmpty())
            return "Underflow";
        return this.items.shift();
    }

    isEmpty() {
        return this.items.length == 0;
    }
}

const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const orbit = new OrbitControls(camera, renderer.domElement);

camera.position.set(10, 15, -22);

orbit.update();

scene.background = new THREE.Color(`rgb(10, 10, 10)`);

const planeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(N, N),
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        visible: true,
        color: 0x000000
    })
);
planeMesh.rotateX(-Math.PI / 2);
planeMesh.position.y -= 0.1;
planeMesh.name = "PLANE";
scene.add(planeMesh);


const grid = new THREE.GridHelper(N, N);
grid.name = "GRID";
grid.position.y -= 0.05;
scene.add(grid);

const highlightMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true,
    })
);
const Mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true,
    })
);
Mesh.rotateX(-Math.PI / 2);
highlightMesh.rotateX(-Math.PI / 2);
highlightMesh.position.set(0.5, 0, 0.5);
scene.add(highlightMesh);

const mousePosition = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let intersects;

window.addEventListener("mousemove", function (e) {
    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mousePosition, camera);
    intersects = raycaster.intersectObject(planeMesh);
    if (intersects.length > 0) {
        const intersect = intersects[0];
        const highlightPos = new THREE.Vector3()
            .copy(intersect.point)
            .floor()
            .addScalar(0.5);

        highlightMesh.position.set(highlightPos.x, -0.07, highlightPos.z);

        const objectExist = objects.find(function (object) {
            return (
                object.position.x === highlightMesh.position.x &&
                object.position.z === highlightMesh.position.z
            );
        });

        if (!objectExist && highlightPos.x >= l && highlightPos.x <= u && highlightPos.z >= l && highlightPos.z <= u) highlightMesh.material.color.setHex(0x808080);
        else highlightMesh.material.color.setHex(0x000000);
    }
});

// Defining the different type of boxes
const startBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.75, 0.75),
    new THREE.MeshBasicMaterial({ color: 0x00FF00 })
);
startBox.add(new THREE.LineSegments(new THREE.EdgesGeometry(startBox.geometry), new THREE.LineBasicMaterial({ color: 0x000000 })));
const endBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.75, 0.75),
    new THREE.MeshBasicMaterial({ color: 0xFF0000 })
);
const wallBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.75, 0.75),
    new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.75 })
);

const finderBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.751, 0.751, 0.751),
    new THREE.MeshBasicMaterial({ color: 0xFF00FF })
);

const solutionBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.75, 0.75),
    new THREE.MeshBasicMaterial({ color: 0xFF00FF })
);

const hideBox = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
);

const cornerHideBox = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
);

const waveBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.5, 0.7),
    new THREE.MeshBasicMaterial({
        color: 0x00FF00,
        opacity: 1,
        transparent: true
    })
);
waveBox.add(new THREE.LineSegments(new THREE.EdgesGeometry(waveBox.geometry), new THREE.LineBasicMaterial({ color: 0x000000 })));

// Adding border around the board to hide animations
if (N < 21) {
    let l2 = l;
    let hideId = 0;
    for (let i = 0; i < 3; i++) {
        l2 = l;
        while (l2 <= u) {
            let hide = hideBox.clone();
            let hide2 = hideBox.clone();
            hide.position.set(l2, -0.6 - i, l - 1);
            hide2.position.set(l - 1, -0.6 - i, l2);
            hide.name = "HIDE" + ++hideId;
            hide2.name = "HIDE" + ++hideId;
            scene.add(hide);
            scene.add(hide2);
            l2++;
        }
    }
    let u2 = u;
    for (let i = 0; i < 3; i++) {
        u2 = u;
        while (u2 >= l) {
            let hide = hideBox.clone();
            let hide2 = hideBox.clone();
            hide.position.set(u2, -0.6 - i, u + 1);
            hide2.position.set(u + 1, -0.6 - i, u2);
            hide.name = "HIDE" + ++hideId;
            hide2.name = "HIDE" + ++hideId;
            scene.add(hide);
            scene.add(hide2);
            u2--;
        }
    }
    for (let i = 0; i < 3; i++) {
        let c1 = cornerHideBox.clone();
        c1.name = "HIDE" + ++hideId;
        c1.position.set(u + 1, -0.6 - i, u + 1);
        let c2 = cornerHideBox.clone();
        c2.name = "HIDE" + ++hideId;
        c2.position.set(u + 1, -0.6 - i, l - 1);
        let c3 = cornerHideBox.clone();
        c3.name = "HIDE" + ++hideId;
        c3.position.set(l - 1, -0.6 - i, l - 1);
        let c4 = cornerHideBox.clone();
        c4.name = "HIDE" + ++hideId;
        c4.position.set(l - 1, -0.6 - i, u + 1);
        scene.add(c1);
        scene.add(c2);
        scene.add(c3);
        scene.add(c4);
    }
}

// Intialization
let objects = [];
let boxes = [];
let paths = null;
let startBoxPosition = null;
let endBoxPosition = null;
let wallId = 0;
let solId = 0;
let solutionDrawn = false;

// Creates a box when a tile is clicked. Start and End boxes have priority
window.addEventListener('click', async function () {
    console.log(scene);
    function boxExists(bs, mesh_x, mesh_z) {
        if (boxes.length == 0) {
            return false;
        }
        for (let i = 0; i < bs.length; i++) {
            if (bs[i].position.x == mesh_x && bs[i].position.z == mesh_z) {
                return true;
            }
        }
        return false;
    }

    function boxIndex(bs, mesh_x, mesh_z) {
        for (let i = 0; i < bs.length; i++) {
            if (bs[i].position.x == mesh_x && bs[i].position.z == mesh_z) {
                return i;
            }
        }
        return -1;
    }

    function isStart(mesh_x, mesh_z) {
        return (mesh_x == startBoxPosition[0] && mesh_z == startBoxPosition[1]);
    }

    function isEnd(mesh_x, mesh_z) {
        return (mesh_x == endBoxPosition[0] && mesh_z == endBoxPosition[1]);
    }

    function removeBox(mesh_x, mesh_z) {
        boxes.forEach(box => {
            if (box.position.x == mesh_x && box.position.z == mesh_z) {
                scene.remove(box);
                boxes = boxes.splice(boxes.indexOf(box), 1);
                return box.name;
            }
        });
    }

    if (intersects.length > 0) {
        if (highlightMesh.position.x >= l && highlightMesh.position.x <= u && highlightMesh.position.z >= l && highlightMesh.position.z <= u) {
            if (!(boxExists(boxes, highlightMesh.position.x, highlightMesh.position.z))) {
                let boxClone = null;
                if (startBoxPosition == null) { // must add startBox
                    boxClone = startBox.clone()
                    boxClone.position.copy(highlightMesh.position);
                    boxClone.position.y -= 0.5;
                    boxClone.name = "START";
                    boxClone.add(new THREE.LineSegments(new THREE.EdgesGeometry(boxClone.geometry), new THREE.LineBasicMaterial({ color: 0x000000 })));
                    boxes.push(boxClone);
                    scene.add(boxClone);
                    if (startBoxPosition == null) {
                        startBoxPosition = [boxClone.position.x, boxClone.position.z];
                    }
                } else if (endBoxPosition == null) { // must add endBox
                    boxClone = endBox.clone()
                    boxClone.position.copy(highlightMesh.position);
                    boxClone.position.y -= 0.5;
                    boxClone.name = "END";
                    boxClone.add(new THREE.LineSegments(new THREE.EdgesGeometry(boxClone.geometry), new THREE.LineBasicMaterial({ color: 0x000000 })));
                    boxes.push(boxClone);
                    scene.add(boxClone);
                    if (endBoxPosition == null) {
                        endBoxPosition = [boxClone.position.x, boxClone.position.z];
                    }
                } else { // free to add wallBox
                    boxClone = wallBox.clone()
                    boxClone.position.copy(highlightMesh.position);
                    boxClone.position.y -= 0.5;
                    boxClone.name = "WALL" + wallId;
                    boxClone.add(new THREE.LineSegments(new THREE.EdgesGeometry(boxClone.geometry), new THREE.LineBasicMaterial({ color: 0x000000 })));
                    boxes.push(boxClone);
                    scene.add(boxClone);
                    wallId++;
                }
                if (ani) {
                    for (let i = 0; i < 50; i++) {
                        await sleep(1);
                        scene.getObjectByName(boxClone.name).position.y += 0.02;
                    }
                }
                scene.getObjectByName(boxClone.name).position.y = 0.45;
            } else { // removing a block
                let index = boxIndex(boxes, highlightMesh.position.x, highlightMesh.position.z);
                let boxToDelete = boxes[index];
                if (index != -1) {
                    boxes.splice(index, 1);
                    if (ani) {
                        for (let i = 0; i < 51; i++) {
                            await sleep(1);
                            scene.getObjectByName(boxToDelete.name).position.y -= 0.02;
                        }
                    }
                    scene.remove(boxToDelete);
                } else {
                    console.log("Tried to get a box that doesn't exist . . .");
                }
                if (startBoxPosition != null && isStart(highlightMesh.position.x, highlightMesh.position.z)) {
                    startBoxPosition = null;
                }
                if (endBoxPosition != null && isEnd(highlightMesh.position.x, highlightMesh.position.z)) {
                    endBoxPosition = null;
                }

            }
        }
    }
});

// Animate the highlight mesh
function animate(time) {
    highlightMesh.material.opacity = 1 + Math.sin(time / 120);
    objects.forEach(function (object) {
        object.rotation.x = time / 1;
        object.rotation.z = time / 1;
        object.position.y = 0.5 + 0.5 * Math.abs(Math.sin(time / 1000));
    });
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// Register window resizing
window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Keyboard controls
window.addEventListener('keypress', (event) => {
    let code = event.code;
    if (code == "Enter") {
        solve();
    } else if (code == "KeyR") {
        reset();
    } else if (code == "KeyC") {
        clearSolution();
    } else if (code == "KeyW") {
        if (ani) {
            if (startBoxPosition != null) {
                wave(startBoxPosition[0], startBoxPosition[1], "RAND");
            } else {
                flash("RED");
            }
        } else {
            flash("RED");
        }
    }
});

// Solve the maze
async function solve() {
    function getWalls() {
        let wallCords = [];
        for (let i = 0; i < boxes.length; i++) {
            if (boxes[i].name.substring(0, 4) == "WALL") {
                wallCords.push([boxes[i].position.x, boxes[i].position.z]);
            }
        }
        return wallCords;
    }

    function isWall(cord) {
        let cords = getWalls();
        for (let i = 0; i < cords.length; i++) {
            if (cord[0] == cords[i][0] && cord[1] == cords[i][1]) {
                return true;
            }
        }
        return false;
    }

    function isIn(cords, cord) {
        for (let i = 0; i < cords.length; i++) {
            if (cord[0] == cords[i][0] && cord[1] == cords[i][1]) {
                return true;
            }
        }
        return false;
    }

    function manhattan(c1, c2) {
        return Math.abs(c1[0] - c2[0]) + Math.abs(c1[1] - c1[1]);
    }

    function aStar() {
        const visited = [];
        const Q = new PriorityQueue();
        Q.enqueue([[startBoxPosition[0], startBoxPosition[1]], [], 0], 0);
        while (!Q.isEmpty()) {
            let tmp = Q.dequeue().element;
            let state = tmp[0];
            let actions = tmp[1];
            let cost = tmp[2];
            if (!isIn(visited, state) && !isWall(state)) {
                visited.push(state);
                if (state[0] == endBoxPosition[0] && state[1] == endBoxPosition[1]) {
                    return actions;
                } else {
                    let x = state[0];
                    let z = state[1];
                    let x1 = state[0] + 1;
                    let z1 = state[1] + 1;
                    let x2 = state[0] - 1;
                    let z2 = state[1] - 1;
                    if (x1 <= u && x1 >= l) {
                        heuristicCost = manhattan(endBoxPosition, [x1, z]);
                        let updatedActions = actions.concat([[x1, z]]);
                        Q.enqueue([[x1, z], updatedActions, cost + 1], cost + 1 + heuristicCost);
                    }
                    if (x2 <= u && x2 >= l) {
                        heuristicCost = manhattan(endBoxPosition, [x2, z]);
                        let updatedActions = actions.concat([[x2, z]]);
                        Q.enqueue([[x2, z], updatedActions, cost + 1], cost + 1 + heuristicCost);
                    }
                    if (z1 <= u && z1 >= l) {
                        heuristicCost = manhattan(endBoxPosition, [x, z1]);
                        let updatedActions = actions.concat([[x, z1]]);
                        Q.enqueue([[x, z1], updatedActions, cost + 1], cost + 1 + heuristicCost);
                    }
                    if (z2 <= u && z2 >= l) {
                        heuristicCost = manhattan(endBoxPosition, [x, z2]);
                        let updatedActions = actions.concat([[x, z2]]);
                        Q.enqueue([[x, z2], updatedActions, cost + 1], cost + 1 + heuristicCost);
                    }
                }
            }
        }
        return -1;
    }

    function getDirection(c1, c2) {
        let dx = c1[0] - c2[0];
        let dz = c1[1] - c2[1];
        if (dx == 1) {
            return "E";
        } else if (dx == -1) {
            return "W";
        } else if (dz == 1) {
            return "S";
        } else if (dz == -1) {
            return "N";
        }

    }

    // After solving, draw the path returned by astar
    if (startBoxPosition != null && endBoxPosition != null && !solutionDrawn) {
        paths = aStar();
        if (paths != -1) {
            let finder = finderBox.clone();
            finder.name = "FINDER";
            finder.position.y -= 0.55;
            finder.position.x = startBoxPosition[0];
            finder.position.z = startBoxPosition[1];
            finder.add(new THREE.LineSegments(new THREE.EdgesGeometry(finder.geometry), new THREE.LineBasicMaterial({ color: 0x000000 })));
            boxes.push(finder);
            scene.add(finder);
            await sleep(100);
            for (let j = 0; j < 26; j++) {
                scene.getObjectByName(finder.name).position.y += 0.04;
                await sleep(10);
            }
            await sleep(100);
            for (let i = -1; i < paths.length - 1; i++) {
                if (i == -1) {
                    await rotateCube(getDirection(startBoxPosition, paths[0]), finder);
                } else {
                    await rotateCube(getDirection(paths[i], paths[i + 1]), finder);
                    if (paintTrail) { // If enabled draw a paint trail
                        let solution = solutionBox.clone();
                        solution.name = "SOL" + ++solId;
                        console.log(paths[i])
                        solution.position.x = paths[i][0];
                        solution.position.z = paths[i][1];
                        solution.position.y -= 0.5;
                        solution.add(new THREE.LineSegments(new THREE.EdgesGeometry(solution.geometry), new THREE.LineBasicMaterial({ color: 0x000000 })));
                        boxes.push(solution);
                        scene.add(solution);
                        if (ani) {
                            for (let j = 0; j < 7; j++) {
                                scene.getObjectByName(solution.name).position.y += 0.15;
                                await sleep(1);
                            }
                            scene.getObjectByName(solution.name).position.y = 0.45;
                        }
                    }
                }
            }
            solutionDrawn = true;
            if (!ani) {
                flash("GREEN");
            }
        } else {
            flash("RED");
        }
    } else {
        flash("RED");
    }
}

// Function to clear board
async function reset() {
    if (ani) {
        async function recurse(i) {
            if (i != boxes.length) {
                recurse(i + 1);
                const name = boxes[i].name;
                for (let j = 0; j < 210; j++) {
                    scene.getObjectByName(name).position.y -= 0.0075;
                    await sleep(1);
                }
                scene.remove(scene.getObjectByName(name));
            }
        }

        await recurse(0);
    }
    for (let i = 0; i < boxes.length; i++) {
        scene.remove(scene.getObjectByName(boxes[i].name));
    }
    objects = [];
    boxes = [];
    paths = null;
    startBoxPosition = null;
    endBoxPosition = null;
    wallId = 0;
    solId = 0;
    solutionDrawn = false;
}

// Function to clear a solution-state if it is present
async function clearSolution() {
    console.log(paths);
    if (paths != null & paths != -1) {
        if (ani) {
            for (let i = 0; i < boxes.length; i++) {
                if (boxes[i].name.substring(0, 3) == "SOL") {
                    for (let j = 0; j < 13; j++) {
                        await sleep(1);
                        scene.getObjectByName(boxes[i].name).position.y -= 0.08;
                    }
                    scene.remove(scene.getObjectByName(boxes[i].name));
                }
            }
            boxes = boxes.filter(function (box) {
                return box.name.substring(0, 3) !== "SOL";
            });

            for (let i = 0; i < boxes.length; i++) {
                if (boxes[i].name == "FINDER") {
                    for (let j = 0; j < 13; j++) {
                        await sleep(1);
                        scene.getObjectByName(boxes[i].name).position.y -= 0.08;
                    }
                    scene.remove(scene.getObjectByName(boxes[i].name));
                    await sleep(1);
                }
            }
            boxes = boxes.filter(function (box) {
                return box.name !== "FINDER";
            });
            solutionDrawn = false;
            paths = null;
            wave(endBoxPosition[0], endBoxPosition[1], "G");
        } else {
            for (let i = 0; i < boxes.length; i++) {
                if (boxes[i].name.substring(0, 3) == "SOL") {
                    scene.remove(scene.getObjectByName(boxes[i].name));
                }
            }
            boxes = boxes.filter(function (box) {
                return box.name.substring(0, 3) !== "SOL"
            });

            solutionDrawn = false;
            paths = null;
        }
    } else {
        flash("RED");
    }
}

// Given a color (RED / GREEN), the board will flash this color
async function flash(color) {
    let grid_error = scene.getObjectByName("GRID");
    let plane_error = scene.getObjectByName("PLANE");
    if (color == "RED") {
        grid_error.material.color.setHex(0x000000);
        for (let j = 0; j < 4; j++) {
            for (let i = 1; i < 17; i++) {
                await sleep(1000 / 150);
                plane_error.material.color = new THREE.Color(`rgb(${0 + (i * 16) - 1}, 0, 0)`);
            }
            for (let i = 1; i < 17; i++) {
                await sleep(1000 / 150);
                plane_error.material.color = new THREE.Color(`rgb(${256 - i * 16}, 0, 0)`);
            }
        }
        grid_error.material.color.setHex(0xFFFFFF);
    } else if (color == "GREEN") {
        grid_error.material.color.setHex(0x000000);
        for (let j = 0; j < 4; j++) {
            for (let i = 1; i < 17; i++) {
                await sleep(1000 / 150);
                plane_error.material.color = new THREE.Color(`rgb(0, ${0 + (i * 16) - 1}, 0)`);
            }
            for (let i = 1; i < 17; i++) {
                await sleep(1000 / 150);
                plane_error.material.color = new THREE.Color(`rgb(0, ${256 - i * 16}, 0)`);
            }
        }
        grid_error.material.color.setHex(0xFFFFFF);
    }
}

// Will produce a wave visual given a x, z coordinate, type can be GREEN or RANDOM
async function wave(x, z, type) {
    let waveId = 0;
    let visited = [];
    function inVisited(vs, x, z) {
        for (let i = 0; i < vs.length; i++) {
            if (vs[i][0] == x && vs[i][1] == z) {
                return true;
            }
        }
        return false;
    }

    function getWalls() {
        let wallCords = [];
        for (let i = 0; i < boxes.length; i++) {
            if (boxes[i].name.substring(0, 4) == "WALL") {
                wallCords.push([boxes[i].position.x, boxes[i].position.z]);
            }
        }
        return wallCords;
    }

    function isWall(cord) {
        let cords = getWalls();
        for (let i = 0; i < cords.length; i++) {
            if (cord[0] == cords[i][0] && cord[1] == cords[i][1]) {
                return true;
            }
        }
        return false;
    }
    async function dfs(x, z, opacity) {
        if (x >= l && x <= u && z >= l && z <= u && opacity > 0 && !inVisited(visited, x, z) && !isWall([x, z])) {
            waveId++;
            const mesh = waveBox.clone();
            mesh.name = "WAVE" + waveId;
            mesh.position.x = x;
            mesh.position.y = -0.5;
            mesh.position.z = z
            mesh.material.opacity = opacity
            if (type == "G") {
                mesh.material.color.setHex(0x10FF10);
                scene.add(mesh);
            } else if (type == "RAND") {
                mesh.material.color = new THREE.Color(`rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)} ,${Math.floor(Math.random() * 256)})`);
                scene.add(mesh);
            }
            waveId++;
            visited.push([x, z]);
            for (let i = 0; i < 5; i++) {
                mesh.position.y += 0.30;
                await sleep(10);
            }
            dfs(x + 1, z, opacity - .03);
            dfs(x, z + 1, opacity - .03);
            dfs(x - 1, z, opacity - .03);
            dfs(x, z - 1, opacity - .03);
            for (let i = 0; i < 25; i++) {
                mesh.position.y -= 0.06;
                await sleep(10);
            }
            scene.remove(mesh);
        }
    }
    dfs(x, z, 1);
}

// Given a box, and a direction, the function will rotate the box about its edge to the next tile
// Will also update the boxes location. If a box already exists in the area, board will flash red
async function rotateCube(direction, box) {
    function inVisited(vs, x, z) {
        for (let i = 0; i < vs.length; i++) {
            if (vs[i][0] == x && vs[i][1] == z) {
                return true;
            }
        }
        return false;
    }

    function getWalls() {
        let wallCords = [];
        for (let i = 0; i < boxes.length; i++) {
            if (boxes[i].name.substring(0, 4) == "WALL") {
                wallCords.push([boxes[i].position.x, boxes[i].position.z]);
            }
        }
        return wallCords;
    }

    function isWall(cord) {
        let cords = getWalls();
        for (let i = 0; i < cords.length; i++) {
            if (cord[0] == cords[i][0] && cord[1] == cords[i][1]) {
                return true;
            }
        }
        return false;
    }
    if (direction == "N") {
        let z = scene.getObjectByName(box.name).position.z + 1;
        if (!isWall([scene.getObjectByName(box.name).position.x, z]) && z >= l && z <= u) {
            for (let i = 0; i < 51; i++) {
                scene.getObjectByName(box.name).rotateX(((90 * (Math.PI / 180)) / 51));
                scene.getObjectByName(box.name).position.z += (1 / 51);
                scene.getObjectByName(box.name).position.y = ((Math.sin(i * (Math.PI / 51))) / 2) + 0.45;
                await sleep(2 / (1 / ((Math.sin(i * (Math.PI / 51))) / 2) + 0.45));
                console.log((2 / (1 / ((Math.sin(i * (Math.PI / 51))) / 2) + 0.45)) * 1000);
            }
            scene.getObjectByName(box.name).position.z = Math.ceil(scene.getObjectByName(box.name).position.z) - 0.5;
            scene.getObjectByName(box.name).position.y = 0.45;
            scene.getObjectByName(box.name).rotation.set(0, 0, 0);
            //console.log(`X: ${scene.getObjectByName(box.name).position.x} Y: ${scene.getObjectByName(box.name).position.y} Z: ${scene.getObjectByName(box.name).position.z}`)
        } else {
            flash("RED");
        }
    }
    else if (direction == "E") {
        // Z + 1
        let x = scene.getObjectByName(box.name).position.x - 1;
        if (!isWall([x, scene.getObjectByName(box.name).position.z])) {
            for (let i = 0; i < 51; i++) {
                scene.getObjectByName(box.name).rotateZ((90 * (Math.PI / 180)) / 51);
                scene.getObjectByName(box.name).position.x -= (1 / 51);
                scene.getObjectByName(box.name).position.y = ((Math.sin(i * (Math.PI / 51))) / 2) + 0.45;
                await sleep(2 / (1 / ((Math.sin(i * (Math.PI / 51))) / 2) + 0.45));
                console.log((2 / (1 / ((Math.sin(i * (Math.PI / 51))) / 2) + 0.45)) * 1000);
            }
            scene.getObjectByName(box.name).position.x = Math.ceil(scene.getObjectByName(box.name).position.x) - 0.5;
            scene.getObjectByName(box.name).position.y = 0.45;
            scene.getObjectByName(box.name).rotation.set(0, 0, 0);
            //console.log(`X: ${scene.getObjectByName(box.name).position.x} Y: ${scene.getObjectByName(box.name).position.y} Z: ${scene.getObjectByName(box.name).position.z}`);
        } else {
            flash("RED");
        }
    }
    else if (direction == "S") {
        let z = scene.getObjectByName(box.name).position.z - 1;
        if (!isWall([scene.getObjectByName(box.name).position.x, z]) && z >= l && z <= u) {
            for (let i = 0; i < 51; i++) {
                scene.getObjectByName(box.name).rotateX(-(90 * (Math.PI / 180)) / 51);
                scene.getObjectByName(box.name).position.z -= (1 / 51);
                scene.getObjectByName(box.name).position.y = ((Math.sin(i * (Math.PI / 51))) / 2) + 0.45;
                await sleep(2 / (1 / ((Math.sin(i * (Math.PI / 51))) / 2) + 0.45));
                console.log((2 / (1 / ((Math.sin(i * (Math.PI / 51))) / 2) + 0.45)) * 1000);
            }
            scene.getObjectByName(box.name).position.z = Math.ceil(scene.getObjectByName(box.name).position.z) - 0.5;
            scene.getObjectByName(box.name).position.y = 0.45;
            scene.getObjectByName(box.name).rotation.set(0, 0, 0);
            //console.log(`X: ${scene.getObjectByName(box.name).position.x} Y: ${scene.getObjectByName(box.name).position.y} Z: ${scene.getObjectByName(box.name).position.z}`)
        } else {
            flash("RED");
        }
    }
    else if (direction == "W") {
        let x = scene.getObjectByName(box.name).position.x + 1;
        if (!isWall([x, scene.getObjectByName(box.name).position.z])) {
            for (let i = 0; i < 51; i++) {
                scene.getObjectByName(box.name).rotateZ(-(90 * (Math.PI / 180)) / 51);
                scene.getObjectByName(box.name).position.x += (1 / 51);
                scene.getObjectByName(box.name).position.y = ((Math.sin(i * (Math.PI / 51))) / 2) + 0.45;
                await sleep(2 / (1 / ((Math.sin(i * (Math.PI / 51))) / 2) + 0.45));
                console.log((2 / (1 / ((Math.sin(i * (Math.PI / 51))) / 2) + 0.45)) * 1000);
            }
            scene.getObjectByName(box.name).position.x = Math.ceil(scene.getObjectByName(box.name).position.x) - 0.5;
            scene.getObjectByName(box.name).position.y = 0.45;
            scene.getObjectByName(box.name).rotation.set(0, 0, 0);
            //console.log(`X: ${scene.getObjectByName(box.name).position.x} Y: ${scene.getObjectByName(box.name).position.y} Z: ${scene.getObjectByName(box.name).position.z}`);
        } else {
            flash("RED");
        }
    }
}
