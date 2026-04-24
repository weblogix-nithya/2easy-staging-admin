"use client";

import { useLazyQuery } from "@apollo/client";
import DriverPathMap from "components/map/DriverPathMap";
import { DRIVER_LOGS_QUERY } from "graphql/route";
import moment from "moment";
import { useEffect, useState } from "react";


export default function DriverPathPage() {
  const [points, setPoints] = useState<any[]>([]);

  const [getLogs] = useLazyQuery(DRIVER_LOGS_QUERY, {
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      const logs = data?.driverLogsList?.data ?? [];

      const sorted = [...logs].sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );

      const formatted = sorted.map((log: any) => ({
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
        first: 100,
        page: 1,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <DriverPathMap points={points} />;
}