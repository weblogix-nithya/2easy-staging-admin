import { gql } from "@apollo/client";

export const GET_USERS_QUERY = gql`
  query users(
    $query: String
    $page: Int!
    $first: Int!
    $orderByColumn: String!
    $orderByOrder: SortOrder!
  ) {
    users(
      query: $query
      page: $page
      first: $first
      orderBy: { column: $orderByColumn, order: $orderByOrder }
    ) {
      data {
        id
        name
        email
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

export const GET_USER_QUERY = gql`
  query user($id: ID!) {
    user(id: $id) {
      id
      name
      email
      state
      media_url
      roles {
        id
        name
      }
    }
  }
`;

export const CREATE_USER_MUTATION = gql`
  mutation createUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      email
      state
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation updateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
      name
      email
      state
    }
  }
`;

export const DELETE_USER_MUTATION = gql`
  mutation deleteUser($id: ID!) {
    deleteUser(id: $id) {
      id
    }
  }
`;

export interface UpdateUserInput {
  id: Number;
  name: String;
  email: String;
}

export interface CreateUserInput {
  name: String;
  email: String;
  password: String;
  state: String;
}

export interface UserType {
  id: number;
  name: string;
  email: string;
}

export interface User {
  id: any;
  name: string;
  email: string;
  media_url: string;
  state: string;
  roles: any[];
}

export const defaultUser: User = {
  id: null,
  name: "",
  email: "",
  media_url: "",
  state: "Queensland",
  roles: [],
};
