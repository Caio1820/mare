import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CustomBurger3DConfig } from '../types';

interface Burger3DViewerProps {
  config: CustomBurger3DConfig;
  explodedValue: number; // 0 (assembled) to 1 (fully separated)
  isRotating?: boolean;
}

export const Burger3DViewer: React.FC<Burger3DViewerProps> = ({
  config,
  explodedValue,
  isRotating = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const burgerGroupRef = useRef<THREE.Group | null>(null);
  const layersRef = useRef<{ [key: string]: THREE.Object3D }>({});
  const animationFrameRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [webglError, setWebglError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Target separation interpolation values
  const currentExplodeRef = useRef<number>(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let width = container.clientWidth || 400;
    let height = container.clientHeight || 400;

    // SCENE
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // CAMERA
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 5.2);
    camera.lookAt(0, 0, 0);

    // RENDERER
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: true,
      });
    } catch (e) {
      console.error('WebGL initialization error:', e);
      setWebglError(true);
      setIsLoading(false);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // LIGHTING RIG (Balanced 3-point warm/cool studio lighting)
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.8);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x1e293b, 1.2);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.4);
    keyLight.position.set(4, 7, 5);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.9);
    fillLight.position.set(-5, 2, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.8);
    rimLight.position.set(0, -3, -4);
    scene.add(rimLight);

    // Contact Ground Shadow Disk
    const shadowGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d');
    if (sctx) {
      const grad = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0,0,0,0.65)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.0;
    scene.add(shadowMesh);

    // BURGER ROOT GROUP
    const burgerGroup = new THREE.Group();
    scene.add(burgerGroup);
    burgerGroupRef.current = burgerGroup;

    setIsLoading(false);

    // TOUCH & MOUSE INTERACTION (360° Drag Rotation & Pinch/Wheel Zoom)
    const handlePointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !burgerGroupRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      burgerGroupRef.current.rotation.y += deltaX * 0.009;
      burgerGroupRef.current.rotation.x = Math.max(
        -0.6,
        Math.min(0.6, burgerGroupRef.current.rotation.x + deltaY * 0.007)
      );

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(3.2, Math.min(7.5, camera.position.z + e.deltaY * 0.003));
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    // RESIZE OBSERVER
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !rendererRef.current) return;
      const newWidth = container.clientWidth || 400;
      const newHeight = container.clientHeight || 400;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    });
    resizeObserver.observe(container);

    // ANIMATION TICK LOOP
    let lastTime = performance.now();
    const animate = (time: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Auto-rotation if enabled and user not dragging
      if (isRotating && !isDraggingRef.current && burgerGroupRef.current) {
        burgerGroupRef.current.rotation.y += 0.45 * delta;
      }

      // Smoothly damp current explode value toward target
      currentExplodeRef.current = THREE.MathUtils.damp(
        currentExplodeRef.current,
        explodedValue,
        8.0,
        delta
      );

      // Apply vertical offsets to layers based on currentExplodeRef
      updateLayersSeparation(currentExplodeRef.current);

      renderer.render(scene, camera);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      resizeObserver.disconnect();
      domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      domElement.removeEventListener('wheel', handleWheel);
      renderer.dispose();
    };
  }, []);

  // BUILD & RE-BUILD BURGER LAYERS BASED ON CONFIG
  useEffect(() => {
    const burgerGroup = burgerGroupRef.current;
    if (!burgerGroup) return;

    // Clear previous layer objects
    while (burgerGroup.children.length > 0) {
      const obj = burgerGroup.children[0];
      burgerGroup.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    }

    layersRef.current = {};

    // 1. COLORS BY BUN TYPE
    let bunColor = 0xd97706; // Brioche golden brown
    let bunRoughness = 0.45;
    if (config.bunType === 'australiano') {
      bunColor = 0x3d2010; // Dark Australian cocoa honey bread
      bunRoughness = 0.65;
    } else if (config.bunType === 'gergelim') {
      bunColor = 0xe08c24; // Warm golden with sesame
      bunRoughness = 0.4;
    }

    const bunMat = new THREE.MeshStandardMaterial({
      color: bunColor,
      roughness: bunRoughness,
      metalness: 0.05,
    });

    const bunInnerMat = new THREE.MeshStandardMaterial({
      color: config.bunType === 'australiano' ? 0x4a2c1a : 0xfde68a,
      roughness: 0.8,
      metalness: 0.0,
    });

    // LAYER 1: BOTTOM BUN (Pão Inferior)
    const bottomBunGroup = new THREE.Group();
    const bottomBunGeo = new THREE.CylinderGeometry(1.2, 1.15, 0.35, 32);
    const bottomBunMesh = new THREE.Mesh(bottomBunGeo, bunMat);
    bottomBunMesh.castShadow = true;
    bottomBunMesh.receiveShadow = true;
    bottomBunGroup.add(bottomBunMesh);
    bottomBunGroup.userData = { baseLevel: -0.7, explodeMultiplier: -1.2 };
    burgerGroup.add(bottomBunGroup);
    layersRef.current['bottom_bun'] = bottomBunGroup;

    // LAYER 2: BASE SAUCE (Molho Base)
    let sauceColor = 0xf59e0b; // Molho Maré
    if (config.sauce === 'maionese_verde') sauceColor = 0x65a30d;
    if (config.sauce === 'barbecue') sauceColor = 0x450a0a;
    if (config.sauce === 'tartaro') sauceColor = 0xfef08a;

    const sauceMat = new THREE.MeshStandardMaterial({
      color: sauceColor,
      roughness: 0.15,
      metalness: 0.1,
    });

    const baseSauceGroup = new THREE.Group();
    const baseSauceGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.06, 24);
    const baseSauceMesh = new THREE.Mesh(baseSauceGeo, sauceMat);
    baseSauceGroup.add(baseSauceMesh);
    baseSauceGroup.userData = { baseLevel: -0.48, explodeMultiplier: -0.8 };
    burgerGroup.add(baseSauceGroup);
    layersRef.current['base_sauce'] = baseSauceGroup;

    // LAYER 3: PATTIES & CHEESE (Carnes 160g e Queijo)
    const pattyMat = new THREE.MeshStandardMaterial({
      color: 0x381e11,
      roughness: 0.85,
      metalness: 0.05,
    });

    let cheeseColor = 0xf59e0b; // Cheddar cremoso
    if (config.cheeseType === 'queijo_prato') cheeseColor = 0xfde047;
    if (config.cheeseType === 'queijo_regional') cheeseColor = 0xfef9c3;

    const cheeseMat = new THREE.MeshStandardMaterial({
      color: cheeseColor,
      roughness: 0.25,
      metalness: 0.05,
    });

    const meatGroup = new THREE.Group();
    const count = config.pattiesCount;

    for (let i = 0; i < count; i++) {
      const yOffset = i * 0.32;

      // Burger Patty Mesh
      const pattyGeo = new THREE.CylinderGeometry(1.22, 1.22, 0.28, 32);
      const pattyMesh = new THREE.Mesh(pattyGeo, pattyMat);
      pattyMesh.position.y = yOffset;
      pattyMesh.castShadow = true;
      meatGroup.add(pattyMesh);

      // Melted Cheese Drapes over each patty
      const cheeseGeo = new THREE.BoxGeometry(1.5, 0.05, 1.5);
      const cheeseMesh = new THREE.Mesh(cheeseGeo, cheeseMat);
      cheeseMesh.position.y = yOffset + 0.16;
      cheeseMesh.rotation.y = 0.35 + i * 0.4;
      meatGroup.add(cheeseMesh);
    }

    meatGroup.userData = { baseLevel: -0.3, explodeMultiplier: -0.3 };
    burgerGroup.add(meatGroup);
    layersRef.current['meat'] = meatGroup;

    // LAYER 4: BACON CROCANTE (if enabled)
    if (config.selectedAddons.bacon) {
      const baconGroup = new THREE.Group();
      const baconMat = new THREE.MeshStandardMaterial({
        color: 0x712121,
        roughness: 0.3,
        metalness: 0.1,
      });

      for (let b = 0; b < 3; b++) {
        const stripGeo = new THREE.BoxGeometry(1.6, 0.06, 0.35);
        const stripMesh = new THREE.Mesh(stripGeo, baconMat);
        stripMesh.rotation.y = (b * Math.PI) / 3;
        stripMesh.position.y = b * 0.05;
        baconGroup.add(stripMesh);
      }

      baconGroup.userData = {
        baseLevel: -0.15 + (count - 1) * 0.3,
        explodeMultiplier: 0.2,
      };
      burgerGroup.add(baconGroup);
      layersRef.current['bacon'] = baconGroup;
    }

    // LAYER 5: CEBOLA CARAMELIZADA (if enabled)
    if (config.selectedAddons.cebola_caram) {
      const onionGroup = new THREE.Group();
      const onionMat = new THREE.MeshStandardMaterial({
        color: 0x78350f,
        roughness: 0.35,
        metalness: 0.1,
      });

      for (let o = 0; o < 4; o++) {
        const ringGeo = new THREE.TorusGeometry(0.35 + o * 0.15, 0.06, 12, 24);
        const ringMesh = new THREE.Mesh(ringGeo, onionMat);
        ringMesh.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.2;
        ringMesh.position.set((Math.random() - 0.5) * 0.4, o * 0.03, (Math.random() - 0.5) * 0.4);
        onionGroup.add(ringMesh);
      }

      onionGroup.userData = {
        baseLevel: 0.05 + (count - 1) * 0.3,
        explodeMultiplier: 0.5,
      };
      burgerGroup.add(onionGroup);
      layersRef.current['onion'] = onionGroup;
    }

    // LAYER 6: PICKLES ARTESANAL (if enabled)
    if (config.selectedAddons.picles) {
      const pickleGroup = new THREE.Group();
      const pickleMat = new THREE.MeshStandardMaterial({
        color: 0x4d7c0f,
        roughness: 0.4,
      });

      for (let p = 0; p < 4; p++) {
        const pGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.05, 16);
        const pMesh = new THREE.Mesh(pGeo, pickleMat);
        const angle = (p * Math.PI) / 2;
        pMesh.position.set(Math.cos(angle) * 0.55, 0, Math.sin(angle) * 0.55);
        pMesh.rotation.z = (Math.random() - 0.5) * 0.2;
        pickleGroup.add(pMesh);
      }

      pickleGroup.userData = {
        baseLevel: 0.2 + (count - 1) * 0.3,
        explodeMultiplier: 0.8,
      };
      burgerGroup.add(pickleGroup);
      layersRef.current['pickles'] = pickleGroup;
    }

    // LAYER 7: SALADA MARÉ (Alface & Tomate, if enabled)
    if (config.selectedAddons.salada_mare) {
      const saladGroup = new THREE.Group();

      // Frilled Lettuce Leaf
      const lettuceMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        roughness: 0.6,
      });
      const lettuceGeo = new THREE.CylinderGeometry(1.4, 1.3, 0.06, 24);
      const lettuceMesh = new THREE.Mesh(lettuceGeo, lettuceMat);
      saladGroup.add(lettuceMesh);

      // Tomato Slices
      const tomatoMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: 0.2,
      });
      for (let t = 0; t < 2; t++) {
        const tomatoGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.08, 20);
        const tomatoMesh = new THREE.Mesh(tomatoGeo, tomatoMat);
        tomatoMesh.position.set(t === 0 ? -0.38 : 0.38, 0.08, 0);
        saladGroup.add(tomatoMesh);
      }

      saladGroup.userData = {
        baseLevel: 0.35 + (count - 1) * 0.3,
        explodeMultiplier: 1.1,
      };
      burgerGroup.add(saladGroup);
      layersRef.current['salad'] = saladGroup;
    }

    // LAYER 8: TOP BUN (Pão Superior)
    const topBunGroup = new THREE.Group();

    // Dome bun geometry
    const topBunGeo = new THREE.SphereGeometry(1.24, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const topBunMesh = new THREE.Mesh(topBunGeo, bunMat);
    topBunMesh.scale.set(1.0, 0.62, 1.0);
    topBunMesh.castShadow = true;
    topBunGroup.add(topBunMesh);

    // Inner flat side
    const innerGeo = new THREE.CircleGeometry(1.24, 32);
    const innerMesh = new THREE.Mesh(innerGeo, bunInnerMat);
    innerMesh.rotation.x = Math.PI / 2;
    topBunGroup.add(innerMesh);

    // Sesame Seeds (Gergelim) if bunType === 'gergelim' or standard
    if (config.bunType === 'gergelim') {
      const seedMat = new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        roughness: 0.4,
      });
      const seedGeo = new THREE.ConeGeometry(0.025, 0.06, 8);

      for (let s = 0; s < 48; s++) {
        const phi = Math.random() * Math.PI * 0.35;
        const theta = Math.random() * Math.PI * 2;
        const radius = 1.25;

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi) * 0.62;
        const z = radius * Math.sin(phi) * Math.sin(theta);

        const seed = new THREE.Mesh(seedGeo, seedMat);
        seed.position.set(x, y, z);
        seed.lookAt(0, y, 0);
        topBunGroup.add(seed);
      }
    }

    topBunGroup.userData = {
      baseLevel: 0.5 + (count - 1) * 0.3 + (config.selectedAddons.salada_mare ? 0.2 : 0),
      explodeMultiplier: 1.6,
    };
    burgerGroup.add(topBunGroup);
    layersRef.current['top_bun'] = topBunGroup;

    // Center the whole burger vertically
    const totalHeight = topBunGroup.userData.baseLevel + 0.6;
    burgerGroup.position.y = -totalHeight * 0.4;
  }, [config]);

  // UPDATE LAYER SEPARATION POSITIONS
  const updateLayersSeparation = (sepFactor: number) => {
    Object.values(layersRef.current).forEach((layer) => {
      const base = layer.userData.baseLevel || 0;
      const mult = layer.userData.explodeMultiplier || 0;
      layer.position.y = base + mult * sepFactor * 1.6;
    });
  };

  return (
    <div className="relative w-full h-full min-h-[320px] select-none flex items-center justify-center">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Skeleton Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-amber-400 tracking-wider uppercase font-mono">
            Carregando Montador 3D...
          </span>
        </div>
      )}

      {/* WebGL Fallback Notification if unavailable */}
      {webglError && (
        <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <span className="text-4xl mb-2">🍔</span>
          <h4 className="font-display text-lg font-bold text-zinc-100 uppercase">
            Visualizador 3D em Modo Compatibilidade
          </h4>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
            Seu dispositivo está processando os ingredientes em modo leve. As opções selecionadas
            serão salvas perfeitamente.
          </p>
        </div>
      )}

      {/* 360° Drag Hint Overlay */}
      <div className="absolute top-3 right-3 pointer-events-none bg-zinc-950/80 border border-zinc-800 px-2.5 py-1 rounded-full text-[10px] text-zinc-400 font-semibold flex items-center gap-1.5 shadow-md">
        <span>🔄</span>
        <span>Arraste para girar 360°</span>
      </div>
    </div>
  );
};
