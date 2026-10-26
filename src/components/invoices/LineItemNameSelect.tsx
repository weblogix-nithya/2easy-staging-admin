import { useQuery } from "@apollo/client";
import { Box, Text } from "@chakra-ui/react";
import { CreatableSelect } from "chakra-react-select";
import { GET_INVOICE_LINE_TEMPLATES_QUERY } from "graphql/invoiceLineTemplate";
import { useMemo } from "react";

const FREIGHT_PREFIX = "Freight Charge";
const HEADER_LINE_REGEX = /^[^:]+:\s.+\s-\s\d{2}\/\d{2}\/\d{4}$/;
const EXCLUDED_WORDS_REGEX = /fuel|toll|slot/i;

const EXCLUDE_EXACT = ["time slot", "timeslot", "fuel", "toll"];
const EXCLUDE_CONTAINS = [
    "timeslot surcharge",
    "time slot fee",
    "time slot surcharge",
    "timeslot fee",
    "timeslot",
    "time slot",
    "fuel levy",
    "fuel surcharge",
    "toll levy",
    "toll surcharge",
    "toll fee",
];

const isExcludedFromDriverPay = (name: string | null | undefined) => {
    const normalized = String(name ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    return (
        EXCLUDE_EXACT.includes(normalized) ||
        EXCLUDE_CONTAINS.some((keyword) => normalized.includes(keyword))
    );
};

const isFreightName = (name: string | null | undefined) =>
    String(name ?? "")
        .trim()
        .startsWith(FREIGHT_PREFIX);

export const isLockedInvoiceLine = (name: string | null | undefined) =>
    HEADER_LINE_REGEX.test(String(name ?? "").trim());

type TemplateOption = {
    value: string;
    label: string;
    id: string | null;
};

type Props = {
    value: string;
    onSelect: (template: { id: string | null; name: string }) => void;
    isDisabled?: boolean;
};

export default function LineItemNameSelect({
    value,
    onSelect,
    isDisabled,
}: Props) {
    const { data, loading } = useQuery(GET_INVOICE_LINE_TEMPLATES_QUERY, {
        variables: { is_active: true },
    });

    const templates = useMemo<TemplateOption[]>(
        () =>
            (data?.invoiceLineTemplates ?? []).map((template: any) => ({
                value: template.name,
                label: template.name,
                id: template.id,
            })),
        [data],
    );

    const options = useMemo<TemplateOption[]>(() => {
        if (!value) return templates;

        return isFreightName(value)
            ? templates.filter((o) => isFreightName(o.value))
            : templates.filter((o) => !isFreightName(o.value));
    }, [templates, value]);

    const selected = useMemo<TemplateOption | null>(() => {
        if (!value) return null;

        return (
            templates.find((o) => o.value === value) ?? {
                value,
                label: value,
                id: null,
            }
        );
    }, [templates, value]);

    const isCustomName = !!value && !templates.some((o) => o.value === value);
    const showWarning =
        isCustomName &&
        EXCLUDED_WORDS_REGEX.test(value) &&
        !isExcludedFromDriverPay(value);

    return (
        <Box>
            <CreatableSelect
                placeholder="Select or type item"
                value={selected}
                options={options}
                isLoading={loading}
                isDisabled={isDisabled}
                isValidNewOption={(input: string) =>
                    !!input.trim() && !isFreightName(value)
                }
                formatCreateLabel={(input: string) => `Use "${input.trim()}"`}
                onCreateOption={(input: string) =>
                    onSelect({ id: null, name: input.trim() })
                }
                onChange={(option: any) => {
                    if (option) {
                        onSelect({ id: option.id ?? null, name: option.value });
                    }
                }}
                size="lg"
                className="select mb-0 max-w-md"
                classNamePrefix="two-easy-select"
                menuPortalTarget={
                    typeof document !== "undefined" ? document.body : undefined
                }
                styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    container: (base) => ({ ...base, minWidth: "260px" }),
                }}
            />
            {showWarning ? (
                <Text fontSize="xs" color="red.500" mt={1}>
                    Pick it from the list if it is one of those.
                </Text>
            ) : null}
        </Box>
    );
}