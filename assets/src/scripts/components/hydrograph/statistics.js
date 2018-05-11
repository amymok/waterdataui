const range = require('lodash/range');
const { DateTime } = require('luxon');
const { isLeapYear } = require('../../models');
const { calcStartTime } = require('../../utils');

/**
 * Make statistical data look like a timeseries for plotting purposes
 *
 * @param series -- an object with the following keys: points, startTime, and endTime at a minimum. Each point should have a javascript month and day
 * @param period -- ISO duration for date range of the time series
 * @param ianaTimeZone -- Internet Assigned Numbers Authority designation for a time zone
 * @returns {*[]}
 */
export const coerceStatisticalSeries = function (series, period, ianaTimeZone) {
    const startTime = calcStartTime(period, series.endTime, ianaTimeZone); // calculate when the start time based on the period
    const startYear = DateTime.fromMillis(startTime, {zone: ianaTimeZone}).year;
    const endYear = DateTime.fromMillis(series.endTime, {zone: ianaTimeZone}).year;
    const yearRange = range(startYear, endYear + 1);
    const points = series.points;
    let plotablePoints = [];
    // for each year in the time range, coerce each median value to the appropriate date in that year
    // exclude February 29th if the year is not a leap year
    yearRange.forEach(year => {
        points.forEach(point => {
            const month = point.month;
            const day = point.day;
            let dataPoint = Object.assign({}, point);
            dataPoint.dateTime = dataPoint.dateTime ? dataPoint.dateTime : DateTime.fromObject({
                year: year,
                day: day,
                month: month,
                zone: ianaTimeZone
            }).valueOf();
            if (!isLeapYear(year)) {
                if(!(month === 1 && day === 29)) {
                    plotablePoints.push(dataPoint);
                }
            } else {
                plotablePoints.push(dataPoint);
            }
        });
    });
    // sort the points by date in ascending order
    const sortedPoints = plotablePoints.sort(function(a, b) {
        return a.dateTime - b.dateTime;
    });
    // include median points that fall within the hydrograph's start and end datetime
    let filtered = sortedPoints.filter(x => startTime <= x.dateTime && x.dateTime <= series.endTime);
    // handle the far left and far right ends of the graph
    const first = filtered[0];
    if (first.dateTime > startTime) {
        // if the hydrograph's start time doesn't line with the first median point, grab
        // the value of the previous median date's value and create a new point using the
        // start time as its x-value, so that the median step function extends to the left
        // terminus of the graph
        let previousIndex;
        if (sortedPoints.indexOf(first) === 0) {
            previousIndex = sortedPoints.length - 1;
        } else {
            previousIndex = sortedPoints.indexOf(first) - 1;
        }
        const previousVal = sortedPoints[previousIndex];
        let leftVal = Object.assign({}, previousVal);
        leftVal.dateTime = startTime;
        filtered.unshift(leftVal);
    }
    const last = filtered[filtered.length - 1];
    if (last.dateTime < series.endTime) {
        // if the hydrograph's end time doesn't line with the last median point, create
        // an additional data point with it's x-value as the graph's end time and its value
        // as the last median point's value, so that the median step function extends to the
        // far right terminus of the graph
        let rightVal = Object.assign({}, last);
        rightVal.dateTime = series.endTime;
        filtered.push(rightVal);
    }
    return filtered;
};
