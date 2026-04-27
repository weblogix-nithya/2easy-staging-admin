"use client";

import { useLazyQuery } from "@apollo/client";
import DriverPathMap from "components/map/DriverPathMap";
import { DRIVER_LOGS_QUERY } from "graphql/route";
import moment from "moment";
import { useState } from "react";

type Point = {
  lat: number;
  lng: number;
  time: string;
  suburb?: string;
};

export default function DriverPathPage() {
  const [points, setPoints] = useState<Point[]>([]);
  const [driverId, setDriverId] = useState("1216");
  const [limit, setLimit] = useState(250);

  const [getLogs, { loading }] = useLazyQuery(DRIVER_LOGS_QUERY, {
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      const logs = data?.driverLogsList?.data ?? [];

      const sorted = [...logs].sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );

      const formatted: Point[] = sorted.map((log: any) => ({
        lat: log.lat,
        lng: log.lng,
        time: moment(log.created_at_au).format("hh:mm A"),
        suburb: log.suburb,
      }));

      setPoints(formatted);
    },
  });

  const handleLoad = () => {
    if (!driverId) return alert("Enter driver ID");

    getLogs({
      variables: {
        driver_id: driverId,
        // today_au: true,
        first: Number(limit),
        page: 1,
      },
    });
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Controls */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1000,
          background: "white",
          padding: "10px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          display: "flex",
          gap: "10px",
        }}
      >
        <input
          type="text"
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
        />

        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
        />

        <button onClick={handleLoad} disabled={loading}>
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

      <DriverPathMap points={points} />
    </div>
  );
}