import _tipFunction from './updateTip/_tipFunction';

export default function updateTip(xdate) {
    if (xdate == null) {
        tooltipDiv.style('opacity', 0);
    } else {
        var s = series.map(function(s) {
            return { item: s.find(xdate), aes: s.aes, options: s.options };
        });

        tooltipDiv
            .style('opacity', 0.9)
            .style('left', defaultSettings.margin.left + 5 + xscale(xdate) + 'px')
            .style('top', '0px')
            .html(_tipFunction(xdate, s));
    }
}
