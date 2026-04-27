"use client";

import { Button } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

type Point = {
  lat: number;
  lng: number;
  time: string;
  suburb?: string;
};

export default function DriverPathMap({ points }: { points: Point[] }) {
  const ref = useRef<HTMLDivElement>(null);

  const indexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const animationRef = useRef<number>();
  const speedRef = useRef(2);

  const [speed, setSpeed] = useState(2);
  const startPlaybackRef = useRef<() => void>();
  const pausePlaybackRef = useRef<() => void>();
  const restartPlaybackRef = useRef<() => void>();

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    if (!ref.current || !window.google || points.length === 0) return;

    // 🔥 Reduce points if too large
    const MAX_POINTS = 300;
    const optimizedPoints =
      points.length > MAX_POINTS
        ? points.filter(
            (_, i) => i % Math.ceil(points.length / MAX_POINTS) === 0,
          )
        : points;

    const map = new google.maps.Map(ref.current, {
      center: optimizedPoints[0],
      zoom: 14,
      gestureHandling: "greedy",
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || undefined
    });

    // ✅ Fit bounds
    const bounds = new google.maps.LatLngBounds();
    optimizedPoints.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds);

    // 🔒 Lock zoom
    const MIN_ZOOM = 14;
    google.maps.event.addListener(map, "zoom_changed", () => {
      if (map.getZoom()! < MIN_ZOOM) {
        map.setZoom(MIN_ZOOM);
      }
    });

    // =========================
    // 🎨 SINGLE Polyline (optimized)
    // =========================
    new google.maps.Polyline({
      path: optimizedPoints,
      strokeColor: "#3b82f6",
      strokeOpacity: 1,
      strokeWeight: 4,
      map,
    });

    // =========================
    // 📍 Advanced Markers
    // =========================
    const createMarker = (label: string, position: any) => {
      const div = document.createElement("div");
      div.innerText = label;
      div.style.background = "#6b46c1";
      div.style.color = "white";
      div.style.padding = "4px 6px";
      div.style.borderRadius = "6px";
      div.style.fontSize = "12px";

      return new google.maps.marker.AdvancedMarkerElement({
        position,
        map,
        content: div,
      });
    };

    createMarker("S", optimizedPoints[0]);
    createMarker("E", optimizedPoints[optimizedPoints.length - 1]);

    // =========================
    // 🎯 Moving Marker
    // =========================
    const movingDiv = document.createElement("div");
    movingDiv.style.width = "10px";
    movingDiv.style.height = "10px";
    movingDiv.style.background = "red";
    movingDiv.style.borderRadius = "50%";

    const movingContainer = document.createElement("div");

    movingContainer.style.display = "flex";
    movingContainer.style.flexDirection = "column";
    movingContainer.style.alignItems = "center";

    const label = document.createElement("div");
    label.style.background = "red";
    label.style.color = "white";
    label.style.padding = "4px 6px";
    label.style.borderRadius = "6px";
    label.style.fontSize = "12px";
    label.style.marginBottom = "4px";

    const dot = document.createElement("div");
    dot.style.width = "10px";
    dot.style.height = "10px";
    dot.style.background = "red";
    dot.style.borderRadius = "50%";

    movingContainer.appendChild(label);
    movingContainer.appendChild(dot);

    const movingMarker = new google.maps.marker.AdvancedMarkerElement({
      position: optimizedPoints[0],
      map,
      content: movingContainer,
    });

    const playbackInfo = new google.maps.InfoWindow();

    // ✅ OPEN ONLY ONCE (fix blinking)
    playbackInfo.open(map, movingMarker);

    // =========================
    // 🎯 Hover (optimized)
    // =========================
    let lastIndex = 0;

    const hoverLine = new google.maps.Polyline({
      path: optimizedPoints,
      strokeOpacity: 0,
      strokeWeight: 20,
      map,
    });

    const hoverInfo = new google.maps.InfoWindow();

    const getClosestPoint = (latLng: google.maps.LatLng) => {
      let min = Infinity;
      let closest = optimizedPoints[0];

      const start = Math.max(0, lastIndex - 5);
      const end = Math.min(optimizedPoints.length, lastIndex + 5);

      for (let i = start; i < end; i++) {
        const p = optimizedPoints[i];
        const d =
          Math.pow(p.lat - latLng.lat(), 2) + Math.pow(p.lng - latLng.lng(), 2);

        if (d < min) {
          min = d;
          closest = p;
          lastIndex = i;
        }
      }

      return closest;
    };

    hoverLine.addListener("mousemove", (e: any) => {
      const p = getClosestPoint(e.latLng);

      hoverInfo.setContent(`
        <div style="font-size:12px;">
          <b>${p.time}</b><br/>
          ${p.suburb ?? ""}
        </div>
      `);

      hoverInfo.setPosition(p);
      hoverInfo.open(map);
    });

    hoverLine.addListener("mouseout", () => hoverInfo.close());

    // =========================
    // 🎬 Animation (optimized)
    // =========================
    let lastUpdate = 0;

    const animate = (time: number) => {
      if (!isPlayingRef.current) return;

      if (time - lastUpdate < 100 / speedRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      lastUpdate = time;

      const i = indexRef.current;

      if (i >= optimizedPoints.length) {
        isPlayingRef.current = false;
        return;
      }

      const p = optimizedPoints[i];

      movingMarker.position = p;

      // 🔥 NO BLINK (only update)
      label.innerHTML = `
          <b>${p.time}</b><br/>
          ${p.suburb ?? ""}
        `;

      // 📍 keep in view
      const bounds = map.getBounds();
      if (!bounds || !bounds.contains(p)) {
        map.panTo(p);
      }

      indexRef.current++;

      animationRef.current = requestAnimationFrame(animate);
    };

    const startPlayback = () => {
      if (isPlayingRef.current) return;
      isPlayingRef.current = true;
      animate(0);
    };

    const pausePlayback = () => {
      isPlayingRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

    const restartPlayback = () => {
      pausePlayback();
      indexRef.current = 0;
      startPlayback();
    };

    startPlaybackRef.current = startPlayback;
    pausePlaybackRef.current = pausePlayback;
    restartPlaybackRef.current = restartPlayback;

    // startPlayback();
    setTimeout(() => {
      startPlayback();
    }, 500);

    return () => pausePlayback();
  }, [points]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={ref} style={{ height: "100vh", width: "100%" }} />

      {/* 🎮 Controls */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          zIndex: 1000,
          display: "flex",
          gap: "10px",
          alignItems: "center",
          background: "white",
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        <Button onClick={() => startPlaybackRef.current?.()}>▶️</Button>
        <Button onClick={() => pausePlaybackRef.current?.()}>⏸</Button>
        <Button onClick={() => restartPlaybackRef.current?.()}>🔁</Button>

        {/* 🎚 Speed Slider */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "12px" }}>Speed: {speed}x</label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
