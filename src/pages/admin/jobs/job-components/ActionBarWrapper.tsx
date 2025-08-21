'use client';

import { Box } from '@chakra-ui/react';
import ActionBar from 'components/jobs/ActionBar';

interface ActionBarWrapperProps {
  isAdmin: boolean;
  loading: boolean;
  selectedJobs: any[];
  onSwitch: (checked: boolean) => void;
  onClickBulkAssign: () => void;
}

const ActionBarWrapper = ({
  isAdmin,
  loading,
  selectedJobs,
  onSwitch,
  onClickBulkAssign,
}: ActionBarWrapperProps) => {
  if (!isAdmin || loading) return null;

  return (
    <Box>
      <ActionBar
        selectedJobs={selectedJobs}
        onSwitch={onSwitch}
        onClickBulkAssign={onClickBulkAssign}
      />
    </Box>
  );
};

export default ActionBarWrapper;
