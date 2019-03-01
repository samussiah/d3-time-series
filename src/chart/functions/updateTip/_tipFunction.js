export default function _tipFunction(date, series, xscale, yscale) {
    var spans =
        '<table style="border:none">' +
        series
            .filter(function(d) {
                return d.item !== undefined && d.item !== null;
            })
            .map(function(d) {
                return (
                    '<tr><td style="color:' +
                    d.options.color +
                    '">' +
                    d.options.label +
                    ' </td>' +
                    '<td style="color:#333333;text-align:right">' +
                    yscale.setformat(d.item[d.aes.y]) +
                    '</td></tr>'
                );
            })
            .join('') +
        '</table>';

    return '<h4>' + xscale.setformat(d3.timeDay(date)) + '</h4>' + spans;
};
