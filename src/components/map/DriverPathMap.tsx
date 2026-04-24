"use client";

import { useEffect, useRef } from "react";

type Point = {
  lat: number;
  lng: number;
  time: string;
  suburb?: string;
};

export default function DriverPathMap({ points }: { points: Point[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !window.google || points.length === 0) return;

    const map = new google.maps.Map(ref.current, {
      center: points[0],
      zoom: 14,
      gestureHandling: "greedy",
    });

    // ✅ Fit bounds
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds);

    // ✅ Gradient + arrows
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];

      const progress = i / (points.length - 1);
      const hue = 220 - progress * 220;
      const color = `hsl(${hue}, 100%, 50%)`;

      new google.maps.Polyline({
        path: [start, end],
        strokeColor: color,
        strokeOpacity: 1,
        strokeWeight: 4,
        icons: [
          {
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              strokeColor: color,
            },
            offset: "0",
            repeat: "80px",
          },
        ],
        map,
      });
    }

    // ✅ Hover line
    const hoverLine = new google.maps.Polyline({
      path: points,
      strokeOpacity: 0,
      strokeWeight: 20,
      map,
    });

    const infoWindow = new google.maps.InfoWindow();

    const getClosestPoint = (latLng: google.maps.LatLng) => {
      let minDist = Infinity;
      let closest = points[0];

      points.forEach((p) => {
        const dist =
          Math.pow(p.lat - latLng.lat(), 2) +
          Math.pow(p.lng - latLng.lng(), 2);

        if (dist < minDist) {
          minDist = dist;
          closest = p;
        }
      });

      return closest;
    };

    // ✅ ONLY ONE hover listener
    hoverLine.addListener("mousemove", (e: any) => {
      const closest = getClosestPoint(e.latLng);

      const distance =
        Math.pow(closest.lat - e.latLng.lat(), 2) +
        Math.pow(closest.lng - e.latLng.lng(), 2);

      if (distance > 0.00001) {
        infoWindow.close();
        return;
      }

      infoWindow.setContent(`
        <div style="font-size:12px;">
          <b>${closest.time}</b><br/>
          ${closest.suburb ?? ""}
        </div>
      `);

      infoWindow.setPosition(closest);
      infoWindow.open(map);
    });

    hoverLine.addListener("mouseout", () => {
      infoWindow.close();
    });

    // ✅ Start / End markers
    new google.maps.Marker({ position: points[0], map, label: "S" });
    new google.maps.Marker({
      position: points[points.length - 1],
      map,
      label: "E",
    });

    // =========================
    // 🔥 PLAYBACK ANIMATION
    // =========================

    let index = 0;

    const movingMarker = new google.maps.Marker({
      position: points[0],
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: "#ff0000",
        fillOpacity: 1,
        strokeWeight: 2,
      },
    });

    const playbackInfo = new google.maps.InfoWindow();

    const interval = setInterval(() => {
      if (index >= points.length) {
        clearInterval(interval);
        return;
      }

      const p = points[index];

      movingMarker.setPosition(p);

      playbackInfo.setContent(`
        <div style="font-size:12px;">
          <b>${p.time}</b><br/>
          ${p.suburb ?? ""}
        </div>
      `);

      playbackInfo.open(map, movingMarker);

      index++;
    }, 400);

    // ✅ cleanup (important)
    return () => {
      clearInterval(interval);
    };

  }, [points]);

  return <div ref={ref} style={{ height: "100vh", width: "100%" }} />;
}