"use client";

import { useLazyQuery } from "@apollo/client";
import { type Marker,Map } from "components/map/Map";
import { DRIVER_LOGS_QUERY } from "graphql/route";
import moment from "moment";
import { useEffect, useState } from "react";

export default function DriverPathPage() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [center, setCenter] = useState<any>({
    lat: -37.692843,
    lng: 144.8697294,
  });
  const [zoom, setZoom] = useState(14);

  const [getDriverLogs] = useLazyQuery(DRIVER_LOGS_QUERY, {
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      const logs = data?.driverLogsList?.data ?? [];

      // 🔥 sort by time
      const sorted = [...logs].sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );

      const formatted: Marker[] = sorted.map((log: any, index: number) => ({
        lat: log.lat,
        lng: log.lng,
        icon:
          index === 0
            ? "/start.png"
            : index === sorted.length - 1
            ? "/end.png"
            : "/dot.png",
        data: {
          time: moment(log.created_at_au).format("hh:mm A"),
          suburb: log.suburb,
        },
      }));

      setMarkers(formatted);

      if (formatted.length > 0) {
        setCenter({
          lat: formatted[0].lat,
          lng: formatted[0].lng,
        });
      }
    },
  });

  useEffect(() => {
    getDriverLogs({
      variables: {
        driver_id: "1216",
        today_au: true,
        first: 5000,
        page: 1,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Map
      center={center}
      zoom={zoom}
      markers={markers}
      drivers={[]}
      onMarkerClick={(data) =>
        alert(`${data.time} - ${data.suburb}`)
      }
      onDriverClick={() => {}}
      onCenterChanged={() => {}}
      onZoomChanged={(z: number) => setZoom(z)}
    />
  );
}