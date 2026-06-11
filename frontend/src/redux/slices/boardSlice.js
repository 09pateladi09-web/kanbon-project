import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as boardApi from '../../api/boardApi';

export const fetchBoards = createAsyncThunk('boards/fetchBoards', async (_, { rejectWithValue }) => {
  try {
    const response = await boardApi.getBoards();
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch boards');
  }
});

export const createBoard = createAsyncThunk('boards/createBoard', async (boardData, { rejectWithValue }) => {
  try {
    const response = await boardApi.createBoard(boardData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create board');
  }
});

export const fetchBoardById = createAsyncThunk('boards/fetchBoardById', async (id, { rejectWithValue }) => {
  try {
    const response = await boardApi.getBoardById(id);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch board details');
  }
});

const boardSlice = createSlice({
  name: 'boards',
  initialState: {
    items: [],
    currentBoard: null,
    status: 'idle',
    currentBoardStatus: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchBoards
      .addCase(fetchBoards.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchBoards.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // createBoard
      .addCase(createBoard.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      // fetchBoardById
      .addCase(fetchBoardById.pending, (state) => {
        state.currentBoardStatus = 'loading';
      })
      .addCase(fetchBoardById.fulfilled, (state, action) => {
        state.currentBoardStatus = 'succeeded';
        state.currentBoard = action.payload;
      })
      .addCase(fetchBoardById.rejected, (state, action) => {
        state.currentBoardStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export default boardSlice.reducer;
