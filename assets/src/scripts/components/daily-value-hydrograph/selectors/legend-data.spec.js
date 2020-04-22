import {lineMarker} from '../../../d3-rendering/markers';

import {getLegendMarkerRows} from './legend-data';

describe('daily-value-hydrograph/legend-data', () => {

    const TEST_STATE = {
        dailyValueTimeSeriesData: {
            dvTimeSeries: {
                '12345': {
                    type: 'Feature',
                    id: '12345',
                    properties: {
                        phenomenonTimeStart: '2018-01-02',
                        phenomenonTimeEnd: '2018-01-05',
                        timeStep: ['2018-01-02', '2018-01-03', '2018-01-04', '2018-01-05'],
                        result: ['5.0', '4.0', '6.1', '3.2'],
                        approvals: [['Approved'], ['Approved'], [], ['Estimated']],
                        nilReason: [null, 'AA', null, null],
                        qualifiers: [null, null, ['ICE'], ['ICE']],
                        grades: [['50'], ['50'], ['60'], ['60']]
                    }
                }
            }
        },
        dailyValueTimeSeriesState: {
            currentDVTimeSeriesId: '12345'
        },
        ui: {
            windowWidth: 1024,
            width: 800
        }
    };

    describe('getLegendMarkerRows', () => {

        it('Should return no markers if no time series to show', () => {
            let newData = {
                ...TEST_STATE,
                dailyValueTimeSeriesData: {
                    ...TEST_STATE.dailyValueTimeSeriesData,
                    dvTimeSeries: {}
                }
            };

            expect(getLegendMarkerRows(newData)).toEqual([]);
        });

        it('Should return markers for the selected variable', () => {
            const result = getLegendMarkerRows(TEST_STATE);

            expect(result.length).toBe(1);
            expect(result[0].length).toBe(3);
            expect(result[0][0].type).toEqual(lineMarker);
            expect(result[0][1].type).toEqual(lineMarker);
        });

    });

});