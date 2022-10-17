import { CloudSearch, ConnectContactLens, WorkMailMessageFlow } from "aws-sdk";
import * as THREE from "three";
import { GridHelper } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const sleep = ms => new Promise(r => setTimeout(r, ms));
let N = 20;
let l = -(N / 2) + 0.5;
let u = N / 2 - 0.5
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

const planeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(N, N),
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        visible: true,
        color: 0x000000
    })
);
planeMesh.rotateX(-Math.PI / 2);
planeMesh.position.y -= 0.05;
planeMesh.name = "PLANE";
scene.add(planeMesh);


const grid = new THREE.GridHelper(N, N);
grid.name = "GRID";
grid.position.y += 0.05;
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
        highlightMesh.position.set(highlightPos.x, 0, highlightPos.z);

        const objectExist = objects.find(function (object) {
            return (
                object.position.x === highlightMesh.position.x &&
                object.position.z === highlightMesh.position.z
            );
        });

        if (!objectExist) highlightMesh.material.color.setHex(0x808080);
        else highlightMesh.material.color.setHex(0xff0000);
    }
});

const startBox = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x00FF00 })
);
const endBox = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xFF0000 })
);
const wallBox = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
);

const finderBox = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xFF00FF })
);

const solutionBox = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x00FF00 })
);


let objects = [];
let boxes = [];
let paths = null;
let startBoxPosition = null;
let endBoxPosition = null;
let wallId = 0;
let solId = 0;
let solutionDrawn = false;
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
            for (let i = 0; i < 50; i++) {
                await sleep(1);
                scene.getObjectByName(boxClone.name).position.y += 0.02;
            }
        } else {
            let index = boxIndex(boxes, highlightMesh.position.x, highlightMesh.position.z);
            let boxToDelete = boxes[index];
            if (index != -1) {
                boxes.splice(index, 1);
                for (let i = 0; i < 51; i++) {
                    await sleep(1);
                    scene.getObjectByName(boxToDelete.name).position.y -= 0.02;
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
});


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

window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keypress', (event) => {
    let code = event.code;
    if (code == "Enter") {
        solve();
    } else if (code == "KeyR") {
        reset();
    } else if (code == "KeyC") {
        clearSolution();
    } else if (code == "KeyW") {
        if (startBoxPosition != null) {
            wave(startBoxPosition[0], startBoxPosition[1], "RAND");
        } else {
            flash("RED");
        }
    }
});

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
    if (startBoxPosition != null && endBoxPosition != null && !solutionDrawn) {
        paths = aStar();
        if (paths != -1) {
            /*let finder = finderBox.clone();
            finder.name = "FINDER";
            finder.position.y += 0.5;
            finder.add(new THREE.LineSegments(new THREE.EdgesGeometry(finder.geometry), new THREE.LineBasicMaterial({ color: 0x000000 })));
            boxes.push(finder);
            scene.add(finder);
            for (let i = 0; i < paths.length; i++) {
                scene.getObjectByName("FINDER").position.setX(paths[i][0]);
                scene.getObjectByName("FINDER").position.setZ(paths[i][1]);
                if (i == 0) {
                    scene.getObjectByName("FINDER").position.y = -0.5;
                    for (let j = 0; j < 25; j++) {
                        await sleep(1000 / 600);
                        scene.getObjectByName("FINDER").position.y += 0.04;
                    }
                }
                await sleep(125);
            }*/
            for (let i = 0; i < paths.length; i++) {
                let solution = solutionBox.clone();
                solution.name = "SOL" + ++solId;
                console.log(paths[i])
                solution.position.x = paths[i][0];
                solution.position.z = paths[i][1];
                solution.position.y -= 0.5;
                solution.add(new THREE.LineSegments(new THREE.EdgesGeometry(solution.geometry), new THREE.LineBasicMaterial({ color: 0x000000 })));
                boxes.push(solution);
                scene.add(solution);
                for (let j = 0; j < 13; j++) {
                    scene.getObjectByName(solution.name).position.y += 0.08;
                    await sleep(1);
                }
                solution.position.y = 0.5;
            }
            solutionDrawn = true;
            //flash("GREEN");
        } else {
            flash("RED");
        }
    } else {
        flash("RED");
    }
}

async function reset() {
    for (let i = 0; i < boxes.length; i++) {
        for (let j = 0; j < 50; j++) {
            await sleep(1);
            scene.getObjectByName(boxes[i].name).position.y -= 0.02;
        }
        scene.remove(boxes[i]);
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

async function clearSolution() {
    if (paths != null) {
        let finderIndex = -1;
        let solutionIndicies = [];
        for (let i = 0; i < boxes.length; i++) {
            if (boxes[i].name == "FINDER") {
                for (let j = 0; j < 26; j++) {
                    await sleep(1);
                    scene.getObjectByName(boxes[i].name).position.y -= 0.04;
                }
                scene.remove(scene.getObjectByName(boxes[i].name));
                await sleep(1);
            } else if (boxes[i].name.substring(0, 3) == "SOL") {
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
        boxes = boxes.filter(function (box) {
            return box.name !== "FINDER";
        });
        solutionDrawn = false;
        paths = null;
        wave(endBoxPosition[0], endBoxPosition[1], "G");
    } else {
        flash("RED");
    }
}

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
            const mesh = Mesh.clone();
            mesh.name = "WAVE" + waveId;
            mesh.position.x = x;
            mesh.position.y = -0.2;
            mesh.position.z = z
            mesh.material.opacity = opacity;
            scene.add(mesh);
            if (type == "G") {
                mesh.material.color.setHex(0x10FF10);
            } else if (type == "RAND") {
                scene.getObjectByName("WAVE" + waveId).material.color = new THREE.Color(`rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)} ,${Math.floor(Math.random() * 256)})`);
            }
            visited.push([x, z]);
            for (let i = 0; i < 14; i++) {
                mesh.position.y += 0.07;
                await sleep(1);
            }
            

            dfs(x + 1, z, opacity - 0.04);
            dfs(x, z + 1, opacity - 0.04);
            dfs(x - 1, z, opacity - 0.04);
            dfs(x, z - 1, opacity - 0.04);
            for (let i = 0; i < 57; i++) {
                mesh.position.y -= 0.0175;
                await sleep(3.75);
            }
            scene.remove(mesh);
            waveId++;
        }
    }
    dfs(x, z, 1);
}
