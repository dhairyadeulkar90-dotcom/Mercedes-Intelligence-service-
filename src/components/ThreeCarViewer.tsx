import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CarModel, CarColor, WheelOption } from './types';
import { RotateCw, Sun, Lightbulb, Play, Pause, Compass, ZoomIn, ZoomOut } from 'lucide-react';

interface ThreeCarViewerProps {
  selectedCar: CarModel;
  selectedColor: CarColor;
  selectedWheel: WheelOption;
  headlightsOn: boolean;
  underglowOn: boolean;
  doorsOpen: boolean;
  underglowColor: string;
}

export default function ThreeCarViewer({
  selectedCar,
  selectedColor,
  selectedWheel,
  headlightsOn,
  underglowOn,
  doorsOpen,
  underglowColor = '#00a6ff',
}: ThreeCarViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Controls & state
  const [autoRotate, setAutoRotate] = useState(true);
  const [cameraView, setCameraView] = useState<'side' | 'front' | 'rear' | 'overhead' | 'isometric'>('isometric');
  const [isDragging, setIsDragging] = useState(false);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  
  // Interactive mechanical parts references for animation
  const leftDoorRef = useRef<THREE.Object3D | null>(null);
  const rightDoorRef = useRef<THREE.Object3D | null>(null);
  const activeSpoilerRef = useRef<THREE.Object3D | null>(null);
  const frontWheelsGroupRef = useRef<THREE.Group[]>([]);
  const rearWheelsGroupRef = useRef<THREE.Group[]>([]);
  const headlightsRef = useRef<THREE.SpotLight[]>([]);
  const underglowLightsRef = useRef<THREE.PointLight[]>([]);
  const rearLightsMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const bodyPaintMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const wheelMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  // Camera settings
  const targetRotation = useRef({ x: -0.2, y: 0.6 });
  const currentRotation = useRef({ x: -0.2, y: 0.6 });
  const targetZoom = useRef(7.5);
  const currentZoom = useRef(7.5);
  const pointerStart = useRef({ x: 0, y: 0 });
  const rotationStart = useRef({ x: 0, y: 0 });

  // Handle preset camera views
  const applyPresetView = (view: typeof cameraView) => {
    setCameraView(view);
    setAutoRotate(false);
    switch (view) {
      case 'side':
        targetRotation.current = { x: 0, y: Math.PI / 2 };
        targetZoom.current = 7.0;
        break;
      case 'front':
        targetRotation.current = { x: -0.05, y: 0 };
        targetZoom.current = 6.8;
        break;
      case 'rear':
        targetRotation.current = { x: -0.1, y: Math.PI };
        targetZoom.current = 6.8;
        break;
      case 'overhead':
        targetRotation.current = { x: -Math.PI / 2, y: Math.PI / 2 };
        targetZoom.current = 8.5;
        break;
      case 'isometric':
      default:
        targetRotation.current = { x: -0.21, y: 0.6 };
        targetZoom.current = 7.5;
        break;
    }
  };

  // Adjust zoom controls
  const adjustZoom = (amount: number) => {
    targetZoom.current = Math.max(4.5, Math.min(11.0, targetZoom.current + amount));
  };

  // Create customized car 3D model depending on type (sports, electric, SUV)
  const buildCarModel = (type: CarverType, colorHex: string, metallic: boolean, roughness: number, metalness: number, wheelId: string) => {
    const carGroup = new THREE.Group();
    bodyPaintMaterialsRef.current = [];
    wheelMaterialsRef.current = [];
    frontWheelsGroupRef.current = [];
    rearWheelsGroupRef.current = [];
    headlightsRef.current = [];
    underglowLightsRef.current = [];

    // Metallic paint material configuration
    const paintMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(colorHex),
      roughness: roughness,
      metalness: metalness,
      clearcoat: metallic ? 1.0 : 0.2,
      clearcoatRoughness: 0.1,
    });
    bodyPaintMaterialsRef.current.push(paintMaterial);

    const blackChromeMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.15,
      metalness: 0.95,
    });

    const glossyAlloyMaterial = new THREE.MeshStandardMaterial({
      color: wheelId.includes('black') ? 0x222222 : 0xcccccc,
      roughness: 0.2,
      metalness: 0.9,
    });
    wheelMaterialsRef.current.push(glossyAlloyMaterial);

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x07090b,
      roughness: 0.05,
      metalness: 0.95,
      transparent: true,
      opacity: 0.75,
    });

    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.6,
      metalness: 0.1,
    });

    const taillightMaterial = new THREE.MeshStandardMaterial({
      color: 0xdd1111,
      emissive: 0x330000,
      roughness: 0.2,
    });
    rearLightsMatRef.current = taillightMaterial;

    const headlightGlassMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: headlightsOn ? 0xffffff : 0x222222,
      roughness: 0.1,
      metalness: 0.9,
    });

    // Main Chassis Group
    const bodyGroup = new THREE.Group();
    carGroup.add(bodyGroup);

    if (type === 'sports') {
      // Sleek low-slung coupe model (e.g. AMG GT)
      
      // Main lower chassis
      const chassisGeo = new THREE.BoxGeometry(4.4, 0.4, 1.8);
      const chassis = new THREE.Mesh(chassisGeo, trimMaterial);
      chassis.position.y = 0.2;
      bodyGroup.add(chassis);

      // Main hood/engine bay
      const hoodGeo = new THREE.BoxGeometry(1.8, 0.45, 1.76);
      const hood = new THREE.Mesh(hoodGeo, paintMaterial);
      hood.position.set(1.1, 0.52, 0);
      bodyGroup.add(hood);

      // Aero Front bumper splitter
      const frontSketchupGeo = new THREE.BoxGeometry(0.4, 0.35, 1.76);
      const splitter = new THREE.Mesh(frontSketchupGeo, blackChromeMaterial);
      splitter.position.set(2.1, 0.25, 0);
      bodyGroup.add(splitter);

      // Cabin Group (to support opening doors on hinge points)
      const leftDoorHinge = new THREE.Group();
      leftDoorHinge.position.set(-0.2, 0.4, 0.9); // Hinge location on left side
      bodyGroup.add(leftDoorHinge);
      leftDoorRef.current = leftDoorHinge;

      const leftDoorMeshGeo = new THREE.BoxGeometry(1.2, 0.5, 0.08);
      const leftDoor = new THREE.Mesh(leftDoorMeshGeo, paintMaterial);
      leftDoor.position.set(-0.5, 0.2, 0); // Offset so hinge rotates correctly
      leftDoorHinge.add(leftDoor);

      // Side glass for left door
      const leftWindowGeo = new THREE.BoxGeometry(0.9, 0.35, 0.05);
      const leftWindow = new THREE.Mesh(leftWindowGeo, glassMaterial);
      leftWindow.position.set(-0.5, 0.6, 0);
      leftDoorHinge.add(leftWindow);

      const rightDoorHinge = new THREE.Group();
      rightDoorHinge.position.set(-0.2, 0.4, -0.9); // Hinge location on right
      bodyGroup.add(rightDoorHinge);
      rightDoorRef.current = rightDoorHinge;

      const rightDoorMeshGeo = new THREE.BoxGeometry(1.2, 0.5, 0.08);
      const rightDoor = new THREE.Mesh(rightDoorMeshGeo, paintMaterial);
      rightDoor.position.set(-0.5, 0.2, 0);
      rightDoorHinge.add(rightDoor);

      // Side glass for right door
      const rightWindowGeo = new THREE.BoxGeometry(0.9, 0.35, 0.05);
      const rightWindow = new THREE.Mesh(rightWindowGeo, glassMaterial);
      rightWindow.position.set(-0.5, 0.6, 0);
      rightDoorHinge.add(rightWindow);

      // Fixed Cabin central shell
      const cabinGeo = new THREE.BoxGeometry(1.5, 0.5, 1.6);
      const cabin = new THREE.Mesh(cabinGeo, paintMaterial);
      cabin.position.set(-0.5, 0.65, 0);
      bodyGroup.add(cabin);

      // Front windshield curved
      const windshieldGeo = new THREE.BoxGeometry(0.8, 0.6, 1.65);
      const windshield = new THREE.Mesh(windshieldGeo, glassMaterial);
      windshield.position.set(0.4, 0.8, 0);
      windshield.rotation.z = -0.6;
      bodyGroup.add(windshield);

      // Rear glass fastback
      const rearGlassGeo = new THREE.BoxGeometry(1.1, 0.45, 1.5);
      const rearGlass = new THREE.Mesh(rearGlassGeo, glassMaterial);
      rearGlass.position.set(-1.3, 0.7, 0);
      rearGlass.rotation.z = 0.55;
      bodyGroup.add(rearGlass);

      // Rear trunk & tail
      const trunkGeo = new THREE.BoxGeometry(0.9, 0.5, 1.76);
      const trunk = new THREE.Mesh(trunkGeo, paintMaterial);
      trunk.position.set(-1.6, 0.45, 0);
      bodyGroup.add(trunk);

      // High Performance Active Spoiler wing
      const spoilerPivot = new THREE.Group();
      spoilerPivot.position.set(-1.9, 0.72, 0);
      bodyGroup.add(spoilerPivot);
      activeSpoilerRef.current = spoilerPivot;

      const wingGeo = new THREE.BoxGeometry(0.25, 0.04, 1.55);
      const wing = new THREE.Mesh(wingGeo, blackChromeMaterial);
      wing.position.set(-0.1, 0, 0);
      spoilerPivot.add(wing);

      // Quad AMG exhaust pipes
      for (const side of [-1, 1]) {
        const pipeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8);
        const pipe = new THREE.Mesh(pipeGeo, glossyAlloyMaterial);
        pipe.rotation.x = Math.PI / 2;
        pipe.position.set(-2.25, 0.15, side * 0.5);
        bodyGroup.add(pipe);
      }

    } else if (type === 'electric') {
      // Aerodynamic "one-bow" luxury sedan (e.g. EQS)
      
      // Aerodynamic lower hull
      const hullGeo = new THREE.BoxGeometry(4.5, 0.42, 1.84);
      const hull = new THREE.Mesh(hullGeo, paintMaterial);
      hull.position.y = 0.24;
      bodyGroup.add(hull);

      // Smooth front bumper panel / Black panel grille
      const panelGeo = new THREE.BoxGeometry(0.25, 0.55, 1.7);
      const glossBlackGrille = new THREE.Mesh(panelGeo, blackChromeMaterial);
      glossBlackGrille.position.set(2.15, 0.35, 0);
      bodyGroup.add(glossBlackGrille);

      // Tiny electric EQ stars pattern representation (glowing accents on grille)
      const starGeo = new THREE.BoxGeometry(0.02, 0.05, 0.02);
      const starMat = new THREE.MeshStandardMaterial({
        color: 0x00dfff,
        emissive: 0x0055ff,
        visible: headlightsOn
      });
      for (let i = 0; i < 4; i++) {
        for (let j = -2; j <= 2; j++) {
          if (j === 0) continue;
          const star = new THREE.Mesh(starGeo, starMat);
          star.position.set(2.28, 0.35 + (i * 0.08) - 0.12, j * 0.3);
          bodyGroup.add(star);
        }
      }

      // Continuous fluid luxury cabin dome
      const domeGeo = new THREE.BoxGeometry(2.4, 0.72, 1.6);
      const dome = new THREE.Mesh(domeGeo, paintMaterial);
      dome.position.set(-0.2, 0.75, 0);
      bodyGroup.add(dome);

      // Glass panoramic windshield
      const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.65, 1.55), glassMaterial);
      frontGlass.position.set(0.75, 0.8, 0);
      frontGlass.rotation.z = -0.52;
      bodyGroup.add(frontGlass);

      // Glass aerodynamic rear screen
      const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.65, 1.55), glassMaterial);
      rearGlass.position.set(-1.15, 0.78, 0);
      rearGlass.rotation.z = 0.5;
      bodyGroup.add(rearGlass);

      // Left Door panel
      const leftDoorHinge = new THREE.Group();
      leftDoorHinge.position.set(-0.1, 0.38, 0.92);
      bodyGroup.add(leftDoorHinge);
      leftDoorRef.current = leftDoorHinge;

      const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.56, 0.05), paintMaterial);
      doorMesh.position.set(-0.6, 0.12, 0);
      leftDoorHinge.add(doorMesh);

      // Left door glass windows
      const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.42, 0.03), glassMaterial);
      windowMesh.position.set(-0.6, 0.54, 0);
      leftDoorHinge.add(windowMesh);

      // Right Door panel
      const rightDoorHinge = new THREE.Group();
      rightDoorHinge.position.set(-0.1, 0.38, -0.92);
      bodyGroup.add(rightDoorHinge);
      rightDoorRef.current = rightDoorHinge;

      const rDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.56, 0.05), paintMaterial);
      rDoorMesh.position.set(-0.6, 0.12, 0);
      rightDoorHinge.add(rDoorMesh);

      const rWindowMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.42, 0.03), glassMaterial);
      rWindowMesh.position.set(-0.6, 0.54, 0);
      rightDoorHinge.add(rWindowMesh);

      // Glowing futuristic cyber underglow bands
      const sideTrimLeft = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.04, 0.05), glossyAlloyMaterial);
      sideTrimLeft.position.set(-0.2, 0.15, 0.93);
      bodyGroup.add(sideTrimLeft);

      const sideTrimRight = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.04, 0.05), glossyAlloyMaterial);
      sideTrimRight.position.set(-0.2, 0.15, -0.93);
      bodyGroup.add(sideTrimRight);

    } else {
      // Rugged mechanical iconic SUV (G-Wagon box concept)
      
      // Massive tall lower body frame
      const frameGeo = new THREE.BoxGeometry(4.2, 0.65, 1.84);
      const bodyFrame = new THREE.Mesh(frameGeo, paintMaterial);
      bodyFrame.position.y = 0.45;
      bodyGroup.add(bodyFrame);

      // Flat muscular square enginehood box
      const hoodGeo = new THREE.BoxGeometry(1.45, 0.58, 1.8);
      const hood = new THREE.Mesh(hoodGeo, paintMaterial);
      hood.position.set(1.1, 0.95, 0);
      bodyGroup.add(hood);

      // Classic signature front vertical grille & AMG crossbar
      const grilleGeo = new THREE.BoxGeometry(0.12, 0.58, 1.5);
      const boxGrille = new THREE.Mesh(grilleGeo, blackChromeMaterial);
      boxGrille.position.set(1.84, 0.85, 0);
      bodyGroup.add(boxGrille);

      // Vertical rugged cabin block
      const cabinGeo = new THREE.BoxGeometry(2.2, 0.95, 1.78);
      const uprightCabin = new THREE.Mesh(cabinGeo, paintMaterial);
      uprightCabin.position.set(-0.6, 1.45, 0);
      bodyGroup.add(uprightCabin);

      // Flat upright flat windshield
      const frontWindshield = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 1.62), glassMaterial);
      frontWindshield.position.set(0.52, 1.4, 0);
      frontWindshield.rotation.z = -0.18; // barely tilted
      bodyGroup.add(frontWindshield);

      // Upright windows
      for (const side of [-1, 1]) {
        const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.03), glassMaterial);
        sideWindow.position.set(-0.55, 1.45, side * 0.91);
        bodyGroup.add(sideWindow);
      }

      // Left front door (hinged)
      const leftDoorHinge = new THREE.Group();
      leftDoorHinge.position.set(0.3, 0.35, 0.91);
      bodyGroup.add(leftDoorHinge);
      leftDoorRef.current = leftDoorHinge;

      const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.82, 0.05), paintMaterial);
      doorMesh.position.set(-0.4, 0.32, 0);
      leftDoorHinge.add(doorMesh);

      // Left door glass window
      const doorWindow = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.52, 0.03), glassMaterial);
      doorWindow.position.set(-0.4, 0.95, 0);
      leftDoorHinge.add(doorWindow);

      // Right front door (hinged)
      const rightDoorHinge = new THREE.Group();
      rightDoorHinge.position.set(0.3, 0.35, -0.91);
      bodyGroup.add(rightDoorHinge);
      rightDoorRef.current = rightDoorHinge;

      const rDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.82, 0.05), paintMaterial);
      rDoorMesh.position.set(-0.4, 0.32, 0);
      rightDoorHinge.add(rDoorMesh);

      const rDoorWindow = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.52, 0.03), glassMaterial);
      rDoorWindow.position.set(-0.4, 0.95, 0);
      rightDoorHinge.add(rDoorWindow);

      // Rear iconic door spare-wheel box
      const spareWheelCoverGeo = new THREE.TorusGeometry(0.34, 0.1, 12, 24);
      const spareWheelCover = new THREE.Mesh(spareWheelCoverGeo, blackChromeMaterial);
      spareWheelCover.rotation.y = Math.PI / 2;
      spareWheelCover.position.set(-1.75, 0.95, 0);
      bodyGroup.add(spareWheelCover);

      const spareCapGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.12, 16);
      const spareCap = new THREE.Mesh(spareCapGeo, paintMaterial);
      spareCap.rotation.z = Math.PI / 2;
      spareCap.position.set(-1.8, 0.95, 0);
      bodyGroup.add(spareCap);

      // Front rugged guard bar (chrome/alloy)
      const guardGeo = new THREE.BoxGeometry(0.15, 0.4, 1.4);
      const mechanicalGuard = new THREE.Mesh(guardGeo, glossyAlloyMaterial);
      mechanicalGuard.position.set(1.95, 0.35, 0);
      bodyGroup.add(mechanicalGuard);

      // AMG Sidepipe exhaust tips exits underneath rear door left and right!
      const exhaustLeftGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8);
      const sidepipeLeft = new THREE.Mesh(exhaustLeftGeo, glossyAlloyMaterial);
      sidepipeLeft.rotation.z = Math.PI / 2.3;
      sidepipeLeft.position.set(-0.55, 0.1, 0.95);
      bodyGroup.add(sidepipeLeft);

      const sidepipeRight = new THREE.Mesh(exhaustLeftGeo, glossyAlloyMaterial);
      sidepipeRight.rotation.z = Math.PI / 2.3;
      sidepipeRight.position.set(-0.55, 0.1, -0.95);
      bodyGroup.add(sidepipeRight);
    }

    // Headlights Details (placed on standard front locations)
    const headlightGeo = type === 'suv' 
      ? new THREE.CylinderGeometry(0.13, 0.13, 0.05, 16) // Round iconic G-class headlights
      : new THREE.BoxGeometry(0.08, 0.12, 0.32); // Sleek multi-beam electric/coupe LEDs

    const lightZShift = type === 'suv' ? 0.72 : 0.68;
    const lightYPos = type === 'sports' ? 0.38 : (type === 'electric' ? 0.42 : 0.85);
    const lightXPos = type === 'sports' ? 1.95 : (type === 'electric' ? 1.98 : 1.83);

    const headlightLeft = new THREE.Mesh(headlightGeo, headlightGlassMaterial);
    headlightLeft.position.set(lightXPos, lightYPos, lightZShift);
    if (type === 'suv') headlightLeft.rotation.z = Math.PI / 2; // face forward flat (cylinder)
    bodyGroup.add(headlightLeft);

    const headlightRight = new THREE.Mesh(headlightGeo, headlightGlassMaterial);
    headlightRight.position.set(lightXPos, lightYPos, -lightZShift);
    if (type === 'suv') headlightRight.rotation.z = Math.PI / 2;
    bodyGroup.add(headlightRight);

    // Active spotlights for glowing headlights projection
    if (headlightsOn) {
      const targetL = new THREE.Object3D();
      targetL.position.set(10, lightYPos, lightZShift);
      carGroup.add(targetL);

      const headlightBeamL = new THREE.SpotLight(0xffffff, 8, 12, Math.PI / 6, 0.5, 1.2);
      headlightBeamL.position.set(lightXPos + 0.1, lightYPos, lightZShift);
      headlightBeamL.target = targetL;
      carGroup.add(headlightBeamL);
      headlightsRef.current.push(headlightBeamL);

      const targetR = new THREE.Object3D();
      targetR.position.set(10, lightYPos, -lightZShift);
      carGroup.add(targetR);

      const headlightBeamR = new THREE.SpotLight(0xffffff, 8, 12, Math.PI / 6, 0.5, 1.2);
      headlightBeamR.position.set(lightXPos + 0.1, lightYPos, -lightZShift);
      headlightBeamR.target = targetR;
      carGroup.add(headlightBeamR);
      headlightsRef.current.push(headlightBeamR);
    }

    // Rear taillights
    const taillightGeo = new THREE.BoxGeometry(0.05, 0.08, type === 'electric' ? 1.76 : 0.42); // Electric has gorgeous continuous full-width lightband!
    const rearYPos = type === 'sports' ? 0.48 : (type === 'electric' ? 0.52 : 0.84);
    const rearXPos = type === 'sports' ? -2.04 : (type === 'electric' ? -2.25 : -1.8);

    if (type === 'electric') {
      const taillightBand = new THREE.Mesh(taillightGeo, taillightMaterial);
      taillightBand.position.set(rearXPos, rearYPos, 0);
      bodyGroup.add(taillightBand);
    } else {
      const taillightL = new THREE.Mesh(taillightGeo, taillightMaterial);
      taillightL.position.set(rearXPos, rearYPos, 0.72);
      bodyGroup.add(taillightL);

      const taillightR = new THREE.Mesh(taillightGeo, taillightMaterial);
      taillightR.position.set(rearXPos, rearYPos, -0.72);
      bodyGroup.add(taillightR);
    }


    // Wheels setup: standard Mercedes alloy wheels
    const wheelYPos = type === 'suv' ? 0.38 : (type === 'electric' ? 0.32 : 0.28);
    const trackWidth = type === 'suv' ? 0.95 : (type === 'sports' ? 0.92 : 0.94);
    const wheelPositions = [
      { x: 1.35, z: trackWidth, group: 'front', isLeft: true }, // front left
      { x: 1.35, z: -trackWidth, group: 'front', isLeft: false }, // front right
      { x: -1.35, z: trackWidth, group: 'rear', isLeft: true }, // rear left
      { x: -1.35, z: -trackWidth, group: 'rear', isLeft: false }  // rear right
    ];

    const wheelRadius = type === 'suv' ? 0.44 : 0.38;
    const wheelThickness = type === 'suv' ? 0.23 : 0.18;

    wheelPositions.forEach((pos) => {
      const wheelHub = new THREE.Group();
      wheelHub.position.set(pos.x, wheelYPos, pos.z);
      carGroup.add(wheelHub);

      // Create outer black tire rubber
      const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 24);
      const tireMat = new THREE.MeshStandardMaterial({
        color: 0x141414,
        roughness: 0.85,
        metalness: 0.05
      });
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.x = Math.PI / 2;
      wheelHub.add(tire);

      // Inner custom multi-spoke high-grade metal alloys design
      const alloyGroup = new THREE.Group();
      alloyGroup.rotation.x = Math.PI / 2;
      wheelHub.add(alloyGroup);

      // Central steel cap
      const capGeo = new THREE.CylinderGeometry(0.12, 0.12, wheelThickness + 0.02, 12);
      const cap = new THREE.Mesh(capGeo, blackChromeMaterial);
      alloyGroup.add(cap);

      // Spokes depending on wheel design selected
      const spokeCount = wheelId.includes('multi') ? 14 : 5;
      const spokeHeight = wheelId.includes('multi') ? 0.015 : 0.04;
      const spokeLength = wheelRadius - 0.05;

      for (let s = 0; s < spokeCount; s++) {
        const spokeGeo = new THREE.BoxGeometry(spokeHeight, wheelThickness + 0.01, spokeLength);
        const spoke = new THREE.Mesh(spokeGeo, glossyAlloyMaterial);
        
        // Arrange spokes radially around hub
        const angle = (s / spokeCount) * Math.PI * 2;
        spoke.rotation.y = angle;
        // Position spoke shifted outwards radially
        spoke.position.x = Math.sin(angle) * (spokeLength / 2);
        spoke.position.z = Math.cos(angle) * (spokeLength / 2);
        alloyGroup.add(spoke);
      }

      // Add alloy outer ring
      const wheelRingGeo = new THREE.TorusGeometry(wheelRadius - 0.03, 0.02, 8, 24);
      const wheelRing = new THREE.Mesh(wheelRingGeo, glossyAlloyMaterial);
      wheelRing.rotation.y = Math.PI / 2;
      alloyGroup.add(wheelRing);

      // Save references based on wheel group for driving animations (spin in loop)
      if (pos.group === 'front') {
        frontWheelsGroupRef.current.push(wheelHub);
      } else {
        rearWheelsGroupRef.current.push(wheelHub);
      }
    });

    // Subtly position the car slightly lower on physics planes
    carGroup.position.set(0, 0.1, 0);

    // Glowing Neon Underglow effect
    if (underglowOn) {
      const hexColorValue = parseInt(underglowColor.replace('#', '0x'));
      const glowPositions = [
        { x: 1.0, y: 0.12, z: 0 },
        { x: -1.0, y: 0.12, z: 0 },
        { x: 0, y: 0.12, z: 0.7 },
        { x: 0, y: 0.12, z: -0.7 }
      ];

      glowPositions.forEach((pos) => {
        const pLight = new THREE.PointLight(hexColorValue, 15, 1.8, 1.5);
        pLight.position.set(pos.x, pos.y, pos.z);
        carGroup.add(pLight);
        underglowLightsRef.current.push(pLight);
      });
    }

    return carGroup;
  };

  // Re-build 3D Scene viewport loop
  useEffect(() => {
    if (!canvasRef.current) return;

    // 1. Initialize Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0c10); // Luxurious deep AMG gray-black
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.06);

    // 2. Initialize Camera
    const camera = new THREE.PerspectiveCamera(
      32,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      60
    );
    cameraRef.current = camera;
    camera.position.set(0, 2.5, 8.5);

    // 3. Initialize WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Set Up Cinematic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    // Dynamic metallic reflections highlight light overhead
    const studioKeyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    studioKeyLight.position.set(5, 7, 5);
    studioKeyLight.castShadow = true;
    studioKeyLight.shadow.mapSize.width = 1024;
    studioKeyLight.shadow.mapSize.height = 1024;
    studioKeyLight.shadow.bias = -0.001;
    scene.add(studioKeyLight);

    // Soft sky lights for highlights
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
    rimLight.position.set(-6, 5, -6);
    scene.add(rimLight);

    // Soft color tone lights matching underglow or premium electric aesthetics
    const floorGlowLight = new THREE.DirectionalLight(0x00dfff, 0.35);
    floorGlowLight.position.set(0, -2, 0);
    scene.add(floorGlowLight);

    // 5. Create Luxurious Mirror Polish Showroom Platform
    const platformGroup = new THREE.Group();
    scene.add(platformGroup);

    // Reflective dark mirror floor
    const floorGeo = new THREE.CylinderGeometry(3.5, 3.6, 0.16, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x121418,
      roughness: 0.15,
      metalness: 0.9,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.08;
    floorMesh.receiveShadow = true;
    platformGroup.add(floorMesh);

    // Neon glowing perimeter boundary ring edge
    const edgeRingGeo = new THREE.TorusGeometry(3.55, 0.05, 8, 64);
    const edgeRingMat = new THREE.MeshStandardMaterial({
      color: underglowOn ? new THREE.Color(underglowColor) : 0x0088ff,
      emissive: underglowOn ? new THREE.Color(underglowColor) : 0x0033aa,
      roughness: 0.1,
    });
    const edgeRing = new THREE.Mesh(edgeRingGeo, edgeRingMat);
    edgeRing.rotation.x = Math.PI / 2;
    edgeRing.position.y = -0.01;
    platformGroup.add(edgeRing);

    // Ground shadows plane
    const shadowPlaneGeo = new THREE.PlaneGeometry(8, 8);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.4 });
    const shadowMesh = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.01;
    scene.add(shadowMesh);

    // 6. Build and Add Selected Mercedes Vehicle Model
    const carModel = buildCarModel(
      selectedCar.type,
      selectedColor.hex,
      selectedColor.metallic,
      selectedColor.roughness,
      selectedColor.metalness,
      selectedWheel.id
    );
    scene.add(carModel);
    carGroupRef.current = carModel;

    // Set initial custom view positions
    applyPresetView('isometric');

    // 7. Core Animation Run Loop
    let animationFrameId: number;
    let localRotationTime = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Handle Automatic Rotation Inertia vs Manual Drag Friction
      if (autoRotate && !isDragging) {
        localRotationTime += 0.005;
        targetRotation.current.y += 0.003;
      }

      // Smooth interpolation (Lerp) for Camera Angles
      currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.1;
      currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.1;
      currentZoom.current += (targetZoom.current - currentZoom.current) * 0.08;

      // Update Camera coordinates Based on Rotation / Zoom
      const r_x = currentRotation.current.x;
      const r_y = currentRotation.current.y;
      const radius = currentZoom.current;

      camera.position.x = radius * Math.cos(r_x) * Math.sin(r_y);
      camera.position.y = radius * Math.sin(r_x) + 0.3; // slightly offset height
      camera.position.z = radius * Math.cos(r_x) * Math.cos(r_y);
      camera.lookAt(0, 0.4, 0);

      // Spin Wheels when Auto-rotating or dragging
      const isWheelsSpinning = autoRotate || isDragging;
      const spinSpeed = 0.08;

      if (isWheelsSpinning) {
        frontWheelsGroupRef.current.forEach((w) => {
          // Spin wheels
          w.children.forEach(mesh => {
            if (mesh instanceof THREE.Group) {
              mesh.rotateZ(spinSpeed);
            }
          });
        });
        rearWheelsGroupRef.current.forEach((w) => {
          w.children.forEach(mesh => {
            if (mesh instanceof THREE.Group) {
              mesh.rotateZ(spinSpeed);
            }
          });
        });
      }

      // Smooth mechanics: Headlights intensity oscillating slightly for ambient cyber glow
      if (headlightsOn) {
        headlightsRef.current.forEach((light) => {
          light.intensity = 8.0 + Math.sin(Date.now() * 0.008) * 0.6;
        });
      }

      // Smooth mechanics: Underglow neon pulsing
      if (underglowOn) {
        underglowLightsRef.current.forEach((light) => {
          light.intensity = 15.0 + Math.sin(Date.now() * 0.01) * 2.5;
        });
      }

      // Smooth mechanics: Doors opening animation lerp
      const targetDoorAngle = doorsOpen ? Math.PI / 5 : 0;
      if (leftDoorRef.current) {
        leftDoorRef.current.rotation.y += (targetDoorAngle - leftDoorRef.current.rotation.y) * 0.08;
      }
      if (rightDoorRef.current) {
        rightDoorRef.current.rotation.y += (-targetDoorAngle - rightDoorRef.current.rotation.y) * 0.08;
      }

      // Smooth mechanics: Active Spoiler rise animation depending on doors open (high-tech feedback)
      if (activeSpoilerRef.current) {
        const targetSpoilerHeight = (doorsOpen || headlightsOn) ? 0.35 : 0.0;
        activeSpoilerRef.current.position.y += (targetSpoilerHeight - activeSpoilerRef.current.position.y) * 0.1;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize viewports
    const handleResize = () => {
      if (!canvasRef.current || !rendererRef.current || !cameraRef.current) return;
      
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    if (mountRef.current) {
      resizeObserver.observe(mountRef.current);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [selectedCar.id, selectedColor.hex, selectedWheel.id, headlightsOn, underglowOn, underglowColor, doorsOpen]);

  // Pointer dragging orbit handlers
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    setAutoRotate(false);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    pointerStart.current = { x: clientX, y: clientY };
    rotationStart.current = { x: currentRotation.current.x, y: currentRotation.current.y };
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - pointerStart.current.x;
    const deltaY = clientY - pointerStart.current.y;

    // Convert mouse movement to radial orbits
    targetRotation.current.y = rotationStart.current.y + deltaX * 0.007;
    // Bound pitch to prevent camera flipping upside down on polar singularity
    targetRotation.current.x = Math.max(
      -Math.PI / 4,
      Math.min(0.2, rotationStart.current.x + deltaY * 0.007)
    );
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const views: { id: typeof cameraView; label: string }[] = [
    { id: 'isometric', label: '3D Studio' },
    { id: 'front', label: 'Front Wing' },
    { id: 'side', label: 'Profile' },
    { id: 'rear', label: 'Rear AMG' },
    { id: 'overhead', label: 'Overhead' },
  ];

  type CarverType = 'sports' | 'electric' | 'suv';

  return (
    <div 
      id="3d-showroom-stage"
      className="relative flex flex-col w-full h-[380px] md:h-[500px] bg-neutral-950 border border-white/10 rounded-none overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.6)]"
      ref={mountRef}
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />

    </div>
  );
}
