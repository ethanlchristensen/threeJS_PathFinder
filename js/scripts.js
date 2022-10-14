import { CloudSearch, ConnectContactLens, WorkMailMessageFlow } from "aws-sdk";
import * as THREE from "three";
import { GridHelper } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const sleep = ms => new Promise(r => setTimeout(r, ms));
// Priority Element
class QElement {
    constructor(element, priority) {
        this.element = element;
        this.priority = priority;
    }
}

// PriorityQueue class
class PriorityQueue {

    constructor() {
        this.items = [];
    }

    enqueue(element, priority) {
        // creating object from queue element
        var qElement = new QElement(element, priority);
        var contain = false;

        // iterating through the entire
        // item array to add element at the
        // correct location of the Queue
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].priority > qElement.priority) {
                // Once the correct location is found it is
                // enqueued
                this.items.splice(i, 0, qElement);
                contain = true;
                break;
            }
        }

        // if the element have the highest priority
        // it is added at the end of the queue
        if (!contain) {
            this.items.push(qElement);
        }
    }

    dequeue() {
        // return the dequeued element
        // and remove it.
        // if the queue is empty
        // returns Underflow
        if (this.isEmpty())
            return "Underflow";
        return this.items.shift();
    }

    isEmpty() {
        // return true if the queue is empty.
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
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        visible: false,
    })
);
planeMesh.rotateX(-Math.PI / 2);
scene.add(planeMesh);

const grid = new THREE.GridHelper(20, 20);
grid.name = "GRID";
grid.material.b
scene.add(grid);

const highlightMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true,
    })
);
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

const sphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 4, 2),
    new THREE.MeshBasicMaterial({
        wireframe: true,
        color: 0xffffff,
    })
);

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
    new THREE.MeshBasicMaterial({ color: 0xffffff })
);

const pathBox = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xff00ff })
);

const solutionBox = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x00FF00 })
);

let objects = [];
let boxes = [];
let walls = [];
let solutions = [];
let pathBlocks = [];
let startBoxPosition = null;
let endBoxPosition = null;
window.addEventListener("mousedown", async function () {
    function boxExists(bs, mesh_x, mesh_z) {
        if (bs.length == 0) {
            return false;
        }
        for (let i = 0; i < bs.length; i++) {
            if (bs[i].position.x == mesh_x && bs[i].position.z == mesh_z) {
                return true;
            }
        }
        return false;
    }

    function searchBox(bs, mesh_x, mesh_z) {
        for (let i = 0; i < bs.length; i++) {
            if (bs[i].position.x == mesh_x && bs[i].position.z == mesh_z) {
                return i;
            }
        }
        return -1;
    }

    function isStart(b) {
        return (b.position.x == startBoxPosition[0] && b.position.z == startBoxPosition[1]);
    }

    function isEnd(b) {
        return (b.position.x == endBoxPosition[0] && b.position.z == endBoxPosition[1]);
    }
    async function raise(

    ) {
        console.log("Yo");
        await sleep(1000);
    }

    if (intersects.length > 0) {
        if (!boxExists(boxes, highlightMesh.position.x, highlightMesh.position.z)) {
            let boxClone = null;
            if (startBoxPosition == null) {
                boxClone = startBox.clone();
                boxClone.position.copy(highlightMesh.position);
                boxClone.position.y -= 0.5;
                let geo = new THREE.EdgesGeometry(boxClone.geometry);
                let mat = new THREE.LineBasicMaterial({ color: 0x000000 });
                let wireframe = new THREE.LineSegments(geo, mat);
                boxClone.add(wireframe);
                boxClone.name = "START";
                scene.add(boxClone);
                boxes.push(boxClone);
                if (startBoxPosition == null) {
                    startBoxPosition = [boxClone.position.x, boxClone.position.z];
                    for (let p = 0; p < 100; p++) {
                        await sleep(1000 / 400);
                        scene.getObjectByName("START").position.y += 0.01;
                    }
                    /*for (let i = 0; i < 12; i ++) {
                        scene.getObjectByName("START").rotation.set(new THREE.Vector3( 0, 0, 0.2));
                        await sleep(1000 / 400);
                    }*/
                }
                highlightMesh.material.color.setHex(0xff0000);
            } else if (endBoxPosition == null) {
                boxClone = endBox.clone();
                boxClone.position.copy(highlightMesh.position);
                boxClone.position.y -= 0.5;
                let geo = new THREE.EdgesGeometry(boxClone.geometry);
                let mat = new THREE.LineBasicMaterial({ color: 0x000000 });
                let wireframe = new THREE.LineSegments(geo, mat);
                boxClone.add(wireframe);
                boxClone.name = "END";
                scene.add(boxClone);
                boxes.push(boxClone);
                if (endBoxPosition == null) {
                    endBoxPosition = [boxClone.position.x, boxClone.position.z];
                    for (let p = 0; p < 100; p++) {
                        await sleep(1000 / 300);
                        scene.getObjectByName("END").position.y += 0.01;
                    }
                }
                console.log(scene);
                highlightMesh.material.color.setHex(0xff0000);
            } else {
                boxClone = wallBox.clone();
                boxClone.position.copy(highlightMesh.position);
                boxClone.position.y -= 0.5;
                let geo = new THREE.EdgesGeometry(boxClone.geometry);
                let mat = new THREE.LineBasicMaterial({ color: 0x000000 });
                let wireframe = new THREE.LineSegments(geo, mat);
                boxClone.add(wireframe);
                boxClone.name = "WALL" + (walls.length + 1);
                scene.add(boxClone);
                boxes.push(boxClone);
                walls.push(boxClone);
                for (let p = 0; p < 100; p++) {
                    await sleep(1000 / 300);
                    scene.getObjectByName(("WALL" + (walls.length))).position.y += 0.01;
                }
                highlightMesh.material.color.setHex(0xff0000);
                console.log(walls);
            }
        } else {
            let index = searchBox(boxes, highlightMesh.position.x, highlightMesh.position.z);
            let index2 = searchBox(walls, highlightMesh.position.x, highlightMesh.position.z);
            let deleteBox = boxes[index];
            if (index != -1) {
                boxes.splice(index, 1);
                scene.remove(deleteBox);
            }
            if (index2 != -1)
                walls.splice(index2, 1);
            highlightMesh.material.color.setHex(0x808080);
            if (startBoxPosition != null && isStart(deleteBox)) {
                startBoxPosition = null;
            }
            if (endBoxPosition != null && isEnd(deleteBox)) {
                endBoxPosition = null;
            }
        }
    }
});

async function animate(time) {
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
    console.log(event.code);
    if (event.code == "Enter") {
        solve();
    } else if (event.code == "KeyR") {
        reset();
    }
}, false);

async function reset() {
    scene.remove(scene.getObjectByName("FINDER"));
    await sleep(1000 / 30);
    scene.remove(scene.getObjectByName("START"));
    await sleep(1000 / 30);
    scene.remove(scene.getObjectByName("END"));
    for(let i = 0; i < walls.length; i++) {
        await sleep(1000 / 30);
        scene.remove(scene.getObjectByName("WALL" + (i + 1)));
    } 
    for(let i = 0; i < pathBlocks.length; i++) {
        await sleep(1000 / 30);
        scene.remove(scene.getObjectByName("PATH" + (i + 1)));
    }
    for(let i = 0; i < solutions.length + 1; i++) {
        await sleep(1000 / 30);
        scene.remove(scene.getObjectByName("SOL" + (i + 1)));
    }
    startBoxPosition = null;
    endBoxPosition = null;
    walls = [];
    pathBlocks = [];
    solutions = [];
    objects = []
    boxes = [];
    console.log(scene);
}

async function solve() {

    function getWalls() {
        let wallCords = [];
        walls.forEach(box => {
            wallCords.push([box.position.x, box.position.z]);
        });
        return wallCords;
    }

    function isIn(coords, cord) {
        for (let i = 0; i < coords.length; i++) {
            if (coords[i][0] == cord[0] && coords[i][1] == cord[1]) {
                return true;
            }
        }
        return false;
    }

    function isWall(cord) {
        console.log(cord);
        wallCords = getWalls()
        for (let i = 0; i < wallCords.length; i++) {
            if (wallCords[i][0] == cord[0] && wallCords[i][1] == cord[1]) {
                return true;
            }
        }
        return false;
    }

    function manhattan(c1, c2) {
        return Math.abs(c1[0] - c2[0]) + Math.abs(c1[1] + c2[1]);
    }

    async function flash(color) {
        let grid_error = scene.getObjectByName("GRID");
        if (color == "RED") {
            for (let j = 0; j < 4; j++) {
                for (let i = 0; i < 16; i++) {
                    await sleep(1000 / 1500);
                    grid_error.material.color = new THREE.Color(`rgb(255, ${255 - i * 16}, ${255 - i * 16})`);
                }
                for (let i = 0; i < 16; i++) {
                    await sleep(1000 / 150);
                    grid_error.material.color = new THREE.Color(`rgb(255, ${0 + i * 16}, ${0 + i * 16})`);
                }
            }
        } else if (color == "GREEN") {
            for (let j = 0; j < 4; j++) {
                for (let i = 0; i < 16; i++) {
                    await sleep(1000 / 1500);
                    grid_error.material.color = new THREE.Color(`rgb(${255 - i * 16}, 255, ${255 - i * 16})`);
                }
                for (let i = 0; i < 16; i++) {
                    await sleep(1000 / 150);
                    grid_error.material.color = new THREE.Color(`rgb( ${0 + i * 16}, 255, ${0 + i * 16})`);
                }
            }
        }
    }

    function aStar() {
        const visited = [];
        const pQueue = new PriorityQueue();
        pQueue.enqueue([[startBoxPosition[0], startBoxPosition[1]], [], 0], 0);
        while (!pQueue.isEmpty()) {
            let tmp = pQueue.dequeue().element;
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
                    if (x1 <= 9.5 && x1 >= -9.5) {
                        heuristicCost = manhattan(endBoxPosition, [x1, z]);
                        let updatedActions = actions.concat([[x1, z]]);
                        pQueue.enqueue([[x1, z], updatedActions, cost + 1], cost + 1 + heuristicCost);
                    }
                    if (x2 <= 9.5 && x2 >= -9.5) {
                        heuristicCost = manhattan(endBoxPosition, [x2, z]);
                        let updatedActions = actions.concat([[x2, z]]);
                        pQueue.enqueue([[x2, z], updatedActions, cost + 1], cost + 1 + heuristicCost);
                    }
                    if (z1 <= 9.5 && z1 >= -9.5) {
                        heuristicCost = manhattan(endBoxPosition, [x, z1]);
                        let updatedActions = actions.concat([[x, z1]]);
                        pQueue.enqueue([[x, z1], updatedActions, cost + 1], cost + 1 + heuristicCost);
                    }
                    if (z2 <= 9.5 && z2 >= -9.5) {
                        heuristicCost = manhattan(endBoxPosition, [x, z2]);
                        let updatedActions = actions.concat([[x, z2]]);
                        pQueue.enqueue([[x, z2], updatedActions, cost + 1], cost + 1 + heuristicCost);
                    }
                }
            }
        }
        console.log("NO SOLUTION!");
        return -1;
    }
    if (startBoxPosition != null && endBoxPosition != null) {
        paths = aStar();
        console.log(paths);
        if (paths != -1) {
            let finderBlock = pathBox.clone();
            finderBlock.name = "FINDER";
            finderBlock.position.x = startBoxPosition[0];
            finderBlock.position.z = startBoxPosition[1];
            finderBlock.position.y += 0.5;
            let geo = new THREE.EdgesGeometry(finderBlock.geometry);
            let mat = new THREE.LineBasicMaterial({ color: 0x000000 });
            let wireframe = new THREE.LineSegments(geo, mat);
            finderBlock.add(wireframe);
            scene.add(finderBlock);
            for (let i = 0; i < paths.length; i++) {
                scene.getObjectByName("FINDER").position.setX(paths[i][0]);
                scene.getObjectByName("FINDER").position.setZ(paths[i][1]);             
                await sleep(125);
            }
            for (let i = paths.length - 1; i > -1; i--) {
                let solution = solutionBox.clone();
                solution.name = "SOL" + (paths.length - i + 1);
                solution.position.x = paths[i][0];
                solution.position.z = paths[i][1];
                solution.position.y += 0.5;
                let geo = new THREE.EdgesGeometry(solution.geometry);
                let mat = new THREE.LineBasicMaterial({ color: 0x000000 });
                let wireframe = new THREE.LineSegments(geo, mat);
                solution.add(wireframe);
                solutions.push(solution);
                boxes.push(solution);
                scene.add(solution);
                await sleep(125);
            }
            flash("GREEN");
        } else {
            flash("RED");
        }
    } else {
        flash("RED");
    }
}