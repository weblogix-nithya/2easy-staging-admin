import { useQuery } from "@apollo/client";
import { Box, Flex } from "@chakra-ui/react";
import { CreatableSelect, Select } from "chakra-react-select";
import { GET_INVOICE_LINE_TEMPLATES_QUERY } from "graphql/invoiceLineTemplate";
import { useMemo, useState } from "react";

type Category = "freight" | "warehouse";
type CategoryValue = Category | "";

const CATEGORY_OPTIONS = [
    { value: "", label: "Select" },
    { value: "freight", label: "Freight" },
    { value: "warehouse", label: "Warehouse" },
];

const HEADER_LINE_REGEX = /^[^:]+:\s.+\s-\s\d{2}\/\d{2}\/\d{4}$/;

export const isLockedInvoiceLine = (name: string | null | undefined) =>
    HEADER_LINE_REGEX.test(String(name ?? "").trim());

const categoryOf = (type: string | null | undefined): Category =>
    type === "warehouse" ? "warehouse" : "freight";

type TemplateOption = {
    value: string;
    label: string;
    id: string | null;
    type: string | null;
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
    const [pickedCategory, setPickedCategory] = useState<CategoryValue | null>(null);

    const { data, loading } = useQuery(GET_INVOICE_LINE_TEMPLATES_QUERY, {
        variables: { is_active: true },
    });

    const templates = useMemo<TemplateOption[]>(
        () =>
            (data?.invoiceLineTemplates ?? []).map((template: any) => ({
                value: template.name,
                label: template.name,
                id: template.id,
                type: template.type ?? null,
            })),
        [data],
    );

    const matchedTemplate = templates.find((o) => o.value === value);

    const category: CategoryValue =
        pickedCategory ?? (matchedTemplate ? categoryOf(matchedTemplate.type) : "");

    const options = useMemo<TemplateOption[]>(
        () =>
            category ? templates.filter((o) => categoryOf(o.type) === category) : [],
        [templates, category],
    );

    const selected = useMemo<TemplateOption | null>(() => {
        if (!value) return null;

        return (
            templates.find((o) => o.value === value) ?? {
                value,
                label: value,
                id: null,
                type: null,
            }
        );
    }, [templates, value]);

    const portalProps = {
        menuPortalTarget:
            typeof document !== "undefined" ? document.body : undefined,
        styles: {
            menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
        },
    };

    return (
        <Box className="max-w-lg">
            <Flex gap={2} flexWrap="wrap">
                <Box minW="150px">
                    <Select
                        value={
                            CATEGORY_OPTIONS.find((o) => o.value === category) ??
                            CATEGORY_OPTIONS[0]
                        }
                        options={CATEGORY_OPTIONS}
                        isSearchable={false}
                        isDisabled={isDisabled}
                        onChange={(option: any) => {
                            if (option) {
                                setPickedCategory(option.value as CategoryValue);
                            }
                        }}
                        size="lg"
                        className="select mb-0"
                        classNamePrefix="two-easy-select"
                        {...portalProps}
                    />
                </Box>
                <Box flex="1" minW="260px">
                    <CreatableSelect
                        placeholder="Select or create item"
                        value={selected}
                        options={options}
                        isLoading={loading}
                        isDisabled={isDisabled}
                        noOptionsMessage={() =>
                            category ? "No items" : "Select a category, or create a new item"
                        }
                        isValidNewOption={(input: string) => !!input.trim()}
                        formatCreateLabel={(input: string) => `Use "${input.trim()}"`}
                        onCreateOption={(input: string) => {
                            setPickedCategory(null);
                            onSelect({ id: null, name: input.trim() });
                        }}
                        onChange={(option: any) => {
                            if (option) {
                                setPickedCategory(null);
                                onSelect({ id: option.id ?? null, name: option.value });
                            }
                        }}
                        size="lg"
                        className="select mb-0"
                        classNamePrefix="two-easy-select"
                        {...portalProps}
                    />
                </Box>
            </Flex>
        </Box>
    );
}