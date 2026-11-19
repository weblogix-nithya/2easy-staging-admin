import { gql } from "@apollo/client";

export const GET_INVOICE_LINE_TEMPLATES_QUERY = gql`
  query invoiceLineTemplates($is_active: Boolean, $type: String) {
    invoiceLineTemplates(is_active: $is_active, type: $type) {
      id
      name
      type
      sort_order
      is_active
    }
  }
`;