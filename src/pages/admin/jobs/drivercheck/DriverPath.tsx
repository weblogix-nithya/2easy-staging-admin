"use client";

import { useLazyQuery } from "@apollo/client";
import DriverPathMap from "components/map/DriverPathMap";
import { DRIVER_LOGS_QUERY } from "graphql/route";
import moment from "moment";
import { useEffect, useState } from "react";

type Point = {
  lat: number;
  lng: number;
  time: string;
  suburb?: string;
};

export default function DriverPathPage() {
  const [points, setPoints] = useState<Point[]>([]);

  const [getLogs] = useLazyQuery(DRIVER_LOGS_QUERY, {
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      const logs = data?.driverLogsList?.data ?? [];

      // ✅ Sort by time
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

  useEffect(() => {
    getLogs({
      variables: {
        driver_id: "1216",
        today_au: true,
        first: 250,
        page: 1,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <DriverPathMap points={points} />;
}