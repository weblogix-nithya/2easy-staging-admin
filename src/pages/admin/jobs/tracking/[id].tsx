import { useLazyQuery, useQuery } from "@apollo/client";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Avatar,
  Box,
  Divider,
  Flex,
  Grid,
  GridItem,
  IconButton,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { faBoltLightning } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TrackingMap } from "components/map/TrackingMap";
import RsbJobIndicatorCircle from "components/sidebar/components/RsbJobIndicatorCircle";
import { GET_JOB_QUERY } from "graphql/job";
import { GET_DRIVER_CURRENT_ROUTE_QUERY } from "graphql/route";
import {
  australianStates,
  formatDate,
  formatTime,
  getMapIcon,
} from "helpers/helper";
import debounce from "lodash.debounce";
import moment from "moment";
import { useRouter } from "next/router";
import React, { useCallback, useState } from "react";

import AdminLayout from "../../../../layouts/admin";

export default function TrackingJob() {
  const router = useRouter();
  const { id: jobId } = router.query;
  const [routePoints, setRoutePoints] = useState([]);

  // Google Maps data.
  const [zoom, setZoom] = useState(5);
  const [center, setCenter] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [pollingSpeed, setPollingSpeed] = useState(60000);

  const centerChangeHandler = (data: any) => {
    setCenter(data);
  };
  const debouncedCenterChangeHandler = useCallback(
    debounce(centerChangeHandler, 300),
    [],
  );

  const {
    loading: jobLoading,
    data: jobData,
    refetch: getJob,
  } = useQuery(GET_JOB_QUERY, {
    variables: {
      id: jobId,
    },
    skip: !jobId,
    onCompleted: (data) => {
      const localDate = formatDate(data?.job?.ready_at);
      getDriverCurrentRoutes({
        variables: {
          page: 1,
          first: 20,
          orderByColumn: "id",
          orderByOrder: "ASC",
          today: moment(localDate).utc().format("YYYY-MM-DD HH:mm:ss"),
          driver_id: Number(data?.job?.driver_id),
        },
      });
    },
    onError(error) {
      console.log("onError");
      console.log(error);
    },
  });

  const [
    getDriverCurrentRoutes,
    { data: routes, loading: loadingDriverCurrentRoutes },
  ] = useLazyQuery(GET_DRIVER_CURRENT_ROUTE_QUERY, {
    pollInterval: pollingSpeed,
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      if (data.routes.data.length > 0) {
        const route = data.routes.data[0];
        // Filter out Completed Stops.
        const routePoints = route.route_points.filter(
          (point: any) =>
            Number(point.route_point_status_id) < 3 && point.job_destination,
        );
        const markers = routePoints.map((point: any) => {
          return {
            lat: point.lat,
            lng: point.lng,
            icon: getMapIcon(point),
            data: point,
          };
        });

        const drivers = [
          {
            lat: route.driver.lat,
            lng: route.driver.lng,
            icon: route.driver.media_url,
            data: route.driver,
          },
        ];

        setRoutePoints(routePoints);
        setMarkers(markers);
        setCenter({
          lat: australianStates[1].lat,
          lng: australianStates[1].lng,
        });
        setDrivers(drivers);
      } else {
        setRoutePoints([]);
        setMarkers([]);
      }
    },
  });

  return (
    <AdminLayout>
      <Box
        className="mk-customers-id overflow-auto"
        pt={{ base: "130px", md: "97px", xl: "97px" }}
        backgroundColor="white"
      >
        <Grid
          pr="24px"
          className="mk-mainInner"
          h={{
            base: "calc(100vh - 130px)",
            md: "calc(100vh - 97px)",
            xl: "calc(100vh - 97px)",
          }}
        >
          {!jobLoading && jobData && (
            <Grid backgroundColor="white">
              <Flex className="my-8 pl-6 justify-between">
                <Box>
                  <h1>Track Delivery</h1>
                </Box>
                <Box>
                  <Tooltip
                    label={`Current polling speed ${pollingSpeed / 1000}s`}
                  >
                    <IconButton
                      m={{ base: "2px" }}
                      aria-label="left button"
                      className="text-[var(--chakra-colors-primary-400)] float-right"
                      icon={<FontAwesomeIcon icon={faBoltLightning} />}
                      onClick={() => {
                        pollingSpeed == 60000
                          ? setPollingSpeed(10000)
                          : setPollingSpeed(60000);
                      }}
                      colorScheme={pollingSpeed == 10000 ? "blue" : "gray"}
                    />
                  </Tooltip>
                </Box>
              </Flex>

              <Grid
                templateAreas={`"nav main"`}
                gridTemplateRows={"1fr 30px"}
                gridTemplateColumns={{ base: "35% 1fr", md: "420px 1fr" }}
                // h="90vh"
                gap="1px"
                color="blackAlpha.700"
                fontWeight="bold"
                className="mk-job-allocation-wrap overflow-hidden"
              >
                {/* Left Column */}
                <GridItem
                  area={"nav"}
                  className="job-list-column h-full overflow-auto pt-4 border-t"
                  sx={{ maxWidth: "420px", height: "calc(100vh - 186px)" }}
                >
                  <Box className="px-6">
                    <h2>Job #{jobData.job.name}</h2>

                    <Divider className="mb-2 mt-3" />

                    <Flex alignItems="center" mb={"16px"}>
                      <Text width="200px" fontSize="sm">
                        Date
                      </Text>
                      <Text fontSize="sm">
                        {formatDate(jobData.job.ready_at, "DD MMM YYYY")}
                      </Text>
                    </Flex>
                    <Flex alignItems="center" mb={"16px"}>
                      <Text width="200px" fontSize="sm">
                        Assigned to
                      </Text>
                      <Flex>
                        <Avatar
                          variant="jobAllocation"
                          src={
                            jobData.job.driver
                              ? jobData.job.driver.media_url
                              : "/img/avatars/driverIcon.png"
                          }
                        />
                        <Text className="ml-1">
                          {jobData?.job.driver?.full_name}
                        </Text>
                      </Flex>
                    </Flex>
                    <Divider className="mb-2 mt-3" />

                    {/* ROUTE POINTS */}
                    {!loadingDriverCurrentRoutes && routePoints.length > 0 && (
                      <Flex className="flex-col mt-4 job-destination-card-wrap">
                        {/* Check if upcoming stop belongs to current Job. */}
                        {Number(routePoints[0].job.id) === Number(jobId) && (
                          <Flex className="p-2 gap-y-2 flex-col bg-[#F4F4F4] rounded-lg">
                            <Text
                              fontSize="md"
                              textColor="#2BA620"
                              fontWeight="700 !important"
                            >
                              Your drive is arriving soon
                            </Text>
                            <Box>
                              <Text fontSize="sm">
                                Your stop is up next in the route. Your driver’s
                                estimated arrival time at the location is
                                between{" "}
                                {formatTime(
                                  routePoints[0].job_destination.estimated_at,
                                )}{" "}
                                -{" "}
                                {formatTime(
                                  moment(
                                    routePoints[0].job_destination.estimated_at,
                                  )
                                    .add(30, "minutes")
                                    .toString(),
                                )}
                              </Text>
                            </Box>
                          </Flex>
                        )}
                        {/* -------------------Route Points------------------- */}
                        <Text fontSize="xs" className="pl-9 mt-5">
                          Next Stop:
                        </Text>
                        {routePoints.map((routePoint: any, index: any) => {
                          const isJobTracked =
                            Number(routePoint.job.id) === Number(jobId);

                          const blueText = isJobTracked ? "text-[#3B68DB]" : "";
                          return (
                            <Flex
                              key={`${index}-${routePoint.id}`}
                              className="job-destination-card"
                            >
                              <RsbJobIndicatorCircle
                                destinationStatus={
                                  routePoint.route_point_status_id
                                }
                              />
                              <Flex className="!max-w-md w-full">
                                <Flex className="w-full flex-col">
                                  <Text
                                    className={`!text-sm !font-bold ${blueText}`}
                                  >
                                    {isJobTracked
                                      ? `${routePoint.job_destination.address_line_1}, ${routePoint.job_destination.address_city}, ${routePoint.job_destination.address_postal_code}`
                                      : `${routePoint.job_destination.address_city} ${routePoint.job_destination.address_state} ${routePoint.job_destination.address_postal_code}`}
                                  </Text>
                                  <Flex className="w-full gap-x-3 mb-6">
                                    <Text
                                      fontSize="xs"
                                      className={`mt-[1px] ${blueText}`}
                                    >
                                      Job #{routePoint.job.name}
                                    </Text>
                                    {isJobTracked && (
                                      <Accordion
                                        allowMultiple
                                        variant="instructions"
                                      >
                                        <AccordionItem>
                                          {({ isExpanded }) => (
                                            <>
                                              <AccordionButton className="!p-0">
                                                <Flex alignItems="center">
                                                  <Box
                                                    as="span"
                                                    textAlign="left"
                                                  >
                                                    {isExpanded ? (
                                                      <Text className="!font-bold">
                                                        Instructions
                                                      </Text>
                                                    ) : (
                                                      <Text className="!font-bold">
                                                        Instructions
                                                      </Text>
                                                    )}
                                                  </Box>
                                                  <AccordionIcon />
                                                </Flex>
                                              </AccordionButton>

                                              <AccordionPanel p={0}>
                                                <div className="p-2 bg-[#f4f4f4] rounded-lg border">
                                                  <p className="text-xs">
                                                    <strong>
                                                      Pick up notes:{" "}
                                                    </strong>
                                                    {`${
                                                      routePoint.job_destination
                                                        .pick_up_notes
                                                        ? routePoint
                                                            .job_destination
                                                            .pick_up_notes
                                                        : routePoint
                                                            .job_destination
                                                            .notes ?? "N/A"
                                                    }`}
                                                  </p>
                                                </div>
                                              </AccordionPanel>
                                            </>
                                          )}
                                        </AccordionItem>
                                      </Accordion>
                                    )}
                                  </Flex>
                                </Flex>
                              </Flex>
                            </Flex>
                          );
                        })}
                      </Flex>
                    )}
                  </Box>
                </GridItem>

                {/* Job map */}
                {!loadingDriverCurrentRoutes &&
                  routePoints &&
                  markers.length > 0 && (
                    <GridItem
                      bg="green.300"
                      area={"main"}
                      sx={{ height: "calc(100vh - 200px)" }}
                    >
                      <TrackingMap
                        center={center}
                        zoom={zoom}
                        markers={markers}
                        onCenterChanged={(data: any) =>
                          debouncedCenterChangeHandler(data)
                        }
                        onZoomChanged={(data: any) => {
                          setZoom(data);
                        }}
                        isRouting
                        drivers={drivers}
                      />
                    </GridItem>
                  )}
              </Grid>
            </Grid>
          )}
        </Grid>
      </Box>
    </AdminLayout>
  );
}
