import {fetchAvailableDVTimeSeries, fetchDVTimeSeries} from '../web-services/observations';

const INITIAL_DAILY_VALUE_TIME_SERIES_DATA= {
    availableDVTimeSeries: [],
    dvTimeSeries: {}
};

/*
 * Synchronous Redux action to set the available dv time series
 * @param {Object} availableDVTimeSeries
 * @return {Function} which returns a Redux action
 */
const setAvailableDVTimeSeries = function (availableTimeSeries) {
    return {
        type: 'SET_AVAILABLE_DV_TIME_SERIES',
        availableTimeSeries
    };
};

/*
 * Synchronous Redux action to add the dv time series
 * @param {String} timeSeriesId
 * @param {Object} data
 * @return {Function} which returns a Redux action
 */
const addDVTimeSeries = function(timeSeriesId, data) {
    return {
        type: 'ADD_DV_TIME_SERIES',
        timeSeriesId,
        data
    };
};

/*
 * Synchronous Redux Action to update the current time series id to be viewed
 * @param {String} timeSeriesId
 * @return {Function} which returns a Redux action
 */
const setCurrentDVTimeSeriesId = function(timeSeriesId) {
    return {
        type: 'SET_CURRENT_DV_TIME_SERIES_ID',
        timeSeriesId
    };
};

/*
 * Synchronous Redux action to update the graph's cursor offset
 * @param {Number} cursorOffset - difference in epoch time from the cursor position to graph start time
 * @return {Function} which returns a Redux action
 */
const setDVGraphCursorOffset = function(cursorOffset) {
    return {
        type: 'SET_DV_GRAPH_CURSOR_OFFSET',
        cursorOffset
    };
};


/*
 * Redux asynchronous action to fetch the available time series and
 * update the store. The dispatched action returns a Promise.
 * @param {String} monitoringLocationId
 * @return {Function} that returns a promise
 */
const retrieveAvailableDVTimeSeries = function(monitoringLocationId) {
    return function(dispatch) {
        return fetchAvailableDVTimeSeries(monitoringLocationId)
            .then(
                (data) => {
                    dispatch(setAvailableDVTimeSeries(data.timeSeries || []));
                },
                () => {
                    console.log(`Unable to fetch available dv time series for ${monitoringLocationId}`);
                });
    };
};

/*
 * Redux asynchronous action to retrieve the statistical time series with id timeSeriesId and monitoringLocationId.
 * The dispatched action returns a Promise that resolves when the data has been fetched.
 * @param {String} monitoringLocationId
 * @param {String} timeSeriesId
 * @return {Function} that returns a promise
 */
const retrieveDVTimeSeries = function(monitoringLocationId, timeSeriesId) {
    return function(dispatch, getState) {
        const state = getState();
        if (state.dailyValueTimeSeriesData.dvTimeSeries && timeSeriesId in state.dailyValueTimeSeriesData.dvTimeSeries) {
            dispatch(setCurrentDVTimeSeriesId(timeSeriesId));
            return Promise.resolve();
        }
        return fetchDVTimeSeries(monitoringLocationId, timeSeriesId)
            .then(
                (data) => {
                    dispatch(addDVTimeSeries(timeSeriesId, data));
                    dispatch(setCurrentDVTimeSeriesId(timeSeriesId));
                },
                () => {
                    console.log(`Unable to fetch dailyValueTimeSeries time series for ${timeSeriesId}`);
                });
    };
};

/*
 * Slice reducer for dailyValueTimeSeries data
 */
export const dailyValueTimeSeriesDataReducer =
    function (dailyValueTimeSeriesData = INITIAL_DAILY_VALUE_TIME_SERIES_DATA, action) {
        switch (action.type) {
            case 'SET_AVAILABLE_DV_TIME_SERIES': {
                return {
                    ...dailyValueTimeSeriesData,
                    availableDVTimeSeries: action.availableTimeSeries
                };
            }
            case 'ADD_DV_TIME_SERIES': {
                let newData = {};
                newData[action.timeSeriesId] = action.data;
                return Object.assign({}, dailyValueTimeSeriesData, {
                    dvTimeSeries: Object.assign({}, dailyValueTimeSeriesData.dvTimeSeries, newData)
                });
            }
            default:
                return dailyValueTimeSeriesData;
        }
    };



/*
 * Synchronous Redux action to update the graph's brush offset
 * @param {Number} startBrushOffset - difference in epoch time from brush start to the displayed time series start time
 * @param {Number} endBrushOffset - difference in epoch time from displayed time series end to the end of the brush
 * @return {Function} which returns a Redux action
 */
const setDVGraphBrushOffset = function(startBrushOffset, endBrushOffset) {
    return {
        type: 'SET_DV_GRAPH_BRUSH_OFFSET',
        startBrushOffset,
        endBrushOffset
    };
};

/*
 * Synchronous Redux action to clear the graph's brush offset
 * @return {Function} which returns a Redux action
 */
const clearDVGraphBrushOffset = function() {
    return {
        type: 'CLEAR_DV_GRAPH_BRUSH_OFFSET'
    };
};

/*
 * Slice reducer for dailyValueTimeSeriesState
 */
export const dailyValueTimeSeriesStateReducer = function(dailyValueTimeSeriesState={}, action) {
    switch (action.type) {
        case 'SET_CURRENT_DV_TIME_SERIES_ID':
            return {
                ...dailyValueTimeSeriesState,
                currentDVTimeSeriesId: action.timeSeriesId
            };
        case 'SET_DV_GRAPH_CURSOR_OFFSET':
            return {
                ...dailyValueTimeSeriesState,
                dvGraphCursorOffset: action.cursorOffset
            };
        case 'SET_DV_GRAPH_BRUSH_OFFSET':
            return {
                ...dailyValueTimeSeriesState,
                dvGraphBrushOffset: {
                    start: action.startBrushOffset,
                    end: action.endBrushOffset
                }
            };
        case 'CLEAR_DV_GRAPH_BRUSH_OFFSET':
            return {
                ...dailyValueTimeSeriesState,
                dvGraphBrushOffset: undefined
            };
        default:
            return dailyValueTimeSeriesState;
    }
};

export const Actions = {
    setAvailableDVTimeSeries,
    addDVTimeSeries,
    setCurrentDVTimeSeriesId,
    setDVGraphCursorOffset,
    retrieveAvailableDVTimeSeries,
    retrieveDVTimeSeries,
    setDVGraphBrushOffset,
    clearDVGraphBrushOffset
};