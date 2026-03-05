import { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { defaultJobFilter } from "components/jobs/Filters";
import { preDefaultJobFilter } from "components/preAllocation/Filters";

// create a slice
export const jobFilterSlice = createSlice({
  name: "jobFilter",
  initialState: {
    filters: {
      states: undefined,
      suburbs: undefined,
      address_business_name: undefined,
      has_company_ids: undefined,
      has_job_category_ids: undefined,
      job_date_at: undefined,
      job_status_id: undefined,
      is_tailgate_required: undefined,
      weight_from: undefined,
      weight_to: undefined,
      volume_from: undefined,
      volume_to: undefined,
    },
    displayName: undefined,
    jobMainFilters: defaultJobFilter,
    is_filter_ticked: "0",
  },
  reducers: {
    setJobFilters: (state: any, action: PayloadAction<any>) => {
      state.filters[action.payload.key] = action.payload.value;
    },
    setDisplayName: (state: any, action: PayloadAction<any>) => {
      state.displayName = action.payload;
    },
    setJobMainFilters: (state, action: PayloadAction<any>) => {
      state.jobMainFilters = action.payload;
    },
    setIsFilterTicked: (state, action: PayloadAction<any>) => {
      state.is_filter_ticked = action.payload;
    },
  },
});

export const preJobFilterSlice = createSlice({
  name: "preJobFilter",
  initialState: {
    filters: {
      states: undefined,
      quadrant: undefined,
      suburbs: undefined,
      address_business_name: undefined,
      has_company_ids: undefined,
      has_job_category_ids: undefined,
      job_date_at: undefined,
      job_status_id: undefined,
      is_tailgate_required: undefined,
      weight_from: undefined,
      weight_to: undefined,
      volume_from: undefined,
      volume_to: undefined,
    },
    displayName: undefined,
    jobMainFilters: preDefaultJobFilter,
    is_filter_ticked: "0",
  },
  reducers: {
    setPreJobFilters: (state: any, action: PayloadAction<any>) => {
      state.filters[action.payload.key] = action.payload.value;
    },
    setPreDisplayName: (state: any, action: PayloadAction<any>) => {
      state.displayName = action.payload;
    },
    setPreJobMainFilters: (state, action: PayloadAction<any>) => {
      state.jobMainFilters = action.payload;
    },
    setIsPreFilterTicked: (state, action: PayloadAction<any>) => {
      state.is_filter_ticked = action.payload;
    },
  },
});

export const {
  setJobFilters,
  setDisplayName,
  setJobMainFilters,
  setIsFilterTicked,
} = jobFilterSlice.actions;

export const {
  setPreJobFilters,
  setPreDisplayName,
  setPreJobMainFilters,
  setIsPreFilterTicked,
} = preJobFilterSlice.actions;

export const jobFilterReducer = jobFilterSlice.reducer;
export const preJobFilterReducer = preJobFilterSlice.reducer;

export default jobFilterSlice.reducer;
