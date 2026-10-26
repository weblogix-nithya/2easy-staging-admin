import { gql } from "@apollo/client";

export const GET_INVOICE_LINE_TEMPLATES_QUERY = gql`
  query invoiceLineTemplates($is_active: Boolean) {
    invoiceLineTemplates(is_active: $is_active) {
      id
      name
      sort_order
      is_active
    }
  }
`;