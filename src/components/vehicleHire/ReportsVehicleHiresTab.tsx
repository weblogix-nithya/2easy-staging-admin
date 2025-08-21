import {
  Box,
  Divider,
  Flex,
} from "@chakra-ui/react";
import PaginationTable from "components/table/PaginationTable";
import { formatDate } from "helpers/helper";
import React, { useEffect, useMemo, useState } from "react";

export default function ReportsVehicleHiresTab(props: {
  vehicleHireObject: any;
}) {
  const { vehicleHireObject } = props;
  // const toast = useToast();
  // const textColor = useColorModeValue("navy.700", "white");
  // let menuBg = useColorModeValue("white", "navy.800");
  const [_vehicleHire, setVehicleHire] = useState(vehicleHireObject);
  // const [jobDestinationsConfirmed, setJobDestinationsConfirmed] = useState([]);
  const [driverIssues, setDriverIssues] = useState([]);
  const [customerIssues, setCustomerIssues] = useState([]);

  const issuesColumns = useMemo(
    () => [
      {
        Header: "DATE",
        accessor: "date" as const,
      },
      {
        Header: "Status",
        accessor: "issue_report_status.name" as const,
      },
      {
        Header: "TYPE",
        accessor: "type" as const,
      },
      {
        Header: "DESCRIPTION",
        accessor: "name" as const,
      },
    ],
    [],
  );

  useEffect(() => {
    setVehicleHire(vehicleHireObject);
    let _driverIssues: any[] = [];
    let _customerIssues: any[] = [];
    if (vehicleHireObject.issue_reports?.length > 0) {
      vehicleHireObject.issue_reports?.map((issueReport: any) => {
        let _issue = {
          ...issueReport,
          date: formatDate(issueReport.updated_at, "HH:MM, DD/MM/YYYY"),
          type: issueReport.issue_report_type?.name,
          status: issueReport.issue_report_status?.name,
          uploaded_by: issueReport.sourceable?.full_name,
        };
        if (issueReport.sourceable?.__typename === "Driver") {
          _driverIssues.push(_issue);
        } else if (issueReport.sourceable?.__typename === "Customer") {
          _customerIssues.push(_issue);
        }
      });

      //_driverIssues = _driverIssues.concat(jobDestination.issue_reports);
    }
    setDriverIssues(_driverIssues);
    setCustomerIssues(_customerIssues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleHireObject]);

  return (
    <Box className="mt-10">
      {/* Driver Issues */}
      <Box>
        <Flex justify="space-between" align="center">
          <h3>Driver Issues</h3>
        </Flex>

        {true && (
          <PaginationTable columns={issuesColumns} data={driverIssues} />
        )}
      </Box>
      <Divider className="my-12" />
      <Box className="mt-10">
        <Flex justify="space-between" align="center">
          <h3>Customer Issues</h3>
        </Flex>

        {true && (
          <PaginationTable columns={issuesColumns} data={customerIssues} />
        )}
      </Box>
    </Box>
  );
}
