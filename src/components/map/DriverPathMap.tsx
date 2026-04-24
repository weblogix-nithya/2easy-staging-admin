"use client";

import { useEffect, useRef } from "react";

type Point = {
  lat: number;
  lng: number;
  time: string;
  suburb?: string;
};

export interface Marker {
  lng: number;
  lat: number;
  icon?: string;
  data?: any;
}
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

    // 🔥 Draw path
    const polyline = new google.maps.Polyline({
      path: points,
      geodesic: true,
      strokeColor: "#2563eb",
      strokeOpacity: 1,
      strokeWeight: 4,
      map,
    });

    // 🔥 Info window (tooltip)
    const infoWindow = new google.maps.InfoWindow();

    // 🔥 Helper: find nearest point
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

    // 🔥 Hover on path
    polyline.addListener("mousemove", (e: any) => {
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

    // hide when mouse out
    polyline.addListener("mouseout", () => {
      infoWindow.close();
    });

  }, [points]);

  return <div ref={ref} style={{ height: "100vh", width: "100%" }} />;
}