import { functorkeyscale, keyNotNull, fk } from '../utils';

export default function createLines(serie, xscale, yscale) {
    // https://github.com/d3/d3-shape/blob/master/README.md#curves
    var aes = serie.aes;

    if (!serie.options.interpolate) {
        serie.options.interpolate = 'linear';
    } else {
        // translate curvenames
        serie.options.interpolate =
            serie.options.interpolate == 'monotone'
                ? 'monotoneX'
                : serie.options.interpolate == 'step-after'
                ? 'stepAfter'
                : serie.options.interpolate == 'step-before'
                ? 'stepBefore'
                : serie.options.interpolate;
    }
    // to uppercase for d3 curve name
    var curveName =
        'curve' +
        serie.options.interpolate[0].toUpperCase() +
        serie.options.interpolate.slice(1);
    serie.interpolationFunction = d3[curveName] || d3.curveLinear;

    var line = d3
        .line()
        .x(functorkeyscale(aes.x, xscale))
        .y(functorkeyscale(aes.y, yscale))
        .curve(serie.interpolationFunction)
        .defined(keyNotNull(aes.y));

    serie.line = line;

    serie.options.label =
        serie.options.label || serie.options.name || serie.aes.label || serie.aes.y;

    if (aes.ci_up && aes.ci_down) {
        var ciArea = d3
            .area()
            .x(functorkeyscale(aes.x, xscale))
            .y0(functorkeyscale(aes.ci_down, yscale))
            .y1(functorkeyscale(aes.ci_up, yscale))
            .curve(serie.interpolationFunction);
        serie.ciArea = ciArea;
    }

    if (aes.diff) {
        serie.diffAreas = [
            d3
                .area()
                .x(functorkeyscale(aes.x, xscale))
                .y0(functorkeyscale(aes.y, yscale))
                .y1(function(d) {
                    if (d[aes.y] > d[aes.diff]) return yscale(d[aes.diff]);
                    return yscale(d[aes.y]);
                })
                .curve(serie.interpolationFunction),
            d3
                .area()
                .x(functorkeyscale(aes.x, xscale))
                .y1(functorkeyscale(aes.y, yscale))
                .y0(function(d) {
                    if (d[aes.y] < d[aes.diff]) return yscale(d[aes.diff]);
                    return yscale(d[aes.y]);
                })
                .curve(serie.interpolationFunction)
        ];
    }

    serie.find = function(date) {
        var bisect = d3.bisector(fk(aes.x)).left;
        var i = bisect(serie.data, date) - 1;
        if (i == -1) {
            return null;
        }

        // look to far after serie is defined
        if (
            i == serie.data.length - 1 &&
            serie.data.length > 1 &&
            Number(date) - Number(serie.data[i][aes.x]) >
                Number(serie.data[i][aes.x]) - Number(serie.data[i - 1][aes.x])
        ) {
            return null;
        }
        return serie.data[i];
    };
}
