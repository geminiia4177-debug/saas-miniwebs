"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ThreePresetId } from "@/lib/templates/contract";

interface ThreePresetCanvasProps {
  preset: ThreePresetId;
  primaryColor?: string;
  secondaryColor?: string;
  intensity?: number;
  className?: string;
}

/**
 * Checks if WebGL is supported and enabled by the browser.
 */
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/**
 * Encapsulated Three.js Canvas with 4 Curated Presets:
 * 1. Flow: Organic sinuous mesh waves
 * 2. Particles: Interactive constellation particle field
 * 3. Luxury: High-end geometric faceted torus lattice with golden reflections
 * 4. Organic: Smooth undulating ribbon curves
 * 
 * Guarantees zero technical exposure, seamless color sync,
 * prefers-reduced-motion support, memory cleanup, and automatic WebGL fallback.
 */
export default function ThreePresetCanvas({
  preset = "flow",
  primaryColor = "#3b82f6",
  secondaryColor = "#8b5cf6",
  intensity = 0.8,
  className = "",
}: ThreePresetCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check WebGL support
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
      return;
    }

    // 2. Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleMotionChange);

    const container = mountRef.current;
    if (!container) return;

    // 3. Three.js Scene Setup
    let animationFrameId: number;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 30;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch {
      setHasWebGL(false);
      return;
    }

    // Parse colors
    const colorA = new THREE.Color(primaryColor || "#3b82f6");
    const colorB = new THREE.Color(secondaryColor || "#8b5cf6");

    // Preset Objects
    const cleanupCallbacks: (() => void)[] = [];
    let updatePreset: (time: number, mouse: { x: number; y: number }) => void = () => {};

    // Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(colorA.getHex(), 2, 80);
    pointLight.position.set(10, 15, 20);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(colorB.getHex(), 1.5, 80);
    pointLight2.position.set(-15, -10, 15);
    scene.add(pointLight2);

    // Mouse parallax tracking
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const onMouseMove = (event: MouseEvent) => {
      mouse.targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      mouse.targetY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── PRESET 1: FLOW (Wave Plane) ──
    if (preset === "flow") {
      const geometry = new THREE.PlaneGeometry(60, 45, 48, 48);
      const positionAttribute = geometry.attributes.position;
      const initialPositions = positionAttribute.array.slice();

      const material = new THREE.MeshStandardMaterial({
        color: colorA,
        wireframe: true,
        roughness: 0.3,
        metalness: 0.8,
        transparent: true,
        opacity: 0.45 * intensity,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 3;
      mesh.position.y = -6;
      scene.add(mesh);

      cleanupCallbacks.push(() => {
        geometry.dispose();
        material.dispose();
        scene.remove(mesh);
      });

      updatePreset = (time) => {
        const positions = positionAttribute.array as Float32Array;
        const speed = reducedMotion ? 0.05 : 0.6;
        for (let i = 0; i < positions.length; i += 3) {
          const u = initialPositions[i];
          const v = initialPositions[i + 1];
          positions[i + 2] =
            Math.sin(u * 0.15 + time * speed) * 3 +
            Math.cos(v * 0.15 + time * speed * 0.8) * 3;
        }
        positionAttribute.needsUpdate = true;
        mesh.rotation.z = Math.sin(time * 0.1) * 0.05;
      };
    }

    // ── PRESET 2: PARTICLES (Constellation Field) ──
    else if (preset === "particles") {
      const particleCount = reducedMotion ? 200 : 450;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 70;
        positions[i3 + 1] = (Math.random() - 0.5) * 50;
        positions[i3 + 2] = (Math.random() - 0.5) * 40;

        const mixedColor = colorA.clone().lerp(colorB, Math.random());
        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      // Canvas circle texture for smooth glowing dots
      const canvasDot = document.createElement("canvas");
      canvasDot.width = 32;
      canvasDot.height = 32;
      const ctx = canvasDot.getContext("2d");
      if (ctx) {
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, "rgba(255,255,255,1)");
        grad.addColorStop(0.3, "rgba(255,255,255,0.8)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
      }
      const dotTexture = new THREE.CanvasTexture(canvasDot);

      const material = new THREE.PointsMaterial({
        size: 1.4 * intensity,
        vertexColors: true,
        map: dotTexture,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      cleanupCallbacks.push(() => {
        geometry.dispose();
        material.dispose();
        dotTexture.dispose();
        scene.remove(points);
      });

      updatePreset = (time) => {
        const speed = reducedMotion ? 0.02 : 0.15;
        points.rotation.y = time * speed * 0.5;
        points.rotation.x = Math.sin(time * speed * 0.3) * 0.1;
      };
    }

    // ── PRESET 3: LUXURY (Golden Geometric Torus Lattice) ──
    else if (preset === "luxury") {
      const geometry = new THREE.TorusGeometry(12, 4.5, 24, 48);
      const wireframeGeometry = new THREE.WireframeGeometry(geometry);

      const lineMaterial = new THREE.LineBasicMaterial({
        color: colorA,
        transparent: true,
        opacity: 0.55 * intensity,
      });

      const torusLines = new THREE.LineSegments(wireframeGeometry, lineMaterial);
      scene.add(torusLines);

      // Inner glowing core sphere
      const coreGeo = new THREE.IcosahedronGeometry(6, 2);
      const coreMat = new THREE.MeshStandardMaterial({
        color: colorB,
        roughness: 0.2,
        metalness: 0.9,
        wireframe: true,
        transparent: true,
        opacity: 0.35 * intensity,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      scene.add(coreMesh);

      cleanupCallbacks.push(() => {
        geometry.dispose();
        wireframeGeometry.dispose();
        lineMaterial.dispose();
        coreGeo.dispose();
        coreMat.dispose();
        scene.remove(torusLines);
        scene.remove(coreMesh);
      });

      updatePreset = (time) => {
        const speed = reducedMotion ? 0.03 : 0.25;
        torusLines.rotation.x = time * speed * 0.4;
        torusLines.rotation.y = time * speed * 0.6;
        coreMesh.rotation.x = -time * speed * 0.5;
        coreMesh.rotation.z = time * speed * 0.3;
      };
    }

    // ── PRESET 4: ORGANIC (Undulating Botanical Ribbon Curves) ──
    else {
      const geometry = new THREE.TorusKnotGeometry(10, 2.8, 100, 16, 2, 3);
      const material = new THREE.MeshStandardMaterial({
        color: colorA,
        roughness: 0.3,
        metalness: 0.7,
        wireframe: true,
        transparent: true,
        opacity: 0.5 * intensity,
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      cleanupCallbacks.push(() => {
        geometry.dispose();
        material.dispose();
        scene.remove(mesh);
      });

      updatePreset = (time) => {
        const speed = reducedMotion ? 0.02 : 0.2;
        mesh.rotation.x = time * speed;
        mesh.rotation.y = time * speed * 0.8;
        mesh.rotation.z = Math.sin(time * 0.3) * 0.2;
        mesh.scale.setScalar(1 + Math.sin(time * 0.5) * 0.08);
      };
    }

    // 4. Resize Handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 5. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      camera.position.x = mouse.x * 4;
      camera.position.y = -mouse.y * 3;
      camera.lookAt(0, 0, 0);

      updatePreset(elapsedTime, mouse);

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

    // 6. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize);
      mediaQuery.removeEventListener("change", handleMotionChange);
      resizeObserver.disconnect();

      cleanupCallbacks.forEach((fn) => fn());
      ambientLight.dispose();
      pointLight.dispose();
      pointLight2.dispose();

      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }, [preset, primaryColor, secondaryColor, intensity, reducedMotion]);

  // If WebGL is unavailable, render an ultra-rich CSS gradient fallback
  if (!hasWebGL) {
    return (
      <div
        className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${primaryColor}22 0%, transparent 60%),
                       radial-gradient(circle at 70% 70%, ${secondaryColor}22 0%, transparent 60%),
                       radial-gradient(circle at 50% 50%, #000000 0%, #080c14 100%)`,
        }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(${primaryColor} 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
      style={{ zIndex: 0 }}
    />
  );
}
