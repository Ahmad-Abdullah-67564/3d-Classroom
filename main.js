import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

// Adding a scene
const scene = new THREE.Scene();

// Adding the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// Adding the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000)
camera.position.z = 5;
camera.position.y =3;
scene.add(camera)

// CSS3D Renderer
const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = 0;
cssRenderer.domElement.style.pointerEvents = 'none';  // Ensure it doesn't capture mouse events
document.body.appendChild(cssRenderer.domElement);

// Create an ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // soft white light, 50% intensity
scene.add(ambientLight);

// Create planes and CSS3DObjects
const planes = [];
const cameras = [];
const rows = 3;
const cols = 4;
const planeWidth = 5;
const planeHeight = 3;
const spacingX = 13;
const spacingZ = 15;
const initialOffsetX = -4;  // Slightly negative offset on the x-axis

const roomURL = 'https://3dclass.daily.co/3dclass'; // Replace with your actual room URL

for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(planeWidth, planeHeight),
            new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide })
        );
        plane.position.x = col * spacingX - ((cols - 1) * spacingX) / 2 + initialOffsetX;
        plane.position.z = row * spacingZ - ((rows - 1) * spacingZ) / 2;
        plane.rotation.x = -Math.PI / 4; // Rotate 45 degrees on the X axis
        scene.add(plane);

        const iframeSrc = `${roomURL}?user=${index}`; // Unique URL for each iframe

        const element = document.createElement('div');
        element.style.width = '500px';
        element.style.height = '300px';
        element.innerHTML = `<iframe src="${iframeSrc}" allow="camera; microphone; display-capture" style="width:100%; height: 100%; border: 0;"></iframe>`;

        const cssObject = new CSS3DObject(element);
        cssObject.scale.set(0.01, 0.01, 0.01); // Scale down the CSS object to match 3D scale
        cssObject.position.copy(plane.position);
        cssObject.rotation.copy(plane.rotation);
        scene.add(cssObject);

        planes.push({ plane, cssObject });

       
    }
}



// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 1;
controls.maxDistance = 100;
controls.maxPolarAngle = Math.PI / 2;

// Transform controls
const transformControl = new TransformControls(camera, renderer.domElement);
transformControl.addEventListener('change', () => {
    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
    planes.forEach(({ plane, cssObject }) => {
        cssObject.position.copy(plane.position);
        cssObject.rotation.copy(plane.rotation);
    });
});

transformControl.addEventListener('dragging-changed', event => {
    controls.enabled = !event.value;
});

scene.add(transformControl);



// GLTF Loader
const loader = new GLTFLoader();

loader.load(
    'Classroom3.glb', // e.g., 'models/yourModel.gltf'
    function (gltf) {
        const model = gltf.scene;
        model.rotation.y = 3 * (Math.PI / 2); // Rotate the model 270 degrees around the Y axis
        scene.add(model);

        // Optional: Call the animation function if your model contains animations
        animate();
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('An error happened', error);
    }
);

// Whiteboard plane
const wbPlane = new THREE.PlaneGeometry(29.5, 15);
const wbMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const whiteBoard = new THREE.Mesh(wbPlane, wbMaterial);
whiteBoard.position.z = -44;
whiteBoard.position.y = 8.5;
whiteBoard.position.x = -8;
scene.add(whiteBoard);

// Event listeners for drawing on the whiteboard
document.addEventListener('mousedown', onMouseDown, false);
document.addEventListener('mouseup', onMouseUp, false);
document.addEventListener('mousemove', onMouseMove, false);

let drawing = false, prevPos = null, points = [];

function onMouseDown(event) {
    if (event.button === 0 && event.ctrlKey) { // Only draw with Ctrl + left mouse button
        drawing = true;
        prevPos = getMousePosition(event);
        controls.enabled = false; // Disable orbit controls while drawing
    }
}

function onMouseUp(event) {
    if (event.button === 0 && drawing) { // Only stop drawing with left mouse button
        drawing = false;
        prevPos = null;
        if (points.length > 1) {
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x000000 }));
            scene.add(line);
        }
        points = [];
        controls.enabled = true; // Re-enable orbit controls after drawing
    }
}

function onMouseMove(event) {
    if (!drawing) return;

    const pos = getMousePosition(event);
    if (prevPos) {
        points.push(prevPos);
        points.push(pos);
        prevPos = pos;
    }
}

function getMousePosition(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(whiteBoard); // Use the whiteboard for drawing
    if (intersects.length > 0) {
        return intersects[0].point;
    }
    return null;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
}

animate();
