import { useToast } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

export interface Marker {
  lng: number;
  lat: number;
  icon?: string;
  data?: any;
}

// add in drivers locations, pick up locations, drop off locations etc
export function Map({
  center,
  zoom,
  markers,
  drivers,
  onMarkerClick,
  onDriverClick,
  onCenterChanged,
  onZoomChanged,
  isRouted,
}: {
  center: google.maps.LatLng;
  zoom: number;
  markers?: Marker[];
  drivers?: Marker[];
  onMarkerClick: any;
  onDriverClick: any;
  onCenterChanged: any;
  onZoomChanged: any;
  isRouted?: boolean;
}) {
  const toast = useToast();
  const ref = useRef();

  const rightSideBarJob = useSelector(
    (state: RootState) => state.rightSideBar.job,
  );
  const rightSideBarRoute = useSelector(
    (state: RootState) => state.rightSideBar.route,
  );

  useEffect(() => {
    const map = new window.google.maps.Map(ref.current, {
      center: center,
      zoom: zoom,
    });

    var driverMarkers: google.maps.Marker[] = [];
    var googleMarkers: google.maps.Marker[] = [];
    const waypoints: google.maps.DirectionsWaypoint[] = [];

    const directionsService = new google.maps.DirectionsService();
    const directionsDisplay = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true,
      suppressInfoWindows: true,
    });

    var bounds = new google.maps.LatLngBounds();

    map.addListener("zoom_changed", () => {
      onZoomChanged(map.getZoom());
    });

    map.addListener("center_changed", () => {
      onCenterChanged({
        lat: map.getCenter().lat(),
        lng: map.getCenter().lng(),
      });
    });

    markers?.forEach((marker, index) => {
      let googleMarker = new window.google.maps.Marker({
        position: { lat: marker.lat, lng: marker.lng },
        map,
        icon: {
          url: marker.icon,
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(27, 44),
          scaledSize: new google.maps.Size(50, 50),
        },
        // @ts-ignore
        data: marker.data || null,
        zIndex: 1000,
      });

      googleMarkers.push(googleMarker);
      if (index > 0 && index < markers.length - 1) {
        waypoints.push({
          location: {
            lng: googleMarker.getPosition().lng(),
            lat: googleMarker.getPosition().lat(),
          },
          stopover: true,
        });
      }

      // bounds.extend(googleMarker.getPosition());

      googleMarker.addListener("click", () => {
        // @ts-ignore
        onMarkerClick(googleMarker.data);
      });
    });

    drivers?.forEach((driver, index) => {
      if (driver.lng && driver.lat) {
        let driverMarker = new window.google.maps.Marker({
          position: { lat: driver.lat, lng: driver.lng },
          map,
          icon: {
            url: driver.icon,
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(25, 25),
          },
          // @ts-ignore
          data: driver.data || null,
          zIndex: 1000,
        });

        driverMarkers.push(driverMarker);
        // bounds.extend(driverMarker.getPosition());

        driverMarker.addListener("click", () => {
          // @ts-ignore
          onDriverClick(driverMarker.data);
        });
      }
    });

    // 23 waypoints max
    if (
      waypoints.length < 23 &&
      googleMarkers.length > 1 &&
      (rightSideBarJob != null || rightSideBarRoute != null)
    ) {
      directionsService.route(
        {
          origin: {
            lat: googleMarkers[0].getPosition().lat(),
            lng: googleMarkers[0].getPosition().lng(),
          },
          destination: {
            lat: googleMarkers[googleMarkers.length - 1].getPosition().lat(),
            lng: googleMarkers[googleMarkers.length - 1].getPosition().lng(),
          },
          avoidTolls: true,
          avoidHighways: false,
          waypoints: waypoints,
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        function (response, status) {
          if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
          } else {
            toast({
              title: "No route or jobs found",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
          }
        },
      );
    }
  });

  return <div ref={ref} id="map" style={{ height: "100%" }} />;
}
