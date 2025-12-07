import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { sceneState } from '../state.js';
import { SCENE, CAMERA, LIGHTING, EYE_HEIGHT } from '../constants.js';

export function initRenderer() {
    sceneState.scene = new THREE.Scene();
    sceneState.scene.background = new THREE.Color(SCENE.BACKGROUND_COLOR);
    sceneState.scene.fog = new THREE.Fog(SCENE.BACKGROUND_COLOR, SCENE.FOG_NEAR, SCENE.FOG_FAR);

    sceneState.camera = new THREE.PerspectiveCamera(
        CAMERA.FOV,
        window.innerWidth / window.innerHeight,
        CAMERA.NEAR,
        CAMERA.FAR
    );
    sceneState.camera.position.set(0, EYE_HEIGHT, 0);

    sceneState.renderer = new THREE.WebGLRenderer({ antialias: true });
    sceneState.renderer.setSize(window.innerWidth, window.innerHeight);
    sceneState.renderer.shadowMap.enabled = true;
    sceneState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sceneState.renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.getElementById('gameCanvas').appendChild(sceneState.renderer.domElement);

    sceneState.labelRenderer = new CSS2DRenderer();
    sceneState.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    sceneState.labelRenderer.domElement.style.position = 'absolute';
    sceneState.labelRenderer.domElement.style.top = '0px';
    sceneState.labelRenderer.domElement.style.pointerEvents = 'none';
    document.getElementById('gameCanvas').appendChild(sceneState.labelRenderer.domElement);

    initLighting();

    sceneState.scene.add(sceneState.camera);

    window.addEventListener('resize', onWindowResize);

    sceneState.clock = new THREE.Clock();
}

function initLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, LIGHTING.AMBIENT_INTENSITY);
    sceneState.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, LIGHTING.DIRECTIONAL_INTENSITY);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -LIGHTING.SHADOW_CAMERA_SIZE;
    directionalLight.shadow.camera.right = LIGHTING.SHADOW_CAMERA_SIZE;
    directionalLight.shadow.camera.top = LIGHTING.SHADOW_CAMERA_SIZE;
    directionalLight.shadow.camera.bottom = -LIGHTING.SHADOW_CAMERA_SIZE;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.mapSize.width = LIGHTING.SHADOW_MAP_SIZE;
    directionalLight.shadow.mapSize.height = LIGHTING.SHADOW_MAP_SIZE;
    sceneState.scene.add(directionalLight);
}

function onWindowResize() {
    sceneState.camera.aspect = window.innerWidth / window.innerHeight;
    sceneState.camera.updateProjectionMatrix();
    sceneState.renderer.setSize(window.innerWidth, window.innerHeight);
    sceneState.labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

export function render() {
    sceneState.renderer.render(sceneState.scene, sceneState.camera);
    sceneState.labelRenderer.render(sceneState.scene, sceneState.camera);
}

export function getDeltaTime() {
    return sceneState.clock.getDelta();
}
