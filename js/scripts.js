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
                boxClone.position.y += 0.5;
                boxClone.name = "START";
                boxClone.add(new THREE.LineSegments(new THREE.EdgesGeometry(boxClone.geometry), new THREE.LineBasicMaterial({ color: 0x000000 })));
                boxes.push(boxClone);
                scene.add(boxClone);
                startBoxPosition = [boxClone.position.x, boxClone.position.z];
            } else if (endBoxPosition == null) { // must add endBox
                boxClone = endBox.clone()
                boxClone.position.copy(highlightMesh.position);
                boxClone.position.y += 0.5;
                boxClone.name = "END";
                boxClone.add(new THREE.LineSegments(new THREE.EdgesGeometry(boxClone.geometry), new THREE.LineBasicMaterial({ color: 0x000000 })));
                boxes.push(boxClone);
                scene.add(boxClone);
                endBoxPosition = [boxClone.position.x, boxClone.position.z];
            } else { // free to add wallBox
                boxClone = wallBox.clone()
                boxClone.position.copy(highlightMesh.position);
                boxClone.position.y += 0.5;
                boxClone.name = "WALL" + wallId;
                boxClone.add(new THREE.LineSegments(new THREE.EdgesGeometry(boxClone.geometry), new THREE.LineBasicMaterial({ color: 0x000000 })));
                boxes.push(boxClone);
                scene.add(boxClone);
                wallId++;
            }
        } else {
            let index = boxIndex(boxes, highlightMesh.position.x, highlightMesh.position.z);
            let boxToDelete = boxes[index];
            if (index != -1) {
                boxes.splice(index, 1);
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
    }
});

async function solve() {
    function getWalls() {
        let wallCords = [];
        for (let i = 0; i < boxes.length; i++) {
            if (boxes[i].name.substring(0,4) == "WALL") {
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
                    if (x1 <= 9.5 && x1 >= -9.5) {
                        heuristicCost = manhattan(endBoxPosition, [x1, z]);
                        let updatedActions = actions.concat([[x1, z]]);
                        Q.enqueue([[x1, z], updatedActions, cost + 1], cost + 1 + heuristicCost);
                    }
                    if (x2 <= 9.5 && x2 >= -9.5) {
                        heuristicCost = manhattan(endBoxPosition, [x2, z]);
                        let updatedActions = actions.concat([[x2, z]]);
                        Q.enqueue([[x2, z], updatedActions, cost + 1], cost + 1 + heuristicCost);
                    }
                    if (z1 <= 9.5 && z1 >= -9.5) {
                        heuristicCost = manhattan(endBoxPosition, [x, z1]);
                        let updatedActions = actions.concat([[x, z1]]);
                        Q.enqueue([[x, z1], updatedActions, cost + 1], cost + 1 + heuristicCost);
                    }
                    if (z2 <= 9.5 && z2 >= -9.5) {
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
            let finder = finderBox.clone();
            finder.name = "FINDER";
            finder.position.y += 0.5;
            finder.add(new THREE.LineSegments(new THREE.EdgesGeometry(finder.geometry), new THREE.LineBasicMaterial({ color: 0x000000 })));
            boxes.push(finder);
            scene.add(finder);
            for (let i = 0; i < paths.length; i++) {
                scene.getObjectByName("FINDER").position.setX(paths[i][0]);
                scene.getObjectByName("FINDER").position.setZ(paths[i][1]);
                await sleep(125);
            }
            for (let i = paths.length - 1; i > -1; i--) {
                let solution = solutionBox.clone();
                solution.name = "SOL" + ++solId;
                console.log(paths[i])
                solution.position.x = paths[i][0];
                solution.position.z = paths[i][1];
                solution.position.y += 0.5;
                solution.add(new THREE.LineSegments(new THREE.EdgesGeometry(solution.geometry), new THREE.LineBasicMaterial({ color: 0x000000 })));
                boxes.push(solution);
                scene.add(solution);
                await sleep(125);
            }
            solutionDrawn = true;
            flash("GREEN");
        } else {
            flash("RED");
        }
    } else {
        flash("RED");
    }
}

async function reset() {
    for (let i = 0; i < boxes.length; i++) {
        scene.remove(boxes[i]);
        await sleep(125);
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
                scene.remove(scene.getObjectByName(boxes[i].name));
            } else if (boxes[i].name.substring(0, 3) == "SOL") {
                scene.remove(scene.getObjectByName(boxes[i].name));
            }
        }
        boxes = boxes.filter(function(box) {
            return box.name.substring(0, 3) !== "SOL";
        });
        boxes = boxes.filter(function(box) {
            return box.name !== "FINDER";
        });
        solutionDrawn = false;
    } else {
        flash("RED");
    }
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
