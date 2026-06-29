// RemoveDriverContext.tsx
// ✅ Single useMutation for ALL 100 rows — zero per-row Apollo registrations

import { useMutation } from "@apollo/client";
import { useToast } from "@chakra-ui/react";
import { REMOVE_PRE_ALLOCATE_DRIVER } from "graphql/job";
import React, { useCallback, useState } from "react";

interface RemoveDriverContextType {
    removeDriver: (job: any) => void;
    loadingId: string | null;
}

export const RemoveDriverContext = React.createContext<RemoveDriverContextType>({
    removeDriver: () => { },
    loadingId: null,
});

interface Props {
    children: React.ReactNode;
    refetch?: () => void;
}

export const RemoveDriverProvider = ({ children, refetch }: Props) => {
    const toast = useToast();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const [mutate] = useMutation(REMOVE_PRE_ALLOCATE_DRIVER, {
        onCompleted: () => {
            toast({ title: "Removed job from driver", status: "success", duration: 3000, isClosable: true });
            setLoadingId(null);
            refetch?.();
        },
        onError: (err) => {
            toast({ title: "Error", description: err.message, status: "error", duration: 3000, isClosable: true });
            setLoadingId(null);
        },
    });

    const removeDriver = useCallback((job: any) => {
        if (!job?.id) return;
        setLoadingId(String(job.id));
        mutate({
            variables: {
                input: {
                    id: job.id,
                    customer_id: job.customer?.id,
                    company_id: job.company?.id,
                    job_type_id: job.job_type?.id,
                    name: job.name,
                    preallocation_driver_id: null,
                    driver_id: job.driver_id || null,
                    d_sort_id: job.d_sort_id || null,
                    sort_datetime: job.sort_datetime || null,
                },
            },
        });
    }, [mutate]);

    return (
        <RemoveDriverContext.Provider value={{ removeDriver, loadingId }}>
            {children}
        </RemoveDriverContext.Provider>
    );
};