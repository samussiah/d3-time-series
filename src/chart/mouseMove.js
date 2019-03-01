import updatefocusRing from './functions/updateFocusRing';
import updateTip from './functions/updateTip';

export default function mouseMove(container, xscale, mousevline, annotationsContainer, series, yscale, tooltipDiv, defaultSettings) {
    var x = d3.mouse(container.node())[0];
    x = xscale.invert(x);
    mousevline.datum({ x: x, visible: true });
    mousevline.update();
    updatefocusRing(x, annotationsContainer, series, xscale, yscale);
    updateTip(x, tooltipDiv, series, defaultSettings, xscale, yscale);
}
