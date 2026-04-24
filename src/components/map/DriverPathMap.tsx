"use client";

import { useEffect, useRef } from "react";

type Point = {
  lat: number;
  lng: number;
  time: string;
  suburb?: string;
};

export default function DriverPathMap({
  points,
}: {
  points: Point[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !window.google || points.length === 0) return;

    const map = new google.maps.Map(ref.current, {
      center: points[0],
      zoom: 14,
      gestureHandling: "greedy",
    });

    // ✅ Fit bounds (better UX)
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds);

    // ✅ Visible path
    const visibleLine = new google.maps.Polyline({
      path: points,
      geodesic: true,
      strokeColor: "#2563eb",
      strokeOpacity: 1,
      strokeWeight: 4,
      map,
    });

    // ✅ Invisible hover line (fix hover issue)
    const hoverLine = new google.maps.Polyline({
      path: points,
      strokeOpacity: 0,
      strokeWeight: 20, // 🔥 big hit area
      map,
    });

    // ✅ Info window
    const infoWindow = new google.maps.InfoWindow();

    // ✅ Find closest point
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

    // ✅ Hover detection (fixed)
    hoverLine.addListener("mousemove", (e: any) => {
      const closest = getClosestPoint(e.latLng);

      infoWindow.setContent(`
        <div style="font-size:12px;">
          <b>${closest.time}</b><br/>
          ${closest.suburb ?? ""}
        </div>
      `);

      infoWindow.setPosition({
        lat: closest.lat,
        lng: closest.lng,
      });

      infoWindow.open(map);
    });

    hoverLine.addListener("mouseout", () => {
      infoWindow.close();
    });

    // ✅ Extra: works even when not exactly on line
    map.addListener("mousemove", (e: any) => {
      const closest = getClosestPoint(e.latLng);

      infoWindow.setContent(`
        <div style="font-size:12px;">
          <b>${closest.time}</b>
        </div>
      `);

      infoWindow.setPosition({
        lat: closest.lat,
        lng: closest.lng,
      });

      infoWindow.open(map);
    });

    // ✅ START marker
    new google.maps.Marker({
      position: points[0],
      map,
      label: "S",
    });

    // ✅ END marker
    new google.maps.Marker({
      position: points[points.length - 1],
      map,
      label: "E",
    });

  }, [points]);

  return <div ref={ref} style={{ height: "100vh", width: "100%" }} />;
}