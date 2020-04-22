import {DateTime} from 'luxon';
import isEqual from 'lodash/isEqual';
import zip from 'lodash/zip';
import zipObject from 'lodash/zipObject';
import {createSelector} from 'reselect';

import {getCurrentDVTimeSeries, getDVGraphCursorOffset} from '../../../selectors/daily-value-time-series-selector';
import {getNearestTime} from '../../../utils';

import {getXScale, getMainXScale, getMainYScale} from './scales';

const TWO_DAYS = 1000 * 60 * 60 * 24 * 2; // In milliseconds

export const APPROVED = 'Approved';
export const ESTIMATED = 'Estimated';

/* Returns the selector function which returns an Array of Objects, each object representing one value, dateTime (in epoch time),
and other attributes representing metadata on the value. This will represent the time series for the current
selected time series
 */
export const getCurrentTimeSeriesPoints = createSelector(
    getCurrentDVTimeSeries,
    (timeSeries) => {
        if (!timeSeries) {
            return [];
        }
        let result =  zip(
            timeSeries.properties.result,
            timeSeries.properties.timeStep.map((timeStep) => {
                return new DateTime.fromISO(timeStep, {zone: 'UTC'}).toMillis();
            }),
            timeSeries.properties.nilReason,
            timeSeries.properties.approvals,
            timeSeries.properties.qualifiers,
            timeSeries.properties.grades)
            .map((zippedStep) => {
                return zipObject([
                    'value',
                    'dateTime',
                    'nilReason',
                    'approvals',
                    'qualifiers',
                    'grades'
                ], zippedStep);
            });

        return result.sort((first, second) => {
            if (first.dateTime < second.dateTime) {
                return -1;
            } else if (first.dateTime > second.dateTime) {
                return 1;
            } else {
                return 0;
            }
        });
    }
);

/*
 * Returns selector function which returns an array of Objects which include the data needed to render the line.
 * The time series data is broken into line segments. The points in a line segment will be shown as continuous and
 * the data has the same approvals.
 * Each Object contains the following properties
 *      @prop {Array of Object} points - each object has date (in milliseconds) and value {Number} properties
 *      @prop {Array of String} approvals - The approvals for this line segment
 *  The time series
 */
export const getCurrentTimeSeriesLineSegments = createSelector(
    getCurrentTimeSeriesPoints,
    (timeSeries) => {
        if (timeSeries.length === 0) {
            return [];
        }

        let lineSegments = [];
        let previousDate = timeSeries[0].dateTime;
        let previousApprovals = timeSeries[0].approvals;
        let segment = {
            points: [],
            approvals: previousApprovals
        };
        timeSeries.forEach((point) => {
            const resultValue = parseFloat(point.value);
            const hasGap = point.dateTime - previousDate >= TWO_DAYS;
            const hasDifferentApprovals = !isEqual(point.approvals, previousApprovals);
            if (hasDifferentApprovals && !hasGap) {
                // Add the current point to the last segment so that line is continous
                segment.points.push({
                    value: resultValue,
                    date: point.dateTime
                });
            }

            if (hasGap || hasDifferentApprovals) {
                lineSegments.push(segment);
                segment = {
                    points: [],
                    approvals: point.approvals
                };
                previousApprovals = point.approvals;
            }
            segment.points.push({
                value: resultValue,
                date: point.dateTime
            });
            previousDate = point.dateTime;
        });

        lineSegments.push(segment);
        return lineSegments;
    }
);

/*
 * Return a selector function that returns the epoch time for the current daily value cursor offset.
 * Return null if no current daily value cursor offset is set.
 */
export const getCursorEpochTime = createSelector(
    getDVGraphCursorOffset,
    getXScale(),
    (cursorOffset, xScale) => {

        if (!cursorOffset) {
            return xScale.domain()[1];
        }
        return xScale.domain()[0] + cursorOffset;
    }
);

/*
 * Return a selector which returns the points nearest the cursor's epoch time.
 */
export const getDataAtCursor = createSelector(
    getCursorEpochTime,
    getCurrentTimeSeriesPoints,
    (cursorEpochTime, points)=> {
        if (!points.length) {
            return null;
        }
        return getNearestTime(points, cursorEpochTime);
    }
);

/*
 * Return a selector which returns an array of objects with x, y coordinates, that represent
 * the position of the line(s) at the cursor offset. Currently this is a single element array.
 */
export const getCursorPoint = createSelector(
    getDataAtCursor,
    getMainXScale,
    getMainYScale,
    (point, xScale, yScale) => {
        if (!point) {
            return [];
        }
        const result = [{
            x: xScale(point.dateTime),
            y: yScale(point.value)
        }];
        return result;
    }
);