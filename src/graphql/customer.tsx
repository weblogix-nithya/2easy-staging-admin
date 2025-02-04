import { gql } from "@apollo/client";

export const GET_CUSTOMERS_QUERY = gql`
  query customers(
    $query: String
    $page: Int!
    $first: Int!
    $orderByColumn: String!
    $orderByOrder: SortOrder!
    $company_id: ID
  ) {
    customers(
      query: $query
      page: $page
      first: $first
      company_id: $company_id
      orderBy: { column: $orderByColumn, order: $orderByOrder }
    ) {
      data {
        id
        first_name
        last_name
        full_name
        admin_notes
        base_notes
        company_id
        abn
        phone_no
        email
        company_name
        is_company_admin
        is_pod_sendable
        is_invoice_sendable
        rate_card_url
      }
      paginatorInfo {
        count
        currentPage
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        total
      }
    }
  }
`;

export const GET_CUSTOMER_QUERY = gql`
  query customer($id: ID!) {
    customer(id: $id) {
      id
      first_name
      last_name
      full_name
      admin_notes
      base_notes
      abn
      phone_no
      email
      company_name
      company_id
      is_company_admin
      is_pod_sendable
      is_invoice_sendable
    }
  }
`;

export const CREATE_CUSTOMER_MUTATION = gql`
  mutation createCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      id
      first_name
      last_name
      full_name
      admin_notes
      base_notes
      abn
      phone_no
      email
      company_name
      company_id
      is_company_admin
      is_pod_sendable
      is_invoice_sendable
    }
  }
`;

export const MUTATION_CUSTOMER_REGISTER = gql`
  mutation registerCustomer($input: RegisterCustomerInput!) {
    registerCustomer(input: $input) {
      id
    }
  }
`;

export const UPDATE_CUSTOMER_MUTATION = gql`
  mutation updateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      first_name
      last_name
      full_name
      admin_notes
      base_notes
      abn
      phone_no
      email
      company_name
      company_id
      is_company_admin
      is_pod_sendable
      is_invoice_sendable
    }
  }
`;

export interface RegisterCustomerInput {
  first_name: String;
  last_name: String;
  email: String;
  password: String;
  password_confirmation: String;
}

export const DELETE_CUSTOMER_MUTATION = gql`
  mutation deleteCustomer($id: ID!) {
    deleteCustomer(id: $id) {
      id
    }
  }
`;

export interface UpdateCustomerInput {
  id: Number;
  first_name: String;
  last_name: String;
  full_name: String;
  admin_notes: String;
  base_notes: String;
  abn: String;
  phone_no: String;
  email: String;
  company_name: String;
  company_id: Number;
  is_company_admin: Boolean;
  is_pod_sendable: Boolean;
  is_invoice_sendable: Boolean;
}

export interface CreateCustomerInput {
  first_name: String;
  last_name: String;
  full_name: String;
  admin_notes: String;
  base_notes: String;
  abn: String;
  phone_no: String;
  email: String;
  company_name: String;
  company_id: Number;
  is_company_admin: Boolean;
  is_pod_sendable: Boolean;
  is_invoice_sendable: Boolean;
}

type Customer = {
  id: number | null;
  [key: string]:
    | string
    | number
    | null
    | boolean
    | undefined
    | Date
    | any[]
    | any;
};

export const defaultCustomer: Customer = {
  id: null,
  first_name: "",
  last_name: "",
  full_name: "",
  admin_notes: "",
  base_notes: "",
  abn: "",
  phone_no: "",
  email: "",
  company_name: "",
  is_company_admin: false,
  is_pod_sendable: false,
  is_invoice_sendable: false,
};
